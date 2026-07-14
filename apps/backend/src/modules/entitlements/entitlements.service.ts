import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EntitlementsService {
  constructor(private prisma: PrismaService) {}

  async getModuleKeys() {
    return [
      { key: 'pos', name: 'Point of Sale', description: 'POS terminal for order taking' },
      { key: 'kitchen', name: 'Kitchen Display', description: 'Kitchen order management' },
      { key: 'orders', name: 'Order Management', description: 'Full order lifecycle' },
      { key: 'tables', name: 'Table Management', description: 'Table tracking and reservations' },
      { key: 'inventory', name: 'Inventory', description: 'Stock and inventory tracking' },
      { key: 'staff', name: 'Staff Management', description: 'Employee profiles and scheduling' },
      { key: 'shifts', name: 'Shift Management', description: 'Shift scheduling and tracking' },
      { key: 'attendance', name: 'Attendance', description: 'Staff attendance tracking' },
      { key: 'payments', name: 'Payments', description: 'Payment processing' },
      { key: 'invoices', name: 'Invoices', description: 'GST invoicing and billing' },
      { key: 'reports', name: 'Reports', description: 'Analytics and reporting' },
      { key: 'ai_analytics', name: 'AI Analytics', description: 'AI-powered insights' },
      { key: 'crm', name: 'CRM', description: 'Customer relationship management' },
      { key: 'loyalty', name: 'Loyalty', description: 'Customer loyalty program' },
      { key: 'qr_ordering', name: 'QR Ordering', description: 'QR code based ordering' },
      { key: 'customer_website', name: 'Customer Website', description: 'Public website for customers' },
      { key: 'reservations', name: 'Reservations', description: 'Table reservation system' },
      { key: 'multi_branch', name: 'Multi-Branch', description: 'Multiple branch management' },
      { key: 'api_access', name: 'API Access', description: 'External API integration' },
      { key: 'white_label', name: 'White Label', description: 'White label branding' },
      { key: 'priority_support', name: 'Priority Support', description: 'Priority customer support' },
    ];
  }

  async getPlans() {
    return this.prisma.platformPlan.findMany({
      where: { isActive: true },
      include: { entitlements: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPlan(slug: string) {
    const plan = await this.prisma.platformPlan.findUnique({
      where: { slug },
      include: { entitlements: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(data: {
    name: string;
    slug: string;
    description?: string;
    price: number;
    billingCycle?: string;
    trialDays?: number;
    maxBranches?: number;
    maxStaff?: number;
    isCustom?: boolean;
    entitlements: Record<string, boolean>;
  }) {
    return this.prisma.platformPlan.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        billingCycle: (data.billingCycle as any) || 'MONTHLY',
        trialDays: data.trialDays ?? 14,
        maxBranches: data.maxBranches ?? 1,
        maxStaff: data.maxStaff ?? 10,
        isCustom: data.isCustom ?? false,
        entitlements: {
          createMany: {
            data: Object.entries(data.entitlements).map(([moduleKey, enabled]) => ({
              moduleKey,
              enabled,
            })),
          },
        },
      },
      include: { entitlements: true },
    });
  }

  async updatePlanEntitlements(planId: string, entitlements: Record<string, boolean>) {
    await this.prisma.planEntitlement.deleteMany({ where: { planId } });
    await this.prisma.planEntitlement.createMany({
      data: Object.entries(entitlements).map(([moduleKey, enabled]) => ({
        planId,
        moduleKey,
        enabled,
      })),
    });
    return this.prisma.platformPlan.findUnique({
      where: { id: planId },
      include: { entitlements: true },
    });
  }

  async setCustomEntitlements(tenantId: string, entitlements: Record<string, boolean>) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) throw new NotFoundException('No subscription found');

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { entitlements },
    });
  }

  // Feature flags
  async getFeatureFlags() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async toggleFeatureFlag(key: string, enabled: boolean) {
    return this.prisma.featureFlag.upsert({
      where: { key },
      create: { key, name: key, enabled },
      update: { enabled },
    });
  }

  async setTenantFeatureFlag(tenantId: string, featureFlagKey: string, enabled: boolean) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key: featureFlagKey } });
    if (!flag) throw new NotFoundException('Feature flag not found');

    return this.prisma.tenantFeatureFlag.upsert({
      where: { tenantId_featureFlagId: { tenantId, featureFlagId: flag.id } },
      create: { tenantId, featureFlagId: flag.id, enabled },
      update: { enabled },
    });
  }

  async getTenantFeatureFlags(tenantId: string) {
    const flags = await this.prisma.featureFlag.findMany({ where: { enabled: true } });
    const tenantFlags = await this.prisma.tenantFeatureFlag.findMany({ where: { tenantId } });

    const tenantMap = new Map(tenantFlags.map((tf) => [tf.featureFlagId, tf.enabled]));

    return flags.map((f) => ({
      key: f.key,
      name: f.name,
      enabled: tenantMap.get(f.id) ?? f.enabled,
    }));
  }
}
