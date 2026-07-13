import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.subscription.findMany({
      where: { tenantId },
      include: { plan: { select: { id: true, name: true, price: true, billingCycle: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, tenantId },
      include: { plan: true },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }

  async getActive(tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateSubscriptionDto) {
    // Verify plan exists
    const plan = await this.prisma.plan.findFirst({
      where: { id: dto.planId, tenantId },
    });
    if (!plan) throw new BadRequestException('Plan not found for this tenant');

    return this.prisma.subscription.create({
      data: {
        tenantId,
        planId: dto.planId,
        status: (dto.status as any) || 'ACTIVE',
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        razorpayId: dto.razorpayId,
      },
      include: { plan: { select: { id: true, name: true, price: true } } },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateSubscriptionDto) {
    await this.findOne(id, tenantId);
    return this.prisma.subscription.update({
      where: { id },
      data: {
        ...(dto.planId && { planId: dto.planId }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.razorpayId && { razorpayId: dto.razorpayId }),
      },
      include: { plan: { select: { id: true, name: true, price: true } } },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.subscription.delete({ where: { id } });
  }
}
