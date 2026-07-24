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

  async getExecutiveSummary(branchId?: string) {
    const ctx = requestContext.getStore();
    const tenantId = ctx?.tenantId;
    if (!tenantId) return { revenue: 0, orders: 0, profit: 0, aov: 0 };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const branchFilter = branchId ? { branchId } : {};
    const tenantFilter = { branch: { tenantId } };

    const [todayPayments, monthPayments, todayOrders, monthOrders, expenses] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { ...branchFilter, ...tenantFilter, createdAt: { gte: todayStart } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { ...branchFilter, ...tenantFilter, createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.order.count({
        where: { ...branchFilter, ...tenantFilter, createdAt: { gte: todayStart } },
      }),
      this.prisma.order.count({
        where: { ...branchFilter, ...tenantFilter, createdAt: { gte: monthStart } },
      }),
      this.prisma.transaction.aggregate({
        where: { tenantId, type: 'EXPENSE', date: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ]);

    const todayRevenue = Number(todayPayments._sum.amount || 0);
    const monthRevenue = Number(monthPayments._sum.amount || 0);
    const monthExpenses = Number(expenses._sum.amount || 0);
    const monthProfit = monthRevenue - monthExpenses;

    return {
      todayRevenue,
      monthRevenue,
      monthProfit,
      monthExpenses,
      todayOrders,
      monthOrders,
      aov: todayOrders > 0 ? Math.round(todayRevenue / todayOrders * 100) / 100 : 0,
      profitMargin: monthRevenue > 0 ? Math.round(monthProfit / monthRevenue * 10000) / 100 : 0,
    };
  }

  async getRevenueTrend(branchId?: string, days = 30) {
    const ctx = requestContext.getStore();
    const tenantId = ctx?.tenantId;
    if (!tenantId) return [];

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 86_400_000);
    const branchFilter = branchId ? { branchId } : {};

    const payments = await this.prisma.payment.findMany({
      where: {
        ...branchFilter,
        branch: { tenantId },
        createdAt: { gte: startDate },
      },
      select: { amount: true, createdAt: true },
    });

    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate.getTime() + i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { revenue: 0, orders: 0 };
    }

    for (const p of payments) {
      const key = p.createdAt.toISOString().slice(0, 10);
      if (dailyMap[key]) {
        dailyMap[key].revenue += Number(p.amount);
        dailyMap[key].orders += 1;
      }
    }

    return Object.entries(dailyMap).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
      aov: data.orders > 0 ? Math.round(data.revenue / data.orders * 100) / 100 : 0,
    }));
  }

  async getProfitability(branchId?: string) {
    const ctx = requestContext.getStore();
    const tenantId = ctx?.tenantId;
    if (!tenantId) return { revenue: 0, expenses: 0, profit: 0, margin: 0, breakdown: [] };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [incomeResult, expenseResult] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { tenantId, type: 'INCOME', date: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where: { tenantId, type: 'EXPENSE', date: { gte: monthStart } },
        select: { amount: true, category: true },
      }),
    ]);

    const revenue = Number(incomeResult._sum.amount || 0);
    const totalExpenses = expenseResult.reduce((sum, t) => sum + Number(t.amount), 0);
    const profit = revenue - totalExpenses;
    const margin = revenue > 0 ? Math.round(profit / revenue * 10000) / 100 : 0;

    const categoryMap: Record<string, number> = {};
    for (const t of expenseResult) {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
    }

    const breakdown = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount, percentage: totalExpenses > 0 ? Math.round(amount / totalExpenses * 10000) / 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);

    return { revenue, expenses: totalExpenses, profit, margin, breakdown };
  }
}
