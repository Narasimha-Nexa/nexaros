import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { CreateEventDto, UpdateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async findAll(tenantId: string, status?: string) {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };
    if (status) where.status = status;
    return this.prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.prisma.event.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Event not found');
    return item;
  }

  async create(tenantId: string, dto: CreateEventDto) {
    const item = await this.prisma.event.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        image: dto.image,
        location: dto.location,
        isVirtual: dto.isVirtual ?? false,
        status: dto.status ?? 'UPCOMING',
      },
    });
    await this.afterMutation(tenantId, 'event:created', { eventId: item.id });
    return item;
  }

  async update(tenantId: string, id: string, dto: UpdateEventDto) {
    await this.findOne(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.isVirtual !== undefined) data.isVirtual = dto.isVirtual;
    if (dto.status !== undefined) data.status = dto.status;

    const item = await this.prisma.event.update({ where: { id }, data });
    await this.afterMutation(tenantId, 'event:updated', { eventId: item.id });
    return item;
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.afterMutation(tenantId, 'event:deleted', { eventId: id });
    return { success: true, id };
  }

  private async afterMutation(tenantId: string, event: string, payload: Record<string, unknown>) {
    try {
      this.eventBus.emitToTenant(tenantId, event, payload);
      this.eventBus.emitToTenantPublicBySlug('', event, payload);
    } catch {}
  }
}
