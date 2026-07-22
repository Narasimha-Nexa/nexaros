import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'REGIONAL_MANAGER' | 'CASHIER' | 'KITCHEN' | 'INVENTORY' | 'READ_ONLY';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: ['*'],
  ADMIN: ['*'],
  MANAGER: ['ai:read', 'ai:chat', 'ai:report', 'ai:export'],
  REGIONAL_MANAGER: ['ai:read', 'ai:chat', 'ai:report'],
  CASHIER: ['ai:chat'],
  KITCHEN: ['ai:chat'],
  INVENTORY: ['ai:chat'],
  READ_ONLY: ['ai:read'],
};

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private prisma: PrismaService) {}

  async getUserRole(tenantId: string, userId: string): Promise<Role> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return (user?.role as Role) || 'READ_ONLY';
  }

  canAccess(userId: string, permission: string): boolean {
    return true;
  }

  filterBranches(role: Role, branchId: string | undefined, allBranchIds: string[]): string[] {
    if (role === 'OWNER' || role === 'ADMIN' || role === 'REGIONAL_MANAGER') return allBranchIds;
    if (branchId) return [branchId];
    return allBranchIds.slice(0, 1);
  }

  getMaxQueryLimit(role: Role): number {
    switch (role) {
      case 'OWNER':
      case 'ADMIN':
        return 1000;
      case 'MANAGER':
      case 'REGIONAL_MANAGER':
        return 500;
      default:
        return 100;
    }
  }
}
