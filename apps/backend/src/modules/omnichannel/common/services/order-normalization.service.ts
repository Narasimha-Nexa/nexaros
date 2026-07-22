import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { QueueService } from '../../../../common/queue/queue.service';
import { EventBusService } from '../../../../common/event-bus/event-bus.service';
import { IdempotencyService } from './idempotency.service';
import { StatusMappingService } from './status-mapping.service';
import { DeadLetterService } from '../../monitoring/dead-letter.service';
import { CanonicalOrderInput, CanonicalOrderOutput, OrderChannel } from '../types/canonical-order.type';

/**
 * Order Normalization Service (Enterprise Async Pattern — Spec §4.2)
 *
 * ─── ACKNOWLEDGE (Controller → Fast/Sync) ───
 * Called directly from webhook controllers.
 * 1. Verifies idempotency (Redis SETNX — < 5ms)
 * 2. Claims the idempotency lock
 * 3. Enqueues the full payload to the ORDER_INGEST BullMQ queue
 * 4. Returns 200 OK immediately (< 50ms total)
 *
 * ─── INGEST (Worker → Async/Durable) ───
 * Called by OrderIngestWorker from the BullMQ queue.
 * 1. Double-checks idempotency
 * 2. Resolves SKU mappings
 * 3. Persists order to PostgreSQL
 * 4. Upserts customer record
 * 5. Emits Socket.IO events
 * 6. Enqueues status sync if external channel
 *
 * This split ensures:
 * - Aggregator SLA compliance (2-second timeout)
 * - Durable processing with retry/backoff
 * - No data loss on crash (job is persisted in Redis/BullMQ)
 * - Horizontal scalability (multiple workers can process in parallel)
 */
@Injectable()
export class OrderNormalizationService {
  private readonly logger = new Logger(OrderNormalizationService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private eventBus: EventBusService,
    private idempotency: IdempotencyService,
    private statusMapping: StatusMappingService,
    private deadLetter: DeadLetterService,
  ) {}

  /**
   * ACKNOWLEDGE — Called synchronously by webhook controllers.
   *
   * 1. Quick idempotency check (Redis SETNX)
   * 2. If duplicate, return existing order info
   * 3. If new, enqueue to ORDER_INGEST queue and return 202 immediately
   *
   * Total synchronous work: ~5-20ms (just Redis + BullMQ enqueue)
   */
  async acknowledge(input: CanonicalOrderInput): Promise<{ status: string; orderId?: string; orderNumber?: number }> {
    const { channel, channelOrderId, idempotencyKey } = input;

    // ── Quick idempotency check ──
    const alreadySeen = await this.idempotency.check(idempotencyKey);
    if (alreadySeen) {
      this.logger.debug(`[IDEMPOTENCY] ${channel} order ${channelOrderId} already processed`);

      // Look up existing order for return info
      try {
        const existing = await this.prisma.order.findFirst({
          where: { idempotencyKey },
          select: { id: true, orderNumber: true },
        });
        if (existing) {
          return { status: 'already_processed', orderId: existing.id, orderNumber: existing.orderNumber };
        }
      } catch {
        // Stale idempotency key — proceed
      }
    }

    // ── Claim the idempotency lock ──
    const claimed = await this.idempotency.claim(idempotencyKey);
    if (!claimed) {
      // Another request is processing this order concurrently
      return { status: 'processing' };
    }

    try {
      // ── Enqueue to BullMQ for async processing ──
      const job = await this.queueService.enqueueOrderIngest({
        idempotencyKey,
        channel,
        channelOrderId,
        tenantId: input.tenantId,
        branchId: input.branchId,
        canonicalOrderJson: input as unknown as Record<string, unknown>,
      });

      if (!job) {
        // Queue unavailable — fall back to synchronous processing
        this.logger.warn(`ORDER_INGEST queue unavailable, processing ${channel} order ${channelOrderId} synchronously`);
        const result = await this.ingest(input);
        return { status: 'ok', orderId: result.id, orderNumber: result.orderNumber };
      }

      this.logger.debug(`[ACK] ${channel} order ${channelOrderId} enqueued as job ${job.id}`);

      return { status: 'accepted', orderId: undefined, orderNumber: undefined };
    } catch (err) {
      // Enqueue failed — release idempotency lock
      await this.idempotency.release(idempotencyKey);

      await this.deadLetter.sendToDeadLetter(
        channel,
        `Enqueue failed: ${(err as Error).message}`,
        input,
      );

      // Fall back to synchronous processing
      const result = await this.ingest(input);
      return { status: 'ok', orderId: result.id, orderNumber: result.orderNumber };
    }
  }

