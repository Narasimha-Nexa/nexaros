import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';

@Injectable()
export class KitchenService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  // ── Station Management ──

  async getStations(branchId: string) {
    return this.prisma.kitchenStation.findMany({
      where: { branchId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createStation(data: { branchId: string; tenantId: string; name: string; displayName?: string; sortOrder?: number; maxConcurrentOrders?: number; color?: string }) {
    return this.prisma.kitchenStation.create({
      data: {
        branchId: data.branchId,
        tenantId: data.tenantId,
        name: data.name,
        displayName: data.displayName || data.name,
        sortOrder: data.sortOrder ?? 0,
        maxConcurrentOrders: data.maxConcurrentOrders ?? 10,
        color: data.color,
      },
    });
  }

  async updateStation(id: string, data: { name?: string; displayName?: string; sortOrder?: number; isActive?: boolean; maxConcurrentOrders?: number; color?: string }) {
    const station = await this.prisma.kitchenStation.findUnique({ where: { id } });
    if (!station) throw new NotFoundException('Kitchen station not found');

    return this.prisma.kitchenStation.update({
      where: { id },
      data,
    });
  }

  async deleteStation(id: string) {
    const station = await this.prisma.kitchenStation.findUnique({ where: { id } });
    if (!station) throw new NotFoundException('Kitchen station not found');

    // Soft-delete by deactivating
    return this.prisma.kitchenStation.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── Channel-Specific Routing ──

  private readonly channelPriorityBoost: Record<string, number> = {
    SWIGGY: 1,
    ZOMATO: 1,
    WHATSAPP: 1,
    ONDC: 1,
    INSTAGRAM: 1,
    FACEBOOK: 1,
    QR: 0,
    APP: 0,
    DINE_IN: 0,
  };

  async routeOrderItems(orderId: string, channel: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        branch: { select: { tenantId: true } },
      },
    });
    if (!order) return;

    const stations = await this.prisma.kitchenStation.findMany({
      where: { branchId: order.branchId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    if (stations.length === 0) return;

    const mainStation = stations[0];

    for (const item of order.items) {
      if (item.stationId) continue;
      await this.prisma.orderItem.update({
        where: { id: item.id },
        data: { stationId: mainStation.id },
      });
    }

    const boost = this.channelPriorityBoost[channel] || 0;
    if (boost > 0 && order.priority === 'NORMAL') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { priority: 'HIGH' },
      });
    }
  }

  // ── Order Queries ──

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

  // ── Chef Assignment ──

  async assignChef(orderId: string, chefId: string, chefName: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { table: { select: { number: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { assignedChefId: chefId, assignedChefName: chefName },
    });

    this.eventBus.kitchenOrderAssigned(order.tenantId, order.branchId, {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      chefId,
      chefName,
      tableNumber: order.table?.number,
    });

    return updated;
  }

  // ── Priority Management ──

  async updatePriority(orderId: string, priority: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { table: { select: { number: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { priority: priority as any },
    });

    this.eventBus.kitchenPriorityChanged(order.tenantId, order.branchId, {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      priority: updated.priority,
      previousPriority: order.priority,
      tableNumber: order.table?.number,
    });

    return updated;
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
    this.eventBus.emitToBranch(broadcastBranch, 'order:status-changed', {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      tableNumber: updated.table?.number,
    });

    // Notify customer tracking page
    this.eventBus.orderTrackingEvent(id, 'order:status-changed', {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      tableNumber: updated.table?.number,
    });

    if (status === 'READY') {
      this.eventBus.emitToBranch(broadcastBranch, 'order:ready', {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        tableNumber: updated.table?.number,
      });

      this.eventBus.orderTrackingEvent(id, 'order:ready', {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        tableNumber: updated.table?.number,
      });

      // Auto-create delivery record for DELIVERY orders
      if (order.type === 'DELIVERY') {
        const existingDelivery = await this.prisma.delivery.findFirst({ where: { orderId: id } });
        if (!existingDelivery) {
          await this.prisma.delivery.create({
            data: {
              orderId: id,
              branchId: order.branchId,
              status: 'PENDING',
              customerName: order.customerName,
              customerPhone: order.customerPhone,
            },
          });
          this.eventBus.emitToBranch(broadcastBranch, 'delivery:created', {
            orderId: id,
            orderNumber: updated.orderNumber,
          });
        }
      }
    }

    // Emit kitchen-specific bump event for KDS
    this.eventBus.kitchenOrderBumped(order.tenantId, broadcastBranch, {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      previousStatus: order.status,
      tableNumber: updated.table?.number,
      items: updated.items.map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        status: i.status,
      })),
    });

    return updated;
  }

  async updateItemStatus(orderId: string, itemId: string, status: string) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
      include: {
        order: { select: { id: true, branchId: true, orderNumber: true, tenantId: true } },
      },
    });
    if (!item) throw new NotFoundException('Order item not found');

    // Set timestamps based on status transition
    const updateData: Record<string, any> = { status: status as any };
    if (status === 'PREPARING' && !item.startedAt) {
      updateData.startedAt = new Date();
    } else if (status === 'READY' && !item.completedAt) {
      updateData.completedAt = new Date();
    }

    const updated = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: updateData,
    });

    const payload = {
      orderId,
      orderNumber: item.order.orderNumber,
      itemId,
      itemName: item.name,
      status,
      quantity: item.quantity,
      startedAt: updated.startedAt,
      completedAt: updated.completedAt,
    };

    // Emit to staff devices (branch room)
    this.eventBus.emitToBranch(item.order.branchId, 'item:status-changed', payload);

    // Emit to customer tracking page (order room on /public namespace)
    this.eventBus.orderTrackingEvent(orderId, 'item:status-changed', payload);

    // Emit kitchen-specific item bump event
    this.eventBus.itemStatusChanged(item.order.tenantId, item.order.branchId, payload);

    return updated;
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
            this.eventBus.emitToBranch(order.branchId, 'inventory:low', {
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
            this.eventBus.emitToBranch(order.branchId, 'inventory:low', {
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
