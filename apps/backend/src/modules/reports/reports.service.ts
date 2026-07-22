import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private buildDateFilter(startDate?: string, endDate?: string) {
    const filter: any = {};
    if (startDate) filter.gte = new Date(startDate);
    if (endDate) filter.lte = new Date(endDate + 'T23:59:59.999Z');
    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  /**
   * Daily sales report — revenue, orders, averages grouped by day
   */
  async dailySales(tenantId: string, dto: ReportFilterDto) {
    const dateFilter = this.buildDateFilter(dto.startDate, dto.endDate);
    const branchFilter = dto.branchId ? { branchId: dto.branchId } : {};

    const orders = await this.prisma.order.findMany({
      where: {
        branch: { tenantId },
        ...branchFilter,
        createdAt: dateFilter,
        status: { in: ['COMPLETED', 'SERVED'] },
      },
      include: {
        branch: { select: { name: true } },
        payments: { where: { status: 'COMPLETED' }, select: { amount: true, method: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by day
    const dailyMap = new Map<string, {
      date: string;
      totalOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
      paymentBreakdown: Record<string, number>;
    }>();

    for (const order of orders) {
      const day = order.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(day)) {
        dailyMap.set(day, { date: day, totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, paymentBreakdown: {} });
      }
      const entry = dailyMap.get(day)!;
      entry.totalOrders++;
      entry.totalRevenue += Number(order.totalAmount);
      for (const p of order.payments) {
        entry.paymentBreakdown[p.method] = (entry.paymentBreakdown[p.method] || 0) + Number(p.amount);
      }
    }

    const daily = Array.from(dailyMap.values());
    for (const d of daily) {
      d.averageOrderValue = d.totalOrders > 0 ? Math.round(d.totalRevenue / d.totalOrders) : 0;
    }

    const totals = daily.reduce((acc, d) => ({
      totalOrders: acc.totalOrders + d.totalOrders,
      totalRevenue: acc.totalRevenue + d.totalRevenue,
    }), { totalOrders: 0, totalRevenue: 0 });

    return {
      daily,
      totals: {
        ...totals,
        averageOrderValue: totals.totalOrders > 0 ? Math.round(totals.totalRevenue / totals.totalOrders) : 0,
        period: { start: dto.startDate || 'earliest', end: dto.endDate || 'latest' },
      },
    };
  }

  /**
   * Revenue breakdown by category and item
   */
  async revenue(tenantId: string, dto: ReportFilterDto) {
    const dateFilter = this.buildDateFilter(dto.startDate, dto.endDate);
    const branchFilter = dto.branchId ? { branchId: dto.branchId } : {};

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          branch: { tenantId },
          ...branchFilter,
          createdAt: dateFilter,
          status: { in: ['COMPLETED', 'SERVED'] },
        },
      },
      include: {
        menuItem: { select: { name: true, category: { select: { name: true, id: true } }, isVeg: true } },
      },
    });

    // By category
    const byCategory = new Map<string, { categoryName: string; totalRevenue: number; orderCount: number }>();
    // By item
    const byItem = new Map<string, { itemName: string; categoryName: string; quantity: number; totalRevenue: number; isVeg: boolean; orderCount: number }>();

    for (const item of orderItems) {
      const catName = item.menuItem?.category?.name || 'Uncategorized';
      const itemName = item.menuItem?.name || item.name;

      if (!byCategory.has(catName)) {
        byCategory.set(catName, { categoryName: catName, totalRevenue: 0, orderCount: 0 });
      }
      const cat = byCategory.get(catName)!;
      cat.totalRevenue += Number(item.totalPrice);
      cat.orderCount++;

      if (!byItem.has(itemName)) {
        byItem.set(itemName, {
          itemName, categoryName: catName, quantity: 0, totalRevenue: 0,
          isVeg: item.menuItem?.isVeg ?? false, orderCount: 0,
        });
      }
      const it = byItem.get(itemName)!;
      it.quantity += item.quantity;
      it.totalRevenue += Number(item.totalPrice);
      it.orderCount++;
    }

    return {
      byCategory: Array.from(byCategory.values()).sort((a, b) => b.totalRevenue - a.totalRevenue),
      byItem: Array.from(byItem.values()).sort((a, b) => b.totalRevenue - a.totalRevenue),
    };
  }

  /**
   * Item performance — top sellers and low performers
   */
  async itemPerformance(tenantId: string, dto: ReportFilterDto) {
    const dateFilter = this.buildDateFilter(dto.startDate, dto.endDate);
    const branchFilter = dto.branchId ? { branchId: dto.branchId } : {};

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          branch: { tenantId },
          ...branchFilter,
          createdAt: dateFilter,
          status: { in: ['COMPLETED', 'SERVED'] },
        },
      },
      include: {
        menuItem: { select: { name: true, category: { select: { name: true } }, costPrice: true } },
      },
    });

    const itemMap = new Map<string, {
      name: string; category: string; quantity: number; revenue: number; costPrice: number; profit: number; orderCount: number;
    }>();

    for (const item of orderItems) {
      const name = item.menuItem?.name || item.name;
      if (!itemMap.has(name)) {
        itemMap.set(name, {
          name, category: item.menuItem?.category?.name || 'Uncategorized',
          quantity: 0, revenue: 0, costPrice: Number(item.menuItem?.costPrice || 0), profit: 0, orderCount: 0,
        });
      }
      const entry = itemMap.get(name)!;
      entry.quantity += item.quantity;
      entry.revenue += Number(item.totalPrice);
      entry.orderCount++;
    }

    for (const entry of itemMap.values()) {
      const totalCost = entry.costPrice * entry.quantity;
      entry.profit = entry.revenue - totalCost;
    }

    const items = Array.from(itemMap.values());
    const topSelling = [...items].sort((a, b) => b.quantity - a.quantity).slice(0, 20);
    const lowPerforming = [...items].sort((a, b) => a.quantity - b.quantity).slice(0, 10);

    return { items, topSelling, lowPerforming };
  }

  /**
   * Peak hours analysis
   */
  async peakHours(tenantId: string, dto: ReportFilterDto) {
    const dateFilter = this.buildDateFilter(dto.startDate, dto.endDate);
    const branchFilter = dto.branchId ? { branchId: dto.branchId } : {};

    const orders = await this.prisma.order.findMany({
      where: {
        branch: { tenantId },
        ...branchFilter,
        createdAt: dateFilter,
      },
      select: { createdAt: true, totalAmount: true },
    });

    const hourlyMap = new Map<string, { hour: string; orderCount: number; revenue: number }>();

    for (const order of orders) {
      const hour = `${order.createdAt.getHours().toString().padStart(2, '0')}:00`;
      if (!hourlyMap.has(hour)) {
        hourlyMap.set(hour, { hour, orderCount: 0, revenue: 0 });
      }
      const entry = hourlyMap.get(hour)!;
      entry.orderCount++;
      entry.revenue += Number(order.totalAmount);
    }

    return Array.from(hourlyMap.values()).sort((a, b) => a.hour.localeCompare(b.hour));
  }

  /**
   * Staff performance metrics
   */
  async staffPerformance(tenantId: string, dto: ReportFilterDto) {
    const dateFilter = this.buildDateFilter(dto.startDate, dto.endDate);
    const branchFilter = dto.branchId ? { branchId: dto.branchId } : {};

    const orders = await this.prisma.order.findMany({
      where: {
        branch: { tenantId },
        ...branchFilter,
        createdAt: dateFilter,
        staffId: { not: null },
      },
      include: {
        staff: { select: { id: true, name: true, role: { select: { name: true } } } },
      },
    });

    const staffMap = new Map<string, {
      staffId: string; name: string; role: string; orderCount: number; totalRevenue: number; avgOrderValue: number;
    }>();

    for (const order of orders) {
      if (!order.staff) continue;
      const id = order.staff.id;
      if (!staffMap.has(id)) {
        staffMap.set(id, {
          staffId: id, name: order.staff.name,
          role: order.staff.role?.name || 'Staff',
          orderCount: 0, totalRevenue: 0, avgOrderValue: 0,
        });
      }
      const entry = staffMap.get(id)!;
      entry.orderCount++;
      entry.totalRevenue += Number(order.totalAmount);
    }

    const results = Array.from(staffMap.values());
    for (const r of results) {
      r.avgOrderValue = r.orderCount > 0 ? Math.round(r.totalRevenue / r.orderCount) : 0;
    }

    return results.sort((a, b) => b.orderCount - a.orderCount);
  }

  /**
   * Inventory consumption report
   */
  async inventoryConsumption(tenantId: string, dto: ReportFilterDto) {
    const dateFilter = this.buildDateFilter(dto.startDate, dto.endDate);

    const movements = await this.prisma.stockMovement.findMany({
      where: {
        inventoryItem: { tenantId },
        createdAt: dateFilter,
        type: 'SALE',
      },
      include: {
        inventoryItem: { select: { name: true, unit: true, currentStock: true, minimumStock: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const itemMap = new Map<string, {
      itemName: string; unit: string; totalConsumed: number; currentStock: number; minimumStock: number; isLow: boolean;
    }>();

    for (const m of movements) {
      const id = m.inventoryItemId;
      if (!itemMap.has(id)) {
        itemMap.set(id, {
          itemName: m.inventoryItem.name,
          unit: m.inventoryItem.unit,
          totalConsumed: 0,
          currentStock: Number(m.inventoryItem.currentStock),
          minimumStock: Number(m.inventoryItem.minimumStock),
          isLow: Number(m.inventoryItem.currentStock) <= Number(m.inventoryItem.minimumStock),
        });
      }
      itemMap.get(id)!.totalConsumed += Number(m.quantity);
    }

    const items = Array.from(itemMap.values());
    return {
      items,
      lowStockItems: items.filter((i) => i.isLow),
      totalItems: items.length,
    };
  }

  /**
   * Customer analytics — acquisition, retention, segmentation
   */
  async customerAnalytics(tenantId: string, dto: ReportFilterDto) {
    const dateFilter = this.buildDateFilter(dto.startDate, dto.endDate);
    const branchFilter = dto.branchId ? { branchId: dto.branchId } : {};

    // Total customers
    const totalCustomers = await this.prisma.customer.count({
      where: { tenantId, createdAt: dateFilter },
    });

    // New customers (by month)
    const customers = await this.prisma.customer.findMany({
      where: { tenantId, createdAt: dateFilter },
      select: { createdAt: true, totalOrders: true, totalSpent: true },
      orderBy: { createdAt: 'asc' },
    });

    const acquisitionByMonth = new Map<string, { month: string; count: number }>();
    for (const c of customers) {
      const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!acquisitionByMonth.has(key)) acquisitionByMonth.set(key, { month: key, count: 0 });
      acquisitionByMonth.get(key)!.count++;
    }

    // Segments by total spent
    const segments = { high: 0, medium: 0, low: 0, new: 0 };
    for (const c of customers) {
      const spent = Number(c.totalSpent);
      if (c.totalOrders === 0) segments.new++;
      else if (spent >= 5000) segments.high++;
      else if (spent >= 1000) segments.medium++;
      else segments.low++;
    }

    // Retention (repeat customers)
    const repeatCustomers = customers.filter(c => c.totalOrders > 1).length;

    // Average order value per customer
    const totalRevenue = customers.reduce((sum, c) => sum + Number(c.totalSpent), 0);
    const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);

    return {
      totalCustomers,
      newCustomers: customers.filter(c => c.totalOrders === 0).length,
      repeatCustomers,
      retentionRate: customers.length > 0 ? Math.round((repeatCustomers / customers.length) * 100) : 0,
      avgOrderValuePerCustomer: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      totalRevenue,
      acquisitionByMonth: Array.from(acquisitionByMonth.values()),
      segments,
    };
  }

  /**
   * Kitchen analytics — preparation times, order volume, KDS metrics
   */
  async kitchenAnalytics(tenantId: string, dto: ReportFilterDto) {
    const dateFilter = this.buildDateFilter(dto.startDate, dto.endDate);
    const branchFilter = dto.branchId ? { branchId: dto.branchId } : {};

    const orders = await this.prisma.order.findMany({
      where: {
        branch: { tenantId },
        ...branchFilter,
        createdAt: dateFilter,
        status: { in: ['PREPARING', 'READY', 'SERVED', 'COMPLETED'] },
      },
      select: {
        id: true, createdAt: true, updatedAt: true, orderNumber: true, totalAmount: true,
        status: true,
        items: {
          select: { id: true, status: true, quantity: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Orders by status
    const statusCount = { pending: 0, preparing: 0, ready: 0, served: 0, completed: 0 };
    for (const o of orders) {
      switch (o.status) {
        case 'PENDING': statusCount.pending++; break;
        case 'PREPARING': statusCount.preparing++; break;
        case 'READY': statusCount.ready++; break;
        case 'SERVED': statusCount.served++; break;
        default: statusCount.completed++;
      }
    }

    // Average preparation time (using createdAt → updatedAt as proxy)
    let totalPrepTime = 0;
    let prepCount = 0;
    for (const o of orders) {
      if (o.status !== 'PENDING') {
        const prepTime = (o.updatedAt.getTime() - o.createdAt.getTime()) / 60000;
        if (prepTime > 0 && prepTime < 120) {
          totalPrepTime += prepTime;
          prepCount++;
        }
      }
    }

    // Items prepared by category
    const itemStatusCount = { pending: 0, preparing: 0, ready: 0, cancelled: 0 };
    for (const o of orders) {
      for (const item of o.items) {
        switch (item.status) {
          case 'PENDING': itemStatusCount.pending += item.quantity; break;
          case 'PREPARING': itemStatusCount.preparing += item.quantity; break;
          case 'READY': itemStatusCount.ready += item.quantity; break;
          default: itemStatusCount.cancelled += item.quantity;
        }
      }
    }

    return {
      totalOrders: orders.length,
      statusBreakdown: statusCount,
      itemStatusBreakdown: itemStatusCount,
      avgPrepTime: prepCount > 0 ? Math.round(totalPrepTime / prepCount) : 0,
      totalPrepTime: Math.round(totalPrepTime),
      prepCount,
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      avgOrderValue: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + Number(o.totalAmount), 0) / orders.length) : 0,
    };
  }

  /**
   * Delivery analytics — times, partner stats, zone analysis
   */
  async deliveryAnalytics(tenantId: string, dto: ReportFilterDto) {
    const dateFilter = this.buildDateFilter(dto.startDate, dto.endDate);

    const deliveries = await this.prisma.delivery.findMany({
      where: {
        order: { branch: { tenantId } },
        createdAt: dateFilter,
      },
      include: {
        partner: { select: { id: true, name: true, vehicleType: true } },
        order: { select: { totalAmount: true, orderNumber: true } },
        locations: {
          select: { latitude: true, longitude: true, timestamp: true },
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Status breakdown
    const statusBreakdown = { pending: 0, assigned: 0, dispatched: 0, inTransit: 0, delivered: 0, failed: 0, cancelled: 0 };
    let totalDeliveryTime = 0;
    let deliveredCount = 0;

    for (const d of deliveries) {
      switch (d.status) {
        case 'PENDING': statusBreakdown.pending++; break;
        case 'ASSIGNED': statusBreakdown.assigned++; break;
        case 'PICKED_UP': statusBreakdown.dispatched++; break;
        case 'IN_TRANSIT': statusBreakdown.inTransit++; break;
        case 'DELIVERED': statusBreakdown.delivered++;
          if (d.deliveredAt) {
            const time = (d.deliveredAt.getTime() - d.createdAt.getTime()) / 60000;
            if (time > 0 && time < 240) {
              totalDeliveryTime += time;
              deliveredCount++;
            }
          }
          break;
        case 'FAILED': statusBreakdown.failed++; break;
        case 'CANCELLED': statusBreakdown.cancelled++; break;
      }
    }

    // Partner performance
    const partnerMap = new Map<string, { name: string; deliveries: number; totalRevenue: number; vehicleType: string }>();
    for (const d of deliveries) {
      if (!d.partner) continue;
      const id = d.partner.id;
      if (!partnerMap.has(id)) {
        partnerMap.set(id, { name: d.partner.name, deliveries: 0, totalRevenue: 0, vehicleType: d.partner.vehicleType || 'Unknown' });
      }
      const entry = partnerMap.get(id)!;
      entry.deliveries++;
      entry.totalRevenue += Number(d.order?.totalAmount || 0);
    }

    // Zone analysis (using location data)
    const zoneCount = deliveries.filter(d => d.locations.length > 0).length;

    return {
      totalDeliveries: deliveries.length,
      statusBreakdown,
      avgDeliveryTime: deliveredCount > 0 ? Math.round(totalDeliveryTime / deliveredCount) : 0,
      totalDelivered: deliveredCount,
      totalRevenue: deliveries.reduce((sum, d) => sum + Number(d.order?.totalAmount || 0), 0),
      partnerPerformance: Array.from(partnerMap.values()).sort((a, b) => b.deliveries - a.deliveries),
      activePartners: partnerMap.size,
      zoneCoverage: zoneCount,
    };
  }

  /**
   * Export report data in requested format (stub — returns data ready for export)
   */
  async exportReport(tenantId: string, type: string, dto: ReportFilterDto) {
    let data: any;
    switch (type) {
      case 'daily-sales': data = await this.dailySales(tenantId, dto); break;
      case 'revenue': data = await this.revenue(tenantId, dto); break;
      case 'items': data = await this.itemPerformance(tenantId, dto); break;
      default: data = await this.dailySales(tenantId, dto);
    }

    return {
      exportType: type,
      format: dto.format || 'PDF',
      generatedAt: new Date().toISOString(),
      data,
      // In production, this would generate and return a PDF/Excel file URL
      downloadUrl: null,
    };
  }

  async financeReport(tenantId: string, type: string, dto: ReportFilterDto) {
    const where: any = { tenantId, deletedAt: null };
    if (dto.startDate || dto.endDate) {
      where.date = {};
      if (dto.startDate) where.date.gte = new Date(dto.startDate);
      if (dto.endDate) where.date.lte = new Date(dto.endDate);
    }

    switch (type) {
      case 'income': {
        where.type = 'INCOME';
        const transactions = await this.prisma.transaction.findMany({ where, orderBy: { date: 'desc' } });
        const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        return { type: 'income', total, count: transactions.length, transactions };
      }
      case 'expenses': {
        where.type = 'EXPENSE';
        const transactions = await this.prisma.transaction.findMany({ where, orderBy: { date: 'desc' } });
        const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        return { type: 'expenses', total, count: transactions.length, transactions };
      }
      case 'tax': {
        const allTransactions = await this.prisma.transaction.findMany({ where, orderBy: { date: 'desc' } });
        const totalIncome = allTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpenses = allTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
        const gstOnSales = totalIncome * 0.05;
        const gstOnPurchases = totalExpenses * 0.18;
        return {
          type: 'tax',
          totalIncome,
          totalExpenses,
          gstOnSales: Math.round(gstOnSales * 100) / 100,
          gstOnPurchases: Math.round(gstOnPurchases * 100) / 100,
          netGstPayable: Math.round((gstOnSales - gstOnPurchases) * 100) / 100,
        };
      }
      default: {
        const transactions = await this.prisma.transaction.findMany({ where, orderBy: { date: 'desc' } });
        const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
        return { type: 'overview', totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses, transactionCount: transactions.length };
      }
    }
  }
}
