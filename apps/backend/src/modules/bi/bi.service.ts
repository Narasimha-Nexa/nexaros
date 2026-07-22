import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { RedisService } from '../../common/redis/redis.service';
import { BiQueryDto, GoalDto } from './dto';

type DateRange = { from: Date; to: Date; prevFrom: Date; prevTo: Date; compare: boolean };

@Injectable()
export class BiService {
  private readonly logger = new Logger(BiService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ── Helpers ──

  resolveTenant(userTenantId: string): string {
    if (!userTenantId) throw new BadRequestException('tenantId is required');
    return userTenantId;
  }

  parseRange(dto: BiQueryDto): DateRange {
    const to = dto.to ? new Date(dto.to) : new Date();
    const from = dto.from ? new Date(dto.from) : new Date(to.getTime() - 30 * 864e5);
    const compare = dto.compare === 'true' || dto.compare === '1';
    const span = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(from.getTime() - span);
    return { from, to, prevFrom, prevTo, compare };
  }

  private async cached<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<T> {
    try {
      const hit = await this.redis.get<T>(key);
      if (hit) return hit;
    } catch { /* ignore cache errors */ }
    const data = await loader();
    try { await this.redis.set(key, data, ttl); } catch { /* ignore */ }
    return data;
  }

  // ── Executive Summary (KPI scorecards) ──

  async executiveSummary(userTenantId: string, dto: BiQueryDto) {
    const tenantId = this.resolveTenant(userTenantId);
    const range = this.parseRange(dto);
    const key = `bi:exec:${tenantId}:${dto.branchIds?.join(',') || 'all'}:${range.from.toISOString().slice(0,10)}:${range.to.toISOString().slice(0,10)}:${range.compare}`;
    return this.cached(key, 300, () => this.computeExecSummary(tenantId, dto, range));
  }

  private async computeExecSummary(tenantId: string, dto: BiQueryDto, range: DateRange) {
    const cur = await this.aggregatePeriod(tenantId, dto, range.from, range.to);
    const prev = range.compare ? await this.aggregatePeriod(tenantId, dto, range.prevFrom, range.prevTo) : null;
    const cards = [
      this.card('revenue', 'Revenue', cur.grossRevenue, prev?.grossRevenue, 'currency'),
      this.card('netProfit', 'Net Profit', cur.netRevenue, prev?.netRevenue, 'currency'),
      this.card('orders', 'Orders', cur.totalOrders, prev?.totalOrders, 'number'),
      this.card('aov', 'Avg Order Value', cur.averageOrderValue, prev?.averageOrderValue, 'currency'),
      this.card('customers', 'Customers', cur.newCustomers + cur.returningCustomers, prev ? prev.newCustomers + prev.returningCustomers : undefined, 'number'),
      this.card('foodCostPct', 'Food Cost %', cur.foodCostPct, prev?.foodCostPct, 'percent'),
      this.card('laborCostPct', 'Labor Cost %', cur.laborCostPct, prev?.laborCostPct, 'percent'),
      this.card('retentionPct', 'Customer Retention %', cur.retentionRate, prev?.retentionRate, 'percent'),
    ];
    return { period: { from: range.from, to: range.to }, cards };
  }

  private card(metric: string, label: string, value: number, prev: number | undefined, kind: 'currency' | 'number' | 'percent') {
    const change = prev && prev !== 0 ? ((value - prev) / Math.abs(prev)) * 100 : 0;
    return {
      metric, label, kind,
      value: Number(value?.toFixed(2) ?? 0),
      previous: prev !== undefined ? Number(prev?.toFixed(2) ?? 0) : null,
      changePct: prev !== undefined ? Number(change.toFixed(1)) : null,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
    };
  }

  // ── Raw aggregation for a period (uses orders + snapshots) ──

  async aggregatePeriod(tenantId: string, dto: BiQueryDto, from: Date, to: Date) {
    const branchFilter = dto.branchIds?.length ? { branchId: { in: dto.branchIds } } : {};
    const where: Prisma.OrderWhereInput = {
      tenantId,
      createdAt: { gte: from, lte: to },
      status: { not: 'CANCELLED' as any },
      deletedAt: null,
      ...branchFilter,
    };

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true, branchId: true, type: true, channel: true, status: true,
        totalAmount: true, taxAmount: true, discountAmount: true, subtotal: true,
        createdAt: true, customerPhone: true, staffId: true,
      },
    });

    const totalOrders = orders.length;
    const completed = orders.filter(o => o.status === ('COMPLETED' as any) || o.status === ('SERVED' as any));
    const cancelled = orders.filter(o => o.status === ('CANCELLED' as any)).length;
    const gross = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const tax = orders.reduce((s, o) => s + Number(o.taxAmount), 0);
    const discounts = orders.reduce((s, o) => s + Number(o.discountAmount), 0);
    const net = gross - discounts;
    const aov = totalOrders ? gross / totalOrders : 0;

    const dineIn = orders.filter(o => o.channel === ('DINE_IN' as any)).length;
    const takeaway = orders.filter(o => o.channel === ('TAKEAWAY' as any) || o.type === ('TAKEAWAY' as any)).length;
    const delivery = orders.filter(o => o.channel === ('DELIVERY' as any) || o.type === ('DELIVERY' as any)).length;

    // Revenue by hour
    const byHour: Record<number, number> = {};
    for (let i = 0; i < 24; i++) byHour[i] = 0;
    orders.forEach(o => { const h = new Date(o.createdAt).getHours(); byHour[h] += Number(o.totalAmount); });

    // Revenue by day
    const byDay: Record<string, number> = {};
    orders.forEach(o => { const d = new Date(o.createdAt).toISOString().slice(0, 10); byDay[d] = (byDay[d] || 0) + Number(o.totalAmount); });

    // Revenue by payment method
    const paymentAgg = await this.prisma.payment.groupBy({
      by: ['method'],
      where: { order: { tenantId, createdAt: { gte: from, lte: to } }, ...(dto.branchIds?.length ? { branchId: { in: dto.branchIds } } : {}) },
      _sum: { amount: true },
    });
    const revenueByPaymentMethod = paymentAgg.map(p => ({ method: p.method, amount: Number(p._sum?.amount || 0) }));

    // Customers (unique phones = customers; new vs returning approximated by first-seen)
    const phones = orders.map(o => o.customerPhone).filter(Boolean) as string[];
    const uniquePhones = new Set(phones);
    const returning = await this.prisma.customer.count({
      where: { tenantId, phone: { in: [...uniquePhones] }, createdAt: { lt: from } },
    });
    const newCustomers = Math.max(0, uniquePhones.size - returning);

    // Top items
    const itemAgg = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { tenantId, createdAt: { gte: from, lte: to }, deletedAt: null, ...branchFilter } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { menuItemId: 'asc' },
      take: 50,
    });
    const sortedAgg = [...itemAgg].sort((a, b) => Number(b._sum?.totalPrice || 0) - Number(a._sum?.totalPrice || 0)).slice(0, 10);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: sortedAgg.map(i => i.menuItemId).filter(Boolean) as string[] } },
      select: { id: true, name: true },
    });
    const topItems = sortedAgg.map(i => ({
      menuItemId: i.menuItemId,
      name: menuItems.find(m => m.id === i.menuItemId)?.name || 'Unknown',
      quantity: Number(i._sum?.quantity || 0),
      revenue: Number(i._sum?.totalPrice || 0),
    }));

    // Food cost (menuItem.costPrice * quantity sold in period)
    const foodCostAgg = await this.prisma.orderItem.aggregate({
      where: { order: { tenantId, createdAt: { gte: from, lte: to }, deletedAt: null, ...branchFilter } },
      _sum: { quantity: true },
    });
    const itemCosts = await this.prisma.menuItem.findMany({
      where: { id: { in: itemAgg.map(i => i.menuItemId).filter(Boolean) as string[] } },
      select: { id: true, costPrice: true },
    });
    let foodCost = 0;
    sortedAgg.forEach(i => {
      const cost = itemCosts.find(m => m.id === i.menuItemId)?.costPrice;
      if (cost) foodCost += Number(cost) * Number(i._sum?.quantity || 0);
    });
    const foodCostPct = gross ? (foodCost / gross) * 100 : 0;

    // Labor cost (payroll net pay in period, matched by createdAt)
    const payroll = await this.prisma.payroll.aggregate({
      where: { tenantId, createdAt: { gte: from, lte: to }, ...(dto.branchIds?.length ? { branchId: { in: dto.branchIds } } : {}) },
      _sum: { netPay: true },
    });
    const laborCost = Number(payroll._sum.netPay || 0);
    const laborCostPct = gross ? (laborCost / gross) * 100 : 0;

    // Sales per staff
    const staffAgg = await this.prisma.order.groupBy({
      by: ['staffId'],
      where: { ...where, staffId: { not: null } },
      _sum: { totalAmount: true },
      _count: { id: true },
    });
    const salesPerStaff = staffAgg.length
      ? staffAgg.reduce((s, x) => s + Number(x._sum.totalAmount || 0), 0) / staffAgg.length
      : 0;

    const retentionRate = uniquePhones.size ? (returning / uniquePhones.size) * 100 : 0;

    return {
      grossRevenue: Number(gross.toFixed(2)),
      netRevenue: Number(net.toFixed(2)),
      taxCollected: Number(tax.toFixed(2)),
      discounts: Number(discounts.toFixed(2)),
      refunds: 0,
      averageOrderValue: Number(aov.toFixed(2)),
      revenueByPaymentMethod,
      totalOrders,
      completedOrders: completed.length,
      cancelledOrders: cancelled,
      dineInOrders: dineIn,
      takeawayOrders: takeaway,
      deliveryOrders: delivery,
      revenueByHour: byHour,
      revenueByDay: byDay,
      newCustomers,
      returningCustomers: returning,
      retentionRate: Number(retentionRate.toFixed(2)),
      topItems,
      foodCost: Number(foodCost.toFixed(2)),
      foodCostPct: Number(foodCostPct.toFixed(2)),
      laborCost: Number(laborCost.toFixed(2)),
      laborCostPct: Number(laborCostPct.toFixed(2)),
      salesPerStaff: Number(salesPerStaff.toFixed(2)),
    };
  }

  // ── Trend endpoints ──

  async revenueTrend(userTenantId: string, dto: BiQueryDto) {
    const tenantId = this.resolveTenant(userTenantId);
    const range = this.parseRange(dto);
    const agg = await this.aggregatePeriod(tenantId, dto, range.from, range.to);
    const series = Object.entries(agg.revenueByDay).map(([date, value]) => ({ date, value: Number(value.toFixed(2)) }));
    let previous: any[] = [];
    if (range.compare) {
      const prev = await this.aggregatePeriod(tenantId, dto, range.prevFrom, range.prevTo);
      previous = Object.entries(prev.revenueByDay).map(([date, value]) => ({ date, value: Number(value.toFixed(2)) }));
    }
    return { series, previous, currency: 'INR' };
  }

  async ordersTrend(userTenantId: string, dto: BiQueryDto) {
    const tenantId = this.resolveTenant(userTenantId);
    const range = this.parseRange(dto);
    const agg = await this.aggregatePeriod(tenantId, dto, range.from, range.to);
    const byDay: Record<string, number> = {};
    // recompute orders by day from raw (cheap within range)
    const orders = await this.prisma.order.findMany({
      where: { tenantId, createdAt: { gte: range.from, lte: range.to }, deletedAt: null, ...(dto.branchIds?.length ? { branchId: { in: dto.branchIds } } : {}) },
      select: { createdAt: true, status: true },
    });
    orders.forEach(o => { const d = new Date(o.createdAt).toISOString().slice(0, 10); byDay[d] = (byDay[d] || 0) + 1; });
    const series = Object.entries(byDay).map(([date, value]) => ({ date, value }));
    return { series };
  }

  async customerTrend(userTenantId: string, dto: BiQueryDto) {
    const tenantId = this.resolveTenant(userTenantId);
    const range = this.parseRange(dto);
    const agg = await this.aggregatePeriod(tenantId, dto, range.from, range.to);
    return {
      newCustomers: agg.newCustomers,
      returningCustomers: agg.returningCustomers,
      retentionRate: agg.retentionRate,
      total: agg.newCustomers + agg.returningCustomers,
    };
  }

  async profitability(userTenantId: string, dto: BiQueryDto) {
    const tenantId = this.resolveTenant(userTenantId);
    const range = this.parseRange(dto);
    const agg = await this.aggregatePeriod(tenantId, dto, range.from, range.to);
    const grossMargin = agg.grossRevenue ? ((agg.grossRevenue - agg.foodCost) / agg.grossRevenue) * 100 : 0;
    const netMargin = agg.grossRevenue ? ((agg.netRevenue - agg.foodCost - agg.laborCost) / agg.grossRevenue) * 100 : 0;
    return {
      grossRevenue: agg.grossRevenue,
      netRevenue: agg.netRevenue,
      foodCost: agg.foodCost,
      foodCostPct: agg.foodCostPct,
      laborCost: agg.laborCost,
      laborCostPct: agg.laborCostPct,
      grossMarginPct: Number(grossMargin.toFixed(2)),
      netMarginPct: Number(netMargin.toFixed(2)),
    };
  }

  async peakHours(userTenantId: string, dto: BiQueryDto) {
    const tenantId = this.resolveTenant(userTenantId);
    const range = this.parseRange(dto);
    const agg = await this.aggregatePeriod(tenantId, dto, range.from, range.to);
    const byHour = agg.revenueByHour as Record<number, number>;
    const hours = Object.entries(byHour).map(([h, revenue]) => ({ hour: Number(h), revenue: Number(revenue.toFixed(2)), orders: 0 }));
    // weekday aggregation
    const orders = await this.prisma.order.findMany({
      where: { tenantId, createdAt: { gte: range.from, lte: range.to }, deletedAt: null, ...(dto.branchIds?.length ? { branchId: { in: dto.branchIds } } : {}) },
      select: { createdAt: true },
    });
    const byWeekday: Record<number, number> = {};
    orders.forEach(o => { const d = new Date(o.createdAt).getDay(); byWeekday[d] = (byWeekday[d] || 0) + 1; });
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name, i) => ({ weekday: name, orders: byWeekday[i] || 0 }));
    return { byHour: hours, byWeekday: weekdays };
  }

  async topItems(userTenantId: string, dto: BiQueryDto) {
    const tenantId = this.resolveTenant(userTenantId);
    const range = this.parseRange(dto);
    const agg = await this.aggregatePeriod(tenantId, dto, range.from, range.to);
    return { items: agg.topItems };
  }

  // ── Branch benchmarking ──

  async branchLeaderboard(userTenantId: string, dto: BiQueryDto) {
    const tenantId = this.resolveTenant(userTenantId);
    const range = this.parseRange(dto);
    const branches = await this.prisma.branch.findMany({ where: { tenantId }, select: { id: true, name: true, city: true } });
    const rows = await Promise.all(branches.map(async b => {
      const agg = await this.aggregatePeriod(tenantId, { ...dto, branchIds: [b.id] }, range.from, range.to);
      const rating = await this.prisma.review.aggregate({ where: { tenantId, createdAt: { gte: range.from, lte: range.to } }, _avg: { rating: true } });
      const score = this.benchmarkScore(agg);
      return {
        branchId: b.id, branchName: b.name, city: b.city,
        revenue: agg.grossRevenue, orders: agg.totalOrders,
        profitMarginPct: Number((agg.grossRevenue ? ((agg.grossRevenue - agg.foodCost - agg.laborCost) / agg.grossRevenue) * 100 : 0).toFixed(2)),
        foodCostPct: agg.foodCostPct, laborCostPct: agg.laborCostPct,
        customerRating: Number((rating._avg.rating || 0).toFixed(2)),
        growthPct: 0, benchmarkScore: score,
      };
    }));
    rows.sort((a, b) => b.revenue - a.revenue);
    return { branches: rows.map((r, i) => ({ rank: i + 1, ...r })) };
  }

  async branchComparison(userTenantId: string, dto: BiQueryDto) {
    const tenantId = this.resolveTenant(userTenantId);
    const range = this.parseRange(dto);
    const ids = dto.branchIds && dto.branchIds.length ? dto.branchIds : (await this.prisma.branch.findMany({ where: { tenantId }, take: 4, select: { id: true } })).map(b => b.id);
    const rows = await Promise.all(ids.map(async id => {
      const branch = await this.prisma.branch.findUnique({ where: { id }, select: { name: true } });
      const agg = await this.aggregatePeriod(tenantId, { ...dto, branchIds: [id] }, range.from, range.to);
      return {
        branchId: id, branchName: branch?.name || id,
        revenue: agg.grossRevenue, orders: agg.totalOrders, aov: agg.averageOrderValue,
        retentionRate: agg.retentionRate, foodCostPct: agg.foodCostPct, laborCostPct: agg.laborCostPct,
      };
    }));
    return { branches: rows };
  }

  async regionalPerformance(userTenantId: string, dto: BiQueryDto) {
    const tenantId = this.resolveTenant(userTenantId);
    const range = this.parseRange(dto);
    const regions = await this.prisma.branch.groupBy({ by: ['city'], where: { tenantId }, _count: { id: true } });
    const rows = await Promise.all(regions.map(async r => {
      const branches = await this.prisma.branch.findMany({ where: { tenantId, city: r.city }, select: { id: true } });
      const agg = await this.aggregatePeriod(tenantId, { ...dto, branchIds: branches.map(b => b.id) }, range.from, range.to);
      return { region: r.city || 'Unknown', branches: r._count.id, revenue: agg.grossRevenue, orders: agg.totalOrders, growthPct: 0 };
    }));
    return { regions: rows.sort((a, b) => b.revenue - a.revenue) };
  }

  benchmarkScore(agg: any): number {
    let score = 0;
    score += Math.min(40, (agg.grossRevenue / 10000)); // revenue scale (capped)
    score += Math.max(0, 30 - agg.foodCostPct / 2);
    score += Math.max(0, 20 - agg.laborCostPct / 3);
    score += agg.retentionRate / 5;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ── Insights ──

  async insights(userTenantId: string, dto: BiQueryDto) {
    const tenantId = this.resolveTenant(userTenantId);
    const range = this.parseRange(dto);
    const agg = await this.aggregatePeriod(tenantId, dto, range.from, range.to);
    const insights: any[] = [];
    if (agg.foodCostPct > 35) insights.push({ type: 'warning', title: 'High food cost', message: `Food cost is ${agg.foodCostPct}% of revenue. Review portioning and supplier rates.`, metric: 'foodCostPct' });
    if (agg.laborCostPct > 30) insights.push({ type: 'warning', title: 'Elevated labor cost', message: `Labor cost is ${agg.laborCostPct}% of revenue. Consider scheduling optimization.`, metric: 'laborCostPct' });
    if (agg.retentionRate < 30 && (agg.newCustomers + agg.returningCustomers) > 0) insights.push({ type: 'critical', title: 'Low retention', message: `Only ${agg.retentionRate}% of customers are returning. Launch a loyalty campaign.`, metric: 'retentionPct' });
    if (agg.topItems.length) insights.push({ type: 'info', title: 'Top performer', message: `"${agg.topItems[0].name}" leads with ₹${agg.topItems[0].revenue} revenue.`, metric: 'topItem' });
    const lowStock = await this.prisma.inventoryItem.count({ where: { tenantId, currentStock: { lte: 0 } } }).catch(() => 0);
    if (lowStock > 0) insights.push({ type: 'warning', title: 'Inventory warning', message: `${lowStock} inventory item(s) are out of stock. Restock to avoid lost sales.`, metric: 'lowStock' });
    return { insights };
  }

  // ── KPI Goals ──

  async getGoals(tenantId: string) {
    return this.prisma.kpiGoal.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createGoal(tenantId: string, dto: GoalDto) {
    return this.prisma.kpiGoal.create({
      data: {
        tenantId, branchId: dto.branchId, metric: dto.metric, target: new Prisma.Decimal(dto.target),
        period: dto.period || 'monthly', startDate: new Date(dto.startDate), endDate: dto.endDate ? new Date(dto.endDate) : null,
        createdBy: dto.createdBy,
      },
    });
  }

  async getAlerts(tenantId: string) {
    return this.prisma.kpiAlert.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  // ── Export (CSV) ──

  async exportCsv(userTenantId: string, dto: BiQueryDto): Promise<{ csv: string; filename: string }> {
    const tenantId = this.resolveTenant(userTenantId);
    const range = this.parseRange(dto);
    const agg = await this.aggregatePeriod(tenantId, dto, range.from, range.to);
    const rows = [
      ['Metric', 'Value'],
      ['Gross Revenue', agg.grossRevenue],
      ['Net Revenue', agg.netRevenue],
      ['Orders', agg.totalOrders],
      ['Avg Order Value', agg.averageOrderValue],
      ['Food Cost %', agg.foodCostPct],
      ['Labor Cost %', agg.laborCostPct],
      ['New Customers', agg.newCustomers],
      ['Retention %', agg.retentionRate],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    return { csv, filename: `bi-export-${tenantId}-${range.from.toISOString().slice(0, 10)}.csv` };
  }
}
