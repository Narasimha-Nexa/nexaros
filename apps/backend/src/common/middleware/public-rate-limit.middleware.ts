import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class PublicRateLimitMiddleware implements NestMiddleware {
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly maxRequests = 30;
  private readonly windowMs = 60 * 1000; // 1 minute

  use(req: Request, res: Response, next: NextFunction) {
    const key = `public:${req.ip || req.headers['x-forwarded-for'] as string || 'unknown'}`;
    const now = Date.now();

    let entry = this.store.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.store.set(key, entry);
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

    next();
  }
}
