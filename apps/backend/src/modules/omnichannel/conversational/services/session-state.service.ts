import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RedisService } from '../../../../common/redis/redis.service';

/**
 * Session State Machine for Conversational Commerce
 *
 * Manages per-conversation state across WhatsApp, Instagram, and Facebook.
 *
 * States: greeting → browsing → cart_building → cart_review →
 *         awaiting_payment → order_placed → post_order
 *
 * Sessions are persisted in Redis with a TTL (30–60 min of inactivity
 * returns the customer to greeting) and backed by PostgreSQL for durability.
 */
@Injectable()
export class SessionStateService {
  private readonly logger = new Logger(SessionStateService.name);
  private readonly SESSION_TTL = 3600; // 1 hour inactivity timeout
  private readonly SESSION_KEY_PREFIX = 'conv_session:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Get or create a conversation session.
   */
  async getOrCreateSession(params: {
    channel: string;
    platformUserId: string;
    tenantId: string;
    branchId: string;
  }): Promise<ConversationSessionData> {
    const cacheKey = `${this.SESSION_KEY_PREFIX}${params.channel}:${params.platformUserId}:${params.tenantId}`;

    // Try Redis first
    const redisClient = (this.redis as any).getClient();
    if (redisClient?.status === 'ready') {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const session = JSON.parse(cached);
          // Refresh TTL
          await redisClient.expire(cacheKey, this.SESSION_TTL);
          return session;
        }
      } catch {
        // Fall through to DB
      }
    }

    // Try DB
    let session = await this.prisma.conversationSession.findFirst({
      where: {
        channel: params.channel.toUpperCase() as any,
        platformUserId: params.platformUserId,
        tenantId: params.tenantId,
        deletedAt: null,
      },
    });

    if (!session) {
      // Create new session
      session = await this.prisma.conversationSession.create({
        data: {
          channel: params.channel.toUpperCase() as any,
          platformUserId: params.platformUserId,
          tenantId: params.tenantId,
          branchId: params.branchId,
          state: 'GREETING',
          lastActivityAt: new Date(),
          expiresAt: new Date(Date.now() + this.SESSION_TTL * 1000),
          cartData: { items: [], total: 0 },
        },
      });
    } else if (session.state === 'ORDER_PLACED' || session.state === 'POST_ORDER') {
      // For returning customers after order placed, start fresh browsing session
      session = await this.prisma.conversationSession.update({
        where: { id: session.id },
        data: {
          state: 'BROWSING',
          cartData: { items: [], total: 0 },
          orderId: null,
          lastActivityAt: new Date(),
          expiresAt: new Date(Date.now() + this.SESSION_TTL * 1000),
        },
      });
    } else {
      // Update activity timestamp
      session = await this.prisma.conversationSession.update({
        where: { id: session.id },
        data: {
          lastActivityAt: new Date(),
          expiresAt: new Date(Date.now() + this.SESSION_TTL * 1000),
        },
      });
    }

    const sessionData: ConversationSessionData = {
      id: session.id,
      channel: session.channel.toLowerCase(),
      platformUserId: session.platformUserId,
      tenantId: session.tenantId,
      branchId: session.branchId,
      state: session.state.toLowerCase() as any,
      cart: (session.cartData as any) || { items: [], total: 0 },
      customerName: session.customerName || undefined,
      customerPhone: session.customerPhone || undefined,
      orderId: session.orderId || undefined,
      lastActivityAt: session.lastActivityAt,
    };

    // Cache in Redis
    if (redisClient?.status === 'ready') {
      try {
        await redisClient.set(cacheKey, JSON.stringify(sessionData), 'EX', this.SESSION_TTL);
      } catch {
        // Non-critical
      }
    }

    return sessionData;
  }

  /**
   * Transition a session to a new state.
   */
  async transitionState(
    sessionId: string,
    newState: SessionState,
    updates?: Partial<{
      cartData: any;
      customerName: string;
      customerPhone: string;
      orderId: string;
    }>,
  ): Promise<void> {
    const updateData: any = {
      state: newState.toUpperCase(),
      lastActivityAt: new Date(),
    };

    if (updates?.cartData) updateData.cartData = updates.cartData;
    if (updates?.customerName !== undefined) updateData.customerName = updates.customerName;
    if (updates?.customerPhone !== undefined) updateData.customerPhone = updates.customerPhone;
    if (updates?.orderId) updateData.orderId = updates.orderId;

    // Update expiry when transitioning to AWAITING_PAYMENT (longer TTL)
    if (newState === 'awaiting_payment') {
      updateData.expiresAt = new Date(Date.now() + 7200 * 1000); // 2 hours
    } else {
      updateData.expiresAt = new Date(Date.now() + this.SESSION_TTL * 1000);
    }

    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    // Invalidate Redis cache
    const session = await this.prisma.conversationSession.findUnique({
      where: { id: sessionId },
      select: { channel: true, platformUserId: true, tenantId: true },
    });
    if (session) {
      const cacheKey = `${this.SESSION_KEY_PREFIX}${session.channel.toLowerCase()}:${session.platformUserId}:${session.tenantId}`;
      const redisClient = (this.redis as any).getClient();
      if (redisClient?.status === 'ready') {
        try { await redisClient.del(cacheKey); } catch {}
      }
    }

    this.logger.debug(`Session ${sessionId} transitioned to ${newState}`);
  }

  /**
   * Update the cart within a session.
   */
  async updateCart(sessionId: string, cartData: { items: CartItem[]; total: number }): Promise<void> {
    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: {
        cartData: cartData as any,
        lastActivityAt: new Date(),
      },
    });
  }

  /**
   * Get session by ID.
   */
  async getSession(sessionId: string): Promise<ConversationSessionData | null> {
    const session = await this.prisma.conversationSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.deletedAt) return null;

    return {
      id: session.id,
      channel: session.channel.toLowerCase(),
      platformUserId: session.platformUserId,
      tenantId: session.tenantId,
      branchId: session.branchId,
      state: session.state.toLowerCase() as any,
      cart: (session.cartData as any) || { items: [], total: 0 },
      customerName: session.customerName || undefined,
      customerPhone: session.customerPhone || undefined,
      orderId: session.orderId || undefined,
      lastActivityAt: session.lastActivityAt,
    };
  }

  /**
   * Clean up expired sessions.
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.conversationSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        state: { notIn: ['ORDER_PLACED', 'AWAITING_PAYMENT'] },
      },
    });
    return result.count;
  }
}

export type SessionState =
  | 'greeting'
  | 'browsing'
  | 'cart_building'
  | 'cart_review'
  | 'awaiting_payment'
  | 'order_placed'
  | 'post_order';

export interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  modifiers?: Array<{ name: string; price: number }>;
}

export interface ConversationSessionData {
  id: string;
  channel: string;
  platformUserId: string;
  tenantId: string;
  branchId: string;
  state: SessionState;
  cart: { items: CartItem[]; total: number };
  customerName?: string;
  customerPhone?: string;
  orderId?: string;
  lastActivityAt: Date;
}
