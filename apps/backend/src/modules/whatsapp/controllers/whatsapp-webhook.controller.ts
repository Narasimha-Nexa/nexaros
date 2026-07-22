import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WhatsAppWebhookService } from '../services/whatsapp-webhook.service';

/**
 * WhatsApp Webhook Controller (Production-Ready)
 *
 * Mounted at `/webhook` (outside global prefix) for Meta compatibility.
 *
 * Handles:
 * - GET /webhook: Verification challenge from Meta
 * - POST /webhook: Incoming messages, status updates, delivery receipts
 *
 * Meta Dashboard Configuration:
 *   Callback URL: https://yourdomain.com/webhook
 *   Verify Token: nexaWebhook123 (or from WHATSAPP_WEBHOOK_VERIFY_TOKEN env)
 */
@Controller('webhook')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(private webhookService: WhatsAppWebhookService) {}

  /**
   * Webhook Verification (GET)
   *
   * Meta sends a GET request during webhook setup:
   *   GET /webhook?hub.mode=subscribe&hub.verify_token=nexaWebhook123&hub.challenge=CHALLENGE_TEXT
   *
   * Must return the hub.challenge value as plain text if token matches.
   */
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ): void {
    this.logger.log(`[WEBHOOK-VERIFY] mode=${mode} token=${token?.substring(0, 10)}...`);

    if (mode !== 'subscribe') {
      this.logger.warn('[WEBHOOK-VERIFY] Invalid mode - expected "subscribe"');
      res.status(403).send('Forbidden: invalid mode');
      return;
    }

    if (this.webhookService.verifyToken(token)) {
      this.logger.log(`[WEBHOOK-VERIFY] ✅ Verified successfully, returning challenge`);
      res.status(200).send(challenge);
      return;
    }

    this.logger.warn(`[WEBHOOK-VERIFY] ❌ Invalid verify token received`);
    res.status(403).send('Forbidden: invalid verify token');
  }

  /**
   * Incoming Webhook Events (POST)
   *
   * Meta sends all events here:
   * - Inbound messages from customers
   * - Message status updates (sent, delivered, read, failed)
   * - Account updates
   *
   * Must always respond with 200 OK within 20 seconds.
   * Signature verification via X-Hub-Signature-256 header.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: Request,
    @Body() body: any,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-hub-request-id') requestId: string,
    @Headers('x-hub-timestamp') timestamp: string,
  ): Promise<{ status: string }> {
    const startTime = Date.now();

    // Log incoming event summary
    const eventSummary = this.summarizeEvent(body);
    this.logger.log(
      `[WEBHOOK-INCOMING] ${eventSummary} | ` +
      `requestId=${requestId || 'none'} timestamp=${timestamp || 'none'}`
    );

    // Verify signature (required for production)
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      this.logger.warn('[WEBHOOK-SIG] ⚠️  rawBody not available - skipping signature check (dev mode)');
    } else if (!signature) {
      this.logger.warn('[WEBHOOK-SIG] ⚠️  No X-Hub-Signature-256 header');
    } else {
      const isValid = this.webhookService.verifySignature(rawBody, signature);
      if (!isValid) {
        this.logger.error('[WEBHOOK-SIG] ❌ Signature verification FAILED - rejecting request');
        return { status: 'invalid_signature' };
      }
      this.logger.debug('[WEBHOOK-SIG] ✅ Signature verified');
    }

    try {
      // Process the webhook asynchronously
      await this.webhookService.processWebhook(body);

      const elapsed = Date.now() - startTime;
      this.logger.log(`[WEBHOOK-OK] Processed in ${elapsed}ms`);

      return { status: 'ok' };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      this.logger.error(
        `[WEBHOOK-ERROR] Failed after ${elapsed}ms: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Still return 200 to prevent Meta from retrying
      return { status: 'ok' };
    }
  }

  /**
   * Health check for monitoring
   */
  @Get('health')
  getHealth(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Summarize webhook event for logging
   */
  private summarizeEvent(body: any): string {
    try {
      const entries = body?.entry || [];
      const counts = { messages: 0, statuses: 0, other: 0 };

      for (const entry of entries) {
        for (const change of entry.changes || []) {
          if (change.value?.messages) counts.messages += change.value.messages.length;
          if (change.value?.statuses) counts.statuses += change.value.statuses.length;
          if (change.field !== 'messages') counts.other++;
        }
      }

      return `messages=${counts.messages} statuses=${counts.statuses} other=${counts.other}`;
    } catch {
      return 'parse_error';
    }
  }
}
