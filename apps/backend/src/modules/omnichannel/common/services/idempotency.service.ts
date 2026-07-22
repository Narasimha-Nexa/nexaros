import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../common/redis/redis.service';
import { PrismaService } from '../../../../prisma/prisma.service';

/**
 * Idempotency guard for external webhooks.
 *
 * Derives a stable key from (channel + channelOrderId) and checks
 * Redis (SETNX) first, then DB, to guarantee that webhook retries
 * never create duplicate orders.
 *
 * Redis TTL is set generously (24h) since idempotency keys must
 * outlive any possible retry window. The DB unique constraint on
 * idempotencyKey is the ultimate backstop.
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly IDEMPOTENCY_TTL = 86400; // 24 hours
  private readonly KEY_PREFIX = 'idempotency:';

  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  /**
   * Build a deterministic idempotency key from channel + external ID.
   */
  buildKey(channel: string, channelOrderId: string): string {
    return `${channel}:${channelOrderId}`;
  }

  /**
   * Check if an idempotency key has already been processed.
   *
   * Returns true if the key exists (already seen), false if not.
   * Uses Redis SETNX for fast path, falls back to DB check.
   */
  async check(key: string): Promise<boolean> {
    // Fast path: Redis
    const redisKey = `${this.KEY_PREFIX}${key}`;
    const redisClient = (this.redis as any).getClient();
    if (redisClient && redisClient.status === 'ready') {
      try {
        const exists = await redisClient.exists(redisKey);
        if (exists) return true;
      } catch (err) {
        this.logger.warn(`Redis idempotency check failed: ${(err as Error).message}`);
      }
    }

    // Fallback: DB unique constraint
    try {
      const order = await this.prisma.order.findFirst({
        where: { idempotencyKey: key },
        select: { id: true },
      });
      return !!order;
    } catch {
      return false;
    }
  }

  /**
   * Try to claim an idempotency key atomically.
   *
   * Returns true if this caller is the first to claim the key
   * (should proceed with processing), false if already claimed.
   */
  async claim(key: string): Promise<boolean> {
    const redisKey = `${this.KEY_PREFIX}${key}`;
    const redisClient = (this.redis as any).getClient();
    if (redisClient && redisClient.status === 'ready') {
      try {
        const set = await redisClient.set(redisKey, 'pending', 'EX', this.IDEMPOTENCY_TTL, 'NX');
        if (set === 'OK') return true;
        return false;
      } catch (err) {
        this.logger.warn(`Redis SETNX failed: ${(err as Error).message}`);
      }
    }

    // Fallback: optimistic DB check (race condition possible but rare)
    const exists = await this.check(key);
    return !exists;
  }

  /**
   * Mark an idempotency key as fully consumed (order created).
   * Updates the Redis value to store the internal order ID.
   */
  async markConsumed(key: string, orderId: string): Promise<void> {
    const redisKey = `${this.KEY_PREFIX}${key}`;
    const redisClient = (this.redis as any).getClient();
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.set(redisKey, orderId, 'EX', this.IDEMPOTENCY_TTL);
      } catch {
        // Non-critical — DB has the truth
      }
    }
  }

  /**
   * Release an idempotency key (used when processing fails before order creation).
   */
  async release(key: string): Promise<void> {
    const redisKey = `${this.KEY_PREFIX}${key}`;
    const redisClient = (this.redis as any).getClient();
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.del(redisKey);
      } catch {
        // Non-critical
      }
    }
  }
}
