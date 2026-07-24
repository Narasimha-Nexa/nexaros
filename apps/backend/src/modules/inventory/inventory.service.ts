import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { CreateInventoryItemDto } from './dto/inventory.dto';
import { UpdateInventoryItemDto } from './dto/inventory.dto';
import { AdjustStockDto } from './dto/inventory.dto';
import { StockMovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { tenantId, deletedAt: null },
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
      where: { id, tenantId, deletedAt: null },
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

  async create(tenantId: string, dto: CreateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.create({
      data: { ...dto, tenantId },
    });

    this.eventBus.inventoryUpdated(tenantId, {
      id: item.id,
      name: item.name,
      action: 'created',
      currentStock: item.currentStock,
    });

    const minStock = Number(item.minimumStock || 0);
    const curStock = Number(item.currentStock || 0);
    if (minStock > 0 && curStock <= minStock) {
      this.eventBus.stockLow(tenantId, '', {
        itemId: item.id,
        name: item.name,
        currentStock: curStock,
        minimumStock: minStock,
      });
    }

    return item;
  }

  async update(id: string, tenantId: string, dto: UpdateInventoryItemDto) {
    await this.findOne(id, tenantId);
    const item = await this.prisma.inventoryItem.update({
      where: { id },
      data: dto,
    });

    this.eventBus.inventoryUpdated(tenantId, {
      id: item.id,
      name: item.name,
      action: 'updated',
      currentStock: item.currentStock,
    });

    return item;
  }

  async adjustStock(id: string, tenantId: string, dto: AdjustStockDto) {
    const item = await this.findOne(id, tenantId);

    const isPositive = dto.type === 'PURCHASE' || dto.type === 'ADJUSTMENT' || dto.type === 'TRANSFER_IN';
    const newStock = isPositive
      ? Number(item.currentStock) + dto.quantity
      : Number(item.currentStock) - dto.quantity;

    if (newStock < 0) {
      throw new NotFoundException('Insufficient stock. Current stock: ' + item.currentStock);
    }

    await this.prisma.stockMovement.create({
      data: {
        inventoryItemId: id,
        type: dto.type as StockMovementType,
        quantity: dto.quantity,
        notes: dto.notes,
      },
    });

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: { currentStock: newStock },
    });

    this.eventBus.stockMovement(tenantId, {
      itemId: id,
      itemName: item.name,
      type: dto.type,
      quantity: dto.quantity,
      previousStock: item.currentStock,
      newStock,
    });

    this.eventBus.inventoryUpdated(tenantId, {
      id: item.id,
      name: item.name,
      action: 'stock_adjusted',
      currentStock: newStock,
      adjustmentType: dto.type,
    });

    const minStock = Number(item.minimumStock || 0);
    if (minStock > 0 && newStock <= minStock) {
      this.eventBus.stockLow(tenantId, '', {
        itemId: item.id,
        name: item.name,
        currentStock: newStock,
        minimumStock: minStock,
      });
    }

    return updated;
  }

  async getMovements(inventoryItemId: string) {
    return this.prisma.stockMovement.findMany({
      where: { inventoryItemId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLowStock(tenantId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId, deletedAt: null },
    });

    return items.filter((item) => Number(item.currentStock) <= Number(item.minimumStock));
  }

  async remove(id: string, tenantId: string) {
    const item = await this.findOne(id, tenantId);

    await this.prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.eventBus.inventoryUpdated(tenantId, {
      id: item.id,
      name: item.name,
      action: 'deleted',
    });

    return { message: 'Inventory item deleted' };
  }
}
