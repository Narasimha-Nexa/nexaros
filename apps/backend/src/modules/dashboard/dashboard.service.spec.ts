import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: jest.Mocked<PrismaService>;

  const mockOrder = {
    id: 'order-1',
    branchId: 'branch-1',
    status: 'COMPLETED',
    totalAmount: 250.0,
    createdAt: new Date(),
    orderNumber: 101,
  };

  const mockPayment = {
    id: 'pay-1',
    branchId: 'branch-1',
    orderId: 'order-1',
    amount: 250.0,
    method: 'CASH',
    status: 'COMPLETED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTable = {
    id: 'table-1',
    branchId: 'branch-1',
    number: 5,
    name: 'Table 5',
    status: 'OCCUPIED',
    capacity: 4,
    qrCode: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
    },
    restaurantTable: {
      findMany: jest.fn(),
    },
    inventoryItem: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('getStats', () => {
    it('should return aggregated dashboard stats', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);
      mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);
      mockPrisma.restaurantTable.findMany.mockResolvedValue([mockTable]);
      mockPrisma.inventoryItem.findMany.mockResolvedValue([]);

      const result = await service.getStats('branch-1');

      expect(result.summary).toMatchObject({
        totalOrders: 1,
        totalRevenue: 250.0,
      });
      expect(result.statusBreakdown).toMatchObject({ completed: 1 });
      expect(result.tableOccupancy).toMatchObject({ total: 1, occupied: 1 });
      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('paymentBreakdown');
      expect(result).toHaveProperty('lowStockItems');
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders with table and staff info', async () => {
      const mockOrderWithRelations = {
        ...mockOrder,
        type: 'DINE_IN',
        customerName: 'John',
        table: { number: 5, name: 'Table 5' },
        staff: { user: { name: 'Alice' } },
      };
      mockPrisma.order.findMany.mockResolvedValue([mockOrderWithRelations]);

      const result = await service.getRecentOrders('branch-1', 5);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('table');
      expect(result[0]).toHaveProperty('staff');
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });
});
