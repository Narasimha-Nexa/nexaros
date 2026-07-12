import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { staff: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(tenantId: string, data: { name: string; description?: string; permissionIds?: string[] }) {
    return this.prisma.role.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        permissions: data.permissionIds
          ? { create: data.permissionIds.map((pid) => ({ permissionId: pid })) }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async update(id: string, tenantId: string, data: any) {
    await this.findOne(id, tenantId);
    return this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const role = await this.findOne(id, tenantId);
    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }
    return this.prisma.role.delete({ where: { id } });
  }

  async getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }
}
