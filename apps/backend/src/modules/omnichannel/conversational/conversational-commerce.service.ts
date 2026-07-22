import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { SessionStateService, ConversationSessionData } from './services/session-state.service';
import { IntentExtractionService, ExtractedIntent } from './services/intent-extraction.service';
import { OrderConversionService } from './services/order-conversion.service';
import { IdempotencyService } from '../common/services/idempotency.service';
import { DeadLetterService } from '../monitoring/dead-letter.service';
import { WhatsAppAdapter } from './adapters/whatsapp.adapter';
import { InstagramAdapter } from './adapters/instagram.adapter';
import { FacebookAdapter } from './adapters/facebook.adapter';

/**
 * Conversational Commerce Service
 *
 * Orchestrates inbound message handling from WhatsApp, Instagram, and Facebook.
 *
 * Resolves the tenant/branch from:
 * - WhatsApp: the Business Phone Number ID that received the message
 * - Instagram/Facebook: the Page/IG ID that received the message
 *
 * These are mapped in channel_restaurant_mappings.externalRestaurantId.
 */
@Injectable()
export class ConversationalCommerceService {
  private readonly logger = new Logger(ConversationalCommerceService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private sessionState: SessionStateService,
    private intentExtraction: IntentExtractionService,
    private orderConversion: OrderConversionService,
    private idempotency: IdempotencyService,
    private deadLetter: DeadLetterService,
    private whatsappAdapter: WhatsAppAdapter,
    private instagramAdapter: InstagramAdapter,
    private facebookAdapter: FacebookAdapter,
  ) {}

  // ── Webhook Challenge Verification ──

  verifyWhatsAppChallenge(token: string): boolean {
    return token === this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
  }

  verifyInstagramChallenge(token: string): boolean {
    return token === this.configService.get<string>('INSTAGRAM_WEBHOOK_VERIFY_TOKEN');
  }

  verifyFacebookChallenge(token: string): boolean {
    return token === this.configService.get<string>('FACEBOOK_WEBHOOK_VERIFY_TOKEN');
  }

  // ── Inbound Message Handling ──

  async handleIncoming(
    channel: string,
    body: unknown,
    headers: Record<string, string>,
  ): Promise<any> {
    const adapter = this.getAdapter(channel);
    if (!adapter) {
      this.logger.warn(`No adapter for channel: ${channel}`);
      return { status: 'unknown_channel' };
    }

    // Verify signature
    const bodyBuffer = Buffer.from(JSON.stringify(body));
    if (!adapter.verifyWebhookSignature(bodyBuffer, headers)) {
      this.logger.warn(`Invalid signature for ${channel} webhook`);
      return { status: 'invalid_signature' };
    }

    try {
      // Extract messages from the payload
      const messages = this.extractMessages(channel, body);
      if (!messages || messages.length === 0) {
        return { status: 'no_messages' };
      }

      // Resolve tenant/branch from the channel identifier
      const channelId = this.extractChannelId(channel, body);
      const resolution = await this.resolveTenantFromChannel(channel, channelId);

      for (const msg of messages) {
        await this.processMessage(channel, msg, adapter, resolution);
      }

      return { status: 'ok' };
    } catch (err) {
      this.logger.error(`Failed to process ${channel} message: ${(err as Error).message}`);
      await this.deadLetter.sendToDeadLetter(
        channel,
        `Message processing failed: ${(err as Error).message}`,
        body,
      );
      return { status: 'error' };
    }
  }

  /**
   * Resolve which tenant/branch this message belongs to based on the
   * channel-specific identifier (WhatsApp Business Phone Number, etc.).
   */
  private async resolveTenantFromChannel(
    channel: string,
    channelIdentifier: string,
  ): Promise<{ tenantId: string; branchId: string } | null> {
    if (!channelIdentifier) return null;

    const mapping = await this.prisma.channelRestaurantMapping.findFirst({
      where: {
        channel: channel.toUpperCase() as any,
        externalRestaurantId: channelIdentifier,
        isActive: true,
        deletedAt: null,
      },
      include: {
        branch: { select: { tenantId: true } },
      },
    });

    if (mapping) {
      return {
        tenantId: mapping.branch.tenantId,
        branchId: mapping.internalBranchId,
      };
    }

    return null;
  }

