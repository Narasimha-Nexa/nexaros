import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.purchase.findMany({
      where: { tenantId },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: { inventoryItem: { select: { id: true, name: true, unit: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        items: {
          include: { inventoryItem: true },
        },
      },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async create(tenantId: string, dto: { supplierId: string; notes?: string; items: { inventoryItemId: string; quantity: number; unitPrice: number }[] }) {
    let totalAmount = 0;
    const itemsData = dto.items.map((item) => {
      const totalCost = item.quantity * item.unitPrice;
      totalAmount += totalCost;
      return {
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalCost,
      };
    });

    const purchase = await this.prisma.purchase.create({
      data: {
        tenantId,
        supplierId: dto.supplierId,
        totalAmount,
        notes: dto.notes,
        items: { create: itemsData },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { inventoryItem: { select: { id: true, name: true, unit: true } } } },
      },
    });

    // Auto-update inventory stock for received purchases
    for (const item of itemsData) {
      await this.prisma.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: { currentStock: { increment: item.quantity } },
      });
      await this.prisma.stockMovement.create({
        data: {
          inventoryItemId: item.inventoryItemId,
          type: 'PURCHASE',
          quantity: item.quantity,
          notes: `Purchase #${purchase.id.substring(0, 8)}`,
        },
      });
    }

    return purchase;
  }

  async updateStatus(id: string, tenantId: string, status: string) {
    await this.findOne(id, tenantId);
    return this.prisma.purchase.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.purchase.delete({ where: { id } });
  }
}
