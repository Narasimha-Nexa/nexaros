import { Test, TestingModule } from '@nestjs/testing';
import { PublicService } from './public.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PublicService', () => {
  let service: PublicService;
  let prisma: jest.Mocked<PrismaService>;
  let gateway: jest.Mocked<GatewayService>;

  const mockTenant = {
    id: 'tenant-1',
    name: 'Spice Garden',
    slug: 'spice-garden',
    logo: null,
    phone: '+911234567890',
    email: 'info@spice.com',
    address: '123 Food St',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  };

  const mockPrisma = {
    tenant: { findUnique: jest.fn() },
    branch: { findMany: jest.fn() },
    category: { findMany: jest.fn() },
    menuItem: { findMany: jest.fn() },
    restaurantTable: { findFirst: jest.fn(), update: jest.fn() },
    order: { findFirst: jest.fn(), create: jest.fn() },
    plan: { findMany: jest.fn() },
  };

  const mockGatewayService = {
    emitToBranch: jest.fn(),
    emitToTenant: jest.fn(),
    emitToRoom: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GatewayService, useValue: mockGatewayService },
      ],
    }).compile();

    service = module.get<PublicService>(PublicService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    gateway = module.get(GatewayService) as jest.Mocked<GatewayService>;
  });

  describe('getTenantBySlug', () => {
    it('should return tenant by slug (active only)', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.getTenantBySlug('spice-garden');

      expect(result).toMatchObject({ name: 'Spice Garden', slug: 'spice-garden' });
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'spice-garden', isActive: true },
        select: expect.objectContaining({ id: true, name: true, slug: true }),
      });
    });

    it('should throw NotFoundException when not found or inactive', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.getTenantBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTenantMenu', () => {
    it('should return grouped categories with items, variants, addOns', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.branch.findMany.mockResolvedValue([
        { id: 'branch-1', name: 'Main' },
      ]);
      mockPrisma.category.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Starters', description: 'Appetizers', sortOrder: 1 },
        { id: 'cat-2', name: 'Mains', description: 'Main courses', sortOrder: 2 },
      ]);
      mockPrisma.menuItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          name: 'Samosa',
          description: 'Crispy pastry',
          price: 80,
          isVeg: true,
          categoryId: 'cat-1',
          prepTimeMin: 10,
          variants: [{ id: 'v-1', name: 'Large', price: 120 }],
          addOns: [{ id: 'a-1', name: 'Extra chutney', price: 20 }],
          images: [{ url: 'https://img.test/samosa.jpg' }],
        },
        {
          id: 'item-2',
          name: 'Biryani',
          description: 'Fragrant rice',
          price: 250,
          isVeg: false,
          categoryId: 'cat-2',
          prepTimeMin: 20,
          variants: [],
          addOns: [],
          images: [],
        },
      ]);

      const result = await service.getTenantMenu('spice-garden');

      expect(result.tenant.id).toBe('tenant-1');
      expect(result.defaultBranch.id).toBe('branch-1');
      expect(result.categories).toHaveLength(2);
      expect(result.totalItems).toBe(2);

      const starters = result.categories[0];
      expect(starters.name).toBe('Starters');
      expect(starters.items).toHaveLength(1);
      expect(starters.items[0].price).toBe(80);
      expect(starters.items[0].variants).toHaveLength(1);
      expect(starters.items[0].addOns).toHaveLength(1);
      expect(starters.items[0].image).toBe('https://img.test/samosa.jpg');

      const mains = result.categories[1];
      expect(mains.items[0].image).toBeNull();
    });
  });

  describe('getTableByQrCode', () => {
    it('should return table info with branch and tenant details', async () => {
      const mockTable = {
        id: 'tbl-1',
        number: 5,
        name: 'Window Seat',
        capacity: 4,
        status: 'AVAILABLE',
        branchId: 'branch-1',
        branch: {
          id: 'branch-1',
          name: 'Main Branch',
          tenantId: 'tenant-1',
          tenant: { slug: 'spice-garden', name: 'Spice Garden' },
        },
      };
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(mockTable);

      const result = await service.getTableByQrCode('qr-abc-123');

      expect(result.id).toBe('tbl-1');
      expect(result.number).toBe(5);
      expect(result.branchName).toBe('Main Branch');
      expect(result.tenantSlug).toBe('spice-garden');
      expect(result.tenantName).toBe('Spice Garden');
    });

    it('should throw NotFoundException for invalid QR', async () => {
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);

      await expect(service.getTableByQrCode('invalid-qr')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createOrder', () => {
    it('should create order with tax calculation from menu items', async () => {
      const mockItems = [
        { id: 'item-1', taxRate: 5 },
        { id: 'item-2', taxRate: 12 },
      ];
      mockPrisma.menuItem.findMany.mockResolvedValue(mockItems);

      const mockOrder = {
        id: 'order-1',
        orderNumber: 1,
        type: 'DINE_IN',
        status: 'PENDING',
        totalAmount: 379.6,
        table: { number: 5 },
        createdAt: new Date(),
      };
      mockPrisma.order.findFirst.mockResolvedValue(null);
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      const result = await service.createOrder({
        branchId: 'branch-1',
        tableId: 'tbl-1',
        type: 'DINE_IN',
        customerName: 'Rahul',
        guestCount: 2,
        items: [
          { menuItemId: 'item-1', name: 'Samosa', quantity: 2, unitPrice: 80 },
          { menuItemId: 'item-2', name: 'Biryani', quantity: 1, unitPrice: 200 },
        ],
      });

      expect(result.orderNumber).toBe(1);
      expect(result.status).toBe('PENDING');
      expect(result.items).toBe(2);

      const createCall = mockPrisma.order.create.mock.calls[0][0];
      expect(createCall.data.branchId).toBe('branch-1');
      expect(createCall.data.tableId).toBe('tbl-1');
      expect(createCall.data.subtotal).toBe(360);
      expect(createCall.data.taxAmount).toBe(32);
      expect(createCall.data.totalAmount).toBe(392);

      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith({
        where: { id: 'tbl-1' },
        data: { status: 'OCCUPIED' },
      });

      expect(gateway.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'order:created',
        expect.objectContaining({ orderNumber: 1 }),
      );
    });

    it('should throw BadRequestException when items array is empty', async () => {
      await expect(
        service.createOrder({
          branchId: 'branch-1',
          type: 'TAKEAWAY',
          items: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should increment order number from last order', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ orderNumber: 42 });
      mockPrisma.menuItem.findMany.mockResolvedValue([]);
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-2',
        orderNumber: 43,
        type: 'TAKEAWAY',
        status: 'PENDING',
        totalAmount: 0,
        table: null,
        createdAt: new Date(),
      });

      const result = await service.createOrder({
        branchId: 'branch-1',
        type: 'TAKEAWAY',
        items: [{ menuItemId: 'i1', name: 'Tea', quantity: 1, unitPrice: 30 }],
      });

      expect(result.orderNumber).toBe(43);
    });
  });

  describe('submitContactMessage', () => {
    it('should save contact message and return success', async () => {
      const result = await service.submitContactMessage({
        name: 'Priya',
        email: 'priya@test.com',
        message: 'Great service!',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Thank you');
    });

    it('should throw BadRequestException when fields are missing', async () => {
      await expect(
        service.submitContactMessage({ name: '', email: '', message: '' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPlans', () => {
    it('should return active subscription plans', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          name: 'Starter',
          price: 999,
          billingCycle: 'monthly',
          maxBranches: 1,
          maxStaff: 5,
          features: { onlineOrdering: true },
        },
        {
          id: 'plan-2',
          name: 'Pro',
          price: 2999,
          billingCycle: 'monthly',
          maxBranches: 5,
          maxStaff: 25,
          features: { onlineOrdering: true, analytics: true },
        },
      ];
      mockPrisma.plan.findMany.mockResolvedValue(mockPlans);

      const result = await service.getPlans();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Starter');
      expect(result[1].name).toBe('Pro');
      expect(mockPrisma.plan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          orderBy: { price: 'asc' },
        }),
      );
    });
  });
});
