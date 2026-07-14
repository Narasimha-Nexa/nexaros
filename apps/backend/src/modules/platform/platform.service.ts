import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.menuItem.count(),
      this.prisma.order.count(),
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'TRIAL' } }),
    ]);

    return {
      tenants: { total: totalTenants, active: activeTenants },
      users: totalUsers,
      menuItems: totalMenuItems,
      orders: totalOrders,
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        trial: trialSubscriptions,
      },
    };
  }
}
