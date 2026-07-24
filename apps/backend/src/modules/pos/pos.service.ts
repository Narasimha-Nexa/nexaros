import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService, requestContext } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { KitchenService } from '../kitchen/kitchen.service';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { ClosePosOrderDto } from './dto/close-pos-order.dto';

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private kitchenService: KitchenService,
  ) {}

  async getMenu(_branchId: string) {
    const ctx = requestContext.getStore();
    const tenantId = ctx?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant context required');

    const [categories, items] = await Promise.all([
      this.prisma.category.findMany({
        where: { tenantId, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, description: true },
      }),
      this.prisma.menuItem.findMany({
        where: { tenantId, isAvailable: true },
        orderBy: { name: 'asc' },
        include: {
          variants: { select: { id: true, name: true, price: true } },
          addOns: { select: { id: true, name: true, price: true } },
          images: { select: { url: true, isPrimary: true }, take: 1 },
        },
      }),
    ]);

    const itemsByCategory = categories.map((cat) => ({
      ...cat,
      items: items.filter((item) => item.categoryId === cat.id).map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        isVeg: item.isVeg,
        isAvailable: item.isAvailable,
        image: item.images.find((img) => img.isPrimary)?.url ?? item.images[0]?.url ?? null,
        variants: item.variants,
        addOns: item.addOns,
      })),
    }));

    const uncategorized = items.filter(
      (item) => !categories.some((cat) => cat.id === item.categoryId),
    );

    return { categories: itemsByCategory, uncategorized };
  }

  async createOrder(branchId: string, staffId: string, dto: CreatePosOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    const branch = await this.prisma.branch.findUnique({ where: { id: branchId }, select: { tenantId: true } });
    const tenantId = branch?.tenantId || '';

    const orderNumber = await this.generateOrderNumber(branchId);
    const subtotal = dto.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const totalAmount = subtotal - (dto.discountAmount || 0);

    const order = await this.prisma.order.create({
      data: {
        branchId,
        tenantId,
        staffId,
        orderNumber,
        type: dto.type,
        channel: (dto.channel as any) || 'DINE_IN',
        channelOrderId: dto.channelOrderId || null,
        tableId: dto.tableId || null,
        customerName: dto.customerName || null,
        customerPhone: dto.customerPhone || null,
        guestCount: dto.guestCount || null,
        subtotal,
        taxAmount: 0,
        discountAmount: dto.discountAmount || 0,
        totalAmount,
        notes: dto.notes || null,
        status: 'PENDING',
        items: {
          create: dto.items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: true,
        table: { select: { number: true, name: true } },
      },
    });

    if (dto.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: dto.tableId },
        data: { status: 'OCCUPIED' },
      });
      this.eventBus.emitToBranch(branchId, 'table:status-changed', {
        tableId: dto.tableId,
        status: 'OCCUPIED',
      });
    }

    this.eventBus.emitToBranch(branchId, 'order:created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
    });

    // Kitchen KDS: instant push for POS orders
    this.eventBus.kitchenOrderCreated(tenantId, branchId, {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      channel: order.channel || 'DINE_IN',
      priority: 'NORMAL',
      totalAmount: order.totalAmount,
      tableNumber: order.table?.number,
      itemCount: order.items.length,
      items: order.items.map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        notes: i.notes,
      })),
      createdAt: order.createdAt,
    });

    this.eventBus.dashboardRefresh(tenantId, {
      type: 'order_created',
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    // Route items to kitchen stations based on channel
    await this.kitchenService.routeOrderItems(order.id, order.channel || 'DINE_IN');

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount,
      items: order.items,
      table: order.table,
    };
  }

  async closeOrder(orderId: string, branchId: string, dto: ClosePosOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, table: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new BadRequestException('Order is already completed or cancelled');
    }

    const totalAmount = Number(order.totalAmount);

    if (dto.paymentMethod) {
      await this.prisma.payment.create({
        data: {
          branchId: order.branchId,
          tenantId: order.tenantId,
          orderId: order.id,
          amount: totalAmount,
          method: dto.paymentMethod as any,
          status: 'COMPLETED',
        },
      });
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        notes: dto.notes
          ? `${order.notes || ''}\n[POS Close] ${dto.notes}`.trim()
          : order.notes,
      },
      include: {
        items: true,
        payments: true,
        table: { select: { number: true, name: true } },
      },
    });

    // Table → FREE when order has a table (POS payment is always full amount)
    if (order.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: 'FREE', occupiedSince: null },
      });
      await this.eventBus.tableStatusChanged(order.tenantId, order.branchId, {
        tableId: order.tableId,
        status: 'FREE',
      });
    }

    // Order lifecycle events
    await this.eventBus.orderCompleted(order.tenantId, order.branchId, {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      totalAmount: updated.totalAmount,
    });

    await this.eventBus.orderTrackingEvent(orderId, 'order:status-changed', {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: 'COMPLETED',
      totalAmount: updated.totalAmount,
    });

    // Payment confirmation + invoice generation
    if (dto.paymentMethod) {
      await this.eventBus.paymentReceived(order.tenantId, order.branchId, {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        amount: totalAmount,
        method: dto.paymentMethod,
        status: 'COMPLETED',
      });

      await this.eventBus.orderTrackingEvent(orderId, 'payment:received', {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        amount: totalAmount,
        method: dto.paymentMethod,
      });

      // Auto-generate GST invoice for completed order
      await this.eventBus.invoiceGenerated(order.tenantId, order.branchId, {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
      });

      // Sync split payment balances across all POS devices
      await this.eventBus.diningBillUpdated(order.tenantId, order.branchId, {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        totalAmount: updated.totalAmount,
        totalPaid: totalAmount,
        remaining: 0,
        payment: { method: dto.paymentMethod, amount: totalAmount },
      });

      await this.eventBus.dashboardStatsUpdated(order.tenantId, order.branchId, {
        type: 'payment_received',
        orderId: updated.id,
        amount: totalAmount,
        method: dto.paymentMethod,
      });

      await this.eventBus.dashboardRefresh(order.tenantId, {
        type: 'payment_received',
        orderId: updated.id,
        amount: totalAmount,
      });
    }

    this.eventBus.dashboardStatsUpdated(order.tenantId, order.branchId, {
      type: 'order_completed',
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      totalAmount: updated.totalAmount,
    });

    this.eventBus.dashboardRefresh(order.tenantId, {
      type: 'order_completed',
      orderId: updated.id,
      orderNumber: updated.orderNumber,
    });

    return {
      id: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      totalAmount: updated.totalAmount,
      payments: updated.payments,
      table: updated.table,
    };
  }

  private async generateOrderNumber(branchId: string): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const count = await this.prisma.order.count({
      where: {
        branchId,
        createdAt: { gte: startOfDay },
      },
    });
    return count + 1;
  }
}
