import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';
import { OrderType, TableStatus } from '@prisma/client';

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: GatewayService,
  ) {}

  async getTenantBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        phone: true,
        email: true,
        address: true,
        currency: true,
        timezone: true,
      },
    });
    if (!tenant) throw new NotFoundException('Restaurant not found');
    return tenant;
  }

  async getTenantMenu(slug: string) {
    const tenant = await this.getTenantBySlug(slug);

    // Get the primary/default branch for ordering
    const branches = await this.prisma.branch.findMany({
      where: { tenantId: tenant.id, isActive: true },
      take: 1,
      select: { id: true, name: true },
    });
    const defaultBranch = branches[0] || null;

    const categories = await this.prisma.category.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const items = await this.prisma.menuItem.findMany({
      where: { tenantId: tenant.id, isAvailable: true },
      include: {
        category: { select: { id: true, name: true } },
        variants: { where: { isActive: true } },
        addOns: { where: { isActive: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Group by category for easy frontend rendering
    const grouped = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      items: items
        .filter((i) => i.categoryId === cat.id)
        .map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          price: Number(i.price),
          isVeg: i.isVeg,
          image: i.images[0]?.url || null,
          variants: i.variants.map((v) => ({ id: v.id, name: v.name, price: Number(v.price) })),
          addOns: i.addOns.map((a) => ({ id: a.id, name: a.name, price: Number(a.price) })),
          prepTimeMin: i.prepTimeMin,
        })),
    }));

    return {
      tenant,
      defaultBranch,
      categories: grouped,
      totalItems: items.length,
    };
  }

  async getTableByQrCode(qrCode: string) {
    const table = await this.prisma.restaurantTable.findFirst({
      where: { qrCode, isActive: true },
      include: {
        branch: {
          select: { id: true, name: true, tenantId: true, tenant: { select: { slug: true, name: true } } },
        },
      },
    });
    if (!table) throw new NotFoundException('Table not found');
    return {
      id: table.id,
      number: table.number,
      name: table.name,
      capacity: table.capacity,
      status: table.status,
      branchId: table.branchId,
      branchName: table.branch.name,
      tenantSlug: table.branch.tenant.slug,
      tenantName: table.branch.tenant.name,
    };
  }

  async createOrder(dto: { branchId: string; tableId?: string; type: string; customerName?: string; customerPhone?: string; guestCount?: number; items: { menuItemId: string; name: string; quantity: number; unitPrice: number; notes?: string }[] }) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    // Get next order number
    const lastOrder = await this.prisma.order.findFirst({
      where: { branchId: dto.branchId },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    const orderNumber = (lastOrder?.orderNumber || 0) + 1;

    // Fetch menu items to get per-item tax rates
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, taxRate: true },
    });
    const taxRateMap = new Map(menuItems.map((mi) => [mi.id, Number(mi.taxRate) || 5]));

    let subtotal = 0;
    let taxAmount = 0;
    for (const item of dto.items) {
      const itemTotal = item.unitPrice * item.quantity;
      subtotal += itemTotal;
      const rate = taxRateMap.get(item.menuItemId) ?? 5;
      taxAmount += Math.round(itemTotal * (rate / 100) * 100) / 100;
    }
    taxAmount = Math.round(taxAmount * 100) / 100;
    const totalAmount = subtotal + taxAmount;

    const order = await this.prisma.order.create({
      data: {
        branchId: dto.branchId,
        tableId: dto.tableId || null,
        orderNumber,
        type: dto.type as OrderType,
        status: 'PENDING',
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        guestCount: dto.guestCount,
        subtotal,
        taxAmount,
        totalAmount,
        items: {
          create: dto.items.map((i) => ({
            menuItemId: i.menuItemId,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.unitPrice * i.quantity,
            notes: i.notes,
          })),
        },
        statusHistory: {
          create: {
            status: 'PENDING',
            notes: 'Order placed via customer portal',
          },
        },
      },
      include: {
        items: true,
        table: { select: { number: true } },
      },
    });

    // Update table status if table is provided
    if (dto.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: dto.tableId },
        data: { status: 'OCCUPIED' as TableStatus },
      });
    }

    // Broadcast to staff devices
    this.gateway.emitToBranch(dto.branchId, 'order:created', {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      tableNumber: order.table?.number,
      itemCount: dto.items.length,
      totalAmount: order.totalAmount,
    });

    // Also notify the customer's tracking page via public namespace
    this.gateway.emitToOrder(order.id, 'order:created', {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      itemCount: dto.items.length,
      customerName: dto.customerName,
    });

    return {
      id: order.id,
      orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      items: dto.items.length,
      createdAt: order.createdAt,
    };
  }

  async trackOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        type: true,
        customerName: true,
        totalAmount: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: { name: true, quantity: true, status: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { status: true, notes: true, createdAt: true },
        },
        table: { select: { number: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Estimate remaining time based on status
    let estimatedMinutes = 0;
    switch (order.status) {
      case 'PENDING': estimatedMinutes = 20; break;
      case 'CONFIRMED': estimatedMinutes = 15; break;
      case 'PREPARING': estimatedMinutes = 10; break;
      case 'READY': estimatedMinutes = 2; break;
      default: estimatedMinutes = 0;
    }

    return { ...order, totalAmount: Number(order.totalAmount), estimatedMinutes };
  }

  async getPlans() {
    return this.prisma.platformPlan.findMany({
      where: { isActive: true },
      include: { entitlements: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async submitContactMessage(dto: { name: string; email: string; message: string }) {
    if (!dto.name?.trim() || !dto.email?.trim() || !dto.message?.trim()) {
      throw new BadRequestException('Name, email, and message are required');
    }
    this.logger.log(`[CONTACT] From: ${dto.name} <${dto.email}> - ${dto.message.substring(0, 100)}`);
    return { success: true, message: 'Thank you for your message. We will get back to you shortly.' };
  }

  /** Find branch by table QR code for direct ordering */
  async getBranchByTableQr(qrCodeOrId: string) {
    const table = await this.prisma.restaurantTable.findFirst({
      where: {
        isActive: true,
        OR: [
          { qrCode: qrCodeOrId },
          { id: qrCodeOrId },
        ],
      },
      include: {
        branch: {
          select: { id: true, name: true, tenantId: true },
        },
      },
    });
    if (!table) throw new NotFoundException('Table not found');

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: table.branch.tenantId },
      select: { slug: true, name: true, currency: true },
    });

    return {
      tableId: table.id,
      tableNumber: table.number,
      branchId: table.branch.id,
      branchName: table.branch.name,
      tenantSlug: tenant?.slug,
      tenantName: tenant?.name,
      currency: tenant?.currency || 'INR',
    };
  }
}
