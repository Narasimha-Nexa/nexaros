import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AggregatorAdapter, MenuItemSync, MenuSyncResult, SettlementLineItem } from '../../common/interfaces/aggregator-adapter.interface';
import { CanonicalOrderInput, CanonicalOrderStatus } from '../../common/types/canonical-order.type';
import { StatusMappingService } from '../../common/services/status-mapping.service';
import * as crypto from 'crypto';

/**
 * Swiggy Aggregator Adapter
 *
 * Handles order intake, status push-back, and menu sync for Swiggy.
 *
 * NOTE: Actual field names, webhook payload shapes, and signature algorithms
 * must be verified against Swiggy's official partner documentation at
 * integration time. This implementation provides the correct architectural
 * pattern — fill in exact field paths once partner access is granted.
 */
@Injectable()
export class SwiggyAdapter implements AggregatorAdapter {
  readonly channel = 'swiggy';

  private readonly logger = new Logger(SwiggyAdapter.name);
  private readonly apiBaseUrl: string;
  private readonly webhookSecret: string;
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
    private statusMapping: StatusMappingService,
  ) {
    this.apiBaseUrl = this.configService.get<string>('SWIGGY_API_BASE_URL', 'https://partner.swiggy.com');
    this.webhookSecret = this.configService.get<string>('SWIGGY_WEBHOOK_SECRET', '');
    this.apiKey = this.configService.get<string>('SWIGGY_API_KEY', '');
  }

  // ── Webhook Signature Verification ──

  verifyWebhookSignature(rawBody: Buffer, headers: Record<string, string>): boolean {
    // Swiggy typically sends an HMAC-SHA256 signature in a header like 'X-Swiggy-Signature'
    const signature = headers['x-swiggy-signature'] || headers['X-Swiggy-Signature'];
    if (!signature || !this.webhookSecret) {
      this.logger.warn('Missing Swiggy webhook signature or secret');
      return false;
    }

    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  // ── Order Normalization ──

  normalizeOrder(payload: unknown): CanonicalOrderInput {
    // TODO: Populate with actual Swiggy payload fields from partner docs
    // This is a template — exact field paths depend on Swiggy's API contract
    const data = payload as any;
    const restaurantId = data?.restaurant_id || data?.restaurantId || '';
    const externalOrderId = data?.order_id || data?.orderId || '';

    return {
      idempotencyKey: `swiggy:${externalOrderId}`,
      channel: 'swiggy',
      channelOrderId: externalOrderId,
      tenantId: '',           // Resolved from channel_restaurant_mappings
      branchId: '',           // Resolved from channel_restaurant_mappings
      orderType: data?.order_type === 'pickup' ? 'pickup' : 'delivery',
      customer: {
        name: data?.customer?.name || data?.delivery_address?.name,
        phone: data?.customer?.phone || data?.delivery_address?.phone,
        deliveryAddress: data?.delivery_address
          ? {
              line1: data.delivery_address.address || '',
              city: data.delivery_address.city,
              state: data.delivery_address.state,
              pincode: data.delivery_address.pincode,
              latitude: data.delivery_address.lat,
              longitude: data.delivery_address.lng,
            }
          : undefined,
      },
      items: (data?.items || []).map((item: any) => ({
        menuItemId: '',       // Resolved from channel_item_mappings
        name: item.name || item.item_name || '',
        quantity: item.quantity || 1,
        unitPrice: item.price || item.unit_price || 0,
        modifiers: (item.addons || item.modifiers || []).map((mod: any) => ({
          name: mod.name || mod.group_name || '',
          price: mod.price || 0,
        })),
        notes: item.instructions || item.notes,
      })),
      pricing: {
        subtotal: Number(data?.subtotal || data?.item_total || 0),
        taxAmount: Number(data?.tax || data?.tax_amount || 0),
        packagingCharges: Number(data?.packaging_charges || 0),
        deliveryCharges: Number(data?.delivery_charges || 0),
        discountAmount: Number(data?.discount || data?.discount_amount || 0),
        aggregatorCommission: Number(data?.commission || data?.aggregator_commission || 0),
        grandTotal: Number(data?.total || data?.grand_total || 0),
      },
      payment: {
        status: data?.payment_status === 'paid' ? 'paid' : 'pending',
        method: 'prepaid',
      },
      rawPayload: payload,
      channelStatus: data?.status || data?.order_status,
    };
  }

  // ── Status Push-Back ──

  async pushStatus(channelOrderId: string, status: CanonicalOrderStatus, metadata?: Record<string, unknown>): Promise<void> {
    const externalStatus = await this.statusMapping.toExternal(this.channel, status);
    const swiggyStatus = externalStatus || status;
    this.logger.log(`Pushing status ${status} -> ${swiggyStatus} for Swiggy order ${channelOrderId}`);

    // TODO: Implement actual HTTP call to Swiggy's status update API
    // const response = await fetch(`${this.apiBaseUrl}/v1/orders/${channelOrderId}/status`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ status: swiggyStatus }),
    // });
    // if (!response.ok) throw new Error(`Swiggy status push failed: ${response.status}`);
  }



  // ── Menu Sync ──

  async syncMenu(menu: MenuItemSync[]): Promise<MenuSyncResult> {
    this.logger.log(`Syncing ${menu.length} items to Swiggy`);

    // TODO: Implement actual menu push to Swiggy API
    // const response = await fetch(`${this.apiBaseUrl}/v1/menu`, {
    //   method: 'PUT',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ items: menu }),
    // });

    return { success: true, syncedCount: menu.length, failedCount: 0 };
  }

  async markItemUnavailable(externalItemId: string): Promise<void> {
    this.logger.log(`Marking Swiggy item ${externalItemId} as unavailable`);
    // TODO: Implement API call
  }

  async markItemAvailable(externalItemId: string): Promise<void> {
    this.logger.log(`Marking Swiggy item ${externalItemId} as available`);
    // TODO: Implement API call
  }

  // ── Reconciliation ──

  async fetchSettlements(fromDate: Date, toDate: Date): Promise<SettlementLineItem[]> {
    this.logger.log(`Fetching Swiggy settlements from ${fromDate.toISOString()} to ${toDate.toISOString()}`);
    // TODO: Implement settlement report fetch
    return [];
  }

  async getCommissionRate(): Promise<number> {
    // TODO: Fetch from Swiggy API or local config
    return 0.18; // Typical Indian aggregator commission ~18%
  }

  // ── Health ──

  async healthCheck(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
    try {
      const start = Date.now();
      // TODO: Implement actual health check call
      // await fetch(`${this.apiBaseUrl}/v1/health`);
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
}
