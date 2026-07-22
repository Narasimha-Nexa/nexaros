import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../../prisma/prisma.service';
import { QueueNames } from '../../../../common/queue/queue.constants';
import { StatusMappingService } from '../../common/services/status-mapping.service';
import { CanonicalOrderStatus } from '../../common/types/canonical-order.type';
import { SwiggyAdapter } from '../adapters/swiggy.adapter';
import { ZomatoAdapter } from '../adapters/zomato.adapter';
import { ChannelAdapter } from '../../common/interfaces/channel-adapter.interface';

/**
 * Aggregator Status Sync Worker
 *
 * Dedicated queue (CHANNEL_AGGREGATOR_STATUS) for Swiggy/Zomato status push-back.
 * Conversational status pushes use CHANNEL_CONVERSATION_STATUS queue.
 * This ensures no worker collision — each worker has its own queue.
 *
 * Aggregators expect an "order accepted" confirmation within 1–2 minutes
 * or they may auto-cancel the order. Low-latency status push-back is a
 * correctness requirement.
 */
@Processor(QueueNames.CHANNEL_AGGREGATOR_STATUS, { concurrency: 5 })
export class StatusSyncWorker extends WorkerHost {
  private readonly logger = new Logger(StatusSyncWorker.name);

  private adapterMap: Map<string, ChannelAdapter> = new Map();

  constructor(
    private prisma: PrismaService,
    private statusMapping: StatusMappingService,
    private swiggyAdapter: SwiggyAdapter,
    private zomatoAdapter: ZomatoAdapter,
  ) {
    super();
    this.adapterMap.set('swiggy', this.swiggyAdapter);
    this.adapterMap.set('zomato', this.zomatoAdapter);
  }

  async process(job: Job): Promise<{ processed: boolean; channel?: string; status?: string }> {
    const { orderId, event } = job.data;

    if (!orderId) {
      return { processed: false };
    }

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, channel: true, channelOrderId: true, status: true },
      });

      if (!order || !order.channelOrderId) {
        return { processed: false };
      }

      const channel = order.channel.toLowerCase();

      // Only process aggregator channels (conversational handled by ConversationStatusWorker)
      const aggregatorChannels = ['swiggy', 'zomato'];
      if (!aggregatorChannels.includes(channel)) {
        return { processed: false, channel, status: order.status };
      }

      const adapter = this.adapterMap.get(channel);
      if (!adapter) {
        this.logger.warn(`No adapter registered for aggregator channel ${channel}`);
        return { processed: false, channel, status: order.status };
      }

      // Map internal status to canonical using StatusMappingService (Spec §5 — data table)
      const canonicalStatus = await this.statusMapping.toExternal(channel, this.internalToCanonical(order.status, event));
      if (!canonicalStatus) {
        return { processed: true, channel, status: order.status };
      }

      await adapter.pushStatus(order.channelOrderId, canonicalStatus as CanonicalOrderStatus);

      this.logger.log(`Status pushed: ${channel} order ${order.channelOrderId} -> ${canonicalStatus}`);

      return { processed: true, channel, status: canonicalStatus };
    } catch (err) {
      this.logger.error(`Status push failed for job ${job.id} (order ${orderId}): ${(err as Error).message}`);
      throw err;
    }
  }

  private internalToCanonical(internalStatus: string, event?: string): string {
    if (event) {
      const eventMap: Record<string, string> = {
        created: 'received',
        ready: 'ready',
        completed: 'completed',
        cancelled: 'cancelled',
      };
      if (eventMap[event]) return eventMap[event];
    }

    const statusMap: Record<string, string> = {
      PENDING: 'received',
      CONFIRMED: 'accepted',
      PREPARING: 'preparing',
      READY: 'ready',
      SERVED: 'completed',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      REJECTED: 'rejected',
    };
    return statusMap[internalStatus] || internalStatus.toLowerCase();
  }
}
