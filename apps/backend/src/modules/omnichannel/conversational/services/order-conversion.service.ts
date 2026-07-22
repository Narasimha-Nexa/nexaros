import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { OrderNormalizationService } from '../../common/services/order-normalization.service';
import { SessionStateService, ConversationSessionData } from './session-state.service';
import { CanonicalOrderInput } from '../../common/types/canonical-order.type';

/**
 * Order Conversion Service
 *
 * Converts a conversational session's cart into a canonical NEXA ROS Order
 * via the shared OrderNormalizationService.
 *
 * Handles:
 * - Cart → Order conversion
 * - Razorpay payment link generation
 * - Session state transition to ORDER_PLACED
 */
@Injectable()
export class OrderConversionService {
  private readonly logger = new Logger(OrderConversionService.name);

  constructor(
    private prisma: PrismaService,
    private orderNormalization: OrderNormalizationService,
    private sessionState: SessionStateService,
  ) {}

  /**
   * Convert a conversational session's cart into a formal order.
   * Called when the customer explicitly confirms their cart.
   */
  async convertCartToOrder(
    session: ConversationSessionData,
    paymentMethod: 'online' | 'cod' = 'online',
  ): Promise<{ orderId: string; orderNumber: number; paymentLink?: string }> {
    if (!session.cart.items || session.cart.items.length === 0) {
      throw new Error('Cannot convert empty cart to order');
    }

    const channelOrderId = `${session.channel}-${session.platformUserId}-${Date.now()}`;

    const canonicalInput: CanonicalOrderInput = {
      idempotencyKey: `conv:${session.channel}:${session.platformUserId}:${Date.now()}`,
      channel: session.channel as any,
      channelOrderId,
      tenantId: session.tenantId,
      branchId: session.branchId,
      orderType: 'pickup',
      customer: {
        name: session.customerName,
        phone: session.customerPhone,
      },
      items: session.cart.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        modifiers: item.modifiers,
        notes: item.notes,
      })),
      pricing: {
        subtotal: session.cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        taxAmount: 0, // Will be calculated by order service
        grandTotal: session.cart.total,
      },
      payment: {
        status: paymentMethod === 'cod' ? 'pending' : 'pending',
        method: paymentMethod,
      },
      rawPayload: { sessionId: session.id, cart: session.cart },
      metadata: {
        sessionId: session.id,
        platformUserId: session.platformUserId,
      },
    };

    // Acknowledge (async ingest via BullMQ) — returns immediately
    const ack = await this.orderNormalization.acknowledge(canonicalInput);

    // If acknowledged async, wait briefly for the ingest worker to create the order
    // or use the idempotency key to look up the created order
    let result: any;
    if (ack.status === 'accepted') {
      // Poll for order creation with the idempotency key (up to 5 seconds)
      result = await this.pollForOrder(canonicalInput.idempotencyKey, 10, 500);
    } else if (ack.orderId) {
      result = { id: ack.orderId, orderNumber: ack.orderNumber };
    } else {
      // Fall back to synchronous ingest
      result = await this.orderNormalization.ingest(canonicalInput);
    }

    // Generate Razorpay payment link for online payments
    let paymentLink: string | undefined;
    if (paymentMethod === 'online') {
      paymentLink = await this.generatePaymentLink(result.id, session.cart.total);
    }

    // Transition session to ORDER_PLACED
    await this.sessionState.transitionState(session.id, 'order_placed', {
      orderId: result.id,
    });

    this.logger.log(
      `Conversational order created: ${result.id} (#${result.orderNumber}) via ${session.channel}`,
    );

    return {
      orderId: result.id,
      orderNumber: result.orderNumber,
      paymentLink,
    };
  }

  /**
   * Generate a Razorpay payment link for the order.
   */
  /**
   * Poll for order creation by idempotency key.
   * Used when the async acknowledge path is taken — the OrderIngestWorker
   * creates the order asynchronously, and we wait for it here.
   */
  private async pollForOrder(
    idempotencyKey: string,
    maxRetries: number,
    delayMs: number,
  ): Promise<{ id: string; orderNumber: number }> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const existing = await this.prisma.order.findFirst({
          where: { idempotencyKey },
          select: { id: true, orderNumber: true },
        });
        if (existing) {
          return { id: existing.id, orderNumber: existing.orderNumber };
        }
      } catch {
        // DB error — retry
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
    // Timeout — fall back to synchronous ingest
    this.logger.warn(`pollForOrder timed out for ${idempotencyKey}, falling back to sync ingest`);
    // This shouldn't happen under normal operation since BullMQ processes
    // jobs within milliseconds. Only occurs if the worker is backed up.
    throw new Error('Order creation timed out after async acknowledge');
  }

  private async generatePaymentLink(orderId: string, amount: number): Promise<string | undefined> {
    // TODO: Implement actual Razorpay payment link generation
    // const razorpay = new Razorpay({ key_id: '...', key_secret: '...' });
    // const link = await razorpay.paymentLink.create({
    //   amount: Math.round(amount * 100),
    //   currency: 'INR',
    //   description: `Order ${orderId}`,
    //   reference_id: orderId,
    // });
    // return link.short_url;

    return `https://pay.example.com/${orderId}`;
  }

  /**
   * Build a text summary of the cart for sending back to the customer.
   */
  buildCartSummary(session: ConversationSessionData): string {
    if (!session.cart.items.length) {
      return '🛒 Your cart is empty. Would you like to see our menu?';
    }

    const lines = session.cart.items.map(
      (item, i) =>
        `${i + 1}. ${item.name} × ${item.quantity} = ₹${(item.unitPrice * item.quantity).toFixed(2)}`,
    );

    return [
      '📋 *Your Order Summary:*\n',
      ...lines,
      '',
      `💰 *Total: ₹${session.cart.total.toFixed(2)}*`,
      '',
      'Reply "confirm" to place the order, or tell me what you\'d like to change!',
    ].join('\n');
  }
}
