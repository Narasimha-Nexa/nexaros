import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderNormalizationService } from '../common/services/order-normalization.service';
import { IdempotencyService } from '../common/services/idempotency.service';
import { DeadLetterService } from '../monitoring/dead-letter.service';
import { StatusMappingService } from '../common/services/status-mapping.service';
import { SwiggyAdapter } from './adapters/swiggy.adapter';
import { ZomatoAdapter } from './adapters/zomato.adapter';
import { AggregatorAdapter } from '../common/interfaces/aggregator-adapter.interface';
import { CanonicalOrderInput } from '../common/types/canonical-order.type';

@Injectable()
export class AggregatorGatewayService {
  private readonly logger = new Logger(AggregatorGatewayService.name);
  private adapters: Map<string, AggregatorAdapter> = new Map();

  constructor(
    private prisma: PrismaService,
    private swiggyAdapter: SwiggyAdapter,
    private zomatoAdapter: ZomatoAdapter,
    private orderNormalization: OrderNormalizationService,
    private idempotency: IdempotencyService,
    private deadLetter: DeadLetterService,
    private statusMapping: StatusMappingService,
  ) {
    this.adapters.set('swiggy', this.swiggyAdapter);
    this.adapters.set('zomato', this.zomatoAdapter);
  }

  /**
   * Handle an incoming aggregator webhook.
   *
   * Flow:
   * 1. Verify webhook signature
   * 2. Check idempotency
   * 3. Normalize payload to canonical shape
   * 4. Resolve restaurant mapping from external restaurant/store ID
   * 5. Resolve item SKU mappings
   * 6. Ingest into NEXA ROS
   */
  async handleWebhook(channel: string, rawBody: unknown, headers: Record<string, string>): Promise<any> {
    const adapter = this.adapters.get(channel);
    if (!adapter) {
      throw new HttpException(`Unknown aggregator channel: ${channel}`, HttpStatus.BAD_REQUEST);
    }

    // Step 1: Verify webhook signature
    const bodyBuffer = Buffer.from(JSON.stringify(rawBody));
    if (!adapter.verifyWebhookSignature(bodyBuffer, headers)) {
      this.logger.warn(`Invalid signature for ${channel} webhook`);
      throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
    }

    try {
      // Step 2: Normalize the payload to get the canonical order shape
      const canonicalOrder = adapter.normalizeOrder(rawBody);

      // Step 3: Check idempotency (quick check before heavy processing)
      const alreadyClaimed = !(await this.idempotency.claim(canonicalOrder.idempotencyKey));
      if (alreadyClaimed) {
        this.logger.debug(`${channel} order ${canonicalOrder.channelOrderId} already being processed`);
        return { status: 'already_processed' };
      }

      // Step 4: Resolve restaurant mapping from the payload's restaurant/store ID
      const mapping = await this.resolveRestaurantMapping(channel, rawBody);
      if (!mapping) {
        await this.idempotency.release(canonicalOrder.idempotencyKey);
        await this.deadLetter.sendToDeadLetter(channel, 'Unmappable restaurant ID', rawBody);
        this.logger.warn(`Unmappable restaurant for ${channel} webhook — sent to dead letter`);
        return { status: 'unmapped_restaurant', message: 'Restaurant mapping not found. Please configure channel_restaurant_mappings.' };
      }

      canonicalOrder.tenantId = mapping.tenantId;
      canonicalOrder.branchId = mapping.branchId;

      // Step 5: Resolve item SKU mappings
      await this.resolveItemMappings(mapping.mappingId, canonicalOrder);

      // Step 6: Acknowledge (async ingest via BullMQ) — returns immediately for SLA compliance
      const result = await this.orderNormalization.acknowledge(canonicalOrder);

      if (result.status === 'accepted') {
        return { status: 'accepted', message: 'Order received and queued for processing' };
      }

      return {
        status: result.status === 'already_processed' ? 'duplicate' : 'ok',
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        channel: canonicalOrder.channel,
      };
    } catch (err) {
      this.logger.error(`Failed to process ${channel} webhook: ${(err as Error).message}`);

      await this.deadLetter.sendToDeadLetter(
        channel,
        `Processing failed: ${(err as Error).message}`,
        rawBody,
        { error: (err as Error).stack },
      );

      throw new HttpException(
        { status: 'error', message: 'Webhook processing failed' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Resolve the internal tenantId/branchId from the external restaurant ID
   * sent by the aggregator in the webhook payload.
   *
   * Each aggregator identifies the restaurant differently:
   * - Swiggy: restaurant_id or restaurantId in the payload
   * - Zomato: restaurant_id or res_id in the payload
   */
  private async resolveRestaurantMapping(
    channel: string,
    rawPayload: unknown,
  ): Promise<{ tenantId: string; branchId: string; mappingId: string } | null> {
    const payload = rawPayload as any;

    // Extract the external restaurant/store ID from the aggregator payload
    let externalRestaurantId: string | undefined;

    switch (channel) {
      case 'swiggy':
        externalRestaurantId = payload?.restaurant_id || payload?.restaurantId || payload?.restaurant?.id;
        break;
      case 'zomato':
        externalRestaurantId = payload?.restaurant_id || payload?.res_id || payload?.restaurant?.id;
        break;
      default:
        return null;
    }

    if (!externalRestaurantId) {
      this.logger.warn(`No restaurant ID found in ${channel} webhook payload`);
      return null;
    }

    // Look up the mapping in the database
    const mapping = await this.prisma.channelRestaurantMapping.findFirst({
      where: {
        channel: channel.toUpperCase() as any,
        externalRestaurantId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        branch: { select: { tenantId: true } },
      },
    });

    if (!mapping) {
      this.logger.warn(`No active mapping for ${channel} restaurant ID: ${externalRestaurantId}`);
      return null;
    }

    return {
      tenantId: mapping.branch.tenantId,
      branchId: mapping.internalBranchId,
      mappingId: mapping.id,
    };
  }

  /**
   * Resolve each item's external ID to an internal menuItemId
   * using the channel_item_mappings table.
   */
  private async resolveItemMappings(
    mappingId: string,
    canonicalOrder: CanonicalOrderInput,
  ): Promise<void> {
    for (const item of canonicalOrder.items) {
      if (!item.menuItemId) continue;

      // Look up the SKU mapping for this item
      const skuMapping = await this.prisma.channelItemMapping.findFirst({
        where: {
          restaurantMappingId: mappingId,
          internalMenuItemId: item.menuItemId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!skuMapping) {
        this.logger.warn(`No SKU mapping found for item ${item.name} (menuItemId: ${item.menuItemId}) in mapping ${mappingId}`);
        // Keep the item name but flag it - the normalization service handles unmapped items
      }
    }
  }
}
