import { Test, TestingModule } from '@nestjs/testing';
import { KitchenService } from './kitchen.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';
import { NotFoundException } from '@nestjs/common';

describe('KitchenService', () => {
  let service: KitchenService;
  let prisma: jest.Mocked<PrismaService>;
  let gateway: jest.Mocked<GatewayService>;

  const mockOrder = {
    id: 'order-1',
    branchId: 'branch-1',
    orderNumber: 101,
    tableId: 'table-1',
    status: 'PENDING',
    type: 'DINE_IN',
    createdAt: new Date(),
    updatedAt: new Date(),
    subtotal: 500,
    taxAmount: 50,
    discountAmount: 0,
    totalAmount: 550,
    customerName: null,
    customerPhone: null,
    guestCount: null,
    notes: null,
    kotPrinted: false,
    synced: false,
    localId: null,
    staffId: null,
    table: { id: 'table-1', number: 5, name: 'Table 5' },
    staff: { id: 'staff-1', name: 'Waiter' },
    items: [
      {
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
        menuItem: { name: 'Butter Chicken', isVeg: false, prepTimeMin: 20, id: 'menu-1' },
        addOns: [],
      },
    ],
    statusHistory: [{ id: 'sh-1', orderId: 'order-1', status: 'PENDING', notes: 'Order created', createdAt: new Date() }],
    tableNumber: 5,
    tableName: 'Table 5',
  };

  const mockPrisma = {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    orderItem: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    orderStatusHistory: { create: jest.fn() },
    restaurantTable: { update: jest.fn() },
    menuItem: {
      findUnique: jest.fn(),
    },
    recipeItem: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    inventoryItem: { update: jest.fn() },
    stockMovement: { create: jest.fn() },
  };

  const mockGateway = { emitToBranch: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KitchenService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GatewayService, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<KitchenService>(KitchenService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    gateway = module.get(GatewayService) as jest.Mocked<GatewayService>;
  });

  describe('getActiveOrders', () => {
    it('should return orders in PENDING, CONFIRMED, PREPARING, or READY status', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await service.getActiveOrders('branch-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            branchId: 'branch-1',
            status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
          },
        }),
      );
    });

    it('should return empty array when no active orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await service.getActiveOrders('branch-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getCompletedOrders', () => {
    it('should return completed orders from last 5 minutes', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await service.getCompletedOrders('branch-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: 'branch-1',
            status: 'COMPLETED',
          }),
        }),
      );
    });
  });

  describe('updateOrderStatus', () => {
    beforeEach(() => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
    });

    it('should transition from PENDING to CONFIRMED', async () => {
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: 'CONFIRMED' });

      const result = await service.updateOrderStatus('order-1', 'CONFIRMED');

      expect(result.status).toBe('CONFIRMED');
    });

    it('should transition from PREPARING to READY', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: 'PREPARING' });
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: 'READY' });

      const result = await service.updateOrderStatus('order-1', 'READY');

      expect(result.status).toBe('READY');
    });

    it('should reject invalid transition (PENDING -> SERVED)', async () => {
      await expect(
        service.updateOrderStatus('order-1', 'SERVED'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should deduct inventory when moving to PREPARING', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: 'PREPARING' });
      mockPrisma.menuItem.findUnique.mockResolvedValue({
        id: 'menu-1',
        inventoryItems: [{ id: 'inv-1', name: 'Chicken', unit: 'kg', currentStock: 10 }],
      });

      await service.updateOrderStatus('order-1', 'PREPARING');

      expect(mockPrisma.stockMovement.create).toHaveBeenCalled();
      expect(mockPrisma.inventoryItem.update).toHaveBeenCalled();
    });

    it('should emit order:ready when status is READY', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: 'PREPARING' });
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: 'READY' });

      await service.updateOrderStatus('order-1', 'READY');

      expect(mockGateway.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'order:ready',
        expect.any(Object),
      );
    });

    it('should update table to ORDER_READY when order is READY', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: 'PREPARING' });
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: 'READY' });

      await service.updateOrderStatus('order-1', 'READY');

      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { status: 'ORDER_READY' },
      });
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus('missing', 'CONFIRMED'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateItemStatus', () => {
    it('should update individual item status', async () => {
      mockPrisma.orderItem.findFirst.mockResolvedValue(mockOrder.items[0]);
      mockPrisma.orderItem.update.mockResolvedValue({ ...mockOrder.items[0], status: 'PREPARING' });

      const result = await service.updateItemStatus('order-1', 'item-1', 'PREPARING');

      expect(result.status).toBe('PREPARING');
    });

    it('should throw NotFoundException for non-existent item', async () => {
      mockPrisma.orderItem.findFirst.mockResolvedValue(null);

      await expect(
        service.updateItemStatus('order-1', 'missing', 'PREPARING'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getKotData', () => {
    it('should return KOT data for an order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getKotData('order-1');

      expect(result).toMatchObject({ id: 'order-1', orderNumber: 101 });
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.getKotData('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
