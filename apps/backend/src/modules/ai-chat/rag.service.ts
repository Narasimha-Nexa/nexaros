import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

interface RAGContext {
  recentOrders: string;
  topMenuItems: string;
  inventoryAlerts: string;
  customerMetrics: string;
  reservationSummary: string;
  staffSummary: string;
  paymentSummary: string;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly CACHE_TTL = 300;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async buildContext(tenantId: string): Promise<RAGContext> {
    const cacheKey = `ai:rag:${tenantId}`;
    const cached = await this.redis.get<RAGContext>(cacheKey);
    if (cached) return cached;

    const [recentOrders, topMenuItems, inventoryAlerts, customerMetrics, reservationSummary, staffSummary, paymentSummary] =
      await Promise.allSettled([
        this.getRecentOrdersContext(tenantId),
        this.getTopMenuItemsContext(tenantId),
        this.getInventoryAlertsContext(tenantId),
        this.getCustomerMetricsContext(tenantId),
        this.getReservationSummaryContext(tenantId),
        this.getStaffSummaryContext(tenantId),
        this.getPaymentSummaryContext(tenantId),
      ]);

    const ctx: RAGContext = {
      recentOrders: recentOrders.status === 'fulfilled' ? recentOrders.value : '',
      topMenuItems: topMenuItems.status === 'fulfilled' ? topMenuItems.value : '',
      inventoryAlerts: inventoryAlerts.status === 'fulfilled' ? inventoryAlerts.value : '',
      customerMetrics: customerMetrics.status === 'fulfilled' ? customerMetrics.value : '',
      reservationSummary: reservationSummary.status === 'fulfilled' ? reservationSummary.value : '',
      staffSummary: staffSummary.status === 'fulfilled' ? staffSummary.value : '',
      paymentSummary: paymentSummary.status === 'fulfilled' ? paymentSummary.value : '',
    };

    await this.redis.set(cacheKey, ctx, this.CACHE_TTL);
    return ctx;
  }

  async retrieveRelevantContext(tenantId: string, query: string): Promise<string> {
    const ctx = await this.buildContext(tenantId);
    const lower = query.toLowerCase();
    const parts: string[] = [];

    if (lower.match(/order|sale|revenue|today|yesterday/)) parts.push(ctx.recentOrders);
    if (lower.match(/menu|item|dish|food|popular|best|worst/)) parts.push(ctx.topMenuItems);
    if (lower.match(/inventory|stock|waste|supply|low/)) parts.push(ctx.inventoryAlerts);
    if (lower.match(/customer|retention|loyalty|churn|new/)) parts.push(ctx.customerMetrics);
    if (lower.match(/reservation|booking|table|no-show/)) parts.push(ctx.reservationSummary);
    if (lower.match(/staff|employee|shift|labor|payroll/)) parts.push(ctx.staffSummary);
    if (lower.match(/payment|refund|upi|card|cash/)) parts.push(ctx.paymentSummary);

    if (parts.length === 0) {
      parts.push(ctx.recentOrders, ctx.topMenuItems, ctx.inventoryAlerts);
    }

    return parts.filter(Boolean).join('\n\n');
  }

  private async getRecentOrdersContext(tenantId: string): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todayOrders, yesterdayOrders, recentOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: { tenantId, createdAt: { gte: today } },
        select: { id: true, orderNumber: true, totalAmount: true, status: true, type: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.order.findMany({
        where: { tenantId, createdAt: { gte: yesterday, lt: today } },
        select: { totalAmount: true, status: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { tenantId, createdAt: { gte: today } },
        _count: true,
        _sum: { totalAmount: true },
      }),
    ]);

    const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const statusBreakdown = recentOrders.map(g => `${g.status}: ${g._count}`);

