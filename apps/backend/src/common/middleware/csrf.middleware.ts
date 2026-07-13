import { Injectable, NestMiddleware, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF protection middleware using double-submit cookie pattern.
 * Generates a CSRF token on first request and sets it as a cookie.
 * The client must send the token back in the X-CSRF-Token header.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger('CSRF');
  private readonly excludedPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/health',
    '/api/public',
    '/docs',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // Ensure CSRF cookie exists (generate if not)
    if (!req.cookies?.['csrf-token']) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie('csrf-token', token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });
    }

    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF for excluded paths
    const path = req.path;
    const isExcluded = this.excludedPaths.some(
      (excluded) => path.startsWith(excluded) || path === excluded,
    );
    if (isExcluded) {
      return next();
    }

    // Validate CSRF token
    const csrfHeader = req.headers['x-csrf-token'] as string;
    const csrfCookie = req.cookies?.['csrf-token'];

    if (!csrfHeader || !csrfCookie) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(HttpStatus.FORBIDDEN).json({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'CSRF token missing',
        });
      }
      this.logger.warn(`CSRF token missing for ${req.method} ${req.path} (allowed in dev mode)`);
      return next();
    }

    if (csrfHeader !== csrfCookie) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(HttpStatus.FORBIDDEN).json({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'CSRF token mismatch',
        });
      }
      this.logger.warn(`CSRF token mismatch for ${req.method} ${req.path} (allowed in dev mode)`);
    }

    next();
  }
}
