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
            menuItem: { select: { id: true, name: true, image: true } },
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
    // Get next order number
    const lastOrder = await this.prisma.order.findFirst({
      where: { branchId },
      orderBy: { orderNumber: 'desc' },
    });
    const orderNumber = (lastOrder?.orderNumber || 0) + 1;

    // Calculate amounts
    let subtotal = 0;
    const items = data.items || [];
    for (const item of items) {
      subtotal += item.unitPrice * item.quantity;
    }

    const taxRate = 0.05; // 5% GST default
    const taxAmount = subtotal * taxRate;
    const discountAmount = data.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

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
        taxAmount,
        discountAmount,
        totalAmount,
        notes: data.notes,
        items: {
          create: items.map((item: any) => ({
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

    // Update table status
    if (data.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: data.tableId },
        data: { status: 'OCCUPIED' },
      });
    }

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

    // Record status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: status as any,
        notes,
      },
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

    // Emit real-time events
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
}
