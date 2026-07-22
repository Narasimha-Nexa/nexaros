import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RedisService } from '../../common/redis/redis.service';
import { AdminService } from '../admin/admin.service';
import { UpdateCmsConfigDto } from './dto/update-cms-config.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private redis: RedisService,
    private adminService: AdminService,
  ) {}

  async getConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);

    let config = await this.prisma.tenantWebsiteConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await this.prisma.tenantWebsiteConfig.create({
        data: { tenantId },
      });
    }

    return config;
  }

  async updateConfig(
    tenantId: string,
    dto: UpdateCmsConfigDto,
    audit?: { adminId?: string; actorRole?: string },
  ) {
    const existing = await this.prisma.tenantWebsiteConfig.findUnique({
      where: { tenantId },
    });

    if (!existing) {
      await this.prisma.tenantWebsiteConfig.create({
        data: { tenantId, ...(dto as any) },
      });
    }

    const updated = await this.prisma.tenantWebsiteConfig.update({
      where: { tenantId },
      data: dto as any,
    });

    await this.afterMutation(tenantId, 'website:updated', { config: updated }, audit);
    return updated;
  }

  async updateFeatures(tenantId: string, features: Record<string, any>, audit?: AuditCtx) {
    const config = await this.getConfig(tenantId);
    const updated = await this.prisma.tenantWebsiteConfig.update({
      where: { tenantId },
      data: {
        features: { ...(config.features as any), ...features },
      },
    });
    await this.afterMutation(tenantId, 'website:updated', { section: 'features' }, audit);
    return updated;
  }

  async updateHomeSections(tenantId: string, sections: any[], audit?: AuditCtx) {
    await this.getConfig(tenantId);
    const updated = await this.prisma.tenantWebsiteConfig.update({
      where: { tenantId },
      data: { homeSections: sections as any },
    });
    await this.afterMutation(tenantId, 'website:updated', { section: 'homeSections' }, audit);
    return updated;
  }

  async updateSeo(tenantId: string, seo: Record<string, any>, audit?: AuditCtx) {
    const config = await this.getConfig(tenantId);
    const updated = await this.prisma.tenantWebsiteConfig.update({
      where: { tenantId },
      data: {
        seo: { ...(config.seo as any), ...seo },
      },
    });
    await this.afterMutation(tenantId, 'website:updated', { section: 'seo' }, audit);
    return updated;
  }

  async publishWebsite(tenantId: string, audit?: AuditCtx) {
    const config = await this.getConfig(tenantId);
    const now = new Date();
    await this.prisma.tenantWebsiteConfig.update({
      where: { tenantId },
      data: { publishedAt: now, version: { increment: 1 } },
    });
    await this.afterMutation(tenantId, 'website:published', { config }, audit);
    return { success: true, publishedAt: now.toISOString() };
  }

  async saveRevision(tenantId: string, label?: string, audit?: AuditCtx) {
    const config = await this.getConfig(tenantId);
    const snapshot = {
      restaurantName: config.restaurantName,
      tagline: config.tagline,
      logo: config.logo,
      favicon: config.favicon,
      phone: config.phone,
      email: config.email,
      address: config.address,
      mapUrl: config.mapUrl,
      whatsappNumber: config.whatsappNumber,
      currency: config.currency,
      timezone: config.timezone,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      accentColor: config.accentColor,
      fontHeading: config.fontHeading,
      fontBody: config.fontBody,
      borderRadius: config.borderRadius,
      containerWidth: config.containerWidth,
      features: config.features,
      seo: config.seo,
      openingHours: config.openingHours,
      socialLinks: config.socialLinks,
      analytics: config.analytics,
      legalPages: config.legalPages,
      homeSections: config.homeSections,
    };
    const revision = await this.prisma.websiteRevision.create({
      data: {
        tenantId,
        configId: config.id,
        version: config.version,
        label: label || `Draft v${config.version}`,
        snapshot: snapshot as any,
        createdBy: audit?.adminId || null,
      },
    });
    return revision;
  }

  async listRevisions(tenantId: string) {
    return this.prisma.websiteRevision.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async revertToRevision(tenantId: string, revisionId: string, audit?: AuditCtx) {
    const revision = await this.prisma.websiteRevision.findFirst({
      where: { id: revisionId, tenantId },
    });
    if (!revision) throw new NotFoundException('Revision not found');

    const snapshot = revision.snapshot as any;
    const updated = await this.prisma.tenantWebsiteConfig.update({
      where: { tenantId },
      data: snapshot,
    });
    await this.afterMutation(tenantId, 'website:updated', { section: 'revert', revisionId }, audit);
    return updated;
  }

  async resetToDefaults(tenantId: string, audit?: AuditCtx) {
    const updated = await this.prisma.tenantWebsiteConfig.update({
      where: { tenantId },
      data: {
        primaryColor: '#2563eb',
        secondaryColor: '#171717',
        accentColor: '#f59e0b',
        fontHeading: 'Playfair Display',
        fontBody: 'Inter',
        borderRadius: 'xl',
        containerWidth: 'max-w-7xl',
        features: {},
        homeSections: [],
        seo: {},
        socialLinks: {},
        analytics: {},
      },
    });
    await this.afterMutation(tenantId, 'website:updated', { section: 'reset' }, audit);
    return updated;
  }

  /**
   * Single source of truth for post-mutation side effects:
   *  - Emit Socket.IO events to the tenant (owner/staff) and public (customers) rooms
   *  - Invalidate the public website cache
   *  - Write an admin audit log entry when an admin actor is provided
   */
  private async afterMutation(
    tenantId: string,
    event: string,
    payload: Record<string, unknown>,
    audit?: AuditCtx,
  ) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, slug: true, subdomain: true },
      });
      if (!tenant) {
        this.logger.warn(`afterMutation: tenant ${tenantId} not found — skipping emit/cache-bust`);
        return;
      }
      this.eventBus.emitToTenantPublicBySlug(tenant.slug, event, payload);
      this.eventBus.emitToTenant(tenantId, event, payload);
      await this.redis.delPattern(`public:website:${tenant.slug}*`);
      await this.redis.delPattern(`public:website:subdomain:${tenant.slug}*`);
      await this.redis.delPattern(`public:tenant:${tenant.slug}*`);
      await this.redis.delPattern(`public:tenant:subdomain:${tenant.slug}*`);
      await this.redis.delPattern(`public:menu:${tenant.slug}*`);
      // Subdomain resolution cache (getTenantBySubdomain uses `public:subdomain:${subdomain}`)
      await this.redis.delPattern(`public:subdomain:${tenant.subdomain}*`);
      await this.redis.delPattern(`public:subdomain:${tenant.slug}*`);
      if (audit?.adminId) {
        await this.adminService.logAction(
          audit.adminId,
          event,
          'TenantWebsiteConfig',
          tenantId,
          undefined,
          { ...payload, actorRole: audit.actorRole },
        );
      }
    } catch (e) {
      this.logger.warn(`afterMutation failed for ${event}: ${e?.message}`);
    }
  }
}

interface AuditCtx {
  adminId?: string;
  actorRole?: string;
}
