import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async findAll(_tenantId?: string) {
    return this.prisma.platformPlan.findMany({
      include: { entitlements: true, _count: { select: { subscriptions: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.platformPlan.findUnique({
      where: { id },
      include: { entitlements: true, subscriptions: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(dto: CreatePlanDto) {
    return this.prisma.platformPlan.create({
      data: {
        name: dto.name,
        slug: dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        price: dto.price,
        billingCycle: (dto.billingCycle as any) || 'MONTHLY',
        maxBranches: dto.maxBranches || 1,
        maxStaff: dto.maxStaff || 10,
        trialDays: 14,
        entitlements: {
          createMany: {
            data: (dto.features || []).map((f) => ({
              moduleKey: f,
              enabled: true,
            })),
          },
        },
      },
      include: { entitlements: true },
    });
  }

  async update(id: string, dto: UpdatePlanDto) {
    await this.findOne(id);
    return this.prisma.platformPlan.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.billingCycle && { billingCycle: dto.billingCycle as any }),
        ...(dto.maxBranches !== undefined && { maxBranches: dto.maxBranches }),
        ...(dto.maxStaff !== undefined && { maxStaff: dto.maxStaff }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.platformPlan.delete({ where: { id } });
  }
}
