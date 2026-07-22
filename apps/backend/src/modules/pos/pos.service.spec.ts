import { Test, TestingModule } from '@nestjs/testing';
import { PosService } from './pos.service';
import { PrismaService, requestContext } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PosService', () => {
  let service: PosService;
  let prisma: jest.Mocked<PrismaService>;
  let eventBus: jest.Mocked<EventBusService>;

  const mockCategory = {
    id: 'cat-1',
    branchId: 'branch-1',
    name: 'Beverages',
    description: 'Drinks',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMenuItem = {
    id: 'item-1',
    categoryId: 'cat-1',
    branchId: 'branch-1',
    name: 'Cola',
    price: 50,
    description: 'Cold drink',
    isVeg: true,
    isActive: true,
    isAvailable: true,
    sortOrder: 0,
    image: null,
    images: [],
    variants: [],
    addOns: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder = {
    id: 'order-1',
    branchId: 'branch-1',
    staffId: 'staff-1',
    orderNumber: 1,
    type: 'DINE_IN',
    tableId: 'table-1',
    status: 'PENDING',
    subtotal: 100,
    discountAmount: 0,
    totalAmount: 100,
    customerName: null,
    customerPhone: null,
    guestCount: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'oi-1',
        orderId: 'order-1',
        menuItemId: 'item-1',
        name: 'Cola',
        quantity: 2,
        unitPrice: 50,
        totalPrice: 100,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    payments: [],
    table: null,
  };

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
    },
    menuItem: {
      findMany: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    restaurantTable: {
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
  };

  const mockEventBus = {
    emitToBranch: jest.fn(),
    emitToTenant: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    eventBus = module.get(EventBusService) as jest.Mocked<EventBusService>;

  });

  describe('getMenu', () => {
    it('should return categories with items grouped', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);
      mockPrisma.menuItem.findMany.mockResolvedValue([mockMenuItem]);

      const result = await requestContext.run({ tenantId: 'tenant-1' }, () =>
        service.getMenu('branch-1'),
      );

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].name).toBe('Beverages');
      expect(result.categories[0].items).toHaveLength(1);
      expect(result.categories[0].items[0].name).toBe('Cola');
      expect(result).toHaveProperty('uncategorized');
    });
  });

  describe('createOrder', () => {
    const dto = {
      type: 'DINE_IN' as const,
      tableId: 'table-1',
      items: [{ menuItemId: 'item-1', name: 'Cola', quantity: 2, unitPrice: 50 }],
    };

    it('should create an order with items and update table status', async () => {
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.restaurantTable.update.mockResolvedValue({} as any);

      const result = await service.createOrder('branch-1', 'staff-1', dto);

      expect(result).toHaveProperty('id', 'order-1');
      expect(mockPrisma.restaurantTable.update).toHaveBeenCalled();
      expect(mockEventBus.emitToBranch).toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty items', async () => {
      await expect(
        service.createOrder('branch-1', 'staff-1', { type: 'DINE_IN', items: [] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('closeOrder', () => {
    const dto = { paymentMethod: 'CASH', tenderedAmount: 200, tip: 10 };

    it('should close an order with payment and emit events', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder as any);
      mockPrisma.payment.create.mockResolvedValue({} as any);
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'COMPLETED',
        payments: [{ method: 'CASH', amount: 100 }],
      } as any);
      mockPrisma.restaurantTable.update.mockResolvedValue({} as any);

      const result = await service.closeOrder('order-1', 'branch-1', dto);

      expect(result.status).toBe('COMPLETED');
      expect(mockPrisma.payment.create).toHaveBeenCalled();
      expect(mockEventBus.emitToBranch).toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.closeOrder('missing', 'branch-1', {})).rejects.toThrow(NotFoundException);
    });
  });
});
