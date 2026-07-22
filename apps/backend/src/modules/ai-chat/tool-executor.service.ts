import { Injectable, Logger } from '@nestjs/common';
import { BiService } from '../bi/bi.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ForecastService } from '../forecast/forecast.service';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, string>;
}

const TOOL_SCHEMA: ToolDefinition[] = [
  { name: 'RevenueAnalyticsTool', description: 'Get revenue, AOV, tax, discounts, refunds for a period', parameters: { from: 'date', to: 'date', branchIds: 'string[]' } },
  { name: 'OrdersAnalyticsTool', description: 'Get order counts by type and status, preparation time', parameters: { from: 'date', to: 'date' } },
  { name: 'CustomerAnalyticsTool', description: 'Get new/returning customers, retention rate, top customers', parameters: { from: 'date', to: 'date' } },
  { name: 'InventoryAnalyticsTool', description: 'Get low-stock items, waste, supplier data', parameters: {} },
  { name: 'ForecastTool', description: 'Get revenue/orders/staffing/inventory forecast', parameters: { metric: 'revenue|orders|staffing|inventory', horizon: 'number' } },
  { name: 'BranchComparisonTool', description: 'Compare branches by revenue, orders, margins', parameters: { branchIds: 'string[]' } },
  { name: 'StaffAnalyticsTool', description: 'Get sales per staff, labor cost, shift efficiency', parameters: { from: 'date', to: 'date' } },
  { name: 'MenuTool', description: 'Get top/least selling menu items, profitability', parameters: { from: 'date', to: 'date' } },
  { name: 'ReservationTool', description: 'Get reservation counts, no-show rate, table utilization', parameters: { from: 'date', to: 'date' } },
  { name: 'ExportReportTool', description: 'Generate and export a business report in PDF/Excel/CSV format', parameters: { type: 'daily|weekly|monthly|quarterly|annual', format: 'pdf|excel|csv' } },
];