  /**
   * Extract the channel-specific identifier from the webhook payload.
   *
   * For WhatsApp: The Business Phone Number ID that received the message
   * (found in metadata.phone_number_id or entry[0].changes[0].value.metadata.phone_number_id).
   *
   * For Instagram/Facebook: The Page ID or IG ID
   * (found in entry[0].id).
   */
  private extractChannelId(channel: string, body: any): string {
    try {
      switch (channel) {
        case 'whatsapp':
          return body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id || '';
        case 'instagram':
        case 'facebook':
          return body?.entry?.[0]?.id || '';
        default:
          return '';
      }
    } catch {
      return '';
    }
  }

  private async processMessage(
    channel: string,
    msg: { from: string; text?: string; messageId: string },
    adapter: any,
    resolution: { tenantId: string; branchId: string } | null,
  ): Promise<void> {
    // If we can't resolve the tenant, use a fallback (or reject)
    if (!resolution) {
      this.logger.warn(`Could not resolve tenant for ${channel} message from ${msg.from}`);
      // Send a helpful message but don't create session without tenant context
      try {
        await adapter.sendMessage({
          to: msg.from,
          text: 'Hi! 👋 It looks like this restaurant hasn\'t fully set up their ordering system yet. Please contact them directly. Thanks!',
        });
      } catch (sendErr) {
        this.logger.error(`Failed to send fallback message: ${(sendErr as Error).message}`);
      }
      return;
    }

    const { tenantId, branchId } = resolution;

    // Get or create session
    const session = await this.sessionState.getOrCreateSession({
      channel,
      platformUserId: msg.from,
      tenantId,
      branchId,
    });

    // Acknowledge receipt
    await adapter.markAsRead(msg.messageId);

    // Check if we need customer info (name/phone)
    if (!session.customerName && msg.from) {
      await this.sessionState.transitionState(session.id, session.state, {
        customerPhone: msg.from,
      });
    }

    // Extract intent from message text
    if (msg.text) {
      const intent = await this.intentExtraction.extractIntent(msg.text, tenantId);
      await this.handleIntent(session, intent, adapter);
    } else {
      await adapter.sendMessage({
        to: msg.from,
        text: 'Hi! 👋 You can send me a text message to order. Try "show menu" or "I want 2 butter chicken"!',
      });
    }
  }

