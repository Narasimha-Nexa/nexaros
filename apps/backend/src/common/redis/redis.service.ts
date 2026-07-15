import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private connected = false;

  constructor(@Inject('REDIS_CLIENT') private readonly client: Redis) {}

  async connect() {
    try {
      await this.client.connect();
      this.connected = true;
      this.logger.log('Redis connected successfully');
    } catch (error) {
      this.logger.warn(`Redis connection failed: ${(error as Error).message}. Running without cache.`);
      this.connected = false;
    }
  }

  async disconnect() {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }

  getClient(): Redis {
    return this.client;
  }

  isReady(): boolean {
    return this.connected && this.client.status === 'ready';
  }

  // ── Cache Operations ──

  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady()) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Silently fail — cache miss is acceptable
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client.del(key);
    } catch {
      // Silently fail
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      // Silently fail
    }
  }

  // ── Rate Limiting ──

  async increment(key: string, windowSeconds = 60): Promise<{ count: number; ttl: number }> {
    if (!this.isReady()) {
      return { count: 0, ttl: windowSeconds };
    }
    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, windowSeconds);
      const results = await multi.exec();
      const count = results?.[0]?.[1] as number || 0;
      const ttl = await this.client.ttl(key);
      return { count, ttl: ttl > 0 ? ttl : windowSeconds };
    } catch {
      return { count: 0, ttl: windowSeconds };
    }
  }

  async getTTL(key: string): Promise<number> {
    if (!this.isReady()) return 0;
    try {
      return await this.client.ttl(key);
    } catch {
      return 0;
    }
  }

  // ── Pub/Sub ──

  createSubscriber(): Redis {
    return this.client.duplicate();
  }

  createPublisher(): Redis {
    return this.client.duplicate();
  }
}
