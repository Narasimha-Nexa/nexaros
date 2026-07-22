import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationalAdapter, SendMessageOptions, IncomingMessage } from '../../common/interfaces/conversational-adapter.interface';
import { CanonicalOrderInput, CanonicalOrderStatus } from '../../common/types/canonical-order.type';
import * as crypto from 'crypto';

/**
 * WhatsApp Business Cloud API Adapter
 *
 * Handles order intake via WhatsApp conversational commerce.
 * Supports the Meta Cloud API (graph.facebook.com/v18.0) webhooks
 * and the Business API for sending messages, catalogs, and templates.
 *
 * NOTE: Requires Meta Business verification and app review before
 * commerce features go live in production.
 */
@Injectable()
export class WhatsAppAdapter implements ConversationalAdapter {
  readonly channel = 'whatsapp';

  private readonly logger = new Logger(WhatsAppAdapter.name);
  private readonly apiVersion = 'v18.0';
  private readonly graphBase: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly webhookVerifyToken: string;
  private readonly appSecret: string;

  constructor(private configService: ConfigService) {
    this.graphBase = 'https://graph.facebook.com';
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN', '');
    this.webhookVerifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN', '');
    this.appSecret = this.configService.get<string>('WHATSAPP_APP_SECRET', '');
  }

  // ── Webhook Verification ──

  /**
   * WhatsApp Cloud API uses a verification challenge for webhook setup
   * and HMAC-SHA256 signature verification for payload authenticity.
   *
   * The verifyWebhookSignature method handles the HMAC verification.
   * The verifyChallenge method is used during initial webhook registration.
   */
  verifyWebhookSignature(rawBody: Buffer, headers: Record<string, string>): boolean {
    // Meta sends X-Hub-Signature-256 header
    const signature = headers['x-hub-signature-256'] || headers['X-Hub-Signature-256'];
    if (!signature || !this.appSecret) {
      this.logger.warn('Missing WhatsApp webhook signature or app secret');
      return false;
    }

    const expected = crypto
      .createHmac('sha256', this.appSecret)
      .update(rawBody)
      .digest('hex');

    const expectedHeader = `sha256=${expected}`;

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedHeader),
      );
    } catch {
      return false;
    }
  }

  /**
   * Verify the webhook challenge token (used during initial webhook setup).
   * WhatsApp sends a GET request with hub.verify_token and hub.challenge.
   */
  verifyChallenge(token: string): boolean {
    return token === this.webhookVerifyToken;
  }

  // ── Order Normalization ──

  normalizeOrder(payload: unknown): CanonicalOrderInput {
    // WhatsApp sends order messages as part of a conversation webhook event.
    // The payload structure depends on whether it's a structured order message
    // (from the catalog/cart flow) or a free-text conversation that the
    // intent extraction service has already parsed into structured data.
    const data = payload as any;

    return {
      idempotencyKey: `whatsapp:${data.messageId || data.orderId || Date.now()}`,
      channel: 'whatsapp',
      channelOrderId: data.orderId || data.messageId || '',
      tenantId: '',
      branchId: '',
      orderType: 'pickup',
      customer: {
        name: data.customer?.name || data.profile?.name,
        phone: data.customer?.phone || data.from,
      },
      items: (data.items || []).map((item: any) => ({
        menuItemId: item.menuItemId || '',
        name: item.name || '',
        quantity: item.quantity || 1,
        unitPrice: Number(item.price || 0),
        notes: item.notes,
      })),
      pricing: {
        subtotal: Number(data.pricing?.subtotal || 0),
        taxAmount: Number(data.pricing?.tax || 0),
        grandTotal: Number(data.pricing?.total || 0),
      },
      payment: {
        status: data.payment?.status || 'pending',
        method: data.payment?.method || 'online',
        paymentId: data.payment?.razorpayPaymentId,
      },
      rawPayload: payload,
      metadata: data.metadata as Record<string, unknown>,
    };
  }

  // ── Status Push-Back ──

  async pushStatus(channelOrderId: string, status: CanonicalOrderStatus, metadata?: Record<string, unknown>): Promise<void> {
    // For WhatsApp, status updates are sent as chat messages to the customer
    const statusMessages: Record<string, string> = {
      received: '✅ We\'ve received your order! We\'ll start preparing it shortly.',
      accepted: '👨‍🍳 Your order has been accepted and is being prepared.',
      preparing: '🔥 Your food is being prepared. We\'ll let you know when it\'s ready!',
      ready: '🍽️ Your order is ready for pickup!',
      out_for_delivery: '🛵 Your order is on its way!',
      completed: '🙏 Thank you for ordering! We hope you enjoyed your meal.',
      cancelled: '❌ Your order has been cancelled.',
      rejected: '❌ Sorry, we\'re unable to process your order at this time.',
    };

    const message = statusMessages[status] || `Your order status has been updated to: ${status}`;
    await this.sendMessage({ to: channelOrderId, text: message });
  }

  // ── Messaging ──

  async sendMessage(options: SendMessageOptions): Promise<{ messageId: string }> {
    this.logger.log(`Sending WhatsApp message to ${options.to}`);

    // TODO: Implement actual WhatsApp Cloud API call
    // const response = await fetch(
    //   `${this.graphBase}/${this.apiVersion}/${this.phoneNumberId}/messages`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${this.accessToken}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       messaging_product: 'whatsapp',
    //       recipient_type: 'individual',
    //       to: options.to,
    //       type: options.text ? 'text' : options.templateName ? 'template' : 'text',
    //       text: options.text ? { body: options.text } : undefined,
    //       template: options.templateName ? {
    //         name: options.templateName,
    //         language: { code: 'en' },
    //         components: options.templateParams ? [
    //           { type: 'body', parameters: Object.entries(options.templateParams).map(([k, v]) => ({ type: 'text', text: v })) },
    //         ] : undefined,
    //       } : undefined,
    //     }),
    //   }
    // );

    return { messageId: `wa-${Date.now()}` };
  }

  async markAsRead(messageId: string): Promise<void> {
    // TODO: Implement read receipt API call
  }

  async sendCatalogMessage(to: string, items: Array<{ id: string; name: string; price: number; imageUrl?: string }>): Promise<void> {
    // TODO: Implement WhatsApp catalog message with interactive carousel
    this.logger.log(`Sending catalog with ${items.length} items to ${to}`);
  }

  // ── Catalog Sync ──

  async syncCatalog(items: Array<{ id: string; name: string; description?: string; price: number; imageUrl?: string; isVeg?: boolean; category?: string }>): Promise<{ success: boolean; catalogId?: string }> {
    this.logger.log(`Syncing ${items.length} items to WhatsApp catalog`);
    // TODO: Implement WhatsApp Business Catalog API call
    return { success: true };
  }

  // ── Session Detection ──

  detectSessionBoundary(message: IncomingMessage): 'new' | 'existing' | 'expired' {
    // Check if this is the first message in a conversation or a follow-up
    // In production, check against Redis/DB for existing session
    return message.type === 'text' && !message.text ? 'new' : 'existing';
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