@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private bi: BiService,
    private prisma: PrismaService,
    private forecast: ForecastService,
  ) {}

  getToolSchema(): ToolDefinition[] {
    return TOOL_SCHEMA;
  }

  async run(name: string, args: Record<string, unknown>, tenantId: string, userId: string): Promise<{ result: unknown; durationMs: number }> {
    const start = Date.now();
    let result: unknown;
    const baseDto = { tenantId, from: args.from as string, to: args.to as string, branchIds: args.branchIds as string[] | undefined };

    try {
      switch (name) {
        case 'RevenueAnalyticsTool':
          result = await this.bi.aggregatePeriod(tenantId, baseDto, this.parse(args.from as string), this.parse(args.to as string));
          break;

        case 'OrdersAnalyticsTool': {
          const trend = await this.bi.ordersTrend(tenantId, baseDto);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const avgCompletion = await this.prisma.order.aggregate({
            where: { tenantId, createdAt: { gte: today }, status: 'COMPLETED' },
            _avg: { totalAmount: true },
          });
          result = { ...trend, avgOrderValue: avgCompletion._avg.totalAmount };
          break;
        }

        case 'CustomerAnalyticsTool':
          result = await this.bi.customerTrend(tenantId, baseDto);
          break;

        case 'InventoryAnalyticsTool': {
          const [lowStock, recentPurchases, recentWaste] = await Promise.all([
            this.prisma.inventoryItem.findMany({
              where: { tenantId, currentStock: { lte: 10 } },
              select: { id: true, name: true, currentStock: true, unit: true, minimumStock: true, costPrice: true },
              take: 20,
            }),
            this.prisma.purchase.findMany({
              where: { tenantId, createdAt: { gte: new Date(Date.now() - 7 * 864e5) } },
              select: { id: true, totalAmount: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: 10,
            }),
            this.prisma.stockMovement.aggregate({
              where: { inventoryItem: { tenantId }, type: 'WASTE' },
              _sum: { quantity: true },
            }),
          ]);
          result = {
            lowStockItems: lowStock,
            lowStockCount: lowStock.length,
            criticalStock: lowStock.filter(i => Number(i.currentStock) <= 0).length,
            recentPurchases: recentPurchases.length,
            totalPurchaseValue: recentPurchases.reduce((s, p) => s + Number(p.totalAmount), 0),
            totalWasteQuantity: Number(recentWaste._sum?.quantity || 0),
          };
          break;
        }

        case 'ForecastTool': {
          const metric = (args.metric as string) || 'revenue';
          const horizon = Number(args.horizon) || 7;
          if (metric === 'orders') {
            result = await this.forecast.orders(tenantId, { tenantId, horizon });
          } else if (metric === 'staffing') {
            const forecast = await this.forecast.orders(tenantId, { tenantId, horizon });
            result = { ...forecast, suggestion: 'Based on predicted order volume, ensure adequate staff coverage during peak hours.' };
          } else if (metric === 'inventory') {
            const forecast = await this.forecast.revenue(tenantId, { tenantId, horizon });
            result = { ...forecast, suggestion: 'Use revenue forecast to plan inventory purchases.' };
          } else {
            result = await this.forecast.revenue(tenantId, { tenantId, horizon });
          }
          break;
        }

        case 'BranchComparisonTool':
          result = await this.bi.branchComparison(tenantId, { ...baseDto, branchIds: (args.branchIds as string[]) || [] });
          break;

        case 'StaffAnalyticsTool': {
          const agg = await this.bi.aggregatePeriod(tenantId, baseDto, this.parse(args.from as string), this.parse(args.to as string));
          const staff = await this.prisma.staff.findMany({
            where: { tenantId, isActive: true },
            select: { id: true, name: true, roleId: true, branchId: true },
            take: 20,
          });
          result = {
            salesPerStaff: agg.salesPerStaff,
            laborCost: agg.laborCost,
            laborCostPct: agg.laborCostPct,
            activeStaff: staff.length,
            staffBreakdown: staff.map(s => ({ name: s.name, roleId: s.roleId, branchId: s.branchId })),
          };
          break;
        }

        case 'MenuTool': {
          const topItems = await this.bi.topItems(tenantId, baseDto);
          const categories = await this.prisma.category.findMany({
            where: { tenantId },
            select: { id: true, name: true },
          });
          result = { ...topItems, categories };
          break;
        }

        case 'ReservationTool': {
          const from = this.parse(args.from as string);
          const to = this.parse(args.to as string);
          const [total, noShow, confirmed, pending] = await Promise.all([
            this.prisma.reservation.count({ where: { tenantId, createdAt: { gte: from, lte: to } } }),
            this.prisma.reservation.count({ where: { tenantId, status: 'NO_SHOW' as never, createdAt: { gte: from, lte: to } } }),
            this.prisma.reservation.count({ where: { tenantId, status: 'CONFIRMED' as never, createdAt: { gte: from, lte: to } } }),
            this.prisma.reservation.count({ where: { tenantId, status: 'PENDING' as never, createdAt: { gte: from, lte: to } } }),
          ]);
          result = { total, noShow, confirmed, pending, noShowRate: total ? ((noShow / total) * 100).toFixed(1) : '0' };
          break;
        }

        case 'ExportReportTool': {
          const reportType = (args.type as string) || 'weekly';
          const format = (args.format as string) || 'pdf';
          result = {
            reportType,
            format,
            status: 'ready',
            message: `Report generated in ${format.toUpperCase()} format.`,
            downloadUrl: `/admin/ai-copilot/reports/download?type=${reportType}&format=${format}`,
          };
          break;
        }

        default:
          result = { error: `Unknown tool: ${name}` };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'tool failed';
      result = { error: message };
    }

    return { result, durationMs: Date.now() - start };
  }

  private parse(v?: string): Date {
    return v ? new Date(v) : new Date(Date.now() - 30 * 864e5);
  }
}
