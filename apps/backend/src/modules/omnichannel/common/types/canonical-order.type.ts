/**
 * Canonical internal order shape that ALL channel adapters must produce.
 *
 * Every adapter normalizes its platform-specific payload into this shape
 * before calling OrderNormalizationService.ingest(). Everything downstream
 * (KDS, POS, analytics, reconciliation) sees only this schema.
 */

export type OrderChannel =
  | 'dine_in'
  | 'qr'
  | 'app'
  | 'swiggy'
  | 'zomato'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'ondc';

export type OrderType = 'delivery' | 'pickup' | 'dine_in';

export type CanonicalOrderStatus =
  | 'received'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'awaiting_pickup'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface CanonicalOrderInput {
  /** Derived from channel + channelOrderId for idempotency */
  idempotencyKey: string;

  /** Which external platform the order originated from */
  channel: OrderChannel;

  /** The external platform's order/reference ID */
  channelOrderId: string;

  /** Resolved internal tenant (restaurant) ID */
  tenantId: string;

  /** Resolved internal branch ID */
  branchId: string;

  /** delivery | pickup | dine_in */
  orderType: OrderType;

  /** Customer info (masked per channel privacy rules) */
  customer: {
    name?: string;
    phone?: string;
    email?: string;
    deliveryAddress?: {
      line1: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      latitude?: number;
      longitude?: number;
    };
  };

  /** Line items with resolved menu item IDs */
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    modifiers?: Array<{ name: string; price: number }>;
    notes?: string;
  }>;

  /** Full pricing breakdown */
  pricing: {
    subtotal: number;
    taxAmount: number;
    taxBreakdown?: Array<{ name: string; rate: number; amount: number }>;
    packagingCharges?: number;
    deliveryCharges?: number;
    discountAmount?: number;
    aggregatorCommission?: number;
    grandTotal: number;
  };

  /** Payment info */
  payment: {
    status: 'paid' | 'pending' | 'failed';
    method: 'prepaid' | 'cod' | 'online' | 'wallet';
    /** Razorpay payment ID if payment was processed through NEXA ROS */
    paymentId?: string;
  };

  /** The raw payload from the external channel — never discarded */
  rawPayload: unknown;

  /** Channel-specific raw status string for audit */
  channelStatus?: string;

  /** Free-form metadata from the channel adapter */
  metadata?: Record<string, unknown>;
}

export interface CanonicalOrderOutput {
  id: string;
  orderNumber: number;
  status: CanonicalOrderStatus;
  channel: OrderChannel;
  channelOrderId: string;
  createdAt: Date;
}
