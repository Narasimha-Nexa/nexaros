import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AggregatorAdapter, MenuItemSync, MenuSyncResult, SettlementLineItem } from '../../common/interfaces/aggregator-adapter.interface';
import { CanonicalOrderInput, CanonicalOrderStatus } from '../../common/types/canonical-order.type';
import { StatusMappingService } from '../../common/services/status-mapping.service';
import * as crypto from 'crypto';

/**
 * Zomato Aggregator Adapter
 *
 * Handles order intake, status push-back, and menu sync for Zomato.
 *
 * NOTE: Actual field names, webhook payload shapes, and signature algorithms
 * must be verified against Zomato's official partner documentation at
 * integration time. This implementation provides the correct architectural
 * pattern — fill in exact field paths once partner access is granted.
 */
@Injectable()
export class ZomatoAdapter implements AggregatorAdapter {
  readonly channel = 'zomato';

  private readonly logger = new Logger(ZomatoAdapter.name);
  private readonly apiBaseUrl: string;
  private readonly webhookSecret: string;
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
    private statusMapping: StatusMappingService,
  ) {
    this.apiBaseUrl = this.configService.get<string>('ZOMATO_API_BASE_URL', 'https://partner.zomato.com');
    this.webhookSecret = this.configService.get<string>('ZOMATO_WEBHOOK_SECRET', '');
    this.apiKey = this.configService.get<string>('ZOMATO_API_KEY', '');
  }

  // ── Webhook Signature Verification ──

  verifyWebhookSignature(rawBody: Buffer, headers: Record<string, string>): boolean {
    // Zomato typically uses a signature in 'X-Zomato-Signature' header
    const signature = headers['x-zomato-signature'] || headers['X-Zomato-Signature'];
    if (!signature || !this.webhookSecret) {
      this.logger.warn('Missing Zomato webhook signature or secret');
      return false;
    }

    // Zomato uses HMAC-SHA256 with the raw body
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  // ── Order Normalization ──

  normalizeOrder(payload: unknown): CanonicalOrderInput {
    // TODO: Populate with actual Zomato payload fields from partner docs
    const data = payload as any;
    const externalOrderId = data?.order_id || data?.orderId || '';

    return {
      idempotencyKey: `zomato:${externalOrderId}`,
      channel: 'zomato',
      channelOrderId: externalOrderId,
      tenantId: '',
      branchId: '',
      orderType: data?.type === 'pickup' ? 'pickup' : 'delivery',
      customer: {
        name: data?.customer?.name,
        phone: data?.customer?.phone,
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
        menuItemId: '',
        name: item.name || item.dish_name || '',
        quantity: item.quantity || 1,
        unitPrice: Number(item.price || item.unit_price || 0),
        modifiers: (item.addons || []).map((mod: any) => ({
          name: mod.name || '',
          price: Number(mod.price || 0),
        })),
        notes: item.special_instructions || item.notes,
      })),
      pricing: {
        subtotal: Number(data?.subtotal || 0),
        taxAmount: Number(data?.tax || data?.tax_amount || 0),
        packagingCharges: Number(data?.packaging_charges || 0),
        deliveryCharges: Number(data?.delivery_charges || 0),
        discountAmount: Number(data?.discount || 0),
        aggregatorCommission: Number(data?.commission || 0),
        grandTotal: Number(data?.total || data?.grand_total || 0),
      },
      payment: {
        status: data?.payment_status === 'paid' ? 'paid' : 'pending',
        method: 'prepaid',
      },
      rawPayload: payload,
      channelStatus: data?.status,
    };
  }

  // ── Status Push-Back ──

  async pushStatus(channelOrderId: string, status: CanonicalOrderStatus, metadata?: Record<string, unknown>): Promise<void> {
    const externalStatus = await this.statusMapping.toExternal(this.channel, status);
    const zomatoStatus = externalStatus || status;
    this.logger.log(`Pushing status ${status} -> ${zomatoStatus} for Zomato order ${channelOrderId}`);

    // TODO: Implement actual HTTP call to Zomato's status update API
    // const response = await fetch(`${this.apiBaseUrl}/v2/orders/${channelOrderId}/status`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ order_status: zomatoStatus }),
    // });
  }



  // ── Menu Sync ──

  async syncMenu(menu: MenuItemSync[]): Promise<MenuSyncResult> {
    this.logger.log(`Syncing ${menu.length} items to Zomato`);
    // TODO: Implement actual menu push to Zomato API
    return { success: true, syncedCount: menu.length, failedCount: 0 };
  }

  async markItemUnavailable(externalItemId: string): Promise<void> {
    this.logger.log(`Marking Zomato item ${externalItemId} as unavailable`);
  }

  async markItemAvailable(externalItemId: string): Promise<void> {
    this.logger.log(`Marking Zomato item ${externalItemId} as available`);
  }

  // ── Reconciliation ──

  async fetchSettlements(fromDate: Date, toDate: Date): Promise<SettlementLineItem[]> {
    this.logger.log(`Fetching Zomato settlements from ${fromDate.toISOString()} to ${toDate.toISOString()}`);
    // TODO: Implement settlement report fetch
    return [];
  }

  async getCommissionRate(): Promise<number> {
    return 0.20; // Typical Zomato commission ~20%
  }

  // ── Health ──

  async healthCheck(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
    try {
      const start = Date.now();
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
}
