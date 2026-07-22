import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { WhatsAppAccount } from '@prisma/client';

/**
 * WhatsApp Cloud API Service
 *
 * Handles all direct communication with Meta's WhatsApp Business Cloud API.
 * Manages multiple tenant accounts, rate limiting, and error handling.
 */
@Injectable()
export class WhatsAppCloudApiService {
  private readonly logger = new Logger(WhatsAppCloudApiService.name);
  private readonly graphBase = 'https://graph.facebook.com';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private getApiVersion(): string {
    return this.configService.get<string>('WHATSAPP_API_VERSION', 'v22.0');
  }

  // ── Account Management ──

  async getAccount(accountId: string): Promise<WhatsAppAccount | null> {
    return this.prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });
  }

  async getDefaultAccount(tenantId: string): Promise<WhatsAppAccount | null> {
    return this.prisma.whatsAppAccount.findFirst({
      where: {
        tenantId,
        isDefault: true,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  }

  async getAccountByPhoneNumberId(phoneNumberId: string): Promise<WhatsAppAccount | null> {
    return this.prisma.whatsAppAccount.findUnique({
      where: { phoneNumberId },
    });
  }

  async getAccountsByTenantId(tenantId: string): Promise<WhatsAppAccount[]> {
    return this.prisma.whatsAppAccount.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Message Sending ──

  async sendTextMessage(
    accountId: string,
    to: string,
    text: string,
  ): Promise<{ messageId: string; success: boolean; error?: string }> {
    const account = await this.getAccount(accountId);
    if (!account) {
      return { messageId: '', success: false, error: 'Account not found' };
    }

    return this.makeApiCall(account, '/messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    });
  }

  async sendTemplateMessage(
    accountId: string,
    to: string,
    templateName: string,
    languageCode: string = 'en',
    parameters?: Array<{ type: string; text: string }>,
  ): Promise<{ messageId: string; success: boolean; error?: string }> {
    const account = await this.getAccount(accountId);
    if (!account) {
      return { messageId: '', success: false, error: 'Account not found' };
    }

    const template: any = {
      name: templateName,
      language: { code: languageCode },
    };

    if (parameters && parameters.length > 0) {
      template.components = [
        {
          type: 'body',
          parameters,
        },
      ];
    }

    return this.makeApiCall(account, '/messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template,
    });
  }

  async sendImageMessage(
    accountId: string,
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<{ messageId: string; success: boolean; error?: string }> {
    const account = await this.getAccount(accountId);
    if (!account) {
      return { messageId: '', success: false, error: 'Account not found' };
    }

    return this.makeApiCall(account, '/messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        ...(caption && { caption }),
      },
    });
  }

  async sendInteractiveMessage(
    accountId: string,
    to: string,
    body: string,
    buttons?: Array<{ id: string; title: string }>,
    sections?: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
  ): Promise<{ messageId: string; success: boolean; error?: string }> {
    const account = await this.getAccount(accountId);
    if (!account) {
      return { messageId: '', success: false, error: 'Account not found' };
    }

    const interactive: any = {
      type: buttons ? 'button' : sections ? 'list' : 'text',
      body: { text: body },
    };

    if (buttons && buttons.length > 0) {
      interactive.action = {
        buttons: buttons.map((btn) => ({
          type: 'reply',
          reply: { id: btn.id, title: btn.title },
        })),
      };
    }

    if (sections && sections.length > 0) {
      interactive.action = {
        button: 'Select',
        sections: sections.map((section) => ({
          title: section.title,
          rows: section.rows.map((row) => ({
            id: row.id,
            title: row.title,
            ...(row.description && { description: row.description }),
          })),
        })),
      };
    }

    return this.makeApiCall(account, '/messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive,
    });
  }

  async sendLocationMessage(
    accountId: string,
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string,
  ): Promise<{ messageId: string; success: boolean; error?: string }> {
    const account = await this.getAccount(accountId);
    if (!account) {
      return { messageId: '', success: false, error: 'Account not found' };
    }

    return this.makeApiCall(account, '/messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'location',
      location: {
        latitude,
        longitude,
        ...(name && { name }),
        ...(address && { address }),
      },
    });
  }

  // ── Mark as Read ──

  async markAsRead(accountId: string, messageId: string): Promise<boolean> {
    const account = await this.getAccount(accountId);
    if (!account) return false;

    try {
      await this.makeApiCall(account, `/messages/${messageId}/read`, {});
      return true;
    } catch {
      return false;
    }
  }

  // ── Webhook Verification ──

  verifyWebhookToken(token: string, verifyToken: string): boolean {
    return token === verifyToken;
  }

  verifyWebhookSignature(
    rawBody: Buffer,
    signature: string,
    appSecret: string,
  ): boolean {
    if (!signature || !appSecret) return false;

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

  // ── Media Handling ──

  async uploadMedia(
    accountId: string,
    mediaType: 'image' | 'audio' | 'video' | 'document',
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<{ mediaId: string; success: boolean; error?: string }> {
    const account = await this.getAccount(accountId);
    if (!account) {
      return { mediaId: '', success: false, error: 'Account not found' };
    }

    try {
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('type', mediaType);
      formData.append(
        'file',
        new Blob([new Uint8Array(fileBuffer)]),
        filename,
      );

      const response = await fetch(
        `${this.graphBase}/${account.apiVersion}/${account.phoneNumberId}/media`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
          body: formData,
        },
      );

      const result = await response.json();

      if (result.id) {
        return { mediaId: result.id, success: true };
      }

      return {
        mediaId: '',
        success: false,
        error: result.error?.message || 'Upload failed',
      };
    } catch (error) {
      return {
        mediaId: '',
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async getMediaUrl(
    accountId: string,
    mediaId: string,
  ): Promise<{ url: string; success: boolean; error?: string }> {
    const account = await this.getAccount(accountId);
    if (!account) {
      return { url: '', success: false, error: 'Account not found' };
    }

    try {
      const response = await fetch(
        `${this.graphBase}/${account.apiVersion}/${mediaId}`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
        },
      );

      const result = await response.json();

      if (result.url) {
        return { url: result.url, success: true };
      }

      return {
        url: '',
        success: false,
        error: result.error?.message || 'Failed to get media URL',
      };
    } catch (error) {
      return {
        url: '',
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // ── Phone Number Management ──

  async getPhoneNumberInfo(
    accountId: string,
  ): Promise<{ displayPhoneNumber: string; verifiedName: string; qualityRating: string } | null> {
    const account = await this.getAccount(accountId);
    if (!account) return null;

    try {
      const response = await fetch(
        `${this.graphBase}/${account.apiVersion}/${account.phoneNumberId}`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
        },
      );

      const result = await response.json();

      if (result.display_phone_number) {
        return {
          displayPhoneNumber: result.display_phone_number,
          verifiedName: result.verified_name || '',
          qualityRating: result.quality_rating || 'UNKNOWN',
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  // ── Internal API Call Handler ──

  private async makeApiCall(
    account: WhatsAppAccount,
    endpoint: string,
    body: any,
  ): Promise<{ messageId: string; success: boolean; error?: string }> {
    const apiVersion = account.apiVersion || this.getApiVersion();
    const url = `${this.graphBase}/${apiVersion}/${account.phoneNumberId}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.messages && result.messages.length > 0) {
        return {
          messageId: result.messages[0].id,
          success: true,
        };
      }

      if (result.error) {
        this.logger.error(`WhatsApp API error: ${result.error.message}`);
        return {
          messageId: '',
          success: false,
          error: result.error.message,
        };
      }

      return {
        messageId: '',
        success: false,
        error: 'Unexpected response format',
      };
    } catch (error) {
      this.logger.error(`WhatsApp API call failed: ${(error as Error).message}`);
      return {
        messageId: '',
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
