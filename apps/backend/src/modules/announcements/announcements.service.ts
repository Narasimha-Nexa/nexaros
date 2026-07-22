import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);
  private readonly CACHE_TTL = 120;

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private redis: RedisService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.announcement.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ isPinned: 'desc' }, { priority: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async create(tenantId: string, dto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: {
        tenantId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        priority: dto.priority ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isPinned: dto.isPinned ?? false,
        isActive: dto.isActive ?? true,
        displayOrder: dto.displayOrder ?? 0,
        branchId: dto.branchId,
      },
    });
    await this.afterMutation(tenantId, 'announcement:created', { announcementId: announcement.id });
    return announcement;
  }

  async update(tenantId: string, id: string, dto: UpdateAnnouncementDto) {
    await this.findOne(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.message !== undefined) data.message = dto.message;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.startDate !== undefined) data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.isPinned !== undefined) data.isPinned = dto.isPinned;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    if (dto.branchId !== undefined) data.branchId = dto.branchId;

    const announcement = await this.prisma.announcement.update({ where: { id }, data });
    await this.afterMutation(tenantId, 'announcement:updated', { announcementId: announcement.id });
    return announcement;
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    await this.afterMutation(tenantId, 'announcement:deleted', { announcementId: id });
    return { success: true, id };
  }

  async getPublicBySlug(slug: string) {
    const cacheKey = `public:announcements:${slug}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug, isActive: true },
      select: { id: true, slug: true },
    });
    if (!tenant) throw new NotFoundException('Restaurant not found');

    const now = new Date();
    const announcements = await this.prisma.announcement.findMany({
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
      orderBy: [{ isPinned: 'desc' }, { priority: 'desc' }, { displayOrder: 'asc' }],
    });

    const result = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      type: a.type,
      priority: a.priority,
      isPinned: a.isPinned,
      startDate: a.startDate,
      endDate: a.endDate,
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
        await this.redis.delPattern(`public:announcements:${tenant.slug}*`);
      }
    } catch (e) {
      this.logger.warn(`Failed to emit/cache-bust announcement event: ${e?.message}`);
    }
  }
}
