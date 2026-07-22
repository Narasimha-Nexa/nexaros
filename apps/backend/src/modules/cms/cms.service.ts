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
    await this.afterMutation(tenantId, 'website:published', { config }, audit);
    return { success: true, publishedAt: new Date().toISOString() };
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
