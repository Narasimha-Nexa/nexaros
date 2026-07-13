import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  /**
   * Suggest menu item pairings based on order history
   * Finds items that are frequently ordered together
   */
  async suggestPairings(tenantId: string, menuItemId: string) {
    // Find orders containing this menu item
    const ordersWithItem = await this.prisma.orderItem.findMany({
      where: { menuItemId },
      select: { orderId: true },
      distinct: ['orderId'],
    });

    const orderIds = ordersWithItem.map((o) => o.orderId);

    // Find items frequently ordered together
    const pairedItems = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        orderId: { in: orderIds },
        menuItemId: { not: menuItemId },
      },
      _count: { menuItemId: true },
      orderBy: { _count: { menuItemId: 'desc' } },
      take: 5,
    });

    const suggestions = await Promise.all(
      pairedItems.map(async (p) => {
        const item = await this.prisma.menuItem.findUnique({
          where: { id: p.menuItemId },
          select: { id: true, name: true, price: true, isVeg: true },
        });
        return {
          ...item,
          pairCount: p._count.menuItemId,
        };
      }),
    );

    return suggestions.filter(Boolean);
  }

  /**
   * Demand forecasting based on historical order patterns
   */
  async forecastDemand(tenantId: string, days = 7) {
    const sevenDaysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const orders = await this.prisma.order.findMany({
      where: {
        branch: { tenantId },
        createdAt: { gte: sevenDaysAgo },
        status: { in: ['COMPLETED', 'SERVED'] },
      },
      include: {
        items: {
          select: { menuItemId: true, name: true, quantity: true },
        },
      },
    });

    // Aggregate item quantities
    const itemCounts = new Map<string, { name: string; totalQuantity: number; daysOrdered: Set<string> }>();
    for (const order of orders) {
      const dayKey = order.createdAt.toISOString().split('T')[0];
      for (const item of order.items) {
        if (!itemCounts.has(item.menuItemId)) {
          itemCounts.set(item.menuItemId, { name: item.name, totalQuantity: 0, daysOrdered: new Set() });
        }
        const entry = itemCounts.get(item.menuItemId)!;
        entry.totalQuantity += item.quantity;
        entry.daysOrdered.add(dayKey);
      }
    }

    const forecast = Array.from(itemCounts.entries()).map(([id, data]) => {
      const dailyAvg = data.totalQuantity / Math.max(data.daysOrdered.size, 1);
      const frequency = data.daysOrdered.size / Math.min(days, 30);
      return {
        menuItemId: id,
        name: data.name,
        dailyAverage: Math.round(dailyAvg * 10) / 10,
        frequency,
        forecastNextWeek: Math.round(dailyAvg * 7),
        trend: dailyAvg > 5 ? 'HIGH' : dailyAvg > 2 ? 'MEDIUM' : 'LOW',
      };
    });

    return forecast.sort((a, b) => b.dailyAverage - a.dailyAverage);
  }

  /**
   * Generate business insights from order data
   */
  async getInsights(tenantId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayOrders = await this.prisma.order.count({
      where: { branch: { tenantId }, createdAt: { gte: todayStart } },
    });

    const weekOrders = await this.prisma.order.count({
      where: { branch: { tenantId }, createdAt: { gte: weekAgo } },
    });

    const popularItems = await this.prisma.orderItem.groupBy({
      by: ['name'],
      where: { order: { branch: { tenantId }, createdAt: { gte: weekAgo } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    return {
      todayOrders,
      weeklyOrders: weekOrders,
      weeklyAverage: Math.round(weekOrders / 7),
      topItems: popularItems.map((i) => ({ name: i.name, totalSold: i._sum.quantity })),
      suggestions: [
        todayOrders === 0 ? 'No orders yet today. Consider running a promotion.' : null,
        weekOrders < 50 ? 'Weekly orders are low. Review menu pricing and marketing.' : null,
        'Review your top-selling items and ensure adequate inventory.',
      ].filter(Boolean),
    };
  }
}
