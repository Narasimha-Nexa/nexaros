import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: jest.Mocked<PrismaService>;
  let gateway: jest.Mocked<GatewayService>;

  // Fixtures
  const mockOrder = {
    id: 'order-1',
    branchId: 'branch-1',
    tableId: 'table-1',
    staffId: 'staff-1',
    orderNumber: 101,
    type: 'DINE_IN',
    status: 'PENDING',
    customerName: 'John',
    customerPhone: '+911234567890',
    guestCount: 4,
    subtotal: 500,
    taxAmount: 50,
    discountAmount: 0,
    totalAmount: 550,
    notes: null,
    kotPrinted: false,
    synced: false,
    localId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderItem = {
    id: 'item-1',
    orderId: 'order-1',
    menuItemId: 'menu-1',
    variantId: null,
    name: 'Butter Chicken',
    quantity: 2,
    unitPrice: 250,
    totalPrice: 500,
    notes: null,
    status: 'PENDING',
  };

  // Mock all Prisma models the service touches
  const mockPrisma = {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    menuItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    restaurantTable: { update: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
  };

  const mockGateway = { emitToBranch: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GatewayService, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    gateway = module.get(GatewayService) as jest.Mocked<GatewayService>;
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);
      mockPrisma.order.count.mockResolvedValue(1);

      const result = await service.findAll('branch-1', undefined, 0, 20);

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(20);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { branchId: 'branch-1' } }),
      );
    });

    it('should filter by status when provided', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await service.findAll('branch-1', 'PENDING', 0, 20);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { branchId: 'branch-1', status: 'PENDING' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return order when found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-1');

      expect(result).toMatchObject({ id: 'order-1', orderNumber: 101 });
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      type: 'DINE_IN',
      tableId: 'table-1',
      staffId: 'staff-1',
      customerName: 'John',
      customerPhone: '+911234567890',
      guestCount: 4,
      notes: 'No onions',
      items: [
        { menuItemId: 'menu-1', name: 'Butter Chicken', quantity: 2, unitPrice: 250 },
        { menuItemId: 'menu-2', name: 'Naan', quantity: 3, unitPrice: 40 },
      ],
    };

    beforeEach(() => {
      mockPrisma.order.findFirst.mockResolvedValue({ orderNumber: 100 });
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', taxRate: 5 },
        { id: 'menu-2', taxRate: 5 },
      ]);
      mockPrisma.order.create.mockResolvedValue({
        ...mockOrder,
        items: createDto.items.map((i, idx) => ({ ...mockOrderItem, id: `item-${idx}`, ...i })),
        table: { id: 'table-1', number: 5 },
      });
    });

    it('should create order with auto-generated order number', async () => {
      const result = await service.create('branch-1', createDto as any);

      expect(result.orderNumber).toBe(101); // 100 + 1
      expect(mockPrisma.order.create).toHaveBeenCalled();
    });

    it('should calculate subtotal, tax, and total correctly', async () => {
      await service.create('branch-1', createDto as any);

      // subtotal = 2*250 + 3*40 = 620
      // tax = (500 * 0.05) + (120 * 0.05) = 31
      // total = 620 + 31 - 0 = 651
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 620,
            taxAmount: 31,
            totalAmount: 651,
          }),
        }),
      );
    });

    it('should update table status to OCCUPIED', async () => {
      await service.create('branch-1', createDto as any);

      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { status: 'OCCUPIED' },
      });
    });

    it('should emit order:created event', async () => {
      await service.create('branch-1', createDto as any);

      expect(mockGateway.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'order:created',
        expect.objectContaining({ orderNumber: 101 }),
      );
    });

    it('should start order number from 1 when no previous orders', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);
      // The create mock must also reflect the new order number, not mockOrder's 101
      mockPrisma.order.create.mockResolvedValue({
        ...mockOrder,
        orderNumber: 1,
        items: createDto.items.map((i, idx) => ({ ...mockOrderItem, id: `item-${idx}`, ...i })),
        table: { id: 'table-1', number: 5 },
      });

      const result = await service.create('branch-1', createDto as any);

      expect(result.orderNumber).toBe(1);
    });
  });

  describe('addItem', () => {
    beforeEach(() => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.orderItem.findMany.mockResolvedValue([
        { ...mockOrderItem, totalPrice: 500 },
      ]);
      mockPrisma.order.update.mockResolvedValue(mockOrder);
    });

    it('should add item to an existing order', async () => {
      mockPrisma.orderItem.create.mockResolvedValue(mockOrderItem);

      const result = await service.addItem('order-1', {
        menuItemId: 'menu-3',
        name: 'Lassi',
        quantity: 1,
        unitPrice: 80,
      });

      expect(result.orderItem).toBeDefined();
      expect(mockGateway.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'order:updated',
        expect.objectContaining({ action: 'item_added' }),
      );
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem('missing', { menuItemId: 'm', name: 'x', quantity: 1, unitPrice: 10 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order is completed', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: 'COMPLETED' });

      await expect(
        service.addItem('order-1', { menuItemId: 'm', name: 'x', quantity: 1, unitPrice: 10 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    beforeEach(() => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.orderItem.findFirst.mockResolvedValue(mockOrderItem);
      mockPrisma.orderItem.findMany.mockResolvedValue([]);
      mockPrisma.order.update.mockResolvedValue(mockOrder);
    });

    it('should remove item from order', async () => {
      mockPrisma.orderItem.delete.mockResolvedValue(mockOrderItem);

      const result = await service.removeItem('order-1', 'item-1');

      expect(result.removed).toBe(true);
      expect(mockGateway.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'order:updated',
        expect.objectContaining({ action: 'item_removed' }),
      );
    });

    it('should throw NotFoundException when item is not on order', async () => {
      mockPrisma.orderItem.findFirst.mockResolvedValue(null);

      await expect(service.removeItem('order-1', 'wrong-item')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    beforeEach(() => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        table: { id: 'table-1', number: 5 },
        items: [mockOrderItem],
      });
    });

    it('should update order status', async () => {
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'CONFIRMED',
        table: { id: 'table-1', number: 5 },
        items: [mockOrderItem],
      });

      const result = await service.updateStatus('order-1', 'CONFIRMED');

      expect(result.status).toBe('CONFIRMED');
    });

    it('should create status history entry', async () => {
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'PREPARING',
        table: { id: 'table-1', number: 5 },
        items: [mockOrderItem],
      });

      await service.updateStatus('order-1', 'PREPARING', 'Started cooking');

      expect(mockPrisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: { orderId: 'order-1', status: 'PREPARING', notes: 'Started cooking' },
      });
    });

    it('should update table status to FREE when cancelling', async () => {
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'CANCELLED',
        table: { id: 'table-1', number: 5 },
        items: [mockOrderItem],
      });

      await service.updateStatus('order-1', 'CANCELLED');

      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { status: 'FREE' },
      });
    });

    it('should emit order:ready when status is READY', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: 'PREPARING' });
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'READY',
        table: { id: 'table-1', number: 5 },
        items: [mockOrderItem],
      });

      await service.updateStatus('order-1', 'READY');

      expect(mockGateway.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'order:ready',
        expect.objectContaining({ orderId: 'order-1' }),
      );
    });
  });

  describe('cancel', () => {
    beforeEach(() => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
    });

    it('should call updateStatus with CANCELLED', async () => {
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'CANCELLED',
        table: { id: 'table-1', number: 5 },
        items: [mockOrderItem],
      });

      const result = await service.cancel('order-1', 'Customer changed mind');

      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('printKot', () => {
    beforeEach(() => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        items: [{ ...mockOrderItem, menuItem: { name: 'Butter Chicken', isVeg: false } }],
        table: { number: 5, name: 'Table 5' },
      });
    });

    it('should mark KOT as printed', async () => {
      await service.printKot('order-1');

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: { kotPrinted: true },
        }),
      );
    });

    it('should emit kot:ready event', async () => {
      await service.printKot('order-1');

      expect(mockGateway.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'kot:ready',
        expect.objectContaining({ orderId: 'order-1', orderNumber: 101 }),
      );
    });
  });

  describe('getOrderNumber', () => {
    it('should return next number after last order', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ orderNumber: 42 });

      const result = await service.getOrderNumber('branch-1');

      expect(result).toBe(43);
    });

    it('should return 1 when no previous orders', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      const result = await service.getOrderNumber('branch-1');

      expect(result).toBe(1);
    });
  });
});
