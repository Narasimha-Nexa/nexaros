import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';

@Injectable()
export class KitchenService {
  constructor(
    private prisma: PrismaService,
    private gateway: GatewayService,
  ) {}

  async getActiveOrders(branchId: string) {
    return this.prisma.order.findMany({
      where: {
        branchId,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
      },
      include: {
        table: { select: { id: true, number: true, name: true } },
        staff: { select: { id: true, name: true } },
        items: {
          include: {
            menuItem: { select: { name: true, isVeg: true, prepTimeMin: true } },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getCompletedOrders(branchId: string) {
    return this.prisma.order.findMany({
      where: {
        branchId,
        status: 'COMPLETED',
        updatedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 mins
      },
      include: {
        table: { select: { id: true, number: true, name: true } },
        items: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateOrderStatus(id: string, status: string, branchId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'PREPARING', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY'],
      READY: ['SERVED', 'COMPLETED'],
      SERVED: ['COMPLETED'],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      throw new NotFoundException(`Cannot transition from ${order.status} to ${status}`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        table: { select: { id: true, number: true, name: true } },
        items: { include: { menuItem: { select: { name: true, isVeg: true, id: true } } } },
      },
    });

    // Auto-deduct inventory when order moves to PREPARING (first time items enter production)
    // We only deduct once at PREPARING to avoid double-deduction when order later transitions to SERVED
    if (status === 'PREPARING') {
      await this._deductInventoryForOrder(updated);
    }

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: status as any,
        notes: `Kitchen: ${order.status} → ${status}`,
      },
    });

    // Update table status based on order status
    if (updated.tableId) {
      let tableStatus: string | undefined;
      switch (status) {
        case 'READY': tableStatus = 'ORDER_READY'; break;
        case 'SERVED': tableStatus = 'OCCUPIED'; break;
        case 'COMPLETED': tableStatus = 'BILLING'; break;
        case 'CANCELLED': tableStatus = 'FREE'; break;
      }
      if (tableStatus) {
        await this.prisma.restaurantTable.update({
          where: { id: updated.tableId },
          data: { status: tableStatus as any },
        });
      }
    }

    const broadcastBranch = branchId || order.branchId;
    this.gateway.emitToBranch(broadcastBranch, 'order:status-changed', {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      tableNumber: updated.table?.number,
    });

    if (status === 'READY') {
      this.gateway.emitToBranch(broadcastBranch, 'order:ready', {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        tableNumber: updated.table?.number,
      });
    }

    return updated;
  }

  async updateItemStatus(orderId: string, itemId: string, status: string) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
    });
    if (!item) throw new NotFoundException('Order item not found');

    return this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status: status as any },
    });
  }

  async getKotData(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: { select: { number: true, name: true } },
        items: {
          include: {
            menuItem: { select: { name: true, isVeg: true, prepTimeMin: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Auto-deduct inventory items when an order moves to PREPARING.
   * Uses the RecipeItem model to get per-unit consumption quantities.
   * Falls back to implicit many-to-many if no recipe items defined.
   */
  private async _deductInventoryForOrder(order: any) {
    for (const item of order.items) {
      const menuItemId = item.menuItem?.id || item.menuItemId;
      if (!menuItemId) continue;

      // First try RecipeItem (explicit recipe with quantities per unit)
      const recipeItems = await this.prisma.recipeItem.findMany({
        where: { menuItemId },
        include: { inventoryItem: { select: { id: true, name: true, unit: true, currentStock: true } } },
      });

      if (recipeItems.length > 0) {
        for (const recipe of recipeItems) {
          const deductQty = Number(recipe.quantity) * item.quantity;
          const newStock = Math.max(Number(recipe.inventoryItem.currentStock) - deductQty, 0);

          await this.prisma.inventoryItem.update({
            where: { id: recipe.inventoryItemId },
            data: { currentStock: newStock },
          });

          await this.prisma.stockMovement.create({
            data: {
              inventoryItemId: recipe.inventoryItemId,
              type: 'SALE',
              quantity: deductQty,
              reference: order.orderNumber?.toString() ?? order.id.substring(0, 8),
              notes: `Order #${order.orderNumber} - ${item.name || menuItemId.substring(0, 8)}`,
            },
          });

          if (newStock <= 0) {
            this.gateway.emitToBranch(order.branchId, 'inventory:low', {
              itemId: recipe.inventoryItemId,
              itemName: recipe.inventoryItem.name,
              currentStock: newStock,
              unit: recipe.inventoryItem.unit,
              orderNumber: order.orderNumber,
            });
          }
        }
      } else {
        // Fallback: use implicit many-to-many (1 unit consumed per inventory item)
        const inventoryLinks = await this.prisma.menuItem.findUnique({
          where: { id: menuItemId },
          include: {
            inventoryItems: { select: { id: true, name: true, unit: true, currentStock: true } },
          },
        });

        if (!inventoryLinks?.inventoryItems?.length) continue;

        for (const invItem of inventoryLinks.inventoryItems) {
          const deductQty = item.quantity;
          const newStock = Math.max(Number(invItem.currentStock) - deductQty, 0);

          await this.prisma.inventoryItem.update({
            where: { id: invItem.id },
            data: { currentStock: newStock },
          });

          await this.prisma.stockMovement.create({
            data: {
              inventoryItemId: invItem.id,
              type: 'SALE',
              quantity: deductQty,
              reference: order.orderNumber?.toString() ?? order.id.substring(0, 8),
              notes: `Order #${order.orderNumber} - ${item.name || menuItemId.substring(0, 8)}`,
            },
          });

          if (newStock <= 0) {
            this.gateway.emitToBranch(order.branchId, 'inventory:low', {
              itemId: invItem.id,
              itemName: invItem.name,
              currentStock: newStock,
              unit: invItem.unit,
              orderNumber: order.orderNumber,
            });
          }
        }
      }
    }
  }
}
