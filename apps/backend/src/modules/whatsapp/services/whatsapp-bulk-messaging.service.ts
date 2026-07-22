import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WhatsAppCloudApiService } from './whatsapp-cloud-api.service';
import { WhatsAppTemplateService } from './whatsapp-template.service';
import { EventBusService } from '../../../common/event-bus/event-bus.service';
import { WhatsAppBulkCampaign, WhatsAppAccount, WhatsAppMessage } from '@prisma/client';

/**
 * WhatsApp Bulk Messaging Service
 *
 * Handles campaign creation, scheduling, and execution with:
 * - Rate limiting (Meta's messaging limits)
 * - Audience segmentation
 * - Template-based messaging
 * - Delivery tracking
 * - Revenue attribution
 */
@Injectable()
export class WhatsAppBulkMessagingService {
  private readonly logger = new Logger(WhatsAppBulkMessagingService.name);

  // Rate limiting constants (Meta's limits)
  private readonly MESSAGES_PER_SECOND = 80; // High quality accounts
  private readonly MESSAGES_PER_DAY = 100000; // Marketing messages

  constructor(
    private prisma: PrismaService,
    private cloudApiService: WhatsAppCloudApiService,
    private templateService: WhatsAppTemplateService,
    private eventBus: EventBusService,
  ) {}

  /**
   * Create a new bulk campaign
   */
  async createCampaign(
    accountId: string,
    data: CreateCampaignDto,
  ): Promise<WhatsAppBulkCampaign> {
    const account = await this.cloudApiService.getAccount(accountId);
    if (!account) {
      throw new NotFoundException('WhatsApp account not found');
    }

    // Verify template exists and is approved
    const template = await this.templateService.getTemplate(data.templateId);
    if (template.status !== 'APPROVED') {
      throw new BadRequestException('Template must be approved before use');
    }

    // Get audience size
    const audienceSize = await this.getAudienceSize(
      account.tenantId,
      data.audienceSegmentId,
    );

    const campaign = await this.prisma.whatsAppBulkCampaign.create({
      data: {
        accountId,
        tenantId: account.tenantId,
        name: data.name,
        description: data.description,
        templateName: template.name,
        templateLanguage: template.language,
        audienceSegmentId: data.audienceSegmentId,
        totalRecipients: audienceSize,
        scheduledAt: data.scheduledAt,
        status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    return campaign;
  }

  /**
   * Get all campaigns for an account
   */
  async getCampaigns(
    accountId: string,
    filters?: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ campaigns: WhatsAppBulkCampaign[]; total: number }> {
    const where: any = {
      accountId,
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      this.prisma.whatsAppBulkCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.whatsAppBulkCampaign.count({ where }),
    ]);

    return { campaigns, total };
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(campaignId: string): Promise<WhatsAppBulkCampaign> {
    const campaign = await this.prisma.whatsAppBulkCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.deletedAt) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  /**
   * Start a campaign (immediate or scheduled)
   */
  async startCampaign(campaignId: string): Promise<WhatsAppBulkCampaign> {
    const campaign = await this.getCampaign(campaignId);

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      throw new BadRequestException('Campaign cannot be started');
    }

    // Update status to running
    const updatedCampaign = await this.prisma.whatsAppBulkCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    // Start sending messages asynchronously
    this.executeCampaign(campaignId).catch((error) => {
      this.logger.error(`Campaign execution failed: ${error.message}`);
    });

    return updatedCampaign;
  }

  /**
   * Pause a running campaign
   */
  async pauseCampaign(campaignId: string): Promise<WhatsAppBulkCampaign> {
    const campaign = await this.getCampaign(campaignId);

    if (campaign.status !== 'RUNNING') {
      throw new BadRequestException('Campaign is not running');
    }

    return this.prisma.whatsAppBulkCampaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' },
    });
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<WhatsAppBulkCampaign> {
    const campaign = await this.getCampaign(campaignId);

    if (campaign.status !== 'PAUSED') {
      throw new BadRequestException('Campaign is not paused');
    }

    return this.prisma.whatsAppBulkCampaign.update({
      where: { id: campaignId },
      data: { status: 'RUNNING' },
    });
  }

  /**
   * Execute campaign (send messages to all recipients)
   */
  private async executeCampaign(campaignId: string): Promise<void> {
    const campaign = await this.getCampaign(campaignId);
    const account = await this.cloudApiService.getAccount(campaign.accountId);

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    try {
      // Get recipients from audience segment
      const recipients = await this.getRecipients(
        campaign.tenantId,
        campaign.audienceSegmentId,
      );

      let sentCount = 0;
      let failedCount = 0;

      // Send messages with rate limiting
      for (const recipient of recipients) {
        // Check if campaign is still running
        const currentCampaign = await this.getCampaign(campaignId);
        if (currentCampaign.status !== 'RUNNING') {
          this.logger.log(`Campaign ${campaignId} paused/stopped`);
          break;
        }

        try {
          // Send template message
          const result = await this.cloudApiService.sendTemplateMessage(
            campaign.accountId,
            recipient.phoneNumber,
            campaign.templateName,
            campaign.templateLanguage,
            recipient.parameters,
          );

          if (result.success) {
            sentCount++;

            // Store message record
            await this.prisma.whatsAppMessage.create({
              data: {
                accountId: campaign.accountId,
                tenantId: campaign.tenantId,
                platformMessageId: result.messageId,
                direction: 'OUTBOUND',
                type: 'TEMPLATE',
                status: 'SENT',
                from: account.phoneNumberId,
                to: recipient.phoneNumber,
                templateName: campaign.templateName,
                templateParams: recipient.parameters,
                sentAt: new Date(),
              },
            });
          } else {
            failedCount++;
            this.logger.warn(`Failed to send to ${recipient.phoneNumber}: ${result.error}`);
          }

          // Rate limiting
          await this.rateLimitDelay();

          // Update campaign stats
          await this.prisma.whatsAppBulkCampaign.update({
            where: { id: campaignId },
            data: {
              sentCount,
              failedCount,
            },
          });
        } catch (error) {
          failedCount++;
          this.logger.error(`Error sending to ${recipient.phoneNumber}: ${(error as Error).message}`);
        }
      }

      // Complete campaign
      await this.prisma.whatsAppBulkCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          sentCount,
          failedCount,
        },
      });

