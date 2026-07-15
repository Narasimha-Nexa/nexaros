import { Injectable, NestMiddleware, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class LoginRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoginRateLimitMiddleware.name);
  private readonly maxAttempts = 5;
  private readonly windowSeconds = 15 * 60; // 15 minutes
  private readonly lockoutSeconds = 30 * 60; // 30 min lockout

  // Fallback in-memory
  private readonly memStore = new Map<string, { attempts: number; firstAttemptAt: number; lockedUntil: number | null }>();

  constructor(private readonly redis: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = (req.ip || req.headers['x-forwarded-for'] || 'unknown') as string;
    const now = Date.now();

    if (this.redis.isReady()) {
      const attemptsKey = `login:attempts:${ip}`;
      const lockKey = `login:lock:${ip}`;

      // Check lockout
      const lockTTL = await this.redis.getTTL(lockKey);
      if (lockTTL > 0) {
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many login attempts. Account temporarily locked.',
          retryAfter: lockTTL,
        });
      }

      // Track attempts via response finish
      res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await this.redis.del(attemptsKey);
        } else if (res.statusCode === 401) {
          const { count } = await this.redis.increment(attemptsKey, this.windowSeconds);
          if (count >= this.maxAttempts) {
            await this.redis.set(lockKey, '1', this.lockoutSeconds);
            await this.redis.del(attemptsKey);
          }
        }
      });
    } else {
      // Fallback: in-memory
      let entry = this.memStore.get(ip);
      if (entry && now > entry.firstAttemptAt + this.windowSeconds * 1000) {
        this.memStore.delete(ip);
        entry = undefined;
      }
      if (entry?.lockedUntil && now < entry.lockedUntil) {
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many login attempts. Account temporarily locked.',
          retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
        });
      }
      if (!entry) {
        entry = { attempts: 0, firstAttemptAt: now, lockedUntil: null };
        this.memStore.set(ip, entry);
      }
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.memStore.delete(ip);
        } else if (res.statusCode === 401) {
          const current = this.memStore.get(ip);
          if (current) {
            current.attempts++;
            if (current.attempts >= this.maxAttempts) {
              current.lockedUntil = now + this.lockoutSeconds * 1000;
            }
          }
        }
      });
    }

    next();
  }
}