    return `Today's orders: ${todayOrders.length}, Revenue: ₹${todayRevenue.toFixed(0)} (yesterday: ₹${yesterdayRevenue.toFixed(0)}). Status breakdown: ${statusBreakdown.join(', ')}. Recent: ${todayOrders.slice(0, 5).map(o => `#${o.orderNumber} ₹${o.totalAmount} ${o.status}`).join(', ')}`;
  }

  private async getTopMenuItemsContext(tenantId: string): Promise<string> {
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { tenantId, createdAt: { gte: new Date(Date.now() - 7 * 864e5) } } },
      _count: true,
      _sum: { totalPrice: true },
      orderBy: { _count: { menuItemId: 'desc' } },
      take: 10,
    });

    const itemIds = topItems.map(i => i.menuItemId);
    const items = await this.prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, price: true, isVeg: true },
    });

    const itemMap = new Map(items.map(i => [i.id, i]));
    const summaries = topItems.map(t => {
      const item = itemMap.get(t.menuItemId);
      return `${item?.name || 'Unknown'}: ${t._count} orders, ₹${Number(t._sum.totalPrice || 0).toFixed(0)} revenue`;
    });

    return `Top menu items (7 days): ${summaries.join('; ') || 'No data'}`;
  }

  private async getInventoryAlertsContext(tenantId: string): Promise<string> {
    const lowStock = await this.prisma.inventoryItem.findMany({
      where: { tenantId, currentStock: { lte: 10 } },
      select: { name: true, currentStock: true, unit: true, minimumStock: true },
      orderBy: { currentStock: 'asc' },
      take: 10,
    });

    const critical = lowStock.filter(i => Number(i.currentStock) <= 0);
    const warnings = lowStock.filter(i => Number(i.currentStock) > 0 && Number(i.currentStock) <= Number(i.minimumStock || 10));

    const parts: string[] = [];
    if (critical.length) parts.push(`CRITICAL (out of stock): ${critical.map(i => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}`);
    if (warnings.length) parts.push(`LOW STOCK: ${warnings.map(i => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}`);

    return parts.join('\n') || 'Inventory levels are healthy.';
  }

  private async getCustomerMetricsContext(tenantId: string): Promise<string> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5);
    const [totalCustomers, newCustomers, returningCustomers] = await Promise.all([
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.customer.count({ where: { tenantId, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.customer.count({ where: { tenantId, totalOrders: { gt: 1 } } }),
    ]);

    return `Customers: ${totalCustomers} total, ${newCustomers} new (30d), ${returningCustomers} returning`;
  }

  private async getReservationSummaryContext(tenantId: string): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayReservations, noShows, upcoming] = await Promise.all([
      this.prisma.reservation.count({ where: { tenantId, date: { gte: today } } }),
      this.prisma.reservation.count({ where: { tenantId, status: 'NO_SHOW' as any, date: { gte: new Date(Date.now() - 7 * 864e5) } } }),
      this.prisma.reservation.findMany({
        where: { tenantId, date: { gte: today }, status: { in: ['CONFIRMED', 'PENDING'] as any } },
        select: { date: true, time: true, guestCount: true, customerName: true },
        take: 5,
      }),
    ]);

    const totalRecent = await this.prisma.reservation.count({
      where: { tenantId, date: { gte: new Date(Date.now() - 7 * 864e5) } },
    });
    const noShowRate = totalRecent > 0 ? ((noShows / totalRecent) * 100).toFixed(1) : '0';

    return `Reservations today: ${todayReservations}. No-show rate (7d): ${noShowRate}%. Upcoming: ${upcoming.map(r => `${r.customerName} ${r.guestCount}p @ ${r.time}`).join(', ') || 'none'}`;
  }

  private async getStaffSummaryContext(tenantId: string): Promise<string> {
    const activeStaff = await this.prisma.staff.count({ where: { tenantId, isActive: true } });
    const pendingLeaves = await this.prisma.leaveRequest.count({
      where: { staff: { tenantId }, status: 'PENDING' as never },
    });

    return `Active staff: ${activeStaff}. Pending leave requests: ${pendingLeaves}`;
  }

  private async getPaymentSummaryContext(tenantId: string): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const payments = await this.prisma.payment.groupBy({
      by: ['method'],
      where: { tenantId, createdAt: { gte: today } },
      _count: true,
      _sum: { amount: true },
    });

    const refunds = await this.prisma.payment.findMany({
      where: { tenantId, status: 'REFUNDED' as never, createdAt: { gte: new Date(Date.now() - 7 * 864e5) } },
      select: { amount: true },
    });

    const totalRefunds = refunds.reduce((s, r) => s + Number(r.amount), 0);
    const breakdown = payments.map(p => `${p.method}: ${p._count} txns, ₹${Number(p._sum.amount || 0).toFixed(0)}`);

    return `Payments today: ${breakdown.join(', ') || 'none'}. Refunds (7d): ₹${totalRefunds.toFixed(0)}`;
  }
}
