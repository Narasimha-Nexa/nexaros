import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGateway } from '../../common/providers/payment-gateway';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private paymentGateway: PaymentGateway,
  ) {}

  async getEntitlements(tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { plan: { include: { entitlements: true } } },
    });

    if (!subscription) {
      return { status: 'NONE', entitlements: {}, trialEndsAt: null };
    }

    const entitlements: Record<string, boolean> = {};
    if (subscription.plan?.entitlements) {
      for (const e of subscription.plan.entitlements) {
        entitlements[e.moduleKey] = e.enabled;
      }
    }

    // Override with subscription-specific entitlements
    if (subscription.entitlements && typeof subscription.entitlements === 'object') {
      Object.assign(entitlements, subscription.entitlements);
    }

    return {
      status: subscription.status,
      entitlements,
      plan: subscription.plan?.slug,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      gracePeriodDays: subscription.gracePeriodDays,
      hasPromise: subscription.hasPromise,
      promiseUntil: subscription.promiseUntil,
    };
  }

  async transitionStatus(
    tenantId: string,
    newStatus: string,
    options?: { reason?: string; approvedBy?: string; days?: number },
  ) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) throw new NotFoundException('No subscription found');

    const validTransitions: Record<string, string[]> = {
      TRIAL: ['ACTIVE', 'PAYMENT_PENDING', 'RESTRICTED'],
      ACTIVE: ['PAYMENT_PENDING', 'GRACE_PERIOD', 'SUSPENDED'],
      PAYMENT_PENDING: ['ACTIVE', 'GRACE_PERIOD', 'RESTRICTED'],
      GRACE_PERIOD: ['ACTIVE', 'RESTRICTED', 'PAYMENT_PENDING'],
      RESTRICTED: ['ACTIVE', 'PAYMENT_PENDING', 'SUSPENDED'],
      SUSPENDED: ['ACTIVE', 'ARCHIVED', 'RESTRICTED'],
      ARCHIVED: [],
    };

    if (!validTransitions[subscription.status]?.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${subscription.status} to ${newStatus}`,
      );
    }

    const updateData: any = { status: newStatus };

    if (newStatus === 'ACTIVE') {
      updateData.currentPeriodStart = new Date();
      updateData.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      updateData.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      updateData.lastPaymentAt = new Date();
      updateData.graceStartedAt = null;
      updateData.hasPromise = false;
    }

    if (newStatus === 'GRACE_PERIOD') {
      updateData.graceStartedAt = new Date();
      const graceDays = options?.days || subscription.gracePeriodDays || 7;
      updateData.gracePeriodDays = graceDays;
    }

    if (newStatus === 'RESTRICTED') {
      const allowedModules = ['pos', 'orders', 'kitchen', 'tables', 'payments', 'invoices'];
      updateData.entitlements = {};
      for (const mod of allowedModules) {
        updateData.entitlements[mod] = true;
      }
    }

    if (newStatus === 'TRIAL' && options?.days) {
      updateData.trialStartedAt = new Date();
      updateData.trialEndsAt = new Date(Date.now() + options.days * 24 * 60 * 60 * 1000);
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: updateData,
    });

    this.logger.log(`Subscription ${tenantId}: ${subscription.status} → ${newStatus}`);
    return { status: newStatus };
  }

  async createCheckout(tenantId: string, planId: string, couponCode?: string) {
    const plan = await this.prisma.platformPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    let amount = Number(plan.price);
    let discount = 0;

    if (couponCode) {
      const coupon = await this.prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.isActive && coupon.expiry > new Date()) {
        if (coupon.type === 'PERCENTAGE') {
          discount = Math.min(amount * Number(coupon.value) / 100, Number(coupon.maxDiscount || amount));
        } else {
          discount = Math.min(Number(coupon.value), amount);
        }
      }
    }

    const finalAmount = Math.max(amount - discount, 0);

    const result = await this.paymentGateway.createOrder({
      amount: finalAmount,
      currency: 'INR',
      planSlug: plan.slug,
      customerEmail: '',
    });

    return {
      orderId: result.razorpayOrderId,
      amount: finalAmount,
      originalAmount: amount,
      discount,
      planSlug: plan.slug,
    };
  }

  async createPaymentPromise(tenantId: string, reason: string, expectedDate: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) throw new NotFoundException('No subscription found');

    const promise = await this.prisma.paymentPromise.create({
      data: {
        tenantId,
        subscriptionId: subscription.id,
        reason,
        expectedDate: new Date(expectedDate),
        status: 'APPROVED',
      },
    });

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        hasPromise: true,
        promiseUntil: new Date(expectedDate),
        promiseReason: reason,
      },
    });

    return promise;
  }

  async getPaymentPromises(tenantId: string) {
    return this.prisma.paymentPromise.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoices(tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) return [];

    return this.prisma.subscriptionInvoice.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayments(tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) return [];

    return this.prisma.subscriptionPayment.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // For admin portal
  async getAllSubscriptions(page = 1, limit = 50, status?: string) {
    const where = status ? { status: status as any } : {};
    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        include: { plan: true, tenant: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return { subscriptions, total, page, pages: Math.ceil(total / limit) };
  }

  async getExpiringSoon(days = 7) {
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.prisma.subscription.findMany({
      where: {
        status: { in: ['TRIAL', 'ACTIVE'] },
        currentPeriodEnd: { lte: cutoff },
      },
      include: { plan: true, tenant: { select: { id: true, name: true } } },
      orderBy: { currentPeriodEnd: 'asc' },
    });
  }
}
