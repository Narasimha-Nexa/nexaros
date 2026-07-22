import { CanonicalOrderInput, CanonicalOrderStatus } from '../types/canonical-order.type';

/**
 * Base interface that ALL channel adapters (aggregator + conversational) must implement.
 *
 * Each channel (Swiggy, Zomato, WhatsApp, Instagram, Facebook) gets its own
 * adapter class. Nothing outside these adapter classes should contain
 * channel-specific strings — that's the test for correct isolation.
 */
export interface ChannelAdapter {
  /** Human-readable channel identifier */
  readonly channel: string;

  // ── Inbound ──

  /**
   * Verify the webhook signature/HMAC from the external platform.
   * Must reject with 401 immediately on failure.
   */
  verifyWebhookSignature(rawBody: Buffer, headers: Record<string, string>): boolean;

  /**
   * Normalize the platform-specific webhook payload into the canonical
   * NEXA ROS Order shape.
   */
  normalizeOrder(payload: unknown): CanonicalOrderInput;

  // ── Outbound ──

  /**
   * Push a status change back to the originating channel.
   * Called by StatusSyncWorker when NEXA ROS's internal order status changes.
   */
  pushStatus(channelOrderId: string, status: CanonicalOrderStatus, metadata?: Record<string, unknown>): Promise<void>;

  // ── Health ──

  /** Quick connectivity check for the channel's API */
  healthCheck(): Promise<{ ok: boolean; latencyMs?: number; error?: string }>;
}
