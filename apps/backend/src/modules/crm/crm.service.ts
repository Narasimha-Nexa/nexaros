import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  // ── Customers ──

  async getCustomers(tenantId: string, query?: { search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = Math.min(query?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { tenantId, deletedAt: null };
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          loyaltyPoints: { select: { points: true, tier: { select: { name: true, color: true } } } },
          wallet: { select: { balance: true } },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { customers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCustomer(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        addresses: true,
        loyaltyPoints: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 }, tier: true } },
        wallet: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async createCustomer(tenantId: string, data: { name: string; phone?: string; email?: string; notes?: string; tags?: string[] }) {
    const customer = await this.prisma.customer.create({
      data: { tenantId, ...data, tags: data.tags || [] },
    });
    // Auto-create loyalty points and wallet
    await this.prisma.loyaltyPoints.create({ data: { customerId: customer.id, tenantId } });
    await this.prisma.wallet.create({ data: { customerId: customer.id, tenantId } });
    this.eventBus.emitToTenant(tenantId, 'crm:customer-created', { id: customer.id, name: customer.name });
    return customer;
  }

  async updateCustomer(tenantId: string, id: string, data: any) {
    const customer = await this.prisma.customer.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!customer) throw new NotFoundException('Customer not found');
    const updated = await this.prisma.customer.update({ where: { id }, data });
    this.eventBus.emitToTenant(tenantId, 'crm:customer-updated', { id });
    return updated;
  }

  async deleteCustomer(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!customer) throw new NotFoundException('Customer not found');
    await this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
    this.eventBus.emitToTenant(tenantId, 'crm:customer-deleted', { id });
  }

  // ── Loyalty Points ──

  async getLoyaltySummary(tenantId: string) {
    const tiers = await this.prisma.membershipTier.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    const totals = await this.prisma.loyaltyPoints.aggregate({
      where: { tenantId },
      _sum: { points: true, lifetimePoints: true },
      _count: true,
    });
    return { tiers, totalPoints: totals._sum.points || 0, totalLifetime: totals._sum.lifetimePoints || 0, activeCustomers: totals._count };
  }

  async adjustLoyaltyPoints(tenantId: string, customerId: string, points: number, description: string) {
    const lp = await this.prisma.loyaltyPoints.findUnique({ where: { customerId } });
    if (!lp) throw new NotFoundException('Loyalty account not found');
    const newBalance = Math.max(0, lp.points + points);
    const updated = await this.prisma.loyaltyPoints.update({
      where: { customerId },
      data: { points: newBalance, lifetimePoints: points > 0 ? lp.lifetimePoints + points : lp.lifetimePoints },
    });
    await this.prisma.loyaltyTransaction.create({
      data: {
        loyaltyPointsId: lp.id,
        type: points > 0 ? 'ADJUSTMENT' : 'ADJUSTMENT',
        points: Math.abs(points),
        description,
      },
    });
    this.eventBus.emitToTenant(tenantId, 'crm:loyalty-updated', { customerId, points: newBalance });
    return updated;
  }

  // ── Membership Tiers ──

  async getTiers(tenantId: string) {
    return this.prisma.membershipTier.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createTier(tenantId: string, data: any) {
    return this.prisma.membershipTier.create({ data: { tenantId, ...data } });
  }

  async updateTier(tenantId: string, id: string, data: any) {
    return this.prisma.membershipTier.update({ where: { id }, data });
  }

  async deleteTier(tenantId: string, id: string) {
    await this.prisma.membershipTier.update({ where: { id, tenantId }, data: { deletedAt: new Date() } });
  }

  // ── Wallet ──

  async getWalletTransactions(tenantId: string, customerId: string, page = 1, limit = 20) {
    const wallet = await this.prisma.wallet.findUnique({ where: { customerId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);
    return { transactions, balance: wallet.balance, total, page, limit };
  }

  async topUpWallet(tenantId: string, customerId: string, amount: number, description: string, createdBy?: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { customerId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    const newBalance = Number(wallet.balance) + amount;
    await this.prisma.wallet.update({
      where: { customerId },
      data: { balance: newBalance, lifetimeCredit: Number(wallet.lifetimeCredit) + amount },
    });
    const tx = await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'TOP_UP',
        amount,
        balanceAfter: newBalance,
        description: description || 'Wallet top-up',
        createdBy,
      },
    });
    this.eventBus.emitToTenant(tenantId, 'crm:wallet-updated', { customerId, balance: newBalance });
    return tx;
  }

  // ── Reviews ──

  async getReviews(tenantId: string, query?: { page?: number; limit?: number; rating?: number; published?: boolean }) {
    const page = query?.page || 1;
    const limit = Math.min(query?.limit || 20, 100);
    const skip = (page - 1) * limit;
    const where: any = { tenantId, deletedAt: null };
    if (query?.rating) where.rating = query.rating;
    if (query?.published !== undefined) where.isPublished = query.published;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, phone: true } } },
      }),
      this.prisma.review.count({ where }),
    ]);
    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async replyToReview(tenantId: string, reviewId: string, reply: string, repliedBy: string) {
    const review = await this.prisma.review.findFirst({ where: { id: reviewId, tenantId } });
    if (!review) throw new NotFoundException('Review not found');
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { reply, repliedAt: new Date(), repliedBy },
    });
  }

  async toggleReviewPublish(tenantId: string, reviewId: string) {
    const review = await this.prisma.review.findFirst({ where: { id: reviewId, tenantId } });
    if (!review) throw new NotFoundException('Review not found');
    return this.prisma.review.update({ where: { id: reviewId }, data: { isPublished: !review.isPublished } });
  }

  // ── Feedback ──

  async getFeedback(tenantId: string, query?: { page?: number; limit?: number; resolved?: boolean }) {
    const page = query?.page || 1;
    const limit = Math.min(query?.limit || 20, 100);
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (query?.resolved !== undefined) where.resolved = query.resolved;

    const [feedback, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, phone: true } } },
      }),
      this.prisma.feedback.count({ where }),
    ]);
    return { feedback, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolveFeedback(tenantId: string, id: string, resolvedBy: string) {
    return this.prisma.feedback.update({
      where: { id },
      data: { resolved: true, resolvedAt: new Date(), resolvedBy },
    });
  }
}
