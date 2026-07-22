import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FinanceFilterDto } from './dto/finance-filter.dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getOverview(branchId: string, from?: string, to?: string) {
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const where: any = { branchId };
    if (from || to) where.date = dateFilter;

    const transactions = await this.prisma.transaction.findMany({ where });
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      transactionCount: transactions.length,
    };
  }

  async getTransactions(branchId: string, filter: FinanceFilterDto) {
    const where: any = { branchId };
    if (filter.type) where.type = filter.type;
    if (filter.category) where.category = filter.category;
    if (filter.from || filter.to) {
      where.date = {};
      if (filter.from) where.date.gte = new Date(filter.from);
      if (filter.to) where.date.lte = new Date(filter.to);
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
      this.prisma.transaction.count({ where }),
    ]);

    return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTransaction(id: string, tenantId: string) {
    const t = await this.prisma.transaction.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!t) throw new NotFoundException('Transaction not found');
    return t;
  }

  async createTransaction(branchId: string, dto: CreateTransactionDto) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId }, select: { tenantId: true } });
    if (!branch) throw new NotFoundException('Branch not found');

    return this.prisma.transaction.create({
      data: { branchId, tenantId: branch.tenantId, ...dto, date: new Date() },
    });
  }

  async updateTransaction(id: string, dto: UpdateTransactionDto, tenantId: string) {
    await this.getTransaction(id, tenantId);
    return this.prisma.transaction.update({ where: { id }, data: dto });
  }

  async deleteTransaction(id: string, tenantId: string) {
    await this.getTransaction(id, tenantId);
    return this.prisma.transaction.delete({ where: { id } });
  }

  async getExpensesByCategory(branchId: string, from?: string, to?: string) {
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const where: any = { branchId, type: 'EXPENSE' };
    if (from || to) where.date = dateFilter;

    const transactions = await this.prisma.transaction.findMany({ where });
    const grouped: Record<string, number> = {};
    transactions.forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount);
    });

    return Object.entries(grouped).map(([category, amount]) => ({ category, amount }));
  }

  async getIncomeByCategory(branchId: string, from?: string, to?: string) {
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const where: any = { branchId, type: 'INCOME' };
    if (from || to) where.date = dateFilter;

    const transactions = await this.prisma.transaction.findMany({ where });
    const grouped: Record<string, number> = {};
    transactions.forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount);
    });

    return Object.entries(grouped).map(([category, amount]) => ({ category, amount }));
  }

  async getTransactionsByType(branchId: string, type: string, filter: FinanceFilterDto) {
    const where: any = { branchId, type };
    if (filter.category) where.category = filter.category;
    if (filter.from || filter.to) {
      where.date = {};
      if (filter.from) where.date.gte = new Date(filter.from);
      if (filter.to) where.date.lte = new Date(filter.to);
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
      this.prisma.transaction.count({ where }),
    ]);

    return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTaxSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const settings = (tenant as any).settings || {};
    return {
      gstRate: settings.gstRate ?? 5,
      serviceTax: settings.serviceTax ?? 0,
      packagingCharge: settings.packagingCharge ?? 0,
      taxEnabled: settings.taxEnabled ?? true,
    };
  }

  async updateTaxSettings(tenantId: string, dto: { gstRate?: number; serviceTax?: number; packagingCharge?: number; taxEnabled?: boolean }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const currentSettings = (tenant as any).settings || {};
    const updatedSettings = { ...currentSettings, ...dto };
    await this.prisma.tenant.update({ where: { id: tenantId }, data: { settings: updatedSettings } as any });
    return { gstRate: updatedSettings.gstRate, serviceTax: updatedSettings.serviceTax, packagingCharge: updatedSettings.packagingCharge, taxEnabled: updatedSettings.taxEnabled };
  }

  async getGstSummary(branchId: string, from?: string, to?: string) {
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const where: any = { branchId };
    if (from || to) where.date = dateFilter;

    const transactions = await this.prisma.transaction.findMany({ where });
    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
    const gstOnSales = totalIncome * 0.05;
    const gstOnPurchases = totalExpenses * 0.18;
    const netGstPayable = gstOnSales - gstOnPurchases;

    return {
      totalIncome,
      totalExpenses,
      gstOnSales: Math.round(gstOnSales * 100) / 100,
      gstOnPurchases: Math.round(gstOnPurchases * 100) / 100,
      netGstPayable: Math.round(netGstPayable * 100) / 100,
      cgst: Math.round((netGstPayable / 2) * 100) / 100,
      sgst: Math.round((netGstPayable / 2) * 100) / 100,
    };
  }

  async getTaxReports(branchId: string, from?: string, to?: string) {
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const where: any = { branchId };
    if (from || to) where.date = dateFilter;

    const transactions = await this.prisma.transaction.findMany({ where, orderBy: { date: 'desc' } });
    const monthlyData: Record<string, { income: number; expense: number; gst: number }> = {};

    transactions.forEach(t => {
      const month = t.date.toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0, gst: 0 };
      const amount = Number(t.amount);
      if (t.type === 'INCOME') {
        monthlyData[month].income += amount;
        monthlyData[month].gst += amount * 0.05;
      } else {
        monthlyData[month].expense += amount;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
      netTax: Math.round(data.gst * 100) / 100,
    }));
  }
}
