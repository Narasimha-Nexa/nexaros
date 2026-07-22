import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../../prisma/prisma.service';
import { QueueNames } from '../../../../common/queue/queue.constants';
import { CanonicalOrderStatus } from '../../common/types/canonical-order.type';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { InstagramAdapter } from '../adapters/instagram.adapter';
import { FacebookAdapter } from '../adapters/facebook.adapter';
import { ConversationalAdapter } from '../../common/interfaces/conversational-adapter.interface';

/**
 * ConversationStatusWorker
 *
 * Pushes order status changes back to conversational commerce channels
 * (WhatsApp, Instagram, Facebook) as chat messages.
 *
 * Unlike aggregator status push-back (which uses pushStatus()), this worker
 * sends human-readable messages that the customer sees in their chat thread.
 */
@Processor(QueueNames.CHANNEL_CONVERSATION_STATUS, { concurrency: 3 })
export class ConversationStatusWorker extends WorkerHost {
  private readonly logger = new Logger(ConversationStatusWorker.name);
  private adapters: Map<string, ConversationalAdapter> = new Map();

  constructor(
    private prisma: PrismaService,
    private whatsappAdapter: WhatsAppAdapter,
    private instagramAdapter: InstagramAdapter,
    private facebookAdapter: FacebookAdapter,
  ) {
    super();
    this.adapters.set('whatsapp', this.whatsappAdapter);
    this.adapters.set('instagram', this.instagramAdapter);
    this.adapters.set('facebook', this.facebookAdapter);
  }

  async process(job: Job): Promise<{ processed: boolean; channel?: string }> {
    const { orderId, event } = job.data;

    if (!orderId) return { processed: false };

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          channel: true,
          channelOrderId: true,
          status: true,
          customerName: true,
          customerPhone: true,
        },
        // Also need the session to get the customer's platform user ID
        // This is linked via channelOrderId or the conversation session
      });

      if (!order) return { processed: false };

      const channel = order.channel.toLowerCase();
      const conversationalChannels = ['whatsapp', 'instagram', 'facebook'];
      if (!conversationalChannels.includes(channel)) {
        return { processed: false };
      }

      const adapter = this.adapters.get(channel);
      if (!adapter) return { processed: false };

      // Find the conversation session to get the platform user ID
      const session = await this.prisma.conversationSession.findFirst({
        where: {
          channel: order.channel,
          orderId: order.id,
        },
      });

      if (!session) {
        this.logger.debug(`No conversation session found for order ${order.id}`);
        return { processed: false };
      }

      // Map internal status to canonical
      const canonicalStatus = this.mapToCanonical(order.status);
      if (!canonicalStatus) return { processed: false };

      // Push status as a chat message
      await adapter.pushStatus(session.platformUserId, canonicalStatus as CanonicalOrderStatus);

      this.logger.log(`Status sent: ${channel} → ${session.platformUserId} (order ${order.channelOrderId}): ${canonicalStatus}`);

      return { processed: true, channel };
    } catch (err) {
      this.logger.error(`Conversation status push failed: ${(err as Error).message}`);
      throw err;
    }
  }

  private mapToCanonical(internalStatus: string): string | null {
    const map: Record<string, string> = {
      PENDING: 'received',
      CONFIRMED: 'accepted',
      PREPARING: 'preparing',
      READY: 'ready',
      SERVED: 'completed',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      REJECTED: 'rejected',
    };
    return map[internalStatus] || null;
  }
}