  private async handleIntent(
    session: ConversationSessionData,
    intent: ExtractedIntent,
    adapter: any,
  ): Promise<void> {
    const { channel, platformUserId } = session;

    switch (intent.type) {
      case 'greeting':
        await adapter.sendMessage({
          to: platformUserId,
          text: '👋 Welcome! Would you like to see our menu? Just say "menu" to get started!',
        });
        await this.sessionState.transitionState(session.id, 'greeting');
        break;

      case 'request_menu':
        await adapter.sendMessage({
          to: platformUserId,
          text: 'Here\'s our menu! You can browse and tell me what you\'d like to order.\n\nReply with items like "2 butter chicken" or "1 naan" to add to your cart.',
        });
        await this.sessionState.transitionState(session.id, 'browsing');
        break;

      case 'add_item':
        if (intent.items && intent.items.length > 0) {
          const newCart = {
            items: [...session.cart.items, ...intent.items],
            total: 0,
          };
          newCart.total = newCart.items.reduce(
            (sum: number, item: any) => sum + item.unitPrice * item.quantity,
            0,
          );

          await this.sessionState.updateCart(session.id, newCart);

          await adapter.sendMessage({
            to: platformUserId,
            text: `✅ Added ${intent.items[0].quantity} × ${intent.items[0].name} to your cart! Current total: ₹${newCart.total.toFixed(2)}\n\nWant anything else? Reply "cart" to review or "confirm" to place the order.`,
          });
          await this.sessionState.transitionState(session.id, 'cart_building');
        } else {
          await adapter.sendMessage({
            to: platformUserId,
            text: '😕 Sorry, I couldn\'t find that item on our menu. Could you try a different name?',
          });
        }
        break;

      case 'review_cart':
        const summary = this.orderConversion.buildCartSummary(session);
        await adapter.sendMessage({ to: platformUserId, text: summary });
        await this.sessionState.transitionState(session.id, 'cart_review');
        break;

      case 'confirm_order':
        if (session.cart.items.length === 0) {
          await adapter.sendMessage({
            to: platformUserId,
            text: '🛒 Your cart is empty! Say "menu" to see what we have.',
          });
          return;
        }

        await adapter.sendMessage({
          to: platformUserId,
          text: '💳 How would you like to pay?\n\nReply "online" for a payment link, or "cod" for cash on delivery.',
        });
        await this.sessionState.transitionState(session.id, 'awaiting_payment');
        break;

      case 'payment_inquiry':
      case 'provide_address':
        if (session.state === 'awaiting_payment') {
          const paymentMethod = intent.type === 'provide_address' ? 'cod' : 'online';
          try {
            const result = await this.orderConversion.convertCartToOrder(session, paymentMethod);

            let response = `🎉 *Order Confirmed!*\n\nOrder #${result.orderNumber}\n`;
            if (result.paymentLink) {
              response += `\n🔗 *Pay now:* ${result.paymentLink}\n\nPlease complete the payment to confirm your order.`;
            } else {
              response += '\nPay on delivery. Thank you! 🙏';
            }

            await adapter.sendMessage({ to: platformUserId, text: response });
            await this.sessionState.transitionState(session.id, 'order_placed', {
              orderId: result.orderId,
            });
          } catch (err) {
            this.logger.error(`Order conversion failed: ${(err as Error).message}`);
            await adapter.sendMessage({
              to: platformUserId,
              text: '😕 Sorry, there was an error placing your order. Please try again or contact the restaurant directly.',
            });
          }
        } else {
          await adapter.sendMessage({
            to: platformUserId,
            text: 'Reply "confirm" to place your order first!',
          });
        }
        break;

      case 'cancel_order':
        await this.sessionState.transitionState(session.id, 'browsing', {
          cartData: { items: [], total: 0 },
        });
        await adapter.sendMessage({
          to: platformUserId,
          text: '🗑️ Your cart has been cleared. Say "menu" to start over!',
        });
        break;

      case 'inquire_status':
        await adapter.sendMessage({
          to: platformUserId,
          text: session.orderId
            ? '🔍 Let me check your order status...\n\n(Order tracking coming soon!)'
            : 'You don\'t have any active orders. Would you like to see our menu?',
        });
        break;

      case 'inquire_hours':
        await adapter.sendMessage({
          to: platformUserId,
          text: '🕐 Our opening hours are:\n\nMon–Sun: 11:00 AM – 10:00 PM\n\nWe\'re open every day!',
        });
        break;

      case 'help':
        await adapter.sendMessage({
          to: platformUserId,
          text: '🤖 *How to order:*\n\n• Say "menu" to see our items\n• "2 butter chicken" to add items\n• "cart" to review your order\n• "confirm" to place the order\n• "cancel" to clear your cart',
        });
        break;

      default:
        await adapter.sendMessage({
          to: platformUserId,
          text: '😕 Sorry, I didn\'t quite understand that. Try:\n\n• "menu" — see our items\n• "help" — see what I can do',
        });
        break;
    }
  }

  private extractMessages(channel: string, body: any): Array<{ from: string; text?: string; messageId: string }> | null {
    try {
      switch (channel) {
        case 'whatsapp': {
          const entry = body?.entry?.[0];
          const change = entry?.changes?.[0];
          const value = change?.value;
          const messages = value?.messages || [];
          return messages.map((msg: any) => ({
            from: msg.from || '',
            text: msg.text?.body || (msg.type === 'interactive' ? JSON.stringify(msg.interactive) : ''),
            messageId: msg.id || '',
          }));
        }
        case 'instagram': {
          const entry = body?.entry?.[0];
          const messaging = entry?.messaging?.[0] || entry?.changes?.[0]?.value?.messages?.[0];
          if (!messaging) return null;
          return [{
            from: messaging.sender?.id || messaging.from || '',
            text: messaging.message?.text || '',
            messageId: messaging.message?.mid || messaging.id || '',
          }];
        }
        case 'facebook': {
          const entry = body?.entry?.[0];
          const messaging = entry?.messaging?.[0];
          if (!messaging) return null;
          return [{
            from: messaging.sender?.id || '',
            text: messaging.message?.text || '',
            messageId: messaging.message?.mid || '',
          }];
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  private getAdapter(channel: string): any {
    switch (channel) {
      case 'whatsapp': return this.whatsappAdapter;
      case 'instagram': return this.instagramAdapter;
      case 'facebook': return this.facebookAdapter;
      default: return null;
    }
  }
}
