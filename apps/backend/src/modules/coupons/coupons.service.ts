import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: {
    code: string;
    description?: string;
    type: 'FIXED_AMOUNT' | 'PERCENTAGE';
    value: number;
    maxDiscount?: number;
    minPlanPrice?: number;
    expiry: string;
    maxTotalUses?: number;
    maxUsesPerUser?: number;
    applicablePlans?: string[];
    festivalTag?: string;
  }) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) throw new ConflictException('Coupon code already exists');

    return this.prisma.coupon.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
        expiry: new Date(data.expiry),
        maxUsesPerUser: data.maxUsesPerUser ?? 1,
      },
    });
  }

  async validate(code: string, tenantId: string, planSlug?: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (!coupon.isActive) throw new BadRequestException('Coupon is inactive');
    if (coupon.expiry < new Date()) throw new BadRequestException('Coupon has expired');

    if (coupon.maxTotalUses) {
      const usageCount = await this.prisma.couponUsage.count({ where: { couponId: coupon.id } });
      if (usageCount >= coupon.maxTotalUses) throw new BadRequestException('Coupon usage limit reached');
    }

    if (planSlug && coupon.applicablePlans.length > 0) {
      if (!coupon.applicablePlans.includes(planSlug)) {
        throw new BadRequestException('Coupon not applicable to this plan');
      }
    }

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount,
      festivalTag: coupon.festivalTag,
    };
  }

  async apply(couponCode: string, tenantId: string, subscriptionId: string, amount: number) {
    const validation = await this.validate(couponCode, tenantId);

    const discount = validation.type === 'PERCENTAGE'
      ? Math.min(amount * Number(validation.value) / 100, Number(validation.maxDiscount || amount))
      : Math.min(Number(validation.value), amount);

    const coupon = await this.prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });

    await this.prisma.couponUsage.create({
      data: {
        couponId: coupon!.id,
        tenantId,
        subscriptionId,
        amount: discount,
      },
    });

    this.logger.log(`Coupon ${couponCode} applied for ${tenantId}: ₹${discount} discount`);
    return { discount, finalAmount: Math.max(amount - discount, 0) };
  }

  async findAll(page = 1, limit = 50, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { festivalTag: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.coupon.count({ where }),
    ]);
    return { coupons, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async update(id: string, data: Partial<{
    description: string;
    value: number;
    maxDiscount: number;
    expiry: string;
    maxTotalUses: number;
    isActive: boolean;
  }>) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...data,
        expiry: data.expiry ? new Date(data.expiry) : undefined,
      },
    });
  }

  async getUsageStats(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: { usages: { select: { id: true, amount: true, tenantId: true, usedAt: true } } },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');

    const totalUsed = coupon.usages.length;
    const totalDiscount = coupon.usages.reduce((sum, u) => sum + Number(u.amount), 0);

    return {
      coupon: { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value },
      stats: { totalUsed, totalDiscount, maxTotalUses: coupon.maxTotalUses },
      recentUsages: coupon.usages.slice(0, 10),
    };
  }

  async createFestivalCampaign(name: string, discountPercent: number, expiry: string, maxUses: number) {
    const tags: Record<string, string> = {
      pongal: 'Pongal 2026', diwali: 'Diwali 2026', ugadi: 'Ugadi 2026',
      holi: 'Holi 2026', christmas: 'Christmas 2026', ramadan: 'Ramadan 2026',
    };
    const tag = tags[name.toLowerCase()] || name;

    return this.create({
      code: `${name.toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      description: `${tag} Special - ${discountPercent}% off`,
      type: 'PERCENTAGE',
      value: discountPercent,
      maxDiscount: 5000,
      expiry,
      maxTotalUses: maxUses,
      maxUsesPerUser: 1,
      festivalTag: tag,
    });
  }
}
