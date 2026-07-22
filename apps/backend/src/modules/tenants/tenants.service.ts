import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if a tenant with given email already exists for the same owner.
   * Used during provisioning to detect existing businesses.
   */
  async findByOwnerEmail(ownerProfileId: string, email: string) {
    return this.prisma.tenant.findFirst({
      where: { ownerProfileId, email, deletedAt: null },
      include: {
        branches: { where: { deletedAt: null }, select: { id: true, name: true, status: true } },
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
    country?: string;
    state?: string;
    city?: string;
    businessType?: string;
    sortBy?: string;
    sortDir?: string;
    ownerProfileId?: string;
  } = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      plan,
      country,
      state,
      city,
      businessType,
      sortBy = 'createdAt',
      sortDir = 'desc',
      ownerProfileId,
    } = params;

    const where: any = { deletedAt: null };

    if (ownerProfileId) where.ownerProfileId = ownerProfileId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
        { customDomain: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { brandName: { contains: search, mode: 'insensitive' } },
        { users: { some: { firstName: { contains: search, mode: 'insensitive' } } } },
        { users: { some: { email: { contains: search, mode: 'insensitive' } } } },
        { ownerProfile: { name: { contains: search, mode: 'insensitive' } } },
        { ownerProfile: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      if (status === 'active') where.status = 'ACTIVE';
      else if (status === 'inactive' || status === 'suspended') where.status = 'SUSPENDED';
      else if (status === 'archived') where.status = 'ARCHIVED';
      else where.status = status.toUpperCase();
    }

    if (country) where.country = country;
    if (state) where.state = state;
    if (city) where.city = city;
    if (businessType) where.businessType = businessType;

    if (plan) {
      where.subscriptions = { some: { plan: { slug: plan } } };
    }

    const orderBy: any = {};
    if (sortBy === 'name') orderBy.name = sortDir;
    else if (sortBy === 'city') orderBy.city = sortDir;
    else if (sortBy === 'createdAt') orderBy.createdAt = sortDir;
    else if (sortBy === 'updatedAt') orderBy.updatedAt = sortDir;
    else orderBy.createdAt = sortDir;

    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        include: {
          ownerProfile: {
            select: { id: true, name: true, email: true, phone: true, isActive: true },
          },
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          users: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
            where: { role: 'OWNER' },
            take: 1,
          },
          branches: {
            select: { id: true, status: true },
          },
          _count: {
            select: { users: true, branches: true, orders: true, staff: true },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    const enriched = tenants.map((t) => {
      const subscription = t.subscriptions[0] || null;
      const owner = t.users[0] || null;
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        subdomain: t.subdomain,
        customDomain: t.customDomain,
        email: t.email,
        phone: t.phone,
        logo: t.logo,
        address: t.address,
        city: t.city,
        state: t.state,
        country: t.country,
        gstNumber: t.gstNumber,
        panNumber: t.panNumber,
        legalName: t.legalName,
        brandName: t.brandName,
        fssaiNumber: t.fssaiNumber,
        businessType: t.businessType,
        timezone: t.timezone,
        currency: t.currency,
        isActive: t.isActive,
        status: t.status,
        onboardingStatus: t.onboardingStatus,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        owner: t.ownerProfile
          ? { id: t.ownerProfile.id, name: t.ownerProfile.name, email: t.ownerProfile.email }
          : (owner ? { id: owner.id, name: `${owner.firstName} ${owner.lastName}`.trim(), email: owner.email } : null),
        subscription: subscription ? {
          id: subscription.id,
          plan: subscription.plan?.name || null,
          planSlug: subscription.plan?.slug || null,
          status: subscription.status,
          trialEndsAt: subscription.trialEndsAt,
          currentPeriodEnd: subscription.currentPeriodEnd,
        } : null,
        branchCount: t._count.branches,
        userCount: t._count.users,
        orderCount: t._count.orders,
        staffCount: t._count.staff,
        activeBranches: t.branches.filter((b) => b.status === 'ACTIVE').length,
      };
    });

    return {
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
      include: {
        ownerProfile: {
          select: { id: true, name: true, email: true, phone: true, isActive: true },
        },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        users: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            role: true, isActive: true, createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        branches: {
          select: {
            id: true, name: true, displayName: true, code: true, branchType: true,
            address: true, city: true, state: true, phone: true, email: true,
            status: true, isPrimary: true, isActive: true, diningCapacity: true,
            createdAt: true,
          },
          orderBy: { isPrimary: 'desc' },
        },
        _count: {
          select: { users: true, branches: true, orders: true, staff: true },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const subscription = tenant.subscriptions[0] || null;
    return {
      ...tenant,
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan?.name || null,
        planSlug: subscription.plan?.slug || null,
        planPrice: subscription.plan?.price || 0,
        status: subscription.status,
        trialStartedAt: subscription.trialStartedAt,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        nextBillingDate: subscription.nextBillingDate,
      } : null,
    };
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findFirst({ where: { slug, deletedAt: null } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async listUsers(tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        role: true, isActive: true, lastLoginAt: true, createdAt: true,
        staff: {
          select: {
            id: true, name: true, status: true,
            branch: { select: { id: true, name: true } },
            role: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findFirst({ where: { id, deletedAt: null } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async hardDelete(id: string) {
    const tenant = await this.prisma.tenant.findFirst({ where: { id, deletedAt: null } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const tenantName = tenant.name;

    await this.prisma.$transaction([
      this.prisma.tenantSetting.deleteMany({ where: { tenantId: id } }),
      this.prisma.taxSetting.deleteMany({ where: { tenantId: id } }),
      this.prisma.membershipTier.deleteMany({ where: { tenantId: id } }),
      this.prisma.tenantFeatureFlag.deleteMany({ where: { tenantId: id } }),
      this.prisma.tenantWebsiteConfig.deleteMany({ where: { tenantId: id } }),
      this.prisma.restaurantTable.deleteMany({ where: { branch: { tenantId: id } } }),
      this.prisma.shift.deleteMany({ where: { branch: { tenantId: id } } }),
      this.prisma.staff.deleteMany({ where: { tenantId: id } }),
      this.prisma.auditLog.deleteMany({ where: { tenantId: id } }),
      this.prisma.user.deleteMany({ where: { tenantId: id } }),
      this.prisma.role.deleteMany({ where: { tenantId: id } }),
      this.prisma.branch.deleteMany({ where: { tenantId: id } }),
      this.prisma.subscription.deleteMany({ where: { tenantId: id } }),
      this.prisma.tenant.delete({ where: { id } }),
    ]);

    return { id, deleted: true, name: tenantName, hardDeleted: true };
  }

  async softDelete(id: string) {
    const tenant = await this.prisma.tenant.findFirst({ where: { id, deletedAt: null } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    await this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, status: 'DELETED' },
    });
    return { id, deleted: true, name: tenant.name };
  }

  async updateStatus(id: string, status: string) {
    const tenant = await this.prisma.tenant.findFirst({ where: { id, deletedAt: null } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const data: any = {};
    if (status === 'active') {
      data.status = 'ACTIVE';
      data.isActive = true;
    } else if (status === 'suspended' || status === 'inactive') {
      data.status = 'SUSPENDED';
      data.isActive = false;
    } else if (status === 'archived') {
      data.status = 'ARCHIVED';
      data.isActive = false;
      data.archivedAt = new Date();
    } else {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    return this.prisma.tenant.update({ where: { id }, data });
  }

  async suspend(id: string) { return this.updateStatus(id, 'suspended'); }
  async activate(id: string) { return this.updateStatus(id, 'active'); }
  async archive(id: string) { return this.updateStatus(id, 'archived'); }

  async restore(id: string) {
    const tenant = await this.prisma.tenant.findFirst({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return this.prisma.tenant.update({
      where: { id },
      data: { status: 'ACTIVE', isActive: true, archivedAt: null, deletedAt: null },
    });
  }

  async bulkAction(ids: string[], action: string) {
    if (!ids.length) throw new BadRequestException('No tenants selected');

    const where = { id: { in: ids }, deletedAt: null };

    switch (action) {
      case 'activate':
        await this.prisma.tenant.updateMany({ where, data: { status: 'ACTIVE', isActive: true } });
        return { affected: ids.length, action: 'activated' };
      case 'suspend':
      case 'deactivate':
        await this.prisma.tenant.updateMany({ where, data: { status: 'SUSPENDED', isActive: false } });
        return { affected: ids.length, action: 'suspended' };
      case 'archive':
        await this.prisma.tenant.updateMany({
          where, data: { status: 'ARCHIVED', isActive: false, archivedAt: new Date() },
        });
        return { affected: ids.length, action: 'archived' };
      case 'delete':
        await this.prisma.tenant.updateMany({
          where, data: { status: 'DELETED', isActive: false, deletedAt: new Date() },
        });
        return { affected: ids.length, action: 'deleted' };
      default:
        throw new BadRequestException(`Unknown bulk action: ${action}`);
    }
  }

  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalTenants, activeTenants, suspendedTenants, archivedTenants,
      createdToday, createdThisMonth, trialTenants, paidTenants,
      totalBranches, totalUsers, totalOrders, totalOwnerProfiles,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.tenant.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      this.prisma.tenant.count({ where: { deletedAt: null, status: 'ARCHIVED' } }),
      this.prisma.tenant.count({ where: { deletedAt: null, createdAt: { gte: today } } }),
      this.prisma.tenant.count({
        where: { deletedAt: null, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      }),
      this.prisma.subscription.count({ where: { status: 'TRIAL', tenant: { deletedAt: null } } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE', tenant: { deletedAt: null } } }),
      this.prisma.branch.count({ where: { tenant: { deletedAt: null } } }),
      this.prisma.user.count({ where: { tenant: { deletedAt: null } } }),
      this.prisma.order.count({ where: { tenant: { deletedAt: null } } }),
      this.prisma.ownerProfile.count({ where: { deletedAt: null } }),
    ]);

    const planGroups = await this.prisma.subscription.groupBy({
      by: ['planId'],
      where: { tenant: { deletedAt: null } },
      _count: true,
    });

    const planIds = planGroups.map((p) => p.planId);
    const planDetails = planIds.length > 0
      ? await this.prisma.platformPlan.findMany({
          where: { id: { in: planIds } },
          select: { id: true, name: true, slug: true, price: true },
        })
      : [];
    const planMap = new Map(planDetails.map((p) => [p.id, p]));

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      archivedTenants,
      inactiveTenants: suspendedTenants,
      createdToday,
      createdThisMonth,
      trialTenants,
      paidTenants,
      totalBranches,
      totalUsers,
      totalOrders,
      totalOwnerProfiles,
      planDistribution: planGroups.map((p) => {
        const plan = planMap.get(p.planId);
        return {
          plan: plan?.name || 'Unknown',
          slug: plan?.slug || 'unknown',
          count: p._count,
          price: plan?.price || 0,
        };
      }),
    };
  }

  async exportTenants(format: 'csv' | 'json', params: Record<string, string> = {}) {
    const result = await this.findAll({ ...params, page: 1, limit: 10000 });
    if (format === 'json') return result.data;

    const headers = [
      'ID', 'Name', 'Slug', 'Email', 'Phone', 'City', 'State', 'Country',
      'Business Type', 'GST', 'Subdomain', 'Status', 'Plan', 'Branches', 'Created',
    ];
    const rows = result.data.map((t: any) => [
      t.id, t.name, t.slug, t.email || '', t.phone || '',
      t.city || '', t.state || '', t.country || '',
      t.businessType || '', t.gstNumber || '', t.subdomain || '',
      t.status || (t.isActive ? 'Active' : 'Inactive'), t.subscription?.plan || '',
      t.branchCount || 0, t.createdAt,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return csv;
  }
}
