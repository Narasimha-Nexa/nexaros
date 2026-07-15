import { Injectable, NestMiddleware, HttpStatus, Inject, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly maxRequests = 100;
  private readonly windowSeconds = 60;

  // Fallback in-memory store when Redis is unavailable
  private readonly memStore = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly redis: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const key = `ratelimit:${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`;
    const now = Date.now();

    if (this.redis.isReady()) {
      // Redis-backed rate limiting
      const { count, ttl } = await this.redis.increment(key, this.windowSeconds);
      const remaining = Math.max(0, this.maxRequests - count);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + ttl * 1000) / 1000));

      if (count > this.maxRequests) {
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: ttl,
        });
      }
    } else {
      // Fallback: in-memory rate limiting
      let entry = this.memStore.get(req.ip || 'unknown');
      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + this.windowSeconds * 1000 };
        this.memStore.set(req.ip || 'unknown', entry);
      }
      entry.count++;

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - entry.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

      if (entry.count > this.maxRequests) {
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        });
      }
    }

    next();
  }
}
