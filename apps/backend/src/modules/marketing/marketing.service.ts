import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { CampaignFilterDto } from './dto/campaign-filter.dto';

@Injectable()
export class MarketingService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  // ── CAMPAIGNS ──

  async findAllCampaigns(tenantId: string, filter?: CampaignFilterDto) {
    const where: any = { tenantId };
    if (filter?.status) where.status = filter.status;
    if (filter?.type) where.type = filter.type;

    return this.prisma.campaign.findMany({
      where,
      include: { template: { select: { id: true, name: true, subject: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCampaign(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { template: { select: { id: true, name: true, subject: true, body: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async createCampaign(tenantId: string, dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        type: dto.type as any,
        channel: dto.channel as any,
        templateId: dto.templateId,
        scheduleAt: dto.scheduleAt ? new Date(dto.scheduleAt) : null,
        audienceIds: dto.audienceIds ? JSON.stringify(dto.audienceIds) : null,
        audienceFilter: dto.audienceFilter || undefined,
      },
      include: { template: { select: { id: true, name: true } } },
    });
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto) {
    await this.findCampaign(id);
    const data: any = { ...dto };
    if (dto.scheduleAt) data.scheduleAt = new Date(dto.scheduleAt);
    if (dto.audienceIds) data.audienceIds = JSON.stringify(dto.audienceIds);
    return this.prisma.campaign.update({
      where: { id },
      data,
      include: { template: { select: { id: true, name: true } } },
    });
  }

  async launchCampaign(id: string) {
    const campaign = await this.findCampaign(id);
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      throw new BadRequestException('Campaign can only be launched from DRAFT or SCHEDULED status');
    }

    const result = await this.prisma.campaign.update({
      where: { id },
      data: { status: 'SENDING', sentAt: new Date() },
    });

    this.eventBus.emitToTenant(campaign.tenantId, 'campaign:launched', { campaignId: id });
    return result;
  }

  async cancelCampaign(id: string) {
    const campaign = await this.findCampaign(id);
    if (campaign.status === 'SENT') {
      throw new BadRequestException('Cannot cancel a sent campaign');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async deleteCampaign(id: string) {
    await this.findCampaign(id);
    return this.prisma.campaign.delete({ where: { id } });
  }

  async getCampaignStats(tenantId: string) {
    const campaigns = await this.prisma.campaign.findMany({ where: { tenantId } });
    return {
      total: campaigns.length,
      sent: campaigns.filter(c => c.status === 'SENT').length,
      draft: campaigns.filter(c => c.status === 'DRAFT').length,
      scheduled: campaigns.filter(c => c.status === 'SCHEDULED').length,
      totalSent: campaigns.reduce((s, c) => s + c.sentCount, 0),
      totalOpens: campaigns.reduce((s, c) => s + c.openCount, 0),
      totalClicks: campaigns.reduce((s, c) => s + c.clickCount, 0),
    };
  }

  // ── EMAIL TEMPLATES ──

  async findAllTemplates(tenantId: string, category?: string) {
    const where: any = { tenantId };
    if (category) where.category = category;
    return this.prisma.emailTemplate.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findTemplate(id: string) {
    const template = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Email template not found');
    return template;
  }

  async createTemplate(tenantId: string, dto: CreateEmailTemplateDto) {
    return this.prisma.emailTemplate.create({
      data: { tenantId, ...dto, variables: dto.variables || undefined },
    });
  }

  async updateTemplate(id: string, dto: UpdateEmailTemplateDto) {
    await this.findTemplate(id);
    return this.prisma.emailTemplate.update({ where: { id }, data: dto as any });
  }

  async deleteTemplate(id: string) {
    await this.findTemplate(id);
    return this.prisma.emailTemplate.delete({ where: { id } });
  }

  // ── AUDIENCE SEGMENTS ──

  async findAllAudiences(tenantId: string) {
    return this.prisma.audienceSegment.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findAudience(id: string) {
    const audience = await this.prisma.audienceSegment.findUnique({ where: { id } });
    if (!audience) throw new NotFoundException('Audience segment not found');
    return audience;
  }

  async createAudience(tenantId: string, dto: CreateAudienceDto) {
    return this.prisma.audienceSegment.create({
      data: { tenantId, ...dto },
    });
  }

  async updateAudience(id: string, dto: UpdateAudienceDto) {
    await this.findAudience(id);
    return this.prisma.audienceSegment.update({ where: { id }, data: dto as any });
  }

  async deleteAudience(id: string) {
    await this.findAudience(id);
    return this.prisma.audienceSegment.delete({ where: { id } });
  }
}
