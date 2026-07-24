import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventBusService } from '../../../common/event-bus/event-bus.service';

@Injectable()
export class WhatsAppOrderHandlerService {
  private readonly logger = new Logger(WhatsAppOrderHandlerService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async createOrderFromWhatsApp(data: {
    tenantId: string;
    accountId: string;
    customerPhone: string;
    textContent: string;
  }) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: data.tenantId },
        include: { branches: { take: 1 } },
      });
      if (!tenant || !tenant.branches.length) {
        this.logger.warn(`No branch found for tenant ${data.tenantId}`);
        return;
      }
      const branch = tenant.branches[0];

      const lastOrder = await this.prisma.order.findFirst({
        where: { branchId: branch.id },
        orderBy: { orderNumber: 'desc' },
      });
      const orderNumber = (lastOrder?.orderNumber || 0) + 1;

      const parsedItems = this.parseOrderText(data.textContent);
      if (parsedItems.length === 0) {
        this.logger.warn(`Could not parse order items from WhatsApp text: ${data.textContent}`);
        return;
      }

      let subtotal = 0;
      for (const item of parsedItems) {
        const menuItem = await this.prisma.menuItem.findFirst({
          where: { tenantId: data.tenantId, name: { contains: item.name, mode: 'insensitive' }, isAvailable: true },
        });
        if (menuItem) {
          item.menuItemId = menuItem.id;
          item.unitPrice = Number(menuItem.price);
          item.totalPrice = item.unitPrice * item.quantity;
          subtotal += item.totalPrice;
        }
      }

      const validItems = parsedItems.filter(i => i.menuItemId);
      if (validItems.length === 0) {
        this.logger.warn('No matching menu items found for WhatsApp order');
        return;
      }

      const totalAmount = subtotal;

      const order = await this.prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
          data: {
            branchId: branch.id,
            tenantId: data.tenantId,
            orderNumber,
            type: 'TAKEAWAY',
            channel: 'WHATSAPP',
            status: 'CONFIRMED',
            customerPhone: data.customerPhone,
            subtotal,
            taxAmount: 0,
            totalAmount,
            notes: `[WhatsApp Order] ${data.textContent}`,
            items: {
              create: validItems.map(item => ({
                menuItemId: item.menuItemId!,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice!,
                totalPrice: item.totalPrice!,
              })),
            },
          },
          include: {
            items: true,
            table: { select: { number: true } },
          },
        });

        await tx.orderStatusHistory.create({
          data: { orderId: createdOrder.id, status: 'CONFIRMED', notes: 'Order created from WhatsApp' },
        });

        return createdOrder;
      });

      await this.eventBus.orderCreated(data.tenantId, branch.id, {
        id: order.id,
        orderNumber: order.orderNumber,
        type: order.type,
        channel: 'WHATSAPP',
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
        customerPhone: data.customerPhone,
        createdAt: order.createdAt,
      });

      await this.eventBus.kitchenOrderCreated(data.tenantId, branch.id, {
        id: order.id,
        orderNumber: order.orderNumber,
        type: order.type,
        status: order.status,
        channel: 'WHATSAPP',
        priority: 'HIGH',
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
        items: order.items.map(i => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          notes: i.notes,
        })),
        customerPhone: data.customerPhone,
        createdAt: order.createdAt,
      });

      await this.eventBus.dashboardRefresh(data.tenantId, {
        type: 'whatsapp_order_created',
        orderId: order.id,
        orderNumber: order.orderNumber,
      });

      this.logger.log(`WhatsApp order ${orderNumber} created for tenant ${data.tenantId}`);
      return order;
    } catch (err) {
      this.logger.error(`Failed to create WhatsApp order: ${(err as Error).message}`);
    }
  }

  private parseOrderText(text: string): Array<{ name: string; quantity: number; menuItemId?: string; unitPrice?: number; totalPrice?: number }> {
    const items: Array<{ name: string; quantity: number }> = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      const match = line.match(/^(\d+)\s*[xX*]\s*(.+)$/) || line.match(/^(\d+)\s+(.+)$/);
      if (match) {
        items.push({ quantity: parseInt(match[1], 10), name: match[2].trim() });
        continue;
      }
      const singleMatch = line.match(/^(.+)$/);
      if (singleMatch && !line.match(/^(hi|hello|hey|order|please|want|i need|give me)/i)) {
        items.push({ quantity: 1, name: singleMatch[1].trim() });
      }
    }

    return items;
  }
}
