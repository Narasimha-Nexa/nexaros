import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/create-testimonial.dto';

@Injectable()
export class TestimonialsService {
  private readonly logger = new Logger(TestimonialsService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.testimonial.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.prisma.testimonial.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Testimonial not found');
    return item;
  }

  async create(tenantId: string, dto: CreateTestimonialDto) {
    const item = await this.prisma.testimonial.create({
      data: {
        tenantId,
        customerName: dto.customerName,
        text: dto.text || '',
        rating: dto.rating ?? 5,
        avatar: dto.avatar,
        isFeatured: dto.isFeatured ?? false,
        isVerified: dto.isVerified ?? false,
        branchId: dto.branchId,
      },
    });
    await this.afterMutation(tenantId, 'testimonial:created', { testimonialId: item.id });
    return item;
  }

  async update(tenantId: string, id: string, dto: UpdateTestimonialDto) {
    await this.findOne(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.customerName !== undefined) data.customerName = dto.customerName;
    if (dto.text !== undefined) data.text = dto.text;
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.avatar !== undefined) data.avatar = dto.avatar;
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured;
    if (dto.isVerified !== undefined) data.isVerified = dto.isVerified;
    if (dto.branchId !== undefined) data.branchId = dto.branchId;

    const item = await this.prisma.testimonial.update({ where: { id }, data });
    await this.afterMutation(tenantId, 'testimonial:updated', { testimonialId: item.id });
    return item;
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.testimonial.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.afterMutation(tenantId, 'testimonial:deleted', { testimonialId: id });
    return { success: true, id };
  }

  private async afterMutation(tenantId: string, event: string, payload: Record<string, unknown>) {
    try {
      this.eventBus.emitToTenant(tenantId, event, payload);
      this.eventBus.emitToTenantPublicBySlug('', event, payload);
    } catch {}
  }
}
