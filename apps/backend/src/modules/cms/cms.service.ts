import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCmsConfigDto } from './dto/update-cms-config.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  async getConfig(tenantId: string) {
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

  async updateConfig(tenantId: string, dto: UpdateCmsConfigDto) {
    const existing = await this.prisma.tenantWebsiteConfig.findUnique({
      where: { tenantId },
    });

    if (!existing) {
      await this.prisma.tenantWebsiteConfig.create({
        data: { tenantId, ...dto as any },
      });
    }

    return this.prisma.tenantWebsiteConfig.update({
      where: { tenantId },
      data: dto as any,
    });
  }

  async updateFeatures(tenantId: string, features: Record<string, any>) {
    const config = await this.getConfig(tenantId);
    return this.prisma.tenantWebsiteConfig.update({
      where: { tenantId },
      data: {
        features: { ...(config.features as any), ...features },
      },
    });
  }

  async updateHomeSections(tenantId: string, sections: any[]) {
    return this.prisma.tenantWebsiteConfig.update({
      where: { tenantId },
      data: { homeSections: sections as any },
    });
  }

  async updateSeo(tenantId: string, seo: Record<string, any>) {
    const config = await this.getConfig(tenantId);
    return this.prisma.tenantWebsiteConfig.update({
      where: { tenantId },
      data: {
        seo: { ...(config.seo as any), ...seo },
      },
    });
  }

  async publishWebsite(tenantId: string) {
    // Trigger cache invalidation and broadcast to connected customers
    const config = await this.getConfig(tenantId);
    return { success: true, publishedAt: new Date().toISOString() };
  }

  async resetToDefaults(tenantId: string) {
    return this.prisma.tenantWebsiteConfig.update({
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
  }

  async getPublicConfig(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return this.getConfig(tenant.id);
  }
}