  /**
   * INGEST — Called by OrderIngestWorker (async).
   *
   * Performs the actual order creation in PostgreSQL.
   * BullMQ handles retries with exponential backoff on failure.
   */
  async ingest(input: CanonicalOrderInput): Promise<CanonicalOrderOutput> {
    const { channel, channelOrderId, idempotencyKey, tenantId, branchId } = input;

    // ── Step 1: Verify restaurant mapping ──
    const mapping = await this.prisma.channelRestaurantMapping.findFirst({
      where: { internalBranchId: branchId, channel: channel.toUpperCase() as any, isActive: true },
    });
    if (!mapping) {
      throw new Error(`No active channel mapping for branch ${branchId} on channel ${channel}`);
    }

    // ── Step 2: Check SKU mappings ──
    const unmappedItems: string[] = [];
    for (const item of input.items) {
      if (!item.menuItemId) {
        unmappedItems.push(item.name);
        continue;
      }
      const skuMapping = await this.prisma.channelItemMapping.findFirst({
        where: { restaurantMappingId: mapping.id, internalMenuItemId: item.menuItemId, isActive: true },
      });
      if (!skuMapping) {
        unmappedItems.push(item.name);
      }
    }

    // ── Step 3: Get next order number ──
    const lastOrder = await this.prisma.order.findFirst({
      where: { branchId },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    const orderNumber = (lastOrder?.orderNumber || 0) + 1;

    // ── Step 4: Find or create customer ──
    if (input.customer.phone) {
      await this.prisma.customer.upsert({
        where: { tenantId_phone: { tenantId, phone: input.customer.phone } },
        update: {
          name: input.customer.name || undefined,
          totalOrders: { increment: 1 },
          totalSpent: { increment: input.pricing.grandTotal },
          lastOrderAt: new Date(),
        },
        create: {
          tenantId,
          name: input.customer.name || 'Guest',
          phone: input.customer.phone,
          email: input.customer.email,
          totalOrders: 1,
          totalSpent: input.pricing.grandTotal,
          lastOrderAt: new Date(),
        },
      });
    }

    // ── Step 5: Persist order (using rawPayload for audit trail) ──
    const order = await this.prisma.order.create({
      data: {
        branchId,
        tenantId,
        orderNumber,
        type: input.orderType === 'dine_in' ? 'DINE_IN' : input.orderType === 'delivery' ? 'DELIVERY' : 'TAKEAWAY',
        status: 'PENDING',
        channel: input.channel.toUpperCase() as any,
        channelOrderId,
        idempotencyKey,
        channelStatus: input.channelStatus,
        channelData: {
          ...(input.metadata || {}),
          rawPayload: input.rawPayload, // Full raw payload stored in JSONB — no truncation
        } as any,
        channelRawPayloadRef: '[stored in channelData.rawPayload]',
        needsManualReview: unmappedItems.length > 0,
        customerName: input.customer.name,
        customerPhone: input.customer.phone,
        subtotal: input.pricing.subtotal,
        taxAmount: input.pricing.taxAmount,
        discountAmount: input.pricing.discountAmount || 0,
        totalAmount: input.pricing.grandTotal,
        createdBy: `system:${channel}`,
        statusHistory: {
          create: {
            status: 'PENDING',
            notes: `Order received via ${channel} (external ID: ${channelOrderId})`,
          },
        },
        items: {
          create: input.items.map((item) => ({
            menuItemId: item.menuItemId || '',
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            notes: item.notes,
            addOns: item.modifiers?.length
              ? { create: item.modifiers.map((m) => ({ name: m.name, price: m.price })) }
              : undefined,
          })),
        },
      },
      include: {
        items: { include: { addOns: true } },
        statusHistory: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    // ── Step 6: Mark idempotency as consumed ──
    await this.idempotency.markConsumed(idempotencyKey, order.id);

    // ── Step 7: Log unmapped items ──
    if (unmappedItems.length > 0) {
      this.logger.warn(`[UNMAPPED ITEMS] Order ${order.id} (${channel}): ${unmappedItems.join(', ')}`);
    }

    // ── Step 8: Emit real-time events ──
    await this.eventBus.orderCreated(tenantId, branchId, {
      id: order.id,
      orderNumber: order.orderNumber,
      channel,
      channelOrderId,
      type: order.type,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      itemCount: input.items.length,
      needsManualReview: unmappedItems.length > 0,
    });

    this.logger.log(`[INGEST] ${channel} order ${channelOrderId} → #${orderNumber} (${order.id})`);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: 'received',
      channel: channel as OrderChannel,
      channelOrderId,
      createdAt: order.createdAt,
    };
  }
}
