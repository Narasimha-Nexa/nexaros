import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddItemDto } from './dto/add-item.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  private async findOneWithTenantValidation(id: string, tenantId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, branch: { tenantId } },
      include: { branch: { select: { tenantId: true } } },
    });
    if (!order) throw new NotFoundException('Order not found or does not belong to this tenant');
    return order;
  }

  async findAll(branchId: string, status?: string, skip = 0, take = 20) {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          branchId,
          ...(status ? { status: status as OrderStatus } : {}),
        },
        skip,
        take,
        include: {
          table: { select: { id: true, number: true, name: true } },
          staff: { select: { id: true, name: true } },
          items: {
            include: {
              menuItem: { select: { id: true, name: true, image: true } },
              addOns: true,
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({
        where: {
          branchId,
          ...(status ? { status: status as OrderStatus } : {}),
        },
      }),
    ]);
    return { orders, total, skip, take };
  }

  async findOne(id: string, tenantId: string) {
    await this.findOneWithTenantValidation(id, tenantId);
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        staff: { select: { id: true, name: true } },
        items: {
          include: {
            menuItem: { select: { id: true, name: true, image: true, isVeg: true } },
            addOns: true,
          },
        },
        payments: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(branchId: string, data: CreateOrderDto) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId }, select: { tenantId: true } });
    const tenantId = branch?.tenantId || '';

    const lastOrder = await this.prisma.order.findFirst({
      where: { branchId },
      orderBy: { orderNumber: 'desc' },
    });
    const orderNumber = (lastOrder?.orderNumber || 0) + 1;

    const menuItemIds = (data.items || []).map((i) => i.menuItemId).filter(Boolean);
    const menuItems = menuItemIds.length > 0
      ? await this.prisma.menuItem.findMany({ where: { id: { in: menuItemIds } }, select: { id: true, taxRate: true } })
      : [];
    const taxRateMap = new Map(menuItems.map(m => [m.id, Number(m.taxRate || 5)]));

    let subtotal = 0;
    let totalTax = 0;
    const items = data.items || [];

    for (const item of items) {
      const itemTotal = item.unitPrice * item.quantity;
      subtotal += itemTotal;
      const taxRate = taxRateMap.get(item.menuItemId) ?? 5;
      totalTax += itemTotal * (taxRate / 100);
    }

    const discountAmount = data.discountAmount || 0;
    const totalAmount = subtotal + totalTax - discountAmount;

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          branchId,
          tenantId,
          tableId: data.tableId,
          staffId: data.staffId,
          orderNumber,
          type: (data.type as any) || 'DINE_IN',
          status: 'PENDING',
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          guestCount: data.guestCount,
          subtotal,
          taxAmount: totalTax,
          discountAmount,
          totalAmount,
          notes: data.notes,
          kotPrinted: false,
          items: {
            create: items.map((item) => ({
              menuItemId: item.menuItemId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              notes: item.notes,
            })),
          },
        },
        include: {
          table: { select: { id: true, number: true } },
          items: { include: { addOns: true } },
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: createdOrder.id, status: 'PENDING', notes: 'Order created' },
      });

      return createdOrder;
    });

    if (data.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: data.tableId },
        data: { status: 'OCCUPIED', occupiedSince: new Date() },
      });
    }

    await this.eventBus.orderCreated(order.tenantId || branchId, branchId, {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      totalAmount: order.totalAmount,
      tableNumber: order.table?.number,
      itemCount: order.items.length,
      createdAt: order.createdAt,
    });

    // Emit kitchen-specific event for KDS real-time push
    await this.eventBus.kitchenOrderCreated(order.tenantId || branchId, branchId, {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      channel: order.channel,
      priority: order.priority,
      totalAmount: order.totalAmount,
      tableNumber: order.table?.number,
      tableName: null,
      itemCount: order.items.length,
      items: order.items.map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        notes: i.notes,
      })),
      customerName: order.customerName,
      guestCount: order.guestCount,
      createdAt: order.createdAt,
    });

    this.eventBus.dashboardStatsUpdated(order.tenantId || branchId, branchId, {
      type: 'order_created',
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    });

    this.eventBus.dashboardRefresh(order.tenantId || branchId, {
      type: 'order_created',
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    return order;
  }

  async addItem(orderId: string, data: { menuItemId: string; name: string; quantity: number; unitPrice: number; taxRate?: number; notes?: string }, tenantId: string) {
    const order = await this.findOneWithTenantValidation(orderId, tenantId);
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot add items to a completed or cancelled order');
    }

    const taxRate = data.taxRate ?? 5;
    const itemTotal = data.unitPrice * data.quantity;

    const orderItem = await this.prisma.orderItem.create({
      data: {
        orderId,
        menuItemId: data.menuItemId,
        name: data.name,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice: itemTotal,
        notes: data.notes,
      },
    });

    const updatedOrder = await this.recalculateOrder(orderId);

    this.eventBus.emitToBranch(order.branchId, 'order:updated', {
      orderId,
      orderNumber: updatedOrder.orderNumber,
      action: 'item_added',
      item: { name: data.name, quantity: data.quantity },
      totalAmount: updatedOrder.totalAmount,
    });

    // Customer-facing: items changed on running order
    this.eventBus.orderItemsChanged(order.tenantId, order.branchId, {
      orderId,
      orderNumber: updatedOrder.orderNumber,
      action: 'item_added',
      item: { id: orderItem.id, name: data.name, quantity: data.quantity, unitPrice: data.unitPrice },
      totalAmount: updatedOrder.totalAmount,
    });

    this.eventBus.orderTrackingEvent(orderId, 'order:items-changed', {
      orderId,
      orderNumber: updatedOrder.orderNumber,
      action: 'item_added',
      item: { id: orderItem.id, name: data.name, quantity: data.quantity },
      totalAmount: updatedOrder.totalAmount,
    });

    // Notify POS devices that the bill total changed
    this.eventBus.diningBillUpdated(order.tenantId, order.branchId, {
      orderId,
      orderNumber: updatedOrder.orderNumber,
      totalAmount: updatedOrder.totalAmount,
      action: 'item_added',
    });

    return { orderItem, order: updatedOrder };
  }

  async removeItem(orderId: string, itemId: string, tenantId: string) {
    const order = await this.findOneWithTenantValidation(orderId, tenantId);
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot remove items from a completed or cancelled order');
    }

    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
    });
    if (!item) throw new NotFoundException('Order item not found');

    await this.prisma.orderItem.delete({ where: { id: itemId } });

    const updatedOrder = await this.recalculateOrder(orderId);

    this.eventBus.emitToBranch(order.branchId, 'order:updated', {
      orderId,
      orderNumber: updatedOrder.orderNumber,
      action: 'item_removed',
      item: { name: item.name },
      totalAmount: updatedOrder.totalAmount,
    });

    // Customer-facing: items changed on running order
    this.eventBus.orderItemsChanged(order.tenantId, order.branchId, {
      orderId,
      orderNumber: updatedOrder.orderNumber,
      action: 'item_removed',
      item: { id: item.id, name: item.name },
      totalAmount: updatedOrder.totalAmount,
    });

    this.eventBus.orderTrackingEvent(orderId, 'order:items-changed', {
      orderId,
      orderNumber: updatedOrder.orderNumber,
      action: 'item_removed',
      item: { id: item.id, name: item.name },
      totalAmount: updatedOrder.totalAmount,
    });

    // Notify POS devices that the bill total changed
    this.eventBus.diningBillUpdated(order.tenantId, order.branchId, {
      orderId,
      orderNumber: updatedOrder.orderNumber,
      totalAmount: updatedOrder.totalAmount,
      action: 'item_removed',
    });

    return { removed: true, order: updatedOrder };
  }

  async updateStatus(id: string, status: string, notes?: string, tenantId?: string) {
    const order = tenantId
      ? await this.findOneWithTenantValidation(id, tenantId)
      : await this.prisma.order.findUnique({ where: { id } });
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
      throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
      include: {
        table: { select: { id: true, number: true } },
        items: true,
      },
    });

    await this.prisma.orderStatusHistory.create({
      data: { orderId: id, status: status as OrderStatus, notes },
    });

    if (order.tableId) {
      let tableStatus: string | undefined;
      let tableUpdateData: Record<string, unknown> = {};
      switch (status) {
        case 'READY': tableStatus = 'ORDER_READY'; break;
        case 'SERVED': tableStatus = 'OCCUPIED'; break;
        case 'COMPLETED': tableStatus = 'BILLING'; break;
        case 'CANCELLED': tableStatus = 'FREE'; tableUpdateData.occupiedSince = null; break;
      }
      if (tableStatus) {
        tableUpdateData.status = tableStatus;
        await this.prisma.restaurantTable.update({
          where: { id: order.tableId },
          data: tableUpdateData,
        });
        // Emit real-time table status change to floor plan
        this.eventBus.emitToBranch(order.branchId, 'table:status-changed', {
          tableId: order.tableId,
          tableNumber: updated.table?.number,
          status: tableStatus,
          orderId: updated.id,
          orderNumber: updated.orderNumber,
        });
      }
    }

    this.eventBus.emitToBranch(order.branchId, 'order:status-changed', {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      tableNumber: updated.table?.number,
    });

    this.eventBus.orderTrackingEvent(id, 'order:status-changed', {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      tableNumber: updated.table?.number,
    });

    // Emit bill-updated when order moves to BILLING (customer requested check)
    if (status === 'BILLING') {
      this.eventBus.diningBillUpdated(order.tenantId, order.branchId, {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        totalAmount: updated.totalAmount,
        status: updated.status,
        action: 'bill_requested',
      });
    }

    if (status === 'READY') {
      this.eventBus.emitToBranch(order.branchId, 'order:ready', {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        tableNumber: updated.table?.number,
      });

      this.eventBus.orderTrackingEvent(id, 'order:ready', {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        tableNumber: updated.table?.number,
      });
    }

    return updated;
  }

  async printKot(id: string, tenantId: string) {
    const order = await this.findOneWithTenantValidation(id, tenantId);
    const fullOrder = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: { select: { name: true, isVeg: true } } } },
        table: { select: { number: true, name: true } },
      },
    });
    if (!fullOrder) throw new NotFoundException('Order not found');

    await this.prisma.order.update({
      where: { id },
      data: { kotPrinted: true },
    });

    this.eventBus.emitToBranch(fullOrder.branchId, 'kot:ready', {
      orderId: fullOrder.id,
      orderNumber: fullOrder.orderNumber,
      tableNumber: fullOrder.table?.number,
      tableName: fullOrder.table?.name,
      items: fullOrder.items.map(i => ({
        name: i.menuItem?.name || i.name,
        quantity: i.quantity,
        isVeg: i.menuItem?.isVeg ?? true,
        notes: i.notes,
      })),
      createdAt: fullOrder.createdAt,
    });

    return { kotPrinted: true, orderId: id };
  }

  async cancel(id: string, notes?: string, tenantId?: string) {
    const order = tenantId
      ? await this.findOneWithTenantValidation(id, tenantId)
      : await this.prisma.order.findUnique({ where: { id } });

    const result = await this.updateStatus(id, 'CANCELLED', notes, tenantId);

    // Emit dedicated cancellation event for customer + kitchen
    if (order) {
      this.eventBus.orderCancelled(order.tenantId, order.branchId, {
        orderId: result.id,
        orderNumber: result.orderNumber,
        status: 'CANCELLED',
        notes,
        tableNumber: result.table?.number,
      });

      this.eventBus.orderTrackingEvent(id, 'order:cancelled', {
        orderId: result.id,
        orderNumber: result.orderNumber,
        status: 'CANCELLED',
        notes,
      });

      this.eventBus.dashboardStatsUpdated(order.tenantId, order.branchId, {
        type: 'order_cancelled',
        orderId: result.id,
        orderNumber: result.orderNumber,
      });

      this.eventBus.dashboardRefresh(order.tenantId, {
        type: 'order_cancelled',
        orderId: result.id,
        orderNumber: result.orderNumber,
      });
    }

    return result;
  }

  async getOrderNumber(branchId: string): Promise<number> {
    const lastOrder = await this.prisma.order.findFirst({
      where: { branchId },
      orderBy: { orderNumber: 'desc' },
    });
    return (lastOrder?.orderNumber || 0) + 1;
  }

  private async recalculateOrder(orderId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      include: { menuItem: { select: { taxRate: true } } },
    });
    let subtotal = 0;
    let totalTax = 0;
    for (const item of items) {
      subtotal += Number(item.totalPrice);
      const taxRate = Number(item.menuItem?.taxRate || 5);
      totalTax += Number(item.totalPrice) * (taxRate / 100);
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    const discount = Number(order?.discountAmount || 0);
    const totalAmount = subtotal + totalTax - discount;

    return this.prisma.order.update({
      where: { id: orderId },
      data: { subtotal, taxAmount: totalTax, totalAmount },
      include: {
        table: { select: { id: true, number: true } },
        items: true,
      },
    });
  }
}
