import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';

describe('SyncService', () => {
  let service: SyncService;
  let prisma: jest.Mocked<PrismaService>;
  let gateway: jest.Mocked<GatewayService>;

  const mockOrder = {
    id: 'order-1',
    branchId: 'branch-1',
    orderNumber: 101,
    type: 'DINE_IN',
    status: 'PENDING',
    subtotal: 500,
    taxAmount: 50,
    discountAmount: 0,
    totalAmount: 550,
    notes: null,
    localId: null,
    synced: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    customerName: null,
    customerPhone: null,
    tableId: null,
    staffId: null,
    kotPrinted: false,
    guestCount: null,
  };

  const mockPrisma = {
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    payment: { create: jest.fn() },
    category: { findMany: jest.fn() },
    menuItem: { findMany: jest.fn() },
    restaurantTable: { findMany: jest.fn() },
  };

  const mockGateway = { emitToBranch: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GatewayService, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    gateway = module.get(GatewayService) as jest.Mocked<GatewayService>;
  });

  describe('pushOfflineData', () => {
    it('should sync a new offline order', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      const result = await service.pushOfflineData('tenant-1', {
        orders: [{
          localId: 'local-1',
          branchId: 'branch-1',
          type: 'DINE_IN',
          status: 'PENDING',
          subtotal: 500,
          taxAmount: 50,
          totalAmount: 550,
          items: [{ menuItemId: 'menu-1', name: 'Butter Chicken', quantity: 2, unitPrice: 250 }],
        }],
        payments: [],
      });

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].localId).toBe('local-1');
      expect(result.orders[0].serverId).toBe('order-1');
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate sync via localId and skip', async () => {
      // Simulate already synced order
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.pushOfflineData('tenant-1', {
        orders: [{
          localId: 'local-1',
          branchId: 'branch-1',
          type: 'DINE_IN',
          status: 'PENDING',
          subtotal: 500,
          taxAmount: 50,
          totalAmount: 550,
          items: [],
        }],
        payments: [],
      });

      // Should still return success — idempotent
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].localId).toBe('local-1');
    });

    it('should sync offline payments', async () => {
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-1' });

      const result = await service.pushOfflineData('tenant-1', {
        orders: [],
        payments: [{
          localId: 'pay-local-1',
          orderId: 'order-1',
          branchId: 'branch-1',
          method: 'CASH',
          amount: 550,
        }],
      });

      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].localId).toBe('pay-local-1');
    });

    it('should handle errors gracefully and collect them', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);
      mockPrisma.order.create.mockRejectedValue(new Error('DB connection lost'));

      const result = await service.pushOfflineData('tenant-1', {
        orders: [{
          localId: 'local-1',
          branchId: 'branch-1',
          type: 'DINE_IN',
          status: 'PENDING',
          subtotal: 500,
          taxAmount: 50,
          totalAmount: 550,
          items: [],
        }],
        payments: [],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('order');
      expect(result.errors[0].localId).toBe('local-1');
    });
  });

  describe('pullLatestData', () => {
    it('should return data updated since last sync', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.menuItem.findMany.mockResolvedValue([]);
      mockPrisma.restaurantTable.findMany.mockResolvedValue([]);

      const result = await service.pullLatestData('tenant-1', '2026-07-01T00:00:00Z');

      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('menuItems');
      expect(result).toHaveProperty('tables');
      expect(result).toHaveProperty('syncedAt');
    });

    it('should use epoch if no lastSyncAt provided', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.menuItem.findMany.mockResolvedValue([]);
      mockPrisma.restaurantTable.findMany.mockResolvedValue([]);

      const result = await service.pullLatestData('tenant-1');

      expect(result.syncedAt).toBeDefined();
      // Should query with a date very close to epoch
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            updatedAt: expect.objectContaining({ gt: expect.any(Date) }),
          }),
        }),
      );
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status with unsynced count', async () => {
      mockPrisma.order.count.mockResolvedValue(0);

      const result = await service.getSyncStatus('tenant-1');

      expect(result).toMatchObject({
        tenantId: 'tenant-1',
        unsyncedOrders: 0,
      });
      expect(result).toHaveProperty('lastSyncAt');
    });

    it('should report unsynced orders count', async () => {
      mockPrisma.order.count.mockResolvedValue(5);

      const result = await service.getSyncStatus('tenant-1');

      expect(result.unsyncedOrders).toBe(5);
    });
  });
});
