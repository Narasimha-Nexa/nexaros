import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNames } from '../../../../common/queue/queue.constants';
import { OrderNormalizationService } from '../../common/services/order-normalization.service';
import { DeadLetterService } from '../../monitoring/dead-letter.service';
import { CanonicalOrderInput } from '../../common/types/canonical-order.type';

/**
 * OrderIngestWorker — Async Order Ingestion (Spec §4.2)
 *
 * Picks up ingested orders from the ORDER_INGEST queue and delegates
 * to OrderNormalizationService.ingest() for all DB operations.
 *
 * This worker is intentionally thin — it deserializes the job data,
 * delegates to the service, and handles failures + dead-letter routing.
 * All order creation logic lives in OrderNormalizationService.ingest().
 */
@Processor(QueueNames.ORDER_INGEST, { concurrency: 10 })
export class OrderIngestWorker extends WorkerHost {
  private readonly logger = new Logger(OrderIngestWorker.name);

  constructor(
    private orderNormalization: OrderNormalizationService,
    private deadLetter: DeadLetterService,
  ) {
    super();
  }

  async process(job: Job): Promise<{ processed: boolean; orderId?: string }> {
    const { idempotencyKey, channel, channelOrderId, canonicalOrderJson } = job.data;

    this.logger.debug(`[ORDER_INGEST] Processing ${channel} order ${channelOrderId} (job ${job.id})`);

    try {
      // Parse the canonical order input from the queued JSON
      const canonicalInput = this.deserializeInput(canonicalOrderJson);

      // Delegate all DB operations to the service
      const result = await this.orderNormalization.ingest(canonicalInput);

      this.logger.log(`[ORDER_INGEST] ${channel} order ${channelOrderId} → #${result.orderNumber} (${result.id})`);

      return { processed: true, orderId: result.id };
    } catch (err) {
      this.logger.error(`[ORDER_INGEST] Failed to ingest ${channel} order ${channelOrderId}: ${(err as Error).message}`);

      await this.deadLetter.sendToDeadLetter(
        channel,
        `Ingestion failed: ${(err as Error).message}`,
        canonicalOrderJson,
        { idempotencyKey, channelOrderId, error: (err as Error).stack },
      );

      // Re-throw to trigger BullMQ retry with exponential backoff
      throw err;
    }
  }

  /**
   * Deserialize the canonical order input from the job data.
   * Reconstructs the CanonicalOrderInput from the JSON-safe representation.
   */
  private deserializeInput(json: Record<string, unknown>): CanonicalOrderInput {
    return json as unknown as CanonicalOrderInput;
  }
}
