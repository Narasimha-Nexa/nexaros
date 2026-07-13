import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.plan.findMany({
      where: { tenantId },
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id, tenantId },
      include: { subscriptions: { include: { tenant: { select: { name: true } } } } },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(tenantId: string, dto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        tenantId,
        name: dto.name,
        price: dto.price,
        billingCycle: (dto.billingCycle as any) || 'MONTHLY',
        maxBranches: dto.maxBranches || 1,
        maxStaff: dto.maxStaff || 10,
        features: dto.features || [],
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdatePlanDto) {
    await this.findOne(id, tenantId);
    return this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.billingCycle && { billingCycle: dto.billingCycle as any }),
        ...(dto.maxBranches !== undefined && { maxBranches: dto.maxBranches }),
        ...(dto.maxStaff !== undefined && { maxStaff: dto.maxStaff }),
        ...(dto.features && { features: dto.features }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.plan.delete({ where: { id } });
  }
}