      this.logger.log(`Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`);
    } catch (error) {
      await this.prisma.whatsAppBulkCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'FAILED',
          error: (error as Error).message,
        },
      });
      throw error;
    }
  }

  /**
   * Get audience size for a segment
   */
  private async getAudienceSize(
    tenantId: string,
    segmentId?: string | null,
  ): Promise<number> {
    if (!segmentId) {
      // Count all customers with phone numbers
      return this.prisma.customer.count({
        where: {
          tenantId,
          phone: { not: null },
          deletedAt: null,
        },
      });
    }

    // TODO: Implement segment-specific counting
    return this.prisma.customer.count({
      where: {
        tenantId,
        phone: { not: null },
        deletedAt: null,
      },
    });
  }

  /**
   * Get recipients for a campaign
   */
  private async getRecipients(
    tenantId: string,
    segmentId?: string | null,
  ): Promise<Array<{ phoneNumber: string; parameters?: Array<{ type: string; text: string }> }>> {
    // Get customers with phone numbers
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId,
        phone: { not: null },
        deletedAt: null,
      },
      select: {
        phone: true,
        name: true,
      },
    });

    return customers
      .filter((c: any) => c.phone)
      .map((c: any) => ({
        phoneNumber: c.phone!,
        parameters: c.name
          ? [{ type: 'text' as const, text: c.name }]
          : undefined,
      }));
  }

  /**
   * Rate limiting delay (80 messages per second for high quality)
   */
  private async rateLimitDelay(): Promise<void> {
    const delayMs = Math.ceil(1000 / this.MESSAGES_PER_SECOND);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  /**
   * Delete a campaign (soft delete)
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    const campaign = await this.getCampaign(campaignId);

    if (campaign.status === 'RUNNING') {
      throw new BadRequestException('Cannot delete a running campaign');
    }

    await this.prisma.whatsAppBulkCampaign.update({
      where: { id: campaignId },
      data: { deletedAt: new Date() },
    });
  }
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  templateId: string;
  audienceSegmentId?: string;
  scheduledAt?: Date;
}
