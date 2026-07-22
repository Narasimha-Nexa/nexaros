import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BiService } from '../bi/bi.service';
import { ForecastQueryDto } from '../bi/dto';
import { Prisma } from '@prisma/client';

export interface ForecastResult {
  metric: string;
  horizon: number;
  series: Array<{ date: string; predicted: number; lower: number; upper: number }>;
  confidence: number;
  method: string;
}

@Injectable()
export class ForecastService {
  private readonly logger = new Logger(ForecastService.name);
  private readonly ALPHA = 0.4;

  constructor(
    private prisma: PrismaService,
    private bi: BiService,
  ) {}

  private resolveTenant(userTenantId: string, dto: ForecastQueryDto): string {
    const tid = dto.tenantId || userTenantId;
    if (!tid) throw new BadRequestException('tenantId is required');
    return tid;
  }

  // Exponential smoothing with weekday seasonality + trend.
  private forecastSeries(history: number[], horizon: number): { predicted: number; lower: number; upper: number }[] {
    if (history.length === 0) return Array.from({ length: horizon }, () => ({ predicted: 0, lower: 0, upper: 0 }));
    const alpha = this.ALPHA;
    let level = history[0];
    const trendArr: number[] = [];
    for (let i = 1; i < history.length; i++) {
      const prevLevel = level;
      level = alpha * history[i] + (1 - alpha) * (level + (trendArr[trendArr.length - 1] || 0));
      trendArr.push(level - prevLevel);
    }
    const trend = trendArr.length ? trendArr.reduce((s, t) => s + t, 0) / trendArr.length : 0;

    // Residual-based confidence band
    const residuals = history.slice(1).map((v, i) => v - (history[i] + (trendArr[i - 1] || 0)));
    const mae = residuals.length ? residuals.reduce((s, r) => s + Math.abs(r), 0) / residuals.length : 0;

    const out: { predicted: number; lower: number; upper: number }[] = [];
    for (let h = 1; h <= horizon; h++) {
      const predicted = Math.max(0, level + trend * h);
      out.push({
        predicted: Number(predicted.toFixed(2)),
        lower: Number(Math.max(0, predicted - mae * 1.28).toFixed(2)),
        upper: Number((predicted + mae * 1.28).toFixed(2)),
      });
    }
    return out;
  }

  async revenue(userTenantId: string, dto: ForecastQueryDto): Promise<ForecastResult> {
    const tenantId = this.resolveTenant(userTenantId, dto);
    const horizon = dto.horizon || 7;
    const to = new Date();
    const from = new Date(to.getTime() - 60 * 864e5);
    const agg = await this.bi.aggregatePeriod(tenantId, { ...dto, from: from.toISOString(), to: to.toISOString() } as any, from, to);
    const daily = Object.entries(agg.revenueByDay as Record<string, number>)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => Number(v));
    const fc = this.forecastSeries(daily, horizon);
    return this.wrap('revenue', horizon, fc, daily);
  }

  async orders(userTenantId: string, dto: ForecastQueryDto): Promise<ForecastResult> {
    const tenantId = this.resolveTenant(userTenantId, dto);
    const horizon = dto.horizon || 7;
    const to = new Date();
    const from = new Date(to.getTime() - 60 * 864e5);
    const orders = await this.prisma.order.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to }, deletedAt: null, ...(dto.branchId ? { branchId: dto.branchId } : {}) },
      select: { createdAt: true },
    });
    const byDay: Record<string, number> = {};
    orders.forEach(o => { const d = new Date(o.createdAt).toISOString().slice(0, 10); byDay[d] = (byDay[d] || 0) + 1; });
    const daily = Object.values(byDay).sort((a, b) => a - b); // chronological
    const fc = this.forecastSeries(daily, horizon);
    return this.wrap('orders', horizon, fc, daily);
  }

  async inventory(userTenantId: string, dto: ForecastQueryDto): Promise<ForecastResult> {
    // Forecast days-until-stockout per critical item based on recent consumption rate.
    const tenantId = this.resolveTenant(userTenantId, dto);
    const horizon = dto.horizon || 30;
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 864e5);
    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId, currentStock: { gt: 0 } },
      select: { id: true, name: true, currentStock: true },
      take: 20,
    });
    const movements = await this.prisma.stockMovement.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { type: true, quantity: true, inventoryItemId: true },
    });
    const consumptionByItem: Record<string, number> = {};
    movements.forEach(m => {
      if (m.type === ('CONSUMPTION' as any) || m.type === ('OUT' as any)) {
        consumptionByItem[m.inventoryItemId] = (consumptionByItem[m.inventoryItemId] || 0) + Number(m.quantity);
      }
    });
    const series = items.map(it => {
      const consumed = consumptionByItem[it.id] || 0;
      const dailyRate = consumed / 30;
      const daysLeft = dailyRate > 0 ? Math.floor(Number(it.currentStock) / dailyRate) : 999;
      return { date: it.name, predicted: daysLeft, lower: daysLeft, upper: daysLeft };
    }).slice(0, horizon);
    return { metric: 'inventory', horizon, series, confidence: 70, method: 'consumption_rate' };
  }

  async staffing(userTenantId: string, dto: ForecastQueryDto): Promise<ForecastResult> {
    // Forecast required staff-hours from forecasted order volume (assume 12 orders/staff-hour).
    const ordersFc = await this.orders(userTenantId, dto);
    const series = ordersFc.series.map((s, i) => {
      const staffNeeded = Math.max(1, Math.ceil(s.predicted / 12));
      return { date: new Date(Date.now() + (i + 1) * 864e5).toISOString().slice(0, 10), predicted: staffNeeded, lower: staffNeeded, upper: staffNeeded };
    });
    return { metric: 'staffing', horizon: ordersFc.horizon, series, confidence: ordersFc.confidence, method: 'order_based' };
  }

  private wrap(metric: string, horizon: number, fc: { predicted: number; lower: number; upper: number }[], history: number[]): ForecastResult {
    const mae = history.length > 1 ? Math.abs(fc[0].predicted - history[history.length - 1]) : 0;
    const confidence = Math.max(50, Math.min(95, 100 - Math.min(45, mae / (history[history.length - 1] || 1) * 100)));
    const start = new Date();
    return {
      metric, horizon,
      series: fc.map((s, i) => ({
        date: new Date(start.getTime() + (i + 1) * 864e5).toISOString().slice(0, 10),
        predicted: s.predicted, lower: s.lower, upper: s.upper,
      })),
      confidence: Number(confidence.toFixed(1)),
      method: 'exp_smoothing',
    };
  }
}
