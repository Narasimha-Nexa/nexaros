import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueNames } from '../queue/queue.constants';

@Processor(QueueNames.REPORTS, { concurrency: 2 })
export class ReportWorker extends WorkerHost {
  private readonly logger = new Logger(ReportWorker.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<{ generated: boolean; type: string; data?: unknown }> {
    const { type, tenantId, branchId, dateRange } = job.data;

    this.logger.debug(`Generating ${type} report for tenant ${tenantId}`);

    const from = dateRange?.from ? new Date(dateRange.from) : new Date(new Date().setHours(0, 0, 0, 0));
    const to = dateRange?.to ? new Date(dateRange.to) : new Date();

    const where: Record<string, unknown> = { tenantId, createdAt: { gte: from, lte: to } };
    if (branchId) where.branchId = branchId;

    switch (type) {
      case 'daily_sales':
        return this.generateDailySalesReport(where);
      case 'inventory':
        return this.generateInventoryReport(tenantId);
      case 'staff_performance':
        return this.generateStaffPerformanceReport(tenantId);
      case 'tax':
        return this.generateTaxReport(where);
      default:
        this.logger.warn(`Unknown report type: ${type}`);
        return { generated: false, type };
    }
  }

  private async generateDailySalesReport(where: Record<string, unknown>) {
    const orders = await this.prisma.order.findMany({
      where: where as any,
      include: { items: true, payments: true },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const report = {
      type: 'daily_sales',
      generatedAt: new Date(),
      summary: { totalRevenue, totalOrders, avgOrderValue },
      orders: orders.map(o => ({
        id: o.id,
        number: o.orderNumber,
        amount: Number(o.totalAmount),
        status: o.status,
        type: o.type,
        createdAt: o.createdAt,
      })),
    };

    this.logger.log(`Daily sales report generated: ${totalOrders} orders, ₹${totalRevenue}`);
    return { generated: true, type: 'daily_sales', data: report };
  }

  private async generateInventoryReport(tenantId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId },
    });

    const lowStock = items.filter(i => Number(i.currentStock) <= Number(i.minimumStock));
    const outOfStock = items.filter(i => Number(i.currentStock) <= 0);

    const report = {
      type: 'inventory',
      generatedAt: new Date(),
      summary: {
        totalItems: items.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
      },
      lowStock: lowStock.map(i => ({ id: i.id, name: i.name, current: Number(i.currentStock), min: Number(i.minimumStock) })),
      outOfStock: outOfStock.map(i => ({ id: i.id, name: i.name })),
    };

    this.logger.log(`Inventory report: ${items.length} items, ${lowStock.length} low stock`);
    return { generated: true, type: 'inventory', data: report };
  }

  private async generateStaffPerformanceReport(tenantId: string) {
    const staff = await this.prisma.staff.findMany({
      where: { tenantId: tenantId as string, isActive: true },
      include: { attendance: true },
    });

    const report = {
      type: 'staff_performance',
      generatedAt: new Date(),
      staff: staff.map(s => ({
        id: s.id,
        name: s.name,
        roleId: s.roleId,
        attendanceDays: s.attendance.length,
      })),
    };

    return { generated: true, type: 'staff_performance', data: report };
  }

  private async generateTaxReport(where: Record<string, unknown>) {
    const orders = await this.prisma.order.findMany({
      where: where as any,
    });

    const totalTax = orders.reduce((sum, o) => sum + Number(o.taxAmount), 0);

    const report = {
      type: 'tax',
      generatedAt: new Date(),
      summary: { totalTaxCollected: totalTax, totalOrders: orders.length },
    };

    return { generated: true, type: 'tax', data: report };
  }
}
