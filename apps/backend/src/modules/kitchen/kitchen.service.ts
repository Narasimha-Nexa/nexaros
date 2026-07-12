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
        items: { include: { menuItem: { select: { name: true, isVeg: true } } } },
      },
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: status as any,
        notes: `Kitchen: ${order.status} → ${status}`,
      },
    });

    // Update table status when order is ready or served
    if (updated.tableId) {
      if (status === 'READY') {
        await this.prisma.restaurantTable.update({
          where: { id: updated.tableId },
          data: { status: 'ORDER_READY' as any },
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
}
