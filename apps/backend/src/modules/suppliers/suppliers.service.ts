import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId, isActive: true },
      include: {
        _count: { select: { purchases: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        purchases: {
          include: { items: { include: { inventoryItem: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async create(tenantId: string, dto: { name: string; phone?: string; email?: string; address?: string; gstNumber?: string }) {
    return this.prisma.supplier.create({
      data: { tenantId, ...dto },
    });
  }

  async update(id: string, tenantId: string, dto: any) {
    await this.findOne(id, tenantId);
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
