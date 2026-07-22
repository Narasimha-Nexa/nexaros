import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

export interface AiInsight {
  id: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  title: string;
  message: string;
  metric?: { label: string; value: string | number };
}

@Injectable()
export class AiService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Suggest menu item pairings based on order history.
   * Tenant-scoped via branch.tenantId to prevent cross-tenant leakage.
   */
  async suggestPairings(tenantId: string, menuItemId: string) {
    const cacheKey = `ai:pairings:${tenantId}:${menuItemId}`;
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return { data: cached, meta: { cached: true, menuItemId, tenantId } };

    // Verify the menu item belongs to this tenant before using it.
    const item = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, tenantId },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Menu item not found for this tenant');

    const ordersWithItem = await this.prisma.orderItem.findMany({
      where: {
        menuItemId,
        order: { branch: { tenantId } },
      },
      select: { orderId: true },
      distinct: ['orderId'],
    });

    const orderIds = ordersWithItem.map((o) => o.orderId);

    const pairedItems = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        orderId: { in: orderIds },
        menuItemId: { not: menuItemId },
        order: { branch: { tenantId } },
      },
      _count: { menuItemId: true },
      orderBy: { _count: { menuItemId: 'desc' } },
      take: 5,
    });

    const suggestions = await Promise.all(
      pairedItems.map(async (p) => {
        const mi = await this.prisma.menuItem.findFirst({
          where: { id: p.menuItemId, tenantId },
          select: { id: true, name: true, price: true, isVeg: true },
        });
        if (!mi) return null;
        return { ...mi, pairCount: p._count.menuItemId };
      }),
    );

    const result = suggestions.filter(Boolean);
    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return { data: result, meta: { cached: false, menuItemId, tenantId } };
  }

  /**
   * Demand forecasting based on historical order patterns.
   * Returns per-item daily averages, frequency, next-week forecast and trend.
   * Capped to the top N items to protect performance on large catalogs.
   */
  async forecastDemand(tenantId: string, days = 7, limit = 20) {
    const safeDays = Math.min(Math.max(days, 1), 90);
    const cacheKey = `ai:forecast:${tenantId}:${safeDays}:${limit}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

    const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

    const orders = await this.prisma.order.findMany({
      where: {
        branch: { tenantId },
        createdAt: { gte: since },
        status: { in: ['COMPLETED', 'SERVED'] },
      },
      select: {
        createdAt: true,
        items: { select: { menuItemId: true, name: true, quantity: true } },
      },
    });

    const itemCounts = new Map<string, { name: string; totalQuantity: number; daysOrdered: Set<string> }>();
    for (const order of orders) {
      const dayKey = order.createdAt.toISOString().split('T')[0];
      for (const item of order.items) {
        if (!item.menuItemId) continue;
        if (!itemCounts.has(item.menuItemId)) {
          itemCounts.set(item.menuItemId, { name: item.name, totalQuantity: 0, daysOrdered: new Set() });
        }
        const entry = itemCounts.get(item.menuItemId)!;
        entry.totalQuantity += item.quantity;
        entry.daysOrdered.add(dayKey);
      }
    }

    const forecast = Array.from(itemCounts.entries())
      .map(([id, data]) => {
        const dailyAvg = data.totalQuantity / Math.max(data.daysOrdered.size, 1);
        const frequency = data.daysOrdered.size / Math.min(safeDays, 90);
        return {
          menuItemId: id,
          name: data.name,
          dailyAverage: Math.round(dailyAvg * 10) / 10,
          frequency: Math.round(frequency * 100) / 100,
          forecastNextWeek: Math.round(dailyAvg * 7),
          trend: dailyAvg > 5 ? 'HIGH' : dailyAvg > 2 ? 'MEDIUM' : 'LOW',
        };
      })
      .sort((a, b) => b.dailyAverage - a.dailyAverage)
      .slice(0, limit);

    const result = {
      data: forecast,
      meta: {
        cached: false,
        tenantId,
        days: safeDays,
        limit,
        generatedAt: new Date().toISOString(),
        totalItemsAnalyzed: itemCounts.size,
      },
    };
    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  /**
   * Generate business insights from order data.
   * Returns KPI summary, top items, and contextual suggestions (alerts).
   */
  async getInsights(tenantId: string) {
    const cacheKey = `ai:insights:${tenantId}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todayOrders, weekOrders, popularItems] = await Promise.all([
      this.prisma.order.count({ where: { branch: { tenantId }, createdAt: { gte: todayStart } } }),
      this.prisma.order.count({ where: { branch: { tenantId }, createdAt: { gte: weekAgo } } }),
      this.prisma.orderItem.groupBy({
        by: ['name'],
        where: { order: { branch: { tenantId }, createdAt: { gte: weekAgo } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const insights: AiInsight[] = [];

    if (todayOrders === 0) {
      insights.push({
        id: 'no-orders-today',
        type: 'warning',
        title: 'No orders today yet',
        message: 'Consider running a promotion or confirming your store is open for online orders.',
      });
    }
    if (weekOrders < 50 && weekOrders > 0) {
      insights.push({
        id: 'low-weekly-volume',
        type: 'info',
        title: 'Weekly orders are below target',
        message: 'Review menu pricing and run a marketing campaign to boost volume.',
      });
    }
    if (weekOrders === 0) {
      insights.push({
        id: 'no-orders-week',
        type: 'critical',
        title: 'No orders in the last 7 days',
        message: 'Your store may be inactive or undiscoverable. Verify your listing and availability.',
      });
    }

    const result = {
      data: {
        todayOrders,
        weeklyOrders: weekOrders,
        weeklyAverage: Math.round(weekOrders / 7),
        topItems: popularItems.map((i) => ({ name: i.name, totalSold: i._sum.quantity })),
        insights,
      },
      meta: {
        cached: false,
        tenantId,
        generatedAt: new Date().toISOString(),
      },
    };
    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }
}
