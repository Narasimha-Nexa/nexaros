import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WhatsAppCloudApiService } from './whatsapp-cloud-api.service';
import { WhatsAppTemplate, WhatsAppAccount } from '@prisma/client';

/**
 * WhatsApp Template Management Service
 *
 * Manages message templates with Meta's approval workflow:
 * - Create/submit templates for review
 * - Track approval status
 * - Manage template versions
 * - Sync with Meta's template API
 */
@Injectable()
export class WhatsAppTemplateService {
  private readonly logger = new Logger(WhatsAppTemplateService.name);
  private readonly graphBase = 'https://graph.facebook.com';

  constructor(
    private prisma: PrismaService,
    private cloudApiService: WhatsAppCloudApiService,
  ) {}

  /**
   * Create a new template and submit for Meta approval
   */
  async createTemplate(
    accountId: string,
    data: CreateTemplateDto,
  ): Promise<WhatsAppTemplate> {
    const account = await this.cloudApiService.getAccount(accountId);
    if (!account) {
      throw new NotFoundException('WhatsApp account not found');
    }

    // Check if template name already exists
    const existing = await this.prisma.whatsAppTemplate.findFirst({
      where: {
        accountId,
        name: data.name,
        language: data.language || 'en',
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Template name already exists');
    }

    // Create template in database
    const template = await this.prisma.whatsAppTemplate.create({
      data: {
        accountId,
        tenantId: account.tenantId,
        name: data.name,
        category: data.category,
        language: data.language || 'en',
        headerType: data.headerType || undefined,
        headerText: data.headerText || undefined,
        headerMediaUrl: data.headerMediaUrl || undefined,
        bodyText: data.bodyText,
        footerText: data.footerText || undefined,
        buttons: data.buttons,
        variables: data.variables || [],
        status: 'PENDING',
        submittedAt: new Date(),
      },
    });

    // Submit to Meta for approval
    try {
      await this.submitToMeta(account, template);
    } catch (error) {
      this.logger.error(`Failed to submit template to Meta: ${(error as Error).message}`);
      // Template is still saved in DB, just not submitted
    }

    return template;
  }

  /**
   * Get all templates for an account
   */
  async getTemplates(
    accountId: string,
    filters?: {
      status?: string;
      category?: string;
      search?: string;
    },
  ): Promise<WhatsAppTemplate[]> {
    const where: any = {
      accountId,
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { bodyText: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.whatsAppTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(templateId: string): Promise<WhatsAppTemplate> {
    const template = await this.prisma.whatsAppTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || template.deletedAt) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  /**
   * Update a template (creates new version if approved)
   */
  async updateTemplate(
    templateId: string,
    data: Partial<CreateTemplateDto>,
  ): Promise<WhatsAppTemplate> {
    const template = await this.getTemplate(templateId);

    if (template.status === 'APPROVED') {
      // Creating a new version
      const headerType = data.headerType || template.headerType;
      return this.createTemplate(template.accountId, {
        name: `${template.name}_v${template.version + 1}`,
        category: template.category,
        language: template.language,
        headerType: headerType as 'text' | 'image' | 'video' | undefined,
        headerText: data.headerText || template.headerText || undefined,
        headerMediaUrl: data.headerMediaUrl || template.headerMediaUrl || undefined,
        bodyText: data.bodyText || template.bodyText,
        footerText: data.footerText || template.footerText || undefined,
        buttons: data.buttons || (template.buttons as any),
        variables: data.variables || template.variables,
      });
    }

    // Update existing pending/rejected template
    return this.prisma.whatsAppTemplate.update({
      where: { id: templateId },
      data: {
        ...data,
        status: 'PENDING',
        submittedAt: new Date(),
        version: { increment: 1 },
      },
    });
  }

  /**
   * Delete a template (soft delete)
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await this.getTemplate(templateId);

    await this.prisma.whatsAppTemplate.update({
      where: { id: templateId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Sync templates from Meta
   */
  async syncTemplatesFromMeta(accountId: string): Promise<void> {
    const account = await this.cloudApiService.getAccount(accountId);
    if (!account) {
      throw new NotFoundException('WhatsApp account not found');
    }

    try {
      const response = await fetch(
        `${this.graphBase}/${account.apiVersion}/${account.wabaId}/templates`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
        },
      );

      const result = await response.json();

      if (result.data) {
        for (const metaTemplate of result.data) {
          await this.syncSingleTemplate(account, metaTemplate);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to sync templates from Meta: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Handle template status update from Meta webhook
   */
  async handleTemplateStatusUpdate(
    accountId: string,
    templateName: string,
    status: string,
    rejectionReason?: string,
  ): Promise<void> {
    const template = await this.prisma.whatsAppTemplate.findFirst({
      where: {
        accountId,
        name: templateName,
        deletedAt: null,
      },
    });

    if (!template) {
      this.logger.warn(`Template not found: ${templateName}`);
      return;
    }

    const updateData: any = {
      status: this.mapTemplateStatus(status),
    };

    if (status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason;
    }

    await this.prisma.whatsAppTemplate.update({
      where: { id: template.id },
      data: updateData,
    });

    this.logger.log(`Template ${templateName} status updated to ${status}`);
  }

  /**
   * Submit template to Meta for approval
   */
  private async submitToMeta(
    account: WhatsAppAccount,
    template: WhatsAppTemplate,
  ): Promise<void> {
    const components: any[] = [];

    // Header component
    if (template.headerType && template.headerText) {
      components.push({
        type: 'HEADER',
        format: template.headerType.toUpperCase(),
        ...(template.headerType === 'text' && { text: template.headerText }),
        ...(template.headerType === 'image' && {
          example: { header_handle: [template.headerMediaUrl] },
        }),
      });
    }

    // Body component
    const bodyParams = template.variables.map((v, i) => `{{${i + 1}}}`);
    components.push({
      type: 'BODY',
      text: template.bodyText,
      example: {
        body_text: [bodyParams.length > 0 ? bodyParams : ['Example text']],
      },
    });

    // Footer component
    if (template.footerText) {
      components.push({
        type: 'FOOTER',
        text: template.footerText,
      });
    }

    // Buttons component
    if (template.buttons && Array.isArray(template.buttons)) {
      components.push({
        type: 'BUTTONS',
        buttons: (template.buttons as any[]).map((btn: any) => ({
          type: btn.type || 'QUICK_REPLY',
          text: btn.text,
          ...(btn.url && { url: btn.url }),
        })),
      });
    }

    const response = await fetch(
      `${this.graphBase}/${account.apiVersion}/${account.wabaId}/templates`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: template.name,
          language: template.language,
          category: template.category,
          components,
        }),
      },
    );

    const result = await response.json();

    if (result.id) {
      await this.prisma.whatsAppTemplate.update({
        where: { id: template.id },
        data: { metaTemplateId: result.id },
      });
    }
  }

  /**
   * Sync a single template from Meta
   */
  private async syncSingleTemplate(
    account: WhatsAppAccount,
    metaTemplate: any,
  ): Promise<void> {
    const existing = await this.prisma.whatsAppTemplate.findFirst({
      where: {
        accountId: account.id,
        name: metaTemplate.name,
        language: metaTemplate.language,
        deletedAt: null,
      },
    });

    const status = this.mapTemplateStatus(metaTemplate.status);

    if (existing) {
      await this.prisma.whatsAppTemplate.update({
        where: { id: existing.id },
        data: {
          status,
          metaTemplateId: metaTemplate.id,
        },
      });
    } else {
      await this.prisma.whatsAppTemplate.create({
        data: {
          accountId: account.id,
          tenantId: account.tenantId,
          name: metaTemplate.name,
          category: metaTemplate.category,
          language: metaTemplate.language,
          bodyText: metaTemplate.components?.find((c: any) => c.type === 'BODY')?.text || '',
          status,
          metaTemplateId: metaTemplate.id,
        },
      });
    }
  }

  /**
   * Map Meta template status to our enum
   */
  private mapTemplateStatus(status: string): any {
    const statusMap: Record<string, string> = {
      PENDING: 'PENDING',
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
      ARCHIVED: 'ARCHIVED',
      PAUSED: 'PAUSED',
    };
    return statusMap[status.toUpperCase()] || 'PENDING';
  }
}

export interface CreateTemplateDto {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language?: string;
  headerType?: 'text' | 'image' | 'video';
  headerText?: string;
  headerMediaUrl?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{
    type: string;
    text: string;
    url?: string;
  }>;
  variables?: string[];
}
