import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNames } from '../queue/queue.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { EventBusService } from '../event-bus/event-bus.service';

const HIGH_VALUE_THRESHOLD = 10000;

@Processor(QueueNames.ORDERS, { concurrency: 5 })
export class OrderWorker extends WorkerHost {
  private readonly logger = new Logger(OrderWorker.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private eventBus: EventBusService,
  ) {
    super();
  }

  async process(job: Job): Promise<{ processed: boolean; event: string }> {
    const { tenantId, branchId, orderId, event } = job.data;

    this.logger.debug(`Processing order event ${event} for order ${orderId}`);

    switch (event) {
      case 'created': {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (order && Number(order.totalAmount) >= HIGH_VALUE_THRESHOLD) {
          await this.notifications.send(tenantId, {
            title: 'High-Value Order',
            message: `Order #${order.orderNumber} worth ₹${order.totalAmount} has been placed in branch ${branchId}.`,
            channel: 'IN_APP',
            entityType: 'Order',
            entityId: orderId,
            branchIds: [branchId],
          });
          this.logger.log(`High-value notification sent for order ${orderId}`);
        }
        break;
      }

      case 'completed': {
        await this.eventBus.fireDomainEvent(tenantId, 'order.completed', {
          orderId,
          branchId,
        });
        this.logger.log(`Domain event order.completed fired for order ${orderId}`);
        break;
      }

      default:
        this.logger.debug(`Order ${orderId} event ${event} — no side effects`);
        break;
    }

    return { processed: true, event };
  }
}
