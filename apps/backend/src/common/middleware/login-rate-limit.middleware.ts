import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface LoginAttemptEntry {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

@Injectable()
export class LoginRateLimitMiddleware implements NestMiddleware {
  private readonly store = new Map<string, LoginAttemptEntry>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  private readonly lockoutDurationMs = 30 * 60 * 1000; // 30 min lockout

  use(req: Request, res: Response, next: NextFunction) {
    const key = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const now = Date.now();

    let entry = this.store.get(key);

    // Cleanup old entries outside the window
    if (entry && now > entry.firstAttemptAt + this.windowMs) {
      this.store.delete(key);
      entry = undefined;
    }

    // Check if currently locked out
    if (entry?.lockedUntil && now < entry.lockedUntil) {
      const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000);
      return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many login attempts. Account temporarily locked.',
        retryAfter,
      });
    }

    if (!entry) {
      entry = { attempts: 0, firstAttemptAt: now, lockedUntil: null };
      this.store.set(key, entry);
    }

    // Track login attempts via response finish event (more robust than overriding res.json)
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Successful login — reset attempts for this IP
        this.store.delete(key);
      } else if (res.statusCode === 401) {
        // Failed login — increment attempts
        const current = this.store.get(key);
        if (current) {
          current.attempts++;
          if (current.attempts >= this.maxAttempts) {
            current.lockedUntil = now + this.lockoutDurationMs;
          }
        }
      }
    });

    next();
  }
}
