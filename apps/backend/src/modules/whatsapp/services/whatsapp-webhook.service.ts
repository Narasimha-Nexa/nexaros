import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WhatsAppCloudApiService } from './whatsapp-cloud-api.service';
import { EventBusService } from '../../../common/event-bus/event-bus.service';
import { WhatsAppMessage, WhatsAppAccount } from '@prisma/client';

/**
 * WhatsApp Webhook Service
 *
 * Processes incoming webhook events from Meta's WhatsApp Cloud API:
 * - Inbound messages from customers
 * - Message status updates (sent, delivered, read, failed)
 * - Other events (account updates, etc.)
 */
@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);

  constructor(
    private prisma: PrismaService,
    private cloudApiService: WhatsAppCloudApiService,
    private eventBus: EventBusService,
  ) {}

  /**
   * Verify the webhook verification token
   */
  verifyToken(token: string): boolean {
    // Use WHATSAPP_WEBHOOK_VERIFY_TOKEN env var, fallback to default
    const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'nexaWebhook123';
    return token === expectedToken;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(rawBody: Buffer, signature: string): boolean {
    if (!signature) return false;

    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) return true; // Skip verification if no secret configured

    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    const expectedHeader = `sha256=${expected}`;

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedHeader),
      );
    } catch {
      return false;
    }
  }

  /**
   * Process incoming webhook event
   */
  async processWebhook(body: any): Promise<void> {
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field === 'messages') {
          await this.processMessagesChange(change.value);
        }
      }
    }
  }

  /**
   * Process messages change (inbound messages + status updates)
   */
  private async processMessagesChange(value: any): Promise<void> {
    const phoneNumberId = value.metadata?.phone_number_id;
    if (!phoneNumberId) {
      this.logger.warn('No phone_number_id in webhook');
      return;
    }

    // Find the account by phone number ID
    const account = await this.cloudApiService.getAccountByPhoneNumberId(phoneNumberId);
    if (!account) {
      this.logger.warn(`No account found for phone number ID: ${phoneNumberId}`);
      return;
    }

    // Process contacts (customer info)
    const contacts = value.contacts || [];
    for (const contact of contacts) {
      await this.processContact(account, contact);
    }

    // Process incoming messages
    const messages = value.messages || [];
    for (const message of messages) {
      await this.processIncomingMessage(account, message, value);
    }

    // Process status updates
    const statuses = value.statuses || [];
    for (const status of statuses) {
      await this.processStatusUpdate(account, status);
    }
  }

  /**
   * Process contact information from webhook
   */
  private async processContact(account: WhatsAppAccount, contact: any): Promise<void> {
    try {
      const waId = contact.wa_id;
      const profile = contact.profile;

      if (waId && profile?.name) {
        // Update or create customer profile in ConversationSession
        await this.prisma.conversationSession.upsert({
          where: {
            channel_platformUserId_tenantId: {
              channel: 'WHATSAPP',
              platformUserId: waId,
              tenantId: account.tenantId,
            },
          },
          create: {
            channel: 'WHATSAPP',
            platformUserId: waId,
            tenantId: account.tenantId,
            branchId: '', // Will be set when session is created
            state: 'GREETING',
            customerName: profile.name,
            customerPhone: waId,
            lastActivityAt: new Date(),
          },
          update: {
            customerName: profile.name,
            lastActivityAt: new Date(),
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to process contact: ${(error as Error).message}`);
    }
  }

  /**
   * Process incoming message from customer
   */
  private async processIncomingMessage(
    account: WhatsAppAccount,
    message: any,
    value: any,
  ): Promise<void> {
    try {
      const messageId = message.id;
      const from = message.from;
      const timestamp = new Date(parseInt(message.timestamp) * 1000);

      // Determine message type and content
      let textContent: string | null = null;
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      let interactivePayload: any = null;
      let templateName: string | null = null;

      switch (message.type) {
        case 'text':
          textContent = message.text?.body || null;
          break;
        case 'image':
          mediaUrl = message.image?.id || null;
          mediaType = 'image';
          break;
        case 'video':
          mediaUrl = message.video?.id || null;
          mediaType = 'video';
          break;
        case 'audio':
          mediaUrl = message.audio?.id || null;
          mediaType = 'audio';
          break;
        case 'document':
          mediaUrl = message.document?.id || null;
          mediaType = 'document';
          break;
        case 'interactive':
          interactivePayload = message.interactive;
          if (message.interactive.type === 'button_reply') {
            textContent = message.interactive.button_reply?.title;
          } else if (message.interactive.type === 'list_reply') {
            textContent = message.interactive.list_reply?.title;
          }
          break;
        case 'template':
          templateName = message.template?.name;
          break;
        case 'location':
          textContent = `Location: ${message.location?.latitude}, ${message.location?.longitude}`;
          break;
      }

      // Store the message
      const whatsappMessage = await this.prisma.whatsAppMessage.create({
        data: {
          accountId: account.id,
          tenantId: account.tenantId,
          platformMessageId: messageId,
          direction: 'INBOUND',
          type: this.mapMessageType(message.type),
          status: 'DELIVERED',
          from,
          to: account.phoneNumberId,
          textContent,
          mediaUrl,
          mediaType,
          templateName,
          interactivePayload,
          rawPayload: message,
          sentAt: timestamp,
          deliveredAt: timestamp,
        },
      });

      // Emit event for processing
      await this.eventBus.emitToTenant(account.tenantId, 'whatsapp:message:received', {
        messageId: whatsappMessage.id,
        platformMessageId: messageId,
        from,
        textContent,
        type: message.type,
        accountId: account.id,
      });

      this.logger.log(`Processed incoming message: ${messageId} from ${from}`);
    } catch (error) {
      this.logger.error(`Failed to process incoming message: ${(error as Error).message}`);
    }
  }

  /**
   * Process message status update
   */
  private async processStatusUpdate(account: WhatsAppAccount, status: any): Promise<void> {
    try {
      const messageId = status.id;
      const statusType = status.status;
      const timestamp = status.timestamp
        ? new Date(parseInt(status.timestamp) * 1000)
        : new Date();

      // Update message status
      const updateData: any = {
        status: this.mapMessageStatus(statusType),
      };

      if (statusType === 'sent') {
        updateData.sentAt = timestamp;
      } else if (statusType === 'delivered') {
        updateData.deliveredAt = timestamp;
      } else if (statusType === 'read') {
        updateData.readAt = timestamp;
      } else if (statusType === 'failed') {
        updateData.failedAt = timestamp;
        updateData.error = status.errors?.[0]?.message || 'Unknown error';
        updateData.errorCode = status.errors?.[0]?.code;
      }

      await this.prisma.whatsAppMessage.updateMany({
        where: {
          platformMessageId: messageId,
          accountId: account.id,
        },
        data: updateData,
      });

      this.logger.debug(`Updated message status: ${messageId} -> ${statusType}`);
    } catch (error) {
      this.logger.error(`Failed to process status update: ${(error as Error).message}`);
    }
  }

  /**
   * Map WhatsApp message type to our enum
   */
  private mapMessageType(type: string): any {
    const typeMap: Record<string, string> = {
      text: 'TEXT',
      image: 'IMAGE',
      video: 'VIDEO',
      audio: 'AUDIO',
      document: 'DOCUMENT',
      interactive: 'INTERACTIVE',
      template: 'TEMPLATE',
      location: 'LOCATION',
      contact: 'CONTACT',
      reaction: 'REACTION',
    };
    return typeMap[type] || 'TEXT';
  }

  /**
   * Map WhatsApp status to our enum
   */
  private mapMessageStatus(status: string): any {
    const statusMap: Record<string, string> = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
      pending: 'PENDING',
      undeliverable: 'UNDELIVERABLE',
    };
    return statusMap[status] || 'PENDING';
  }
}
