import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreateGalleryImageDto, UpdateGalleryImageDto } from './dto/create-gallery-image.dto';

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);
  private readonly CACHE_TTL = 120;

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private redis: RedisService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.galleryImage.findMany({
      where: { tenantId, deletedAt: null, status: 'ACTIVE' },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const image = await this.prisma.galleryImage.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!image) throw new NotFoundException('Gallery image not found');
    return image;
  }

  async create(tenantId: string, dto: CreateGalleryImageDto) {
    const image = await this.prisma.galleryImage.create({
      data: {
        tenantId,
        imageUrl: dto.imageUrl,
        thumbnailUrl: dto.thumbnailUrl,
        caption: dto.caption,
        altText: dto.altText,
        displayOrder: dto.displayOrder ?? 0,
        isFeatured: dto.isFeatured ?? false,
        imageMetadata: dto.imageMetadata,
        branchId: dto.branchId,
      },
    });
    await this.afterMutation(tenantId, 'gallery:created', { imageId: image.id });
    return image;
  }

  async update(tenantId: string, id: string, dto: UpdateGalleryImageDto) {
    await this.findOne(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.thumbnailUrl !== undefined) data.thumbnailUrl = dto.thumbnailUrl;
    if (dto.caption !== undefined) data.caption = dto.caption;
    if (dto.altText !== undefined) data.altText = dto.altText;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured;
    if (dto.imageMetadata !== undefined) data.imageMetadata = dto.imageMetadata;
    if (dto.branchId !== undefined) data.branchId = dto.branchId;

    const image = await this.prisma.galleryImage.update({ where: { id }, data });
    await this.afterMutation(tenantId, 'gallery:updated', { imageId: image.id });
    return image;
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.galleryImage.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    await this.afterMutation(tenantId, 'gallery:deleted', { imageId: id });
    return { success: true, id };
  }

  async getPublicBySlug(slug: string) {
    const cacheKey = `public:gallery:${slug}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug, isActive: true },
      select: { id: true, slug: true },
    });
    if (!tenant) throw new NotFoundException('Restaurant not found');

    const images = await this.prisma.galleryImage.findMany({
      where: { tenantId: tenant.id, deletedAt: null, status: 'ACTIVE' },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    const result = images.map((g) => ({
      id: g.id,
      url: g.imageUrl,
      thumbnail: g.thumbnailUrl,
      caption: g.caption,
      alt: g.altText,
      isFeatured: g.isFeatured,
    }));

    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  private async afterMutation(tenantId: string, event: string, payload: Record<string, unknown>) {
    this.eventBus.emitToTenant(tenantId, event, payload);
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { slug: true },
      });
      if (tenant?.slug) {
        this.eventBus.emitToTenantPublicBySlug(tenant.slug, event, payload);
        await this.redis.delPattern(`public:gallery:${tenant.slug}*`);
      }
    } catch (e) {
      this.logger.warn(`Failed to emit/cache-bust gallery event: ${e?.message}`);
    }
  }
}
