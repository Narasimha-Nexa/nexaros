import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Raw Body Parser Middleware for WhatsApp Webhook
 *
 * Captures the raw request body for HMAC signature verification.
 * Must run before body-parser to preserve the original bytes.
 */
@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RawBodyMiddleware.name);

  use(req: Request, _res: Response, next: NextFunction): void {
    // Only capture for POST requests to webhook paths
    if (req.method === 'POST' && req.path === '/webhook') {
      const chunks: Buffer[] = [];

      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      req.on('end', () => {
        (req as any).rawBody = Buffer.concat(chunks);
        next();
      });

      req.on('error', (err: Error) => {
        this.logger.error(`Raw body parse error: ${err.message}`);
        next(err);
      });
    } else {
      next();
    }
  }
}
