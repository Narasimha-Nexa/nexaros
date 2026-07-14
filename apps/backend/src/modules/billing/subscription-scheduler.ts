import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionScheduler {
  private readonly logger = new Logger(SubscriptionScheduler.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleSubscriptionLifecycle() {
    this.logger.log('Running subscription lifecycle check...');
    const now = new Date();
    let transitions = 0;

    // 1. TRIAL ended → PAYMENT_PENDING
    const expiredTrials = await this.prisma.subscription.findMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: { lte: now },
      },
    });
    for (const sub of expiredTrials) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'PAYMENT_PENDING' },
      });
      transitions++;
      this.logger.log(`Trial expired for tenant ${sub.tenantId} → PAYMENT_PENDING`);
    }

    // 2. ACTIVE period ended → GRACE_PERIOD
    const expiredActive = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { lte: now },
        hasPromise: false,
      },
    });
    for (const sub of expiredActive) {
      const graceEnd = new Date(now.getTime() + (sub.gracePeriodDays || 7) * 24 * 60 * 60 * 1000);
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'GRACE_PERIOD',
          graceStartedAt: now,
        },
      });
      transitions++;
      this.logger.log(`Period ended for tenant ${sub.tenantId} → GRACE_PERIOD (until ${graceEnd.toISOString()})`);
    }

    // 3. PAYMENT_PENDING for >3 days → GRACE_PERIOD
    const pendingTooLong = await this.prisma.subscription.findMany({
      where: {
        status: 'PAYMENT_PENDING',
        lastPaymentAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      },
    });
    for (const sub of pendingTooLong) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'GRACE_PERIOD',
          graceStartedAt: now,
        },
      });
      transitions++;
      this.logger.log(`Payment pending >3 days for tenant ${sub.tenantId} → GRACE_PERIOD`);
    }

    // 4. GRACE_PERIOD ended → RESTRICTED
    const graceExpired = await this.prisma.subscription.findMany({
      where: {
        status: 'GRACE_PERIOD',
        graceStartedAt: { not: null },
      },
    });
    for (const sub of graceExpired) {
      const graceEnd = new Date(
        sub.graceStartedAt!.getTime() + (sub.gracePeriodDays || 7) * 24 * 60 * 60 * 1000,
      );
      if (graceEnd <= now && !sub.hasPromise) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'RESTRICTED',
            entitlements: {
              pos: true, orders: true, kitchen: true,
              tables: true, payments: true, invoices: true,
            },
          },
        });
        transitions++;
        this.logger.log(`Grace expired for tenant ${sub.tenantId} → RESTRICTED`);
      }
    }

    // 5. Payment promises that are overdue → expire them
    const expiredPromises = await this.prisma.paymentPromise.findMany({
      where: {
        status: { in: ['APPROVED', 'PENDING'] },
        expectedDate: { lt: now },
      },
    });
    for (const promise of expiredPromises) {
      await this.prisma.paymentPromise.update({
        where: { id: promise.id },
        data: { status: 'EXPIRED' },
      });
      await this.prisma.subscription.update({
        where: { id: promise.subscriptionId },
        data: {
          hasPromise: false,
          promiseUntil: null,
          promiseReason: null,
        },
      });
      transitions++;
      this.logger.log(`Promise expired for tenant ${promise.tenantId}`);
    }

    this.logger.log(`Lifecycle check complete: ${transitions} transitions`);
  }
}
