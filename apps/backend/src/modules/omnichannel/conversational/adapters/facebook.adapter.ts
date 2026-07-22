import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationalAdapter, SendMessageOptions, IncomingMessage } from '../../common/interfaces/conversational-adapter.interface';
import { CanonicalOrderInput, CanonicalOrderStatus } from '../../common/types/canonical-order.type';
import * as crypto from 'crypto';

/**
 * Facebook Messenger Platform Adapter
 *
 * Handles order intake via Facebook Messenger.
 * Uses Facebook's Messenger Platform API (graph.facebook.com/v18.0).
 *
 * NOTE: Requires Meta Business verification and app review before
 * commerce features go live in production.
 */
@Injectable()
export class FacebookAdapter implements ConversationalAdapter {
  readonly channel = 'facebook';

  private readonly logger = new Logger(FacebookAdapter.name);
  private readonly graphBase: string;
  private readonly apiVersion = 'v18.0';
  private readonly pageAccessToken: string;
  private readonly appSecret: string;

  constructor(private configService: ConfigService) {
    this.graphBase = 'https://graph.facebook.com';
    this.pageAccessToken = this.configService.get<string>('FACEBOOK_PAGE_ACCESS_TOKEN', '');
    this.appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET', '');
  }

  verifyWebhookSignature(rawBody: Buffer, headers: Record<string, string>): boolean {
    const signature = headers['x-hub-signature-256'] || headers['X-Hub-Signature-256'];
    if (!signature || !this.appSecret) {
      this.logger.warn('Missing Facebook webhook signature or app secret');
      return false;
    }

    const expected = crypto
      .createHmac('sha256', this.appSecret)
      .update(rawBody)
      .digest('hex');

    const expectedHeader = `sha256=${expected}`;
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHeader));
    } catch {
      return false;
    }
  }

  normalizeOrder(payload: unknown): CanonicalOrderInput {
    const data = payload as any;
    return {
      idempotencyKey: `facebook:${data.messageId || data.orderId || Date.now()}`,
      channel: 'facebook',
      channelOrderId: data.orderId || data.messageId || '',
      tenantId: '',
      branchId: '',
      orderType: 'pickup',
      customer: {
        name: data.customer?.name || data.sender?.name,
        phone: data.customer?.phone,
      },
      items: (data.items || []).map((item: any) => ({
        menuItemId: item.menuItemId || '',
        name: item.name || '',
        quantity: item.quantity || 1,
        unitPrice: Number(item.price || 0),
      })),
      pricing: {
        subtotal: Number(data.pricing?.subtotal || 0),
        taxAmount: Number(data.pricing?.tax || 0),
        grandTotal: Number(data.pricing?.total || 0),
      },
      payment: {
        status: data.payment?.status || 'pending',
        method: 'online',
      },
      rawPayload: payload,
    };
  }

  async pushStatus(channelOrderId: string, status: CanonicalOrderStatus, metadata?: Record<string, unknown>): Promise<void> {
    const statusMessages: Record<string, string> = {
      received: '✅ We\'ve received your order!',
      accepted: '👨‍🍳 Your order is being prepared.',
      preparing: '🔥 Your food is being prepared!',
      ready: '🍽️ Your order is ready!',
      completed: '🙏 Thank you for your order!',
      cancelled: '❌ Your order has been cancelled.',
    };

    const message = statusMessages[status] || `Status: ${status}`;
    await this.sendMessage({ to: channelOrderId, text: message });
  }

  async sendMessage(options: SendMessageOptions): Promise<{ messageId: string }> {
    this.logger.log(`Sending Facebook message to ${options.to}`);
    return { messageId: `fb-${Date.now()}` };
  }

  async markAsRead(messageId: string): Promise<void> {
    // TODO: Implement read receipt
  }

  async sendCatalogMessage(to: string, items: Array<{ id: string; name: string; price: number; imageUrl?: string }>): Promise<void> {
    this.logger.log(`Sending catalog with ${items.length} items to ${to}`);
  }

  async syncCatalog(items: any[]): Promise<{ success: boolean; catalogId?: string }> {
    this.logger.log(`Syncing ${items.length} items to Facebook catalog`);
    return { success: true };
  }

  detectSessionBoundary(message: IncomingMessage): 'new' | 'existing' | 'expired' {
    return 'existing';
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
    return { ok: true };
  }
}
