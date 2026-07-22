import { Injectable } from '@nestjs/common';
import { PrismaService, requestContext } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(branchId?: string) {
    const ctx = requestContext.getStore();
    const tenantId = ctx?.tenantId;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86_400_000);

    const branchFilter = (condition: any) =>
      branchId ? { ...condition, branchId } : condition;

    const [orders, payments, tables, inventoryAlerts] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: todayStart, lt: todayEnd },
          ...(tenantId ? { branch: { tenantId } } : {}),
          ...branchFilter({}),
        },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          orderNumber: true,
        },
      }),

      this.prisma.payment.findMany({
        where: {
          createdAt: { gte: todayStart, lt: todayEnd },
          ...(tenantId ? { branch: { tenantId } } : {}),
          ...branchFilter({}),
        },
        select: { amount: true, method: true },
      }),

      this.prisma.restaurantTable.findMany({
        where: {
          ...(branchId ? { branchId } : {}),
          ...(tenantId ? { branch: { tenantId } } : {}),
        },
        select: { id: true, status: true },
      }),

      this.prisma.inventoryItem.findMany({
        where: {
          ...(tenantId ? { branch: { tenantId } } : {}),
          ...branchFilter({}),
        },
        select: { id: true, name: true, currentStock: true, minimumStock: true },
      }).then((items) => items.filter((i) => Number(i.currentStock) <= Number(i.minimumStock || 0))),
    ]);

    const totalOrders = orders.length;
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusBreakdown = {
      pending: orders.filter((o) => o.status === 'PENDING').length,
      preparing: orders.filter((o) => o.status === 'PREPARING').length,
      ready: orders.filter((o) => o.status === 'READY').length,
      completed: orders.filter((o) => o.status === 'COMPLETED').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
    };

    const tableOccupancy = {
      total: tables.length,
      free: tables.filter((t) => t.status === 'FREE').length,
      occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
      reserved: tables.filter((t) => t.status === 'RESERVED').length,
      cleaning: tables.filter((t) => t.status === 'CLEANING').length,
    };

    const paymentBreakdown: Record<string, number> = {};
    for (const p of payments) {
      const method = p.method || 'UNKNOWN';
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + Number(p.amount);
    }

    return {
      period: { start: todayStart.toISOString(), end: todayEnd.toISOString() },
      summary: {
        totalOrders,
        totalRevenue,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
      statusBreakdown,
      tableOccupancy,
      paymentBreakdown,
      lowStockItems: inventoryAlerts.length,
    };
  }

  async getRecentOrders(branchId?: string, limit = 10) {
    const ctx = requestContext.getStore();
    const tenantId = ctx?.tenantId;

    const branchFilter = branchId ? { branchId } : {};

    return this.prisma.order.findMany({
      where: {
        ...branchFilter,
        ...(tenantId ? { branch: { tenantId } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        type: true,
        customerName: true,
        createdAt: true,
        table: { select: { number: true, name: true } },
        staff: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
  }
}
