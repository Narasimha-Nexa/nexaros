import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private gateway: GatewayService,
  ) {}

  async findAll(branchId: string, status?: string) {
    return this.prisma.order.findMany({
      where: {
        branchId,
        ...(status ? { status: status as any } : {}),
      },
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
    });
  }

  async findOne(id: string) {
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

  async create(branchId: string, data: any) {
    const lastOrder = await this.prisma.order.findFirst({
      where: { branchId },
      orderBy: { orderNumber: 'desc' },
    });
    const orderNumber = (lastOrder?.orderNumber || 0) + 1;

    // Calculate amounts with per-item tax
    let subtotal = 0;
    let totalTax = 0;
    const items = data.items || [];

    for (const item of items) {
      const itemTotal = item.unitPrice * item.quantity;
      subtotal += itemTotal;
      const taxRate = item.taxRate ?? 5;
      totalTax += itemTotal * (taxRate / 100);
    }

    const discountAmount = data.discountAmount || 0;
    const totalAmount = subtotal + totalTax - discountAmount;

    const order = await this.prisma.order.create({
      data: {
        branchId,
        tableId: data.tableId,
        staffId: data.staffId,
        orderNumber,
        type: data.type || 'DINE_IN',
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
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            taxRate: item.taxRate ?? 5,
            notes: item.notes,
          })),
        },
      },
      include: {
        table: { select: { id: true, number: true } },
        items: { include: { addOns: true } },
      },
    });

    // Update table status
    if (data.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: data.tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    // Record initial status
    await this.prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: 'PENDING', notes: 'Order created' },
    });

    // Emit real-time events
    this.gateway.emitToBranch(branchId, 'order:created', {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      totalAmount: order.totalAmount,
      tableNumber: order.table?.number,
      itemCount: order.items.length,
      createdAt: order.createdAt,
    });

    return order;
  }

  async addItem(orderId: string, data: { menuItemId: string; name: string; quantity: number; unitPrice: number; taxRate?: number; notes?: string }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot add items to a completed or cancelled order');
    }

    const taxRate = data.taxRate ?? 5;
    const itemTotal = data.unitPrice * data.quantity;
    const tax = itemTotal * (taxRate / 100);

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

    // Recalculate totals
    const updatedOrder = await this.recalculateOrder(orderId);

    this.gateway.emitToBranch(order.branchId, 'order:updated', {
      orderId,
      orderNumber: updatedOrder.orderNumber,
      action: 'item_added',
      item: { name: data.name, quantity: data.quantity },
      totalAmount: updatedOrder.totalAmount,
    });

    return { orderItem, order: updatedOrder };
  }

  async removeItem(orderId: string, itemId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot remove items from a completed or cancelled order');
    }

    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
    });
    if (!item) throw new NotFoundException('Order item not found');

    await this.prisma.orderItem.delete({ where: { id: itemId } });

    // Recalculate totals
    const updatedOrder = await this.recalculateOrder(orderId);

    this.gateway.emitToBranch(order.branchId, 'order:updated', {
      orderId,
      orderNumber: updatedOrder.orderNumber,
      action: 'item_removed',
      item: { name: item.name },
      totalAmount: updatedOrder.totalAmount,
    });

    return { removed: true, order: updatedOrder };
  }

  async updateStatus(id: string, status: string, notes?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        table: { select: { id: true, number: true } },
        items: true,
      },
    });

    await this.prisma.orderStatusHistory.create({
      data: { orderId: id, status: status as any, notes },
    });

    // Update table status based on order status
    if (order.tableId) {
      let tableStatus: any;
      switch (status) {
        case 'READY': tableStatus = 'ORDER_READY'; break;
        case 'SERVED': tableStatus = 'OCCUPIED'; break;
        case 'COMPLETED': tableStatus = 'BILLING'; break;
        case 'CANCELLED': tableStatus = 'FREE'; break;
      }
      if (tableStatus) {
        await this.prisma.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: tableStatus },
        });
      }
    }

    this.gateway.emitToBranch(order.branchId, 'order:status-changed', {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      tableNumber: updated.table?.number,
    });

    if (status === 'READY') {
      this.gateway.emitToBranch(order.branchId, 'order:ready', {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        tableNumber: updated.table?.number,
      });
    }

    return updated;
  }

  async printKot(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: { select: { name: true, isVeg: true } } } },
        table: { select: { number: true, name: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Mark KOT as printed
    await this.prisma.order.update({
      where: { id },
      data: { kotPrinted: true },
    });

    // Emit KOT event for kitchen display
    this.gateway.emitToBranch(order.branchId, 'kot:ready', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.table?.number,
      tableName: order.table?.name,
      items: order.items.map(i => ({
        name: i.menuItem?.name || i.name,
        quantity: i.quantity,
        isVeg: i.menuItem?.isVeg ?? true,
        notes: i.notes,
      })),
      createdAt: order.createdAt,
    });

    return { kotPrinted: true, orderId: id };
  }

  async cancel(id: string, notes?: string) {
    return this.updateStatus(id, 'CANCELLED', notes);
  }

  async getOrderNumber(branchId: string): Promise<number> {
    const lastOrder = await this.prisma.order.findFirst({
      where: { branchId },
      orderBy: { orderNumber: 'desc' },
    });
    return (lastOrder?.orderNumber || 0) + 1;
  }

  private async recalculateOrder(orderId: string) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    let subtotal = 0;
    let totalTax = 0;
    for (const item of items) {
      subtotal += Number(item.totalPrice);
      totalTax += Number(item.totalPrice) * 0.05;
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
