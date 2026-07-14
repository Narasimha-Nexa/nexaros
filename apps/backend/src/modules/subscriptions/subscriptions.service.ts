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
      include: { plan: { select: { id: true, name: true, slug: true, price: true, billingCycle: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, tenantId },
      include: { plan: true, payments: true, invoices: true },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }

  async getActive(tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIAL', 'PAYMENT_PENDING', 'GRACE_PERIOD'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateSubscriptionDto) {
    const plan = await this.prisma.platformPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new BadRequestException('Plan not found');

    const entitlements: Record<string, boolean> = {};
    const planEntitlements = await this.prisma.planEntitlement.findMany({
      where: { planId: dto.planId },
    });
    for (const e of planEntitlements) {
      entitlements[e.moduleKey] = e.enabled;
    }

    return this.prisma.subscription.create({
      data: {
        tenantId,
        planId: dto.planId,
        status: 'TRIAL',
        entitlements,
        trialStartedAt: new Date(),
        trialEndsAt: new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000),
      },
      include: { plan: { select: { id: true, name: true, slug: true, price: true } } },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateSubscriptionDto) {
    await this.findOne(id, tenantId);
    return this.prisma.subscription.update({
      where: { id },
      data: {
        ...(dto.planId && { planId: dto.planId }),
        ...(dto.status && { status: dto.status as any }),
      },
      include: { plan: { select: { id: true, name: true, slug: true, price: true } } },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.subscription.delete({ where: { id } });
  }
}
