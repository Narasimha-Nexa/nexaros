import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/create-offer.dto';

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);
  private readonly CACHE_TTL = 120;

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private redis: RedisService,
  ) {}

  // ─── Owner (tenant-scoped) CRUD ───

  async findAll(tenantId: string) {
    return this.prisma.offer.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const offer = await this.prisma.offer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async create(tenantId: string, dto: CreateOfferDto) {
    const offer = await this.prisma.offer.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        image: dto.image,
        discountType: dto.discountType,
        discountValue: dto.discountValue ?? 0,
        couponCode: dto.couponCode,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: dto.isActive ?? true,
        displayOrder: dto.displayOrder ?? 0,
        branchId: dto.branchId,
      },
    });
    await this.afterMutation(tenantId, 'offer:created', { offerId: offer.id });
    return offer;
  }

  async update(tenantId: string, id: string, dto: UpdateOfferDto) {
    await this.findOne(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.discountType !== undefined) data.discountType = dto.discountType;
    if (dto.discountValue !== undefined) data.discountValue = dto.discountValue;
    if (dto.couponCode !== undefined) data.couponCode = dto.couponCode;
    if (dto.startDate !== undefined) data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    if (dto.branchId !== undefined) data.branchId = dto.branchId;

    const offer = await this.prisma.offer.update({ where: { id }, data });
    await this.afterMutation(tenantId, 'offer:updated', { offerId: offer.id });
    return offer;
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    const offer = await this.prisma.offer.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    await this.afterMutation(tenantId, 'offer:deleted', { offerId: id });
    return { success: true, id };
  }

  // ─── Public read (by slug) ───

  async getPublicBySlug(slug: string) {
    const cacheKey = `public:offers:${slug}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug, isActive: true },
      select: { id: true, slug: true },
    });
    if (!tenant) throw new NotFoundException('Restaurant not found');

    const now = new Date();
    const offers = await this.prisma.offer.findMany({
      where: {
        tenantId: tenant.id,
        deletedAt: null,
        isActive: true,
        status: 'ACTIVE',
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    const result = offers.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      image: o.image,
      discountType: o.discountType,
      discountValue: Number(o.discountValue),
      code: o.couponCode,
      couponCode: o.couponCode,
      startDate: o.startDate,
      endDate: o.endDate,
    }));

    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  // ─── Helpers ───

  private async afterMutation(tenantId: string, event: string, payload: Record<string, unknown>) {
    this.eventBus.emitToTenant(tenantId, event, payload);
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { slug: true },
      });
      if (tenant?.slug) {
        this.eventBus.emitToTenantPublicBySlug(tenant.slug, event, payload);
        await this.redis.delPattern(`public:offers:${tenant.slug}*`);
      }
    } catch (e) {
      this.logger.warn(`Failed to emit/cache-bust offer event: ${e?.message}`);
    }
  }
}
