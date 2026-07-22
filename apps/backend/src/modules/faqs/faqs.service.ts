import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/create-faq.dto';

@Injectable()
export class FaqsService {
  private readonly logger = new Logger(FaqsService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.faq.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.prisma.faq.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('FAQ not found');
    return item;
  }

  async create(tenantId: string, dto: CreateFaqDto) {
    const item = await this.prisma.faq.create({
      data: {
        tenantId,
        question: dto.question,
        answer: dto.answer,
        category: dto.category,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.afterMutation(tenantId, 'faq:created', { faqId: item.id });
    return item;
  }

  async update(tenantId: string, id: string, dto: UpdateFaqDto) {
    await this.findOne(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.question !== undefined) data.question = dto.question;
    if (dto.answer !== undefined) data.answer = dto.answer;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const item = await this.prisma.faq.update({ where: { id }, data });
    await this.afterMutation(tenantId, 'faq:updated', { faqId: item.id });
    return item;
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.faq.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.afterMutation(tenantId, 'faq:deleted', { faqId: id });
    return { success: true, id };
  }

  private async afterMutation(tenantId: string, event: string, payload: Record<string, unknown>) {
    try {
      this.eventBus.emitToTenant(tenantId, event, payload);
      this.eventBus.emitToTenantPublicBySlug('', event, payload);
    } catch {}
  }
}
