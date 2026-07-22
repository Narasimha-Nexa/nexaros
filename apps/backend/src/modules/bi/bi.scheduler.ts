import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { BiService } from '../bi/bi.service';
import { ForecastService } from '../forecast/forecast.service';
import { ForecastQueryDto } from '../bi/dto';

@Injectable()
export class BiScheduler {
  private readonly logger = new Logger(BiScheduler.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private bi: BiService,
    private forecast: ForecastService,
  ) {}

  // Distributed lock so only one instance runs a cron job.
  private async withLock(key: string, ttlSec: number, fn: () => Promise<void>): Promise<void> {
    const client = this.redis.getClient();
    const lockKey = `bi:lock:${key}`;
    const token = `${process.pid}-${Date.now()}`;
    try {
      const acquired = await client.set(lockKey, token, 'EX', ttlSec, 'NX');
      if (!acquired) {
        this.logger.debug(`Skipped ${key} — lock held by another instance`);
        return;
      }
      await fn();
    } catch (err) {
      this.logger.error(`Scheduler ${key} failed: ${err}`);
    } finally {
      try {
        const cur = await client.get(lockKey);
        if (cur === token) await client.del(lockKey);
      } catch { /* ignore */ }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async hourlySnapshots() {
    await this.withLock('hourly', 3600, () => this.buildHourly());
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async dailySnapshots() {
    await this.withLock('daily', 7200, () => this.buildDaily());
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async branchSnapshots() {
    await this.withLock('branch', 7200, () => this.buildBranch());
  }

  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async forecastSnapshots() {
    await this.withLock('forecast', 7200, () => this.buildForecast());
  }

  private async tenants(): Promise<{ id: string }[]> {
    return this.prisma.tenant.findMany({ where: { status: 'ACTIVE' as any, deletedAt: null }, select: { id: true } });
  }

  private async buildHourly() {
    const now = new Date();
    const hour = now.getHours();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (const t of await this.tenants()) {
      const agg = await this.bi.aggregatePeriod(t.id, {}, date, now);
      const existing = await this.prisma.hourlyAnalyticsSnapshot.findFirst({ where: { tenantId: t.id, branchId: null, date, hour } });
      const data = { revenue: agg.grossRevenue, orders: agg.totalOrders, avgOrderValue: agg.averageOrderValue, computedAt: now };
      if (existing) {
        await this.prisma.hourlyAnalyticsSnapshot.update({ where: { id: existing.id }, data });
      } else {
        await this.prisma.hourlyAnalyticsSnapshot.create({ data: { tenantId: t.id, branchId: null, date, hour, ...data } });
      }
    }
    this.logger.log('Hourly snapshots built');
  }

  private async buildDaily() {
    const yesterday = new Date(Date.now() - 864e5);
    const date = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    for (const t of await this.tenants()) {
      const agg = await this.bi.aggregatePeriod(t.id, {}, date, new Date(date.getTime() + 864e5 - 1));
      const existing = await this.prisma.dailyAnalyticsSnapshot.findFirst({ where: { tenantId: t.id, branchId: null, date } });
      if (existing) {
        await this.prisma.dailyAnalyticsSnapshot.update({ where: { id: existing.id }, data: this.dailyData(agg, date) });
      } else {
        await this.prisma.dailyAnalyticsSnapshot.create({ data: { tenantId: t.id, branchId: null, date, ...this.dailyData(agg, date) } as any });
      }
    }
    this.logger.log('Daily snapshots built');
  }

  private dailyData(agg: any, date: Date) {
    return {
      grossRevenue: agg.grossRevenue, netRevenue: agg.netRevenue, taxCollected: agg.taxCollected,
      discounts: agg.discounts, refunds: agg.refunds, averageOrderValue: agg.averageOrderValue,
      revenueByPaymentMethod: agg.revenueByPaymentMethod, totalOrders: agg.totalOrders,
      completedOrders: agg.completedOrders, cancelledOrders: agg.cancelledOrders,
      dineInOrders: agg.dineInOrders, takeawayOrders: agg.takeawayOrders, deliveryOrders: agg.deliveryOrders,
      newCustomers: agg.newCustomers, returningCustomers: agg.returningCustomers, retentionRate: agg.retentionRate,
      topItems: agg.topItems, revenueByCategory: agg.revenueByCategory || null, foodCost: agg.foodCost,
      wasteValue: agg.wasteValue || null, laborCost: agg.laborCost, salesPerStaff: agg.salesPerStaff,
    };
  }

  private async buildBranch() {
    const yesterday = new Date(Date.now() - 864e5);
    const date = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    for (const t of await this.tenants()) {
      const branches = await this.prisma.branch.findMany({ where: { tenantId: t.id }, select: { id: true } });
      for (const b of branches) {
        const agg = await this.bi.aggregatePeriod(t.id, { branchIds: [b.id] }, date, new Date(date.getTime() + 864e5 - 1));
        const profitMarginPct = agg.grossRevenue ? ((agg.grossRevenue - agg.foodCost - agg.laborCost) / agg.grossRevenue) * 100 : 0;
        const growthPct = 0;
        const benchmarkScore = this.bi.benchmarkScore(agg);
        await this.prisma.branchAnalyticsSnapshot.upsert({
          where: { tenantId_branchId_date: { tenantId: t.id, branchId: b.id, date } },
          update: { grossRevenue: agg.grossRevenue, netRevenue: agg.netRevenue, totalOrders: agg.totalOrders, completedOrders: agg.completedOrders, cancelledOrders: agg.cancelledOrders, averageOrderValue: agg.averageOrderValue, foodCostPct: agg.foodCostPct, laborCostPct: agg.laborCostPct, profitMarginPct: Number(profitMarginPct.toFixed(2)), growthPct: growthPct, benchmarkScore },
          create: { tenantId: t.id, branchId: b.id, date, grossRevenue: agg.grossRevenue, netRevenue: agg.netRevenue, totalOrders: agg.totalOrders, completedOrders: agg.completedOrders, cancelledOrders: agg.cancelledOrders, averageOrderValue: agg.averageOrderValue, foodCostPct: agg.foodCostPct, laborCostPct: agg.laborCostPct, profitMarginPct: Number(profitMarginPct.toFixed(2)), growthPct, benchmarkScore },
        });
      }
    }
    this.logger.log('Branch snapshots built');
  }

  private async buildForecast() {
    for (const t of await this.tenants()) {
      const dto: ForecastQueryDto = { tenantId: t.id, horizon: 30 };
      for (const metric of ['revenue', 'orders', 'inventory', 'staffing'] as const) {
        try {
          let result: { series: Array<{ predicted: number; lower: number; upper: number }>; confidence: number };
          if (metric === 'revenue') result = await this.forecast.revenue(t.id, dto);
          else if (metric === 'orders') result = await this.forecast.orders(t.id, dto);
          else if (metric === 'inventory') result = await this.forecast.inventory(t.id, dto);
          else result = await this.forecast.staffing(t.id, dto);

          const forecastDate = new Date(Date.now() + 30 * 864e5);
          const existing = await this.prisma.forecastSnapshot.findFirst({ where: { tenantId: t.id, branchId: null, metric, forecastDate } });
          const data = {
            predicted: result.series.reduce((s, x) => s + x.predicted, 0),
            lowerBound: result.series.reduce((s, x) => s + x.lower, 0),
            upperBound: result.series.reduce((s, x) => s + x.upper, 0),
            confidence: result.confidence,
            computedAt: new Date(),
          };
          if (existing) {
            await this.prisma.forecastSnapshot.update({ where: { id: existing.id }, data });
          } else {
            await this.prisma.forecastSnapshot.create({ data: { tenantId: t.id, branchId: null, metric, horizon: 30, forecastDate, ...data, method: 'exp_smoothing' } });
          }
        } catch (err) {
          this.logger.warn(`Forecast ${metric} failed for ${t.id}: ${err}`);
        }
      }
    }
    this.logger.log('Forecast snapshots built');
  }
}
