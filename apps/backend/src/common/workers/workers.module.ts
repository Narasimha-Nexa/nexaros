import { Module } from '@nestjs/common';
import { NotificationWorker } from './notification.worker';
import { InvoiceWorker } from './invoice.worker';
import { ReportWorker } from './report.worker';
import { OrderWorker } from './order.worker';
import { SubscriptionWorker } from './subscription.worker';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../../modules/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [
    NotificationWorker,
    InvoiceWorker,
    ReportWorker,
    OrderWorker,
    SubscriptionWorker,
  ],
})
export class WorkersModule {}
