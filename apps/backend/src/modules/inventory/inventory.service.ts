import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { tenantId },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async create(tenantId: string, data: any) {
    return this.prisma.inventoryItem.create({
      data: { ...data, tenantId },
    });
  }

  async update(id: string, tenantId: string, data: any) {
    await this.findOne(id, tenantId);
    return this.prisma.inventoryItem.update({
      where: { id },
      data,
    });
  }

  async adjustStock(id: string, tenantId: string, data: { quantity: number; type: string; notes?: string }) {
    const item = await this.findOne(id, tenantId);

    const newStock = data.type === 'PURCHASE' || data.type === 'ADJUSTMENT'
      ? Number(item.currentStock) + data.quantity
      : Number(item.currentStock) - data.quantity;

    await this.prisma.stockMovement.create({
      data: {
        inventoryItemId: id,
        type: data.type as any,
        quantity: data.quantity,
        notes: data.notes,
      },
    });

    return this.prisma.inventoryItem.update({
      where: { id },
      data: { currentStock: newStock },
    });
  }

  async getMovements(inventoryItemId: string) {
    return this.prisma.stockMovement.findMany({
      where: { inventoryItemId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLowStock(tenantId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId },
    });

    return items.filter((item) => Number(item.currentStock) <= Number(item.minimumStock));
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.inventoryItem.delete({ where: { id } });
  }
}
