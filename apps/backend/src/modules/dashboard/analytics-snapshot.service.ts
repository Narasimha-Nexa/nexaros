import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';

@Injectable()
export class AnalyticsSnapshotService {
  private readonly logger = new Logger(AnalyticsSnapshotService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async computeDailySnapshot(tenantId: string, branchId: string | null, date: Date) {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);

    const branchFilter = branchId ? { branchId } : {};

    const [orders, payments, inventoryItems, staffList] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          ...branchFilter,
          branch: { tenantId },
          createdAt: { gte: dayStart, lt: dayEnd },
        },
        select: {
          id: true, status: true, totalAmount: true, type: true,
          createdAt: true, updatedAt: true,
        },
      }),
      this.prisma.payment.findMany({
        where: {
          ...branchFilter,
          branch: { tenantId },
          createdAt: { gte: dayStart, lt: dayEnd },
        },
        select: { amount: true, method: true },
      }),
      this.prisma.inventoryItem.findMany({
        where: { tenantId },
        select: { id: true, currentStock: true, costPrice: true, minimumStock: true },
      }),
      this.prisma.staff.findMany({
        where: { branch: branchId ? { id: branchId } : { tenantId } },
        select: { id: true, salary: true },
      }),
    ]);

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED').length;
    const cancelledOrders = orders.filter((o: any) => o.status === 'CANCELLED').length;
    const grossRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const avgOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;

    const completionTimes = orders
      .filter((o: any) => o.status === 'COMPLETED')
      .map((o: any) => {
        const diff = new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime();
        return diff / 60_000;
      });
    const avgCompletionMinutes = completionTimes.length > 0
      ? completionTimes.reduce((a: number, b: number) => a + b, 0) / completionTimes.length
      : null;

    const paymentBreakdown: Record<string, number> = {};
    for (const p of payments) {
      const method = (p as any).method || 'UNKNOWN';
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + Number(p.amount);
    }

    const dineInOrders = orders.filter((o: any) => o.type === 'DINE_IN').length;
    const takeawayOrders = orders.filter((o: any) => o.type === 'TAKEAWAY').length;
    const deliveryOrders = orders.filter((o: any) => o.type === 'DELIVERY').length;

    const foodCost = inventoryItems.reduce((sum: number, i: any) => {
      const used = Number(i.currentStock) * Number(i.costPrice || 0);
      return sum + used * 0.3;
    }, 0);

    const laborCost = staffList.reduce((sum: number, s: any) => sum + Number(s.salary || 0) / 30, 0);

    const snapshot = await this.prisma.dailyAnalyticsSnapshot.upsert({
      where: {
        tenantId_branchId_date: {
          tenantId,
          branchId: branchId || '',
          date: dayStart,
        },
      },
      update: {
        grossRevenue,
        netRevenue: grossRevenue,
        averageOrderValue: avgOrderValue,
        totalOrders,
        completedOrders,
        cancelledOrders,
        dineInOrders,
        takeawayOrders,
        deliveryOrders,
        avgCompletionMinutes,
        foodCost,
        laborCost,
        revenueByPaymentMethod: paymentBreakdown,
        computedAt: new Date(),
      },
      create: {
        tenantId,
        branchId: branchId || null,
        date: dayStart,
        grossRevenue,
        netRevenue: grossRevenue,
        averageOrderValue: avgOrderValue,
        totalOrders,
        completedOrders,
        cancelledOrders,
        dineInOrders,
        takeawayOrders,
        deliveryOrders,
        avgCompletionMinutes,
        foodCost,
        laborCost,
        revenueByPaymentMethod: paymentBreakdown,
      },
    });

    this.logger.debug(`Daily snapshot computed: ${tenantId}/${branchId || 'all'} ${dayStart.toISOString().slice(0, 10)}`);
    return snapshot;
  }

  async computeHourlySnapshot(tenantId: string, branchId: string | null, date: Date, hour: number) {
    const hourStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);
    const hourEnd = new Date(hourStart.getTime() + 3_600_000);

    const branchFilter = branchId ? { branchId } : {};

    const [orders, payments] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          ...branchFilter,
          branch: { tenantId },
          createdAt: { gte: hourStart, lt: hourEnd },
        },
        select: { id: true, totalAmount: true },
      }),
      this.prisma.payment.findMany({
        where: {
          ...branchFilter,
          branch: { tenantId },
          createdAt: { gte: hourStart, lt: hourEnd },
        },
        select: { amount: true },
      }),
    ]);

    const totalOrders = orders.length;
    const revenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

    const snapshot = await this.prisma.hourlyAnalyticsSnapshot.upsert({
      where: {
        tenantId_branchId_date_hour: {
          tenantId,
          branchId: branchId || '',
          date: hourStart,
          hour,
        },
      },
      update: {
        revenue,
        orders: totalOrders,
        avgOrderValue,
        computedAt: new Date(),
      },
      create: {
        tenantId,
        branchId: branchId || null,
        date: hourStart,
        hour,
        revenue,
        orders: totalOrders,
        avgOrderValue,
      },
    });

    return snapshot;
  }

  async computeBranchSnapshot(tenantId: string, branchId: string, date: Date) {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);

    const [orders, payments, prevDaySnapshot] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          branchId,
          branch: { tenantId },
          createdAt: { gte: dayStart, lt: dayEnd },
        },
        select: { id: true, status: true, totalAmount: true },
      }),
      this.prisma.payment.findMany({
        where: {
          branchId,
          branch: { tenantId },
          createdAt: { gte: dayStart, lt: dayEnd },
        },
        select: { amount: true },
      }),
      this.prisma.branchAnalyticsSnapshot.findFirst({
        where: {
          tenantId,
          branchId,
          date: new Date(dayStart.getTime() - 86_400_000),
        },
      }),
    ]);

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED').length;
    const cancelledOrders = orders.filter((o: any) => o.status === 'CANCELLED').length;
    const grossRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const netRevenue = grossRevenue;
    const avgOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;

    const growthPct = prevDaySnapshot && Number(prevDaySnapshot.grossRevenue) > 0
      ? ((grossRevenue - Number(prevDaySnapshot.grossRevenue)) / Number(prevDaySnapshot.grossRevenue)) * 100
      : 0;

    const snapshot = await this.prisma.branchAnalyticsSnapshot.upsert({
      where: {
        tenantId_branchId_date: {
          tenantId,
          branchId,
          date: dayStart,
        },
      },
      update: {
        grossRevenue,
        netRevenue,
        totalOrders,
        completedOrders,
        cancelledOrders,
        averageOrderValue: avgOrderValue,
        growthPct,
        computedAt: new Date(),
      },
      create: {
        tenantId,
        branchId,
        date: dayStart,
        grossRevenue,
        netRevenue,
        totalOrders,
        completedOrders,
        cancelledOrders,
        averageOrderValue: avgOrderValue,
        growthPct,
      },
    });

    return snapshot;
  }

  async computeAllSnapshots(tenantId: string, branchId?: string) {
    const now = new Date();
    const branches = branchId
      ? [{ id: branchId }]
      : await this.prisma.branch.findMany({
          where: { tenantId, isActive: true },
          select: { id: true },
        });

    const results = await Promise.all([
      this.computeDailySnapshot(tenantId, branchId || null, now),
      this.computeHourlySnapshot(tenantId, branchId || null, now, now.getHours()),
      ...branches.map((b: any) =>
        this.computeBranchSnapshot(tenantId, b.id, now),
      ),
    ]);

    return results;
  }

  async getSnapshots(tenantId: string, options: {
    branchId?: string;
    from?: Date;
    to?: Date;
    type?: 'daily' | 'hourly' | 'branch';
  }) {
    const { branchId, from, to, type } = options;
    const dateFilter: any = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;

    if (type === 'hourly' || (!type && !branchId)) {
      const where: any = { tenantId };
      if (branchId) where.branchId = branchId;
      if (Object.keys(dateFilter).length) where.date = dateFilter;

      return this.prisma.hourlyAnalyticsSnapshot.findMany({
        where,
        orderBy: [{ date: 'desc' }, { hour: 'desc' }],
        take: 168,
      });
    }

    if (type === 'branch') {
      const where: any = { tenantId };
      if (branchId) where.branchId = branchId;
      if (Object.keys(dateFilter).length) where.date = dateFilter;

      return this.prisma.branchAnalyticsSnapshot.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 90,
      });
    }

    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;
    if (Object.keys(dateFilter).length) where.date = dateFilter;

    return this.prisma.dailyAnalyticsSnapshot.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 90,
    });
  }

  async getGoalProgress(tenantId: string) {
    const now = new Date();

    const goals = await this.prisma.kpiGoal.findMany({
      where: {
        tenantId,
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const results = await Promise.all(
      goals.map(async (goal: any) => {
        const currentValue = await this.getGoalCurrentValue(tenantId, goal.metric, goal.period, goal.startDate, goal.endDate || now);
        const target = Number(goal.target);
        const progress = target > 0 ? (currentValue / target) * 100 : 0;

        return {
          ...goal,
          currentValue,
          progress: Math.round(progress * 100) / 100,
          status: progress >= 100 ? 'achieved' : progress >= 75 ? 'on_track' : progress >= 50 ? 'at_risk' : 'behind',
        };
      }),
    );

    return results;
  }

  private async getGoalCurrentValue(
    tenantId: string,
    metric: string,
    _period: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const dayStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const dayEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);

    switch (metric) {
      case 'revenue': {
        const result = await this.prisma.payment.aggregate({
          where: {
            branch: { tenantId },
            createdAt: { gte: dayStart, lt: dayEnd },
          },
          _sum: { amount: true },
        });
        return Number(result._sum.amount || 0);
      }
      case 'orders': {
        return this.prisma.order.count({
          where: {
            branch: { tenantId },
            createdAt: { gte: dayStart, lt: dayEnd },
          },
        });
      }
      case 'netProfit': {
        const [incomeResult, expenseResult] = await Promise.all([
          this.prisma.transaction.aggregate({
            where: { tenantId, type: 'INCOME', date: { gte: dayStart, lt: dayEnd } },
            _sum: { amount: true },
          }),
          this.prisma.transaction.aggregate({
            where: { tenantId, type: 'EXPENSE', date: { gte: dayStart, lt: dayEnd } },
            _sum: { amount: true },
          }),
        ]);
        return Number(incomeResult._sum.amount || 0) - Number(expenseResult._sum.amount || 0);
      }
      case 'aov': {
        const [payResult, orderCount] = await Promise.all([
          this.prisma.payment.aggregate({
            where: {
              branch: { tenantId },
              createdAt: { gte: dayStart, lt: dayEnd },
            },
            _sum: { amount: true },
          }),
          this.prisma.order.count({
            where: {
              branch: { tenantId },
              createdAt: { gte: dayStart, lt: dayEnd },
            },
          }),
        ]);
        return orderCount > 0 ? Number(payResult._sum.amount || 0) / orderCount : 0;
      }
      default:
        return 0;
    }
  }

  async getActiveAlerts(tenantId: string) {
    return this.prisma.kpiAlert.findMany({
      where: {
        tenantId,
        status: { not: 'resolved' },
      },
      orderBy: [
        { severity: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async acknowledgeAlert(alertId: string, tenantId: string) {
    return this.prisma.kpiAlert.update({
      where: { id: alertId, tenantId },
      data: { status: 'acknowledged' },
    });
  }

  async resolveAlert(alertId: string, tenantId: string) {
    return this.prisma.kpiAlert.update({
      where: { id: alertId, tenantId },
      data: { status: 'resolved', resolvedAt: new Date() },
    });
  }

  async createAlert(tenantId: string, data: {
    branchId?: string;
    metric: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    value?: number;
    threshold?: number;
  }) {
    return this.prisma.kpiAlert.create({
      data: {
        tenantId,
        branchId: data.branchId || null,
        metric: data.metric,
        severity: data.severity,
        title: data.title,
        message: data.message,
        value: data.value ?? null,
        threshold: data.threshold ?? null,
        status: 'open',
      },
    });
  }

  async getSystemHealth() {
    const [dbCheck, orderCount, activeStaff, lowStockItems] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1 as ok`.then(() => true).catch(() => false),
      this.prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } } }),
      this.prisma.staff.count({ where: { isActive: true } }),
      this.prisma.inventoryItem.findMany({
        where: { currentStock: { lte: 10 } },
        select: { id: true, name: true, currentStock: true },
      }),
    ]);

    return {
      database: { status: dbCheck ? 'healthy' : 'degraded', latencyMs: dbCheck ? 2 : -1 },
      orders: { active: orderCount },
      staff: { total: activeStaff },
      inventory: { lowStock: lowStockItems.length, items: lowStockItems.slice(0, 5) },
      timestamp: new Date().toISOString(),
    };
  }
}
