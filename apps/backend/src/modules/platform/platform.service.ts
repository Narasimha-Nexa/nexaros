import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function formatAuditDetails(log: any): string {
  const data = log?.newData;
  if (!data || typeof data !== 'object') return log?.details || '';
  if (data.restaurantName) {
    return `Provisioned ${data.restaurantName} (${data.subdomain || '—'}) · plan: ${data.plan || '—'}`;
  }
  if (data.email) return `Email: ${data.email}`;
  if (data.title) return String(data.title);
  try {
    return JSON.stringify(data);
  } catch {
    return '';
  }
}

@Injectable()
export class PlatformService {
  constructor(private prisma: PrismaService) {}

  async getSetting(key: string) {
    const setting = await this.prisma.platformSettings.findUnique({ where: { key } });
    return setting?.value;
  }

  async setSetting(key: string, value: any, description?: string) {
    return this.prisma.platformSettings.upsert({
      where: { key },
      create: { key, value, description },
      update: { value, description },
    });
  }

  async getAllSettings() {
    return this.prisma.platformSettings.findMany({ orderBy: { key: 'asc' } });
  }

  async getMaintenanceMode() {
    const value = await this.getSetting('maintenance_mode');
    return value ?? { enabled: false, message: 'System is under maintenance' };
  }

  async setMaintenanceMode(enabled: boolean, message?: string) {
    return this.setSetting('maintenance_mode', {
      enabled,
      message: message || 'System is under maintenance. Please try again later.',
    });
  }

  async getPlatformStats() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalMenuItems,
      totalOrders,
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      graceSubscriptions,
      suspendedSubscriptions,
      pendingSupportTickets,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.menuItem.count(),
      this.prisma.order.count(),
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'TRIAL' } }),
      this.prisma.subscription.count({ where: { status: 'GRACE_PERIOD' } }),
      this.prisma.subscription.count({ where: { status: { in: ['SUSPENDED', 'RESTRICTED'] } } }),
      this.prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          newData: true,
          createdAt: true,
          adminUser: { select: { name: true, email: true } },
        },
      }),
    ]);

    let totalRevenue = 0;
    try {
      const revenueResult = await this.prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(amount), 0)::int as total FROM subscription_payments WHERE status = 'COMPLETED'`,
      );
      totalRevenue = (revenueResult as any)[0]?.total || 0;
    } catch {}

    return {
      tenants: { total: totalTenants, active: activeTenants },
      users: totalUsers,
      menuItems: totalMenuItems,
      orders: totalOrders,
      totalRevenue,
      pendingIssues: pendingSupportTickets,
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        trial: trialSubscriptions,
        grace: graceSubscriptions,
        suspended: suspendedSubscriptions,
      },
      recentActivity: recentAuditLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        details: formatAuditDetails(log),
        timestamp: log.createdAt,
        actor: log.adminUser?.name || log.adminUser?.email || 'System',
      })),
    };
  }
}
