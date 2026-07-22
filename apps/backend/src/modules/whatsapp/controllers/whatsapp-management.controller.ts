import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { WhatsAppTemplateService } from '../services/whatsapp-template.service';
import { WhatsAppBulkMessagingService } from '../services/whatsapp-bulk-messaging.service';
import { WhatsAppAutomationService } from '../services/whatsapp-automation.service';
import { WhatsAppAnalyticsService } from '../services/whatsapp-analytics.service';
import { WhatsAppCloudApiService } from '../services/whatsapp-cloud-api.service';
import {
  CreateWhatsAppTemplateDto,
  UpdateWhatsAppTemplateDto,
  CreateWhatsAppCampaignDto,
  CreateWhatsAppAutomationDto,
  SendWhatsAppMessageDto,
} from '../dto/whatsapp.dto';

/**
 * WhatsApp Management Controller
 *
 * Provides admin endpoints for managing WhatsApp Business features:
 * - Template management
 * - Campaign management
 * - Automation rules
 * - Analytics
 * - Account configuration
 */
@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppManagementController {
  constructor(
    private templateService: WhatsAppTemplateService,
    private bulkMessagingService: WhatsAppBulkMessagingService,
    private automationService: WhatsAppAutomationService,
    private analyticsService: WhatsAppAnalyticsService,
    private cloudApiService: WhatsAppCloudApiService,
  ) {}

  // ── Account Endpoints ──

  @Get('accounts')
  async getAccounts(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.cloudApiService.getAccountsByTenantId(tenantId);
  }

  @Get('accounts/:id')
  async getAccount(@Param('id') id: string) {
    return this.cloudApiService.getAccount(id);
  }

  // ── Template Endpoints ──

  @Get('templates')
  async getTemplates(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);
    return this.templateService.getTemplates(accountId, { status, category, search });
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.templateService.getTemplate(id);
  }

  @Post('templates')
  async createTemplate(
    @Req() req: any,
    @Body() dto: CreateWhatsAppTemplateDto,
  ) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);
    return this.templateService.createTemplate(accountId, dto);
  }

  @Put('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateWhatsAppTemplateDto,
  ) {
    return this.templateService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.templateService.deleteTemplate(id);
  }

  @Post('templates/sync')
  async syncTemplates(@Req() req: any) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);
    return this.templateService.syncTemplatesFromMeta(accountId);
  }

  // ── Campaign Endpoints ──

  @Get('campaigns')
  async getCampaigns(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);
    return this.bulkMessagingService.getCampaigns(accountId, { status, search, page, limit });
  }

  @Get('campaigns/:id')
  async getCampaign(@Param('id') id: string) {
    return this.bulkMessagingService.getCampaign(id);
  }

  @Post('campaigns')
  async createCampaign(
    @Req() req: any,
    @Body() dto: CreateWhatsAppCampaignDto,
  ) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);
    return this.bulkMessagingService.createCampaign(accountId, dto);
  }

  @Post('campaigns/:id/start')
  async startCampaign(@Param('id') id: string) {
    return this.bulkMessagingService.startCampaign(id);
  }

  @Post('campaigns/:id/pause')
  async pauseCampaign(@Param('id') id: string) {
    return this.bulkMessagingService.pauseCampaign(id);
  }

  @Post('campaigns/:id/resume')
  async resumeCampaign(@Param('id') id: string) {
    return this.bulkMessagingService.resumeCampaign(id);
  }

  @Delete('campaigns/:id')
  async deleteCampaign(@Param('id') id: string) {
    return this.bulkMessagingService.deleteCampaign(id);
  }

  // ── Automation Endpoints ──

  @Get('automations')
  async getAutomations(
    @Req() req: any,
    @Query('trigger') trigger?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);
    return this.automationService.getAutomations(accountId, { trigger, isActive });
  }

  @Get('automations/:id')
  async getAutomation(@Param('id') id: string) {
    return this.automationService.getAutomation(id);
  }

  @Post('automations')
  async createAutomation(
    @Req() req: any,
    @Body() dto: CreateWhatsAppAutomationDto,
  ) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);
    return this.automationService.createAutomation(accountId, dto);
  }

  @Put('automations/:id')
  async updateAutomation(
    @Param('id') id: string,
    @Body() dto: Partial<CreateWhatsAppAutomationDto>,
  ) {
    return this.automationService.updateAutomation(id, dto);
  }

  @Post('automations/:id/toggle')
  async toggleAutomation(@Param('id') id: string) {
    return this.automationService.toggleAutomation(id);
  }

  @Delete('automations/:id')
  async deleteAutomation(@Param('id') id: string) {
    return this.automationService.deleteAutomation(id);
  }

  // ── Analytics Endpoints ──

  @Get('analytics')
  async getAnalytics(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);
    return this.analyticsService.getAnalytics(
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('analytics/summary')
  async getSummaryMetrics(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);
    return this.analyticsService.getSummaryMetrics(
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('analytics/trend')
  async getDailyTrend(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);
    return this.analyticsService.getDailyTrend(
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('analytics/templates')
  async getTopTemplates(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: number,
  ) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);
    return this.analyticsService.getTopTemplates(
      accountId,
      new Date(startDate),
      new Date(endDate),
      limit,
    );
  }

  @Get('analytics/campaigns')
  async getCampaignPerformance(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);
    return this.analyticsService.getCampaignPerformance(
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  // ── Messaging Endpoints ──

  @Post('messages/send')
  async sendMessage(
    @Req() req: any,
    @Body() dto: SendWhatsAppMessageDto,
  ) {
    const accountId = await this.getDefaultAccountId(req.user.tenantId);

    if (dto.templateName) {
      return this.cloudApiService.sendTemplateMessage(
        accountId,
        dto.to,
        dto.templateName,
        dto.templateLanguage,
        dto.parameters,
      );
    }

    if (dto.text) {
      return this.cloudApiService.sendTextMessage(accountId, dto.to, dto.text);
    }

    if (dto.imageUrl) {
      return this.cloudApiService.sendImageMessage(
        accountId,
        dto.to,
        dto.imageUrl,
        dto.caption,
      );
    }

    throw new Error('Must provide text, templateName, or imageUrl');
  }

  // ── Helper Methods ──

  private async getDefaultAccountId(tenantId: string): Promise<string> {
    const account = await this.cloudApiService.getDefaultAccount(tenantId);
    if (!account) {
      throw new Error('No WhatsApp account configured');
    }
    return account.id;
  }
}
