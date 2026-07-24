import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  // ─── Partners ───

  async createPartner(data: {
    tenantId: string;
    name: string;
    phone: string;
    email?: string;
    vehicleType?: string;
    licensePlate?: string;
    branchId?: string;
  }) {
    return this.prisma.deliveryPartner.create({
      data: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        vehicleType: (data.vehicleType as any) || 'BIKE',
        licensePlate: data.licensePlate,
      },
    });
  }

  async findAllPartners(tenantId: string, branchId?: string) {
    return this.prisma.deliveryPartner.findMany({
      where: { tenantId, ...(branchId ? { branchId } : {}), deletedAt: null },
      include: { _count: { select: { deliveries: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findPartner(id: string, tenantId: string) {
    const partner = await this.prisma.deliveryPartner.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: { select: { deliveries: true } },
        deliveries: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { order: { select: { orderNumber: true, totalAmount: true, type: true } } },
        },
      },
    });
    if (!partner) throw new NotFoundException('Delivery partner not found');
    return partner;
  }

  async updatePartner(id: string, tenantId: string, data: any) {
    const partner = await this.prisma.deliveryPartner.findFirst({ where: { id, tenantId } });
    if (!partner) throw new NotFoundException('Delivery partner not found');
    return this.prisma.deliveryPartner.update({ where: { id }, data });
  }

  async deletePartner(id: string, tenantId: string) {
    const partner = await this.prisma.deliveryPartner.findFirst({ where: { id, tenantId } });
    if (!partner) throw new NotFoundException('Delivery partner not found');
    return this.prisma.deliveryPartner.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  async updatePartnerLocation(id: string, latitude: number, longitude: number) {
    return this.prisma.deliveryPartner.update({
      where: { id },
      data: { latitude, longitude },
    });
  }

  // ─── Deliveries ───

  async assignDelivery(deliveryId: string, partnerId: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');

    const partner = await this.prisma.deliveryPartner.findUnique({ where: { id: partnerId } });
    if (!partner || !partner.isActive) throw new BadRequestException('Partner not available');

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { partnerId, status: 'ASSIGNED', assignedAt: new Date() },
      include: { partner: true, order: { select: { orderNumber: true, customerName: true, customerPhone: true } } },
    });

    // Update partner's delivery count
    await this.prisma.deliveryPartner.update({
      where: { id: partnerId },
      data: { totalDeliveries: { increment: 1 } },
    });

    // Emit real-time event
    this.eventBus.emitToBranch(delivery.branchId || '', 'delivery:assigned', {
      deliveryId: updated.id,
      orderNumber: updated.order?.orderNumber,
      partnerName: partner.name,
      partnerPhone: partner.phone,
      status: 'ASSIGNED',
    });

    return updated;
  }

  async unassignDelivery(deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { partnerId: null, status: 'PENDING', assignedAt: null },
    });
  }

  async updateDeliveryStatus(deliveryId: string, status: string, location?: { lat: number; lng: number }) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');

    const timestampFields: any = {};
    if (status === 'PICKED_UP') timestampFields.pickedUpAt = new Date();
    if (status === 'DELIVERED') timestampFields.deliveredAt = new Date();

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: status as any, ...timestampFields },
      include: { partner: true, order: { select: { orderNumber: true } } },
    });

    // Record location if provided
    if (location) {
      await this.prisma.deliveryLocation.create({
        data: {
          deliveryId,
          latitude: location.lat,
          longitude: location.lng,
        },
      });
    }

    // Emit real-time event
    this.eventBus.emitToBranch(delivery.branchId || '', 'delivery:status-changed', {
      deliveryId: updated.id,
      orderNumber: updated.order?.orderNumber,
      status: updated.status,
      partnerName: updated.partner?.name,
    });

    return updated;
  }

  async recordLocation(deliveryId: string, latitude: number, longitude: number, speed?: number, accuracy?: number) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');

    const location = await this.prisma.deliveryLocation.create({
      data: { deliveryId, latitude, longitude, speed, accuracy },
    });

    // Also update partner's current location
    if (delivery.partnerId) {
      await this.prisma.deliveryPartner.update({
        where: { id: delivery.partnerId },
        data: { latitude, longitude },
      });
    }

    // Emit real-time location update
    this.eventBus.emitToBranch(delivery.branchId || '', 'delivery:location', {
      deliveryId,
      latitude,
      longitude,
      speed,
      timestamp: location.timestamp,
    });

    return location;
  }

  // ─── Queries ───

  async getActiveDeliveries(branchId?: string) {
    const where: any = {
      status: { in: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
      ...(branchId ? { branchId } : {}),
    };
    return this.prisma.delivery.findMany({
      where,
      include: {
        partner: { select: { id: true, name: true, phone: true, vehicleType: true, latitude: true, longitude: true } },
        order: { select: { orderNumber: true, customerName: true, customerPhone: true, totalAmount: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDeliveryHistory(branchId?: string, page = 1, limit = 20) {
    const where: any = {
      status: { in: ['DELIVERED', 'FAILED', 'CANCELLED'] },
      ...(branchId ? { branchId } : {}),
    };
    const [deliveries, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          partner: { select: { id: true, name: true, phone: true } },
          order: { select: { orderNumber: true, customerName: true, totalAmount: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.delivery.count({ where }),
    ]);
    return { deliveries, total, page, pages: Math.ceil(total / limit) };
  }

  async getDashboardStats(branchId?: string) {
    const where = branchId ? { branchId } : {};

    const [activeCount, pendingCount, todayCount, partners] = await Promise.all([
      this.prisma.delivery.count({
        where: { ...where, status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } },
      }),
      this.prisma.delivery.count({
        where: { ...where, status: 'PENDING' },
      }),
      this.prisma.delivery.count({
        where: {
          ...where,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.deliveryPartner.count({
        where: { ...(branchId ? { branchId } : {}), isActive: true },
      }),
    ]);

    return { activeCount, pendingCount, todayCount, availablePartners: partners };
  }

  async findDeliveryByOrder(orderId: string) {
    return this.prisma.delivery.findFirst({
      where: { orderId },
      include: {
        partner: { select: { id: true, name: true, phone: true, vehicleType: true, latitude: true, longitude: true } },
        order: { select: { orderNumber: true, customerName: true, customerPhone: true, totalAmount: true, type: true } },
        locations: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
    });
  }

  async getDeliveryLocations(deliveryId: string) {
    return this.prisma.deliveryLocation.findMany({
      where: { deliveryId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getPendingOrdersForDelivery(branchId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        type: 'DELIVERY',
        status: { in: ['READY', 'SERVED'] },
        // Exclude orders that already have a delivery
        deliveries: { none: {} },
      },
      include: {
        items: {
          include: { menuItem: { select: { name: true, isVeg: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    return orders;
  }

  async createDeliveryFromOrder(orderId: string, customerAddress?: string, customerLat?: number, customerLng?: number) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const existing = await this.prisma.delivery.findFirst({ where: { orderId } });
    if (existing) throw new BadRequestException('Delivery already exists for this order');

    return this.prisma.delivery.create({
      data: {
        orderId,
        branchId: order.branchId,
        status: 'PENDING',
        customerAddress: customerAddress || order.notes,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerLat,
        customerLng,
      },
      include: {
        order: { select: { orderNumber: true, customerName: true, totalAmount: true } },
      },
    });
  }

  async autoAssign(partnerPreference?: string) {
    // Find the highest priority pending delivery
    const pendingDelivery = await this.prisma.delivery.findFirst({
      where: { status: 'PENDING', partnerId: null },
      orderBy: { createdAt: 'asc' },
    });
    if (!pendingDelivery) throw new NotFoundException('No pending deliveries');

    // Find best available partner
    const partner = await this.prisma.deliveryPartner.findFirst({
      where: {
        isActive: true,
        ...(partnerPreference ? { vehicleType: partnerPreference as any } : {}),
        // Partners with fewer active deliveries preferred
      },
      orderBy: { totalDeliveries: 'asc' },
    });
    if (!partner) throw new NotFoundException('No available delivery partners');

    return this.assignDelivery(pendingDelivery.id, partner.id);
  }

  // ─── Public Tracking ───

  async trackDeliveryPublic(orderId: string, token?: string) {
    const delivery = await this.prisma.delivery.findFirst({
      where: { orderId, deletedAt: null },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
            latitude: true,
            longitude: true,
            rating: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            totalAmount: true,
            type: true,
            status: true,
            createdAt: true,
          },
        },
        locations: {
          orderBy: { timestamp: 'desc' },
          take: 50,
          select: {
            latitude: true,
            longitude: true,
            speed: true,
            timestamp: true,
          },
        },
      },
    });

    if (!delivery) return null;

    const statusTimeline = [
      { status: 'PENDING', label: 'Order placed', timestamp: delivery.createdAt },
      { status: 'ASSIGNED', label: 'Delivery partner assigned', timestamp: delivery.assignedAt },
      { status: 'PICKED_UP', label: 'Picked up from restaurant', timestamp: delivery.pickedUpAt },
      { status: 'IN_TRANSIT', label: 'On the way', timestamp: null },
      { status: 'DELIVERED', label: 'Delivered', timestamp: delivery.deliveredAt },
    ].filter((s) => {
      const idx = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].indexOf(s.status);
      const currentIdx = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED'].indexOf(delivery.status);
      return idx <= currentIdx || s.timestamp !== null;
    });

    return {
      id: delivery.id,
      status: delivery.status,
      customerAddress: delivery.customerAddress,
      customerName: delivery.customerName,
      estimatedArrival: null,
      partner: delivery.partner,
      order: delivery.order,
      locations: delivery.locations,
      statusTimeline,
      createdAt: delivery.createdAt,
    };
  }
}
