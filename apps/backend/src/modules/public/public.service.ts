import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RedisService } from '../../common/redis/redis.service';
import { OrderType, TableStatus } from '@prisma/client';
import { OffersService } from '../offers/offers.service';
import { AnnouncementsService } from '../announcements/announcements.service';
import { GalleryService } from '../gallery/gallery.service';

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);
  private readonly CACHE_TTL = 120; // 2 minutes

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private redis: RedisService,
    private offersService: OffersService,
    private announcementsService: AnnouncementsService,
    private galleryService: GalleryService,
  ) {}

  async getTenantBySlug(slug: string) {
    const cacheKey = `public:tenant:${slug}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

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
    await this.redis.set(cacheKey, tenant, this.CACHE_TTL);
    return tenant;
  }

  async getTenantMenu(slug: string) {
    const menuCacheKey = `public:menu:${slug}`;
    const cached = await this.redis.get<any>(menuCacheKey);
    if (cached) return cached;

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
          isPopular: i.isPopular,
          isBestSeller: i.isBestSeller,
          isChefRecommendation: i.isChefRecommendation,
          isTodaySpecial: i.isTodaySpecial,
          isNew: i.isNew,
          isSeasonal: i.isSeasonal,
          image: i.images[0]?.url || null,
          variants: i.variants.map((v) => ({ id: v.id, name: v.name, price: Number(v.price) })),
          addOns: i.addOns.map((a) => ({ id: a.id, name: a.name, price: Number(a.price) })),
          prepTimeMin: i.prepTimeMin,
        })),
    }));

    const result = {
      tenant,
      defaultBranch,
      categories: grouped,
      totalItems: items.length,
    };

    await this.redis.set(menuCacheKey, result, this.CACHE_TTL);
    return result;
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

    // Get branch's tenantId for event bus
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
      select: { tenantId: true },
    });

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
        tenantId: branch?.tenantId || '',
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
    await this.eventBus.orderCreated(branch?.tenantId || '', dto.branchId, {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      tableNumber: order.table?.number,
      itemCount: dto.items.length,
      totalAmount: order.totalAmount,
    });

    // Also notify the customer's tracking page via public namespace
    await this.eventBus.orderTrackingEvent(order.id, 'order:created', {
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

  async getWebsiteConfig(slug: string) {
    const cacheKey = `public:website:${slug}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

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
        city: true,
        state: true,
        currency: true,
        timezone: true,
        businessType: true,
      },
    });
    if (!tenant) throw new NotFoundException('Restaurant not found');

    const websiteConfig = await this.prisma.tenantWebsiteConfig.findUnique({
      where: { tenantId: tenant.id },
    });

    const categories = await this.prisma.category.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, description: true },
    });

    const branches = await this.prisma.branch.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: { id: true, name: true, address: true },
    });

    const branchIds = branches.map((b) => b.id);
    const tables = branchIds.length > 0
      ? await this.prisma.restaurantTable.findMany({
          where: { branchId: { in: branchIds }, isActive: true },
          select: { id: true, number: true, name: true, capacity: true, status: true, branchId: true },
          orderBy: { number: 'asc' },
        })
      : [];

    const result = {
      tenant,
      website: websiteConfig
        ? {
            restaurantName: websiteConfig.restaurantName,
            tagline: websiteConfig.tagline,
            logo: websiteConfig.logo,
            favicon: websiteConfig.favicon,
            phone: websiteConfig.phone,
            email: websiteConfig.email,
            address: websiteConfig.address,
            mapUrl: websiteConfig.mapUrl,
            whatsappNumber: websiteConfig.whatsappNumber,
            primaryColor: websiteConfig.primaryColor,
            secondaryColor: websiteConfig.secondaryColor,
            accentColor: websiteConfig.accentColor,
            fontHeading: websiteConfig.fontHeading,
            fontBody: websiteConfig.fontBody,
            borderRadius: websiteConfig.borderRadius,
            containerWidth: websiteConfig.containerWidth,
            features: websiteConfig.features,
            seo: websiteConfig.seo,
            openingHours: websiteConfig.openingHours,
            socialLinks: websiteConfig.socialLinks,
            analytics: websiteConfig.analytics,
            legalPages: websiteConfig.legalPages,
            homeSections: websiteConfig.homeSections,
          }
        : null,
      categories,
      branches,
      tables,
    };

    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async submitContactMessage(dto: {
    name: string;
    email: string;
    message: string;
    phone?: string;
    subject?: string;
    tenantId?: string;
  }) {
    if (!dto.name?.trim() || !dto.email?.trim() || !dto.message?.trim()) {
      throw new BadRequestException('Name, email, and message are required');
    }

    // Find tenant if tenantId not provided (from first active tenant, or skip persistence)
    let tenantId = dto.tenantId;
    if (!tenantId) {
      const tenant = await this.prisma.tenant.findFirst({ where: { isActive: true }, select: { id: true } });
      tenantId = tenant?.id;
    }

    if (tenantId) {
      await this.prisma.contactMessage.create({
        data: {
          tenantId,
          name: dto.name.trim(),
          email: dto.email.trim(),
          phone: dto.phone || null,
          subject: dto.subject || null,
          message: dto.message.trim(),
        },
      });
    }

    this.logger.log(`[CONTACT] From: ${dto.name} <${dto.email}> - ${dto.message.substring(0, 100)}`);
    return { success: true, message: 'Thank you for your message. We will get back to you shortly.' };
  }

  async validateCoupon(slug: string, code: string, orderAmount?: number) {
    if (!code?.trim()) {
      throw new BadRequestException('Coupon code is required');
    }

    // Resolve tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!tenant) throw new NotFoundException('Restaurant not found');

    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        isActive: true,
      },
    });

    if (!coupon) {
      throw new NotFoundException('Invalid coupon code');
    }

    if (coupon.expiry < new Date()) {
      throw new BadRequestException('This coupon has expired');
    }

    if (coupon.maxTotalUses) {
      const usageCount = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id },
      });
      if (usageCount >= coupon.maxTotalUses) {
        throw new BadRequestException('This coupon usage limit has been reached');
      }
    }

    const discount =
      coupon.type === 'PERCENTAGE'
        ? orderAmount
          ? Math.min((orderAmount * Number(coupon.value)) / 100, Number(coupon.maxDiscount || Infinity))
          : Number(coupon.value)
        : Number(coupon.value);

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      discount,
      festivalTag: coupon.festivalTag,
    };
  }

  // ─── Subdomain Resolution ───

  async getTenantBySubdomain(subdomain: string) {
    const cacheKey = `public:subdomain:${subdomain}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        customDomain: true,
        logo: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        currency: true,
        timezone: true,
        businessType: true,
      },
    });
    if (!tenant) throw new NotFoundException('Restaurant not found');
    await this.redis.set(cacheKey, tenant, this.CACHE_TTL);
    return tenant;
  }

  async getWebsiteConfigBySubdomain(subdomain: string) {
    const tenant = await this.getTenantBySubdomain(subdomain);
    return this.getWebsiteConfig(tenant.slug);
  }

  // ─── Public Website Business Content (delegates to dedicated modules) ───

  async getPublicOffers(slug: string) {
    return this.offersService.getPublicBySlug(slug);
  }

  async getPublicAnnouncements(slug: string) {
    return this.announcementsService.getPublicBySlug(slug);
  }

  async getPublicGallery(slug: string) {
    return this.galleryService.getPublicBySlug(slug);
  }

  // ─── Public Reservations ───

  async createPublicReservation(slug: string, data: {
    customerName: string;
    customerPhone: string;
    date: string;
    time: string;
    guestCount: number;
    occasion?: string;
    specialRequests?: string;
  }) {
    const tenant = await this.getTenantBySlug(slug);

    const branches = await this.prisma.branch.findMany({
      where: { tenantId: tenant.id, isActive: true },
      take: 1,
    });
    const branch = branches[0];
    if (!branch) throw new BadRequestException('No active branch found');

    // Normalize the time to 24h HH:mm so Date parsing is valid regardless of
    // whether the client sends "11:00 AM" or "11:00".
    const normalizedTime = this.normalizeTime(data.time);
    if (!normalizedTime) throw new BadRequestException(`Invalid time format: ${data.time}`);

    const reservationDate = new Date(`${data.date}T${normalizedTime}`);
    if (Number.isNaN(reservationDate.getTime())) {
      throw new BadRequestException(`Invalid reservation date/time: ${data.date} ${data.time}`);
    }

    const availableTables = await this.prisma.restaurantTable.findMany({
      where: {
        branchId: branch.id,
        isActive: true,
        capacity: { gte: data.guestCount },
        status: 'FREE' as any,
      },
      orderBy: { capacity: 'asc' },
      take: 1,
    });

    const table = availableTables[0] || null;

    const reservation = await this.prisma.reservation.create({
      data: {
        tenantId: tenant.id,
        tableId: table?.id || null,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        date: reservationDate,
        time: normalizedTime,
        guestCount: data.guestCount,
        notes: [data.occasion && `Occasion: ${data.occasion}`, data.specialRequests].filter(Boolean).join(' | ') || null,
        status: 'CONFIRMED',
        createdBy: null,
      },
    });

    this.logger.log(`[RESERVATION] ${tenant.name}: ${data.customerName} (${data.guestCount} guests) on ${data.date} at ${data.time}`);

    return {
      id: reservation.id,
      date: reservation.date.toISOString(),
      time: reservation.time,
      guestCount: reservation.guestCount,
      status: 'confirmed',
      tableNumber: table?.number || null,
      restaurantName: tenant.name,
    };
  }

  async getAvailableSlots(slug: string, date: string) {
    const tenant = await this.getTenantBySlug(slug);
    const branches = await this.prisma.branch.findMany({
      where: { tenantId: tenant.id, isActive: true },
      take: 1,
    });
    const branch = branches[0];
    if (!branch) return [];

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedReservations = await this.prisma.reservation.findMany({
      where: {
        tenantId: tenant.id,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['CONFIRMED'] },
      },
      select: { time: true },
    });

    const bookedTimes = new Set(bookedReservations.map(r => r.time));
    const allSlots: string[] = [];

    for (let h = 11; h <= 22; h++) {
      const hour12 = h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      const slots = [`${hour12}:00 ${ampm}`, `${hour12}:30 ${ampm}`];
      for (const slot of slots) {
        if (h === 22 && slot.includes(':30')) continue;
        allSlots.push(slot);
      }
    }

    return allSlots.filter(s => !bookedTimes.has(s));
  }

  /**
   * Normalize a time string to 24h "HH:mm". Accepts "11:00 AM", "11:00 PM",
   * "23:00", or "11:00". Returns null for unparseable input.
   */
  private normalizeTime(time: string): string | null {
    if (!time || typeof time !== 'string') return null;
    const trimmed = time.trim();

    const hm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (!hm) return null;
    let hour = parseInt(hm[1], 10);
    const minute = parseInt(hm[2], 10);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

    const meridiem = hm[3]?.toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
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
