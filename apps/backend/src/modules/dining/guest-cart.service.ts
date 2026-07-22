import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class GuestCartService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  private async validateGuest(guestSessionId: string) {
    const guest = await this.prisma.guestSession.findFirst({
      where: { id: guestSessionId, leftAt: null },
      include: {
        diningSession: {
          select: { id: true, branchId: true, status: true, tableId: true, table: { select: { number: true } } },
        },
      },
    });
    if (!guest) throw new NotFoundException('Guest session not found or guest has left');
    if (guest.diningSession.status === 'CLOSED' || guest.diningSession.status === 'SETTLED') {
      throw new BadRequestException('Dining session is closed');
    }
    return guest;
  }

  async getCart(guestSessionId: string) {
    await this.validateGuest(guestSessionId);

    const items = await this.prisma.guestCartItem.findMany({
      where: { guestSessionId },
      include: {
        menuItem: {
          select: { id: true, name: true, image: true, isVeg: true, isAvailable: true },
        },
      },
      orderBy: { addedAt: 'asc' },
    });

    const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    return { items, subtotal, itemCount: items.length };
  }

  async addToCart(guestSessionId: string, dto: AddCartItemDto) {
    const guest = await this.validateGuest(guestSessionId);

    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id: dto.menuItemId, isAvailable: true, deletedAt: null },
    });
    if (!menuItem) throw new NotFoundException('Menu item not found or unavailable');

    const existingItem = await this.prisma.guestCartItem.findFirst({
      where: {
        guestSessionId,
        menuItemId: dto.menuItemId,
        variantId: dto.variantId || null,
      },
    });

    let cartItem;
    if (existingItem) {
      const newQty = existingItem.quantity + dto.quantity;
      const newTotal = new Decimal(dto.unitPrice).mul(newQty);
      cartItem = await this.prisma.guestCartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
          totalPrice: newTotal,
          notes: dto.notes || existingItem.notes,
        },
        include: { menuItem: { select: { id: true, name: true, image: true, isVeg: true } } },
      });
    } else {
      const total = new Decimal(dto.unitPrice).mul(dto.quantity);
      cartItem = await this.prisma.guestCartItem.create({
        data: {
          guestSessionId,
          menuItemId: dto.menuItemId,
          variantId: dto.variantId,
          name: dto.name,
          quantity: dto.quantity,
          unitPrice: new Decimal(dto.unitPrice),
          totalPrice: total,
          notes: dto.notes,
        },
        include: { menuItem: { select: { id: true, name: true, image: true, isVeg: true } } },
      });
    }

    await this.prisma.guestSession.update({
      where: { id: guestSessionId },
      data: { lastActivityAt: new Date(), status: 'ORDERING' },
    });

    this.eventBus.emitToBranch(guest.diningSession.branchId, 'dining:cart-updated', {
      sessionId: guest.diningSessionId,
      guestSessionId,
      guestNumber: guest.guestNumber,
      action: existingItem ? 'updated' : 'added',
      itemName: dto.name,
    });

    return this.getCart(guestSessionId);
  }

  async updateCartItem(guestSessionId: string, cartItemId: string, dto: UpdateCartItemDto) {
    await this.validateGuest(guestSessionId);

    const existing = await this.prisma.guestCartItem.findFirst({
      where: { id: cartItemId, guestSessionId },
    });
    if (!existing) throw new NotFoundException('Cart item not found');

    if (dto.quantity !== undefined && dto.quantity <= 0) {
      await this.prisma.guestCartItem.delete({ where: { id: cartItemId } });
      return this.getCart(guestSessionId);
    }

    const newTotal = dto.quantity
      ? new Decimal(existing.unitPrice).mul(dto.quantity)
      : existing.totalPrice;

    await this.prisma.guestCartItem.update({
      where: { id: cartItemId },
      data: {
        ...(dto.quantity !== undefined && { quantity: dto.quantity, totalPrice: newTotal }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return this.getCart(guestSessionId);
  }

  async removeFromCart(guestSessionId: string, cartItemId: string) {
    await this.validateGuest(guestSessionId);

    const existing = await this.prisma.guestCartItem.findFirst({
      where: { id: cartItemId, guestSessionId },
    });
    if (!existing) throw new NotFoundException('Cart item not found');

    await this.prisma.guestCartItem.delete({ where: { id: cartItemId } });
    return this.getCart(guestSessionId);
  }

  async clearCart(guestSessionId: string) {
    await this.validateGuest(guestSessionId);
    await this.prisma.guestCartItem.deleteMany({ where: { guestSessionId } });
    return this.getCart(guestSessionId);
  }

  async placeOrder(guestSessionId: string) {
    const guest = await this.validateGuest(guestSessionId);

    const cartItems = await this.prisma.guestCartItem.findMany({
      where: { guestSessionId },
    });
    if (cartItems.length === 0) throw new BadRequestException('Cart is empty');

    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    const latestOrderNumber = await this.prisma.order.findFirst({
      where: { branchId: guest.diningSession.branchId },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    const orderNumber = (latestOrderNumber?.orderNumber || 0) + 1;

    const order = await this.prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          tenantId: guest.diningSession.branchId ? (await tx.branch.findUnique({ where: { id: guest.diningSession.branchId } }))!.tenantId : '',
          branchId: guest.diningSession.branchId,
          tableId: guest.diningSession.tableId ?? undefined,
          diningSessionId: guest.diningSessionId,
          guestSessionId,
          orderNumber,
          type: 'QR_ORDER',
          status: 'CONFIRMED',
          orderSource: 'QR',
          channel: 'QR',
          customerName: guest.guestName,
          guestCount: 1,
          subtotal: new Decimal(subtotal),
          taxAmount: new Decimal(0),
          discountAmount: new Decimal(0),
          totalAmount: new Decimal(subtotal),
        },
      });

      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: o.id,
            menuItemId: item.menuItemId,
            variantId: item.variantId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            totalPrice: new Decimal(item.totalPrice),
            notes: item.notes,
            status: 'PENDING',
          },
        });
      }

      await tx.guestCartItem.deleteMany({ where: { guestSessionId } });

      await tx.guestSession.update({
        where: { id: guestSessionId },
        data: { status: 'ORDERED', lastActivityAt: new Date() },
      });

      await tx.sessionTimeline.create({
        data: {
          diningSessionId: guest.diningSessionId,
          event: 'order.placed',
          description: `Guest ${guest.guestNumber || '?'} placed order #${orderNumber} (${cartItems.length} items, ₹${subtotal})`,
          metadata: { guestSessionId, orderId: o.id, orderNumber, itemCount: cartItems.length, total: subtotal },
        },
      });

      return o;
    });

    const fullOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, table: { select: { number: true } } },
    });

    this.eventBus.emitToBranch(guest.diningSession.branchId, 'dining:order-placed', {
      sessionId: guest.diningSessionId,
      guestSessionId,
      guestNumber: guest.guestNumber,
      orderId: order.id,
      orderNumber,
      itemCount: cartItems.length,
      total: subtotal,
    });

    return fullOrder;
  }
}
