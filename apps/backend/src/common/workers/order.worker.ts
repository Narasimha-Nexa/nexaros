import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNames } from '../queue/queue.constants';

@Processor(QueueNames.ORDERS, { concurrency: 5 })
export class OrderWorker extends WorkerHost {
  private readonly logger = new Logger(OrderWorker.name);

  async process(job: Job): Promise<{ processed: boolean; event: string }> {
    const { tenantId, branchId, orderId, event } = job.data;

    this.logger.debug(`Processing order event ${event} for order ${orderId}`);

    switch (event) {
      case 'created':
        // Trigger notification to kitchen, update analytics
        this.logger.log(`Order ${orderId} created in branch ${branchId}`);
        break;
      case 'status_changed':
        this.logger.log(`Order ${orderId} status changed`);
        break;
      case 'ready':
        this.logger.log(`Order ${orderId} ready — notify customer`);
        break;
      case 'completed':
        this.logger.log(`Order ${orderId} completed — update analytics`);
        break;
      case 'cancelled':
        this.logger.log(`Order ${orderId} cancelled — process refund if needed`);
        break;
    }

    return { processed: true, event };
  }
}
