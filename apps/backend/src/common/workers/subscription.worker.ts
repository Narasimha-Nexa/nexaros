import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueNames } from '../queue/queue.constants';

@Processor(QueueNames.SUBSCRIPTIONS, { concurrency: 2 })
export class SubscriptionWorker extends WorkerHost {
  private readonly logger = new Logger(SubscriptionWorker.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<{ processed: boolean; transition: string }> {
    const { tenantId, subscriptionId, transition } = job.data;

    this.logger.debug(`Processing subscription transition: ${transition} for ${tenantId}`);

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      this.logger.warn(`Subscription ${subscriptionId} not found`);
      return { processed: false, transition };
    }

    const now = new Date();

    switch (transition) {
      case 'trial_expiry':
        if (subscription.status === 'TRIAL' && subscription.currentPeriodEnd && subscription.currentPeriodEnd <= now) {
          await this.prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: 'PAYMENT_PENDING' },
          });
          this.logger.log(`Trial expired for ${tenantId} → PAYMENT_PENDING`);
        }
        break;

      case 'payment_pending':
        if (subscription.status === 'PAYMENT_PENDING' && subscription.currentPeriodEnd) {
          const overdueDays = Math.floor((now.getTime() - subscription.currentPeriodEnd.getTime()) / 86400000);
          if (overdueDays >= 3) {
            await this.prisma.subscription.update({
              where: { id: subscriptionId },
              data: {
                status: 'GRACE_PERIOD',
                currentPeriodEnd: new Date(now.getTime() + (subscription.gracePeriodDays || 7) * 86400000),
              },
            });
            this.logger.log(`Payment overdue ${overdueDays}d for ${tenantId} → GRACE_PERIOD`);
          }
        }
        break;

      case 'grace_expiry':
        if (subscription.status === 'GRACE_PERIOD' && subscription.currentPeriodEnd && subscription.currentPeriodEnd <= now) {
          await this.prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: 'RESTRICTED' },
          });
          this.logger.log(`Grace period expired for ${tenantId} → RESTRICTED`);
        }
        break;

      case 'suspension':
        if (subscription.status === 'RESTRICTED') {
          const restrictedSince = subscription.updatedAt;
          const daysRestricted = Math.floor((now.getTime() - restrictedSince.getTime()) / 86400000);
          if (daysRestricted >= 30) {
            await this.prisma.subscription.update({
              where: { id: subscriptionId },
              data: {
                status: 'SUSPENDED',
                currentPeriodEnd: new Date(now.getTime() + 90 * 86400000),
              },
            });
            this.logger.log(`Restricted for ${daysRestricted}d → SUSPENDED for ${tenantId}`);
          }
        }
        break;

      case 'archive':
        if (subscription.status === 'SUSPENDED' && subscription.currentPeriodEnd && subscription.currentPeriodEnd <= now) {
          await this.prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: 'ARCHIVED' },
          });
          this.logger.log(`Suspended subscription archived for ${tenantId}`);
        }
        break;
    }

    return { processed: true, transition };
  }
}
