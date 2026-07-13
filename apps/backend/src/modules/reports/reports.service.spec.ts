import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportFilterDto } from './dto/report-filter.dto';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: jest.Mocked<PrismaService>;

  const branch1 = { id: 'branch-1', name: 'Downtown' };
  const branch2 = { id: 'branch-2', name: 'Uptown' };
  const tenantId = 'tenant-1';

  // Orders across different days
  const orderDay1 = {
    id: 'order-1',
    branchId: branch1.id,
    tableId: 'table-1',
    orderNumber: 101,
    type: 'DINE_IN',
    status: 'COMPLETED',
    totalAmount: 1200,
    subtotal: 1100,
    taxAmount: 100,
    discountAmount: 0,
    notes: null,
    kotPrinted: true,
    synced: true,
    localId: null,
    staffId: 'staff-1',
    customerName: 'Alice',
    customerPhone: null,
    guestCount: 2,
    createdAt: new Date('2026-07-10T10:30:00Z'),
    updatedAt: new Date('2026-07-10T11:00:00Z'),
    branch: branch1,
    payments: [
      { id: 'pay-1', amount: 800, method: 'CASH', status: 'COMPLETED' },
      { id: 'pay-2', amount: 400, method: 'UPI', status: 'COMPLETED' },
    ],
    staff: null,
  };

  const orderDay2a = {
    id: 'order-2',
    branchId: branch1.id,
    tableId: 'table-2',
    orderNumber: 102,
    type: 'DINE_IN',
    status: 'COMPLETED',
    totalAmount: 2400,
    subtotal: 2200,
    taxAmount: 200,
    discountAmount: 0,
    notes: 'Anniversary',
    kotPrinted: true,
    synced: true,
    localId: null,
    staffId: 'staff-2',
    customerName: 'Bob',
    customerPhone: '+911234567890',
    guestCount: 4,
    createdAt: new Date('2026-07-11T12:00:00Z'),
    updatedAt: new Date('2026-07-11T12:45:00Z'),
    branch: branch1,
    payments: [
      { id: 'pay-3', amount: 2400, method: 'CREDIT_CARD', status: 'COMPLETED' },
    ],
    staff: null,
  };

  const orderDay2b = {
    id: 'order-3',
    branchId: branch1.id,
    tableId: 'table-3',
    orderNumber: 103,
    type: 'TAKEAWAY',
    status: 'SERVED',
    totalAmount: 600,
    subtotal: 550,
    taxAmount: 50,
    discountAmount: 0,
    notes: null,
    kotPrinted: true,
    synced: true,
    localId: null,
    staffId: 'staff-1',
    customerName: 'Charlie',
    customerPhone: null,
    guestCount: null,
    createdAt: new Date('2026-07-11T19:00:00Z'),
    updatedAt: new Date('2026-07-11T19:15:00Z'),
    branch: branch1,
    payments: [
      { id: 'pay-4', amount: 600, method: 'CASH', status: 'COMPLETED' },
    ],
    staff: null,
  };

  const orderStaff1 = {
    ...orderDay1,
    id: 'order-4',
    staffId: 'staff-1',
    totalAmount: 1500,
    createdAt: new Date('2026-07-10T14:00:00Z'),
    payments: [{ id: 'pay-5', amount: 1500, method: 'UPI', status: 'COMPLETED' }],
    staff: { id: 'staff-1', name: 'John', role: { name: 'Waiter' } },
  };

  const orderStaff2a = {
    ...orderDay2a,
    id: 'order-5',
    staffId: 'staff-2',
    totalAmount: 800,
    createdAt: new Date('2026-07-11T10:00:00Z'),
    payments: [{ id: 'pay-6', amount: 800, method: 'CASH', status: 'COMPLETED' }],
    staff: { id: 'staff-2', name: 'Jane', role: { name: 'Chef' } },
  };

  const orderStaff2b = {
    ...orderDay2b,
    id: 'order-6',
    staffId: 'staff-2',
    totalAmount: 2000,
    createdAt: new Date('2026-07-11T18:00:00Z'),
    payments: [{ id: 'pay-7', amount: 2000, method: 'CREDIT_CARD', status: 'COMPLETED' }],
    staff: { id: 'staff-2', name: 'Jane', role: { name: 'Chef' } },
  };

  const mockOrderItem1 = {
    id: 'oi-1',
    orderId: 'order-1',
    menuItemId: 'menu-1',
    variantId: null,
    name: 'Butter Chicken',
    quantity: 2,
    unitPrice: 350,
    totalPrice: 700,
    notes: null,
    status: 'SERVED',
    menuItem: {
      name: 'Butter Chicken',
      isVeg: false,
      costPrice: 200,
      category: { id: 'cat-1', name: 'Main Course' },
    },
  };

  const mockOrderItem2 = {
    id: 'oi-2',
    orderId: 'order-1',
    menuItemId: 'menu-2',
    variantId: null,
    name: 'Naan',
    quantity: 4,
    unitPrice: 40,
    totalPrice: 160,
    notes: null,
    status: 'SERVED',
    menuItem: {
      name: 'Naan',
      isVeg: true,
      costPrice: 15,
      category: { id: 'cat-2', name: 'Breads' },
    },
  };

  const mockOrderItem3 = {
    id: 'oi-3',
    orderId: 'order-2',
    menuItemId: 'menu-3',
    variantId: null,
    name: 'Chicken Biryani',
    quantity: 3,
    unitPrice: 400,
    totalPrice: 1200,
    notes: null,
    status: 'SERVED',
    menuItem: {
      name: 'Chicken Biryani',
      isVeg: false,
      costPrice: 250,
      category: { id: 'cat-1', name: 'Main Course' },
    },
  };

  const mockOrderItem4 = {
    id: 'oi-4',
    orderId: 'order-2',
    menuItemId: 'menu-4',
    variantId: null,
    name: 'Gulab Jamun',
    quantity: 6,
    unitPrice: 50,
    totalPrice: 300,
    notes: null,
    status: 'SERVED',
    menuItem: {
      name: 'Gulab Jamun',
      isVeg: true,
      costPrice: 20,
      category: { id: 'cat-3', name: 'Desserts' },
    },
  };

  const mockOrderItem5 = {
    id: 'oi-5',
    orderId: 'order-3',
    menuItemId: 'menu-1',
    variantId: null,
    name: 'Butter Chicken',
    quantity: 1,
    unitPrice: 350,
    totalPrice: 350,
    notes: null,
    status: 'SERVED',
    menuItem: {
      name: 'Butter Chicken',
      isVeg: false,
      costPrice: 200,
      category: { id: 'cat-1', name: 'Main Course' },
    },
  };

  const mockStockMovement1 = {
    id: 'sm-1',
    inventoryItemId: 'inv-1',
    type: 'SALE',
    quantity: 2,
    unit: 'kg',
    createdAt: new Date('2026-07-10T10:30:00Z'),
    inventoryItem: {
      name: 'Chicken Breast',
      unit: 'kg',
      currentStock: 5,
      minimumStock: 3,
    },
  };

  const mockStockMovement2 = {
    id: 'sm-2',
    inventoryItemId: 'inv-2',
    type: 'SALE',
    quantity: 0.5,
    unit: 'litre',
    createdAt: new Date('2026-07-10T10:30:00Z'),
    inventoryItem: {
      name: 'Cooking Oil',
      unit: 'litre',
      currentStock: 1,
      minimumStock: 2,
    },
  };

  const mockStockMovement3 = {
    id: 'sm-3',
    inventoryItemId: 'inv-1',
    type: 'SALE',
    quantity: 1.5,
    unit: 'kg',
    createdAt: new Date('2026-07-11T12:00:00Z'),
    inventoryItem: {
      name: 'Chicken Breast',
      unit: 'kg',
      currentStock: 5,
      minimumStock: 3,
    },
  };

  const mockPrisma = {
    order: { findMany: jest.fn() },
    orderItem: { findMany: jest.fn() },
    stockMovement: { findMany: jest.fn() },
  };

  const defaultDto: ReportFilterDto = {
    startDate: '2026-07-10',
    endDate: '2026-07-11',
    branchId: undefined,
    format: 'PDF',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  // ---------- dailySales ----------

  describe('dailySales', () => {
    it('should group orders by day with totals and averages', async () => {
      mockPrisma.order.findMany.mockResolvedValue([orderDay1, orderDay2a, orderDay2b]);

      const result = await service.dailySales(tenantId, defaultDto);

      expect(result.daily).toHaveLength(2);

      // Day 1 (2026-07-10): 1 order, total 1200
      const day1 = result.daily.find((d) => d.date === '2026-07-10');
      expect(day1).toBeDefined();
      expect(day1!.totalOrders).toBe(1);
      expect(day1!.totalRevenue).toBe(1200);
      expect(day1!.averageOrderValue).toBe(1200);
      expect(day1!.paymentBreakdown).toEqual({ CASH: 800, UPI: 400 });

      // Day 2 (2026-07-11): 2 orders, total 3000
      const day2 = result.daily.find((d) => d.date === '2026-07-11');
      expect(day2).toBeDefined();
      expect(day2!.totalOrders).toBe(2);
      expect(day2!.totalRevenue).toBe(3000);
      expect(day2!.averageOrderValue).toBe(1500);
      expect(day2!.paymentBreakdown).toEqual({ CREDIT_CARD: 2400, CASH: 600 });

      // Totals
      expect(result.totals.totalOrders).toBe(3);
      expect(result.totals.totalRevenue).toBe(4200);
      expect(result.totals.averageOrderValue).toBe(1400);
      expect(result.totals.period).toEqual({ start: '2026-07-10', end: '2026-07-11' });
    });

    it('should filter by branchId when provided', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const dtoWithBranch: ReportFilterDto = { ...defaultDto, branchId: branch1.id };
      await service.dailySales(tenantId, dtoWithBranch);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ branchId: branch1.id }),
        }),
      );
    });

    it('should query with tenantId and status filter', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      await service.dailySales(tenantId, defaultDto);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            branch: { tenantId },
            branchId: undefined,
            createdAt: { gte: new Date('2026-07-10'), lte: new Date('2026-07-11T23:59:59.999Z') },
            status: { in: ['COMPLETED', 'SERVED'] },
          },
        }),
      );
    });

    it('should handle an empty order set', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await service.dailySales(tenantId, defaultDto);

      expect(result.daily).toHaveLength(0);
      expect(result.totals.totalOrders).toBe(0);
      expect(result.totals.totalRevenue).toBe(0);
      expect(result.totals.averageOrderValue).toBe(0);
    });

    it('should use "earliest"/"latest" when dates are not provided', async () => {
      mockPrisma.order.findMany.mockResolvedValue([orderDay1]);

      const result = await service.dailySales(tenantId, {});

      expect(result.totals.period).toEqual({ start: 'earliest', end: 'latest' });
    });
  });

  // ---------- revenue ----------

  describe('revenue', () => {
    it('should return revenue breakdown by category and item', async () => {
      mockPrisma.orderItem.findMany.mockResolvedValue([mockOrderItem1, mockOrderItem2, mockOrderItem3, mockOrderItem4]);

      const result = await service.revenue(tenantId, defaultDto);

      // byCategory — sorted descending by totalRevenue
      expect(result.byCategory).toHaveLength(3);
      expect(result.byCategory[0].categoryName).toBe('Main Course');
      expect(result.byCategory[0].totalRevenue).toBe(1900); // 700 + 1200
      expect(result.byCategory[0].orderCount).toBe(2);

      expect(result.byCategory[1].categoryName).toBe('Desserts');
      expect(result.byCategory[1].totalRevenue).toBe(300);

      expect(result.byCategory[2].categoryName).toBe('Breads');
      expect(result.byCategory[2].totalRevenue).toBe(160);

      // byItem — sorted descending by totalRevenue
      expect(result.byItem).toHaveLength(4);
      expect(result.byItem[0].itemName).toBe('Chicken Biryani');
      expect(result.byItem[0].totalRevenue).toBe(1200);
      expect(result.byItem[0].quantity).toBe(3);

      expect(result.byItem[1].itemName).toBe('Butter Chicken');
      expect(result.byItem[1].totalRevenue).toBe(700);
      expect(result.byItem[1].quantity).toBe(2);
      expect(result.byItem[1].isVeg).toBe(false);
    });

    it('should handle items without a category', async () => {
      const itemNoCat = {
        ...mockOrderItem1,
        menuItem: { ...mockOrderItem1.menuItem, category: null },
      };
      mockPrisma.orderItem.findMany.mockResolvedValue([itemNoCat]);

      const result = await service.revenue(tenantId, defaultDto);

      expect(result.byCategory[0].categoryName).toBe('Uncategorized');
    });
  });

  // ---------- itemPerformance ----------

  describe('itemPerformance', () => {
    it('should return top selling and low performing items', async () => {
      mockPrisma.orderItem.findMany.mockResolvedValue([mockOrderItem1, mockOrderItem2, mockOrderItem3, mockOrderItem4]);

      const result = await service.itemPerformance(tenantId, defaultDto);

      expect(result.items).toHaveLength(4);

      // Top selling — highest quantity first: Gulab Jamun (6), Naan (4), Biryani (3), Butter Chicken (2)
      expect(result.topSelling).toHaveLength(4);
      expect(result.topSelling[0].name).toBe('Gulab Jamun');
      expect(result.topSelling[0].quantity).toBe(6);
      expect(result.topSelling[0].revenue).toBe(300);
      expect(result.topSelling[0].costPrice).toBe(20);
      expect(result.topSelling[0].profit).toBe(180); // 300 - (20 * 6)

      expect(result.topSelling[1].name).toBe('Naan');
      expect(result.topSelling[1].profit).toBe(100); // 160 - (15 * 4)

      // Low performing — lowest quantity first: Butter Chicken (2), then Biryani (3)
      expect(result.lowPerforming).toHaveLength(4);
      expect(result.lowPerforming[0].name).toBe('Butter Chicken');
      expect(result.lowPerforming[0].quantity).toBe(2);
    });

    it('should limit topSelling to 20 and lowPerforming to 10', async () => {
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        ...mockOrderItem1,
        id: `oi-${i}`,
        name: `Item ${i}`,
        quantity: i + 1,
        totalPrice: (i + 1) * 100,
        menuItem: {
          name: `Item ${i}`,
          category: { name: 'Test' },
          costPrice: 10,
        },
      }));
      mockPrisma.orderItem.findMany.mockResolvedValue(manyItems);

      const result = await service.itemPerformance(tenantId, defaultDto);

      expect(result.topSelling).toHaveLength(20);
      expect(result.lowPerforming).toHaveLength(10);
    });

    it('should handle items with no menuItem reference', async () => {
      const itemNoRef = {
        ...mockOrderItem1,
        menuItemId: null,
        menuItem: null,
        name: 'Custom Item',
        totalPrice: 500,
        quantity: 1,
      };
      mockPrisma.orderItem.findMany.mockResolvedValue([itemNoRef]);

      const result = await service.itemPerformance(tenantId, defaultDto);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Custom Item');
      expect(result.items[0].category).toBe('Uncategorized');
      expect(result.items[0].costPrice).toBe(0);
      expect(result.items[0].profit).toBe(500); // 500 - 0
    });
  });

  // ---------- peakHours ----------

  describe('peakHours', () => {
    it('should return hourly order and revenue breakdown sorted by hour', async () => {
      const localOrder1 = { ...orderDay1, createdAt: new Date('2026-07-10T10:30:00') };
      const localOrder2a = { ...orderDay2a, createdAt: new Date('2026-07-11T12:00:00') };
      const localOrder2b = { ...orderDay2b, createdAt: new Date('2026-07-11T19:00:00') };
      mockPrisma.order.findMany.mockResolvedValue([localOrder1, localOrder2a, localOrder2b]);

      const result = await service.peakHours(tenantId, defaultDto);

      // orderDay1: 10:30 -> "10:00"
      // orderDay2a: 12:00 -> "12:00"
      // orderDay2b: 19:00 -> "19:00"
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ hour: '10:00', orderCount: 1, revenue: 1200 });
      expect(result[1]).toEqual({ hour: '12:00', orderCount: 1, revenue: 2400 });
      expect(result[2]).toEqual({ hour: '19:00', orderCount: 1, revenue: 600 });
    });

    it('should aggregate multiple orders in the same hour', async () => {
      const sameHourOrder1 = { ...orderDay1, createdAt: new Date('2026-07-10T10:00:00'), totalAmount: 500 };
      const sameHourOrder2 = { ...orderDay2a, createdAt: new Date('2026-07-10T10:15:00'), totalAmount: 300 };
      mockPrisma.order.findMany.mockResolvedValue([sameHourOrder1, sameHourOrder2]);

      const result = await service.peakHours(tenantId, defaultDto);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ hour: '10:00', orderCount: 2, revenue: 800 });
    });

    it('should query without status filter', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      await service.peakHours(tenantId, defaultDto);

      const callArgs = mockPrisma.order.findMany.mock.calls[0][0];
      expect(callArgs.where.status).toBeUndefined();
    });
  });

  // ---------- staffPerformance ----------

  describe('staffPerformance', () => {
    it('should return metrics per staff member sorted by order count', async () => {
      mockPrisma.order.findMany.mockResolvedValue([orderStaff1, orderStaff2a, orderStaff2b]);

      const result = await service.staffPerformance(tenantId, defaultDto);

      expect(result).toHaveLength(2);

      // Jane: 2 orders, 2800 total
      expect(result[0].name).toBe('Jane');
      expect(result[0].orderCount).toBe(2);
      expect(result[0].totalRevenue).toBe(2800);
      expect(result[0].avgOrderValue).toBe(1400);
      expect(result[0].role).toBe('Chef');

      // John: 1 order, 1500 total
      expect(result[1].name).toBe('John');
      expect(result[1].orderCount).toBe(1);
      expect(result[1].totalRevenue).toBe(1500);
      expect(result[1].avgOrderValue).toBe(1500);
      expect(result[1].role).toBe('Waiter');
    });

    it('should filter orders with staffId not null and include staff relations', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      await service.staffPerformance(tenantId, defaultDto);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            staffId: { not: null },
          }),
          include: {
            staff: { select: { id: true, name: true, role: { select: { name: true } } } },
          },
        }),
      );
    });

    it('should skip orders without staff reference', async () => {
      const orderNoStaff = { ...orderDay1, staff: null };
      mockPrisma.order.findMany.mockResolvedValue([orderNoStaff]);

      const result = await service.staffPerformance(tenantId, defaultDto);

      expect(result).toHaveLength(0);
    });
  });

  // ---------- inventoryConsumption ----------

  describe('inventoryConsumption', () => {
    it('should return consumed items and identify low stock alerts', async () => {
      mockPrisma.stockMovement.findMany.mockResolvedValue([mockStockMovement1, mockStockMovement2, mockStockMovement3]);

      const result = await service.inventoryConsumption(tenantId, defaultDto);

      // 2 unique items: Chicken Breast (inv-1) and Cooking Oil (inv-2)
      expect(result.items).toHaveLength(2);
      expect(result.totalItems).toBe(2);

      const chicken = result.items.find((i) => i.itemName === 'Chicken Breast');
      expect(chicken).toBeDefined();
      expect(chicken!.totalConsumed).toBe(3.5); // 2 + 1.5
      expect(chicken!.currentStock).toBe(5);
      expect(chicken!.minimumStock).toBe(3);
      expect(chicken!.isLow).toBe(false);

      const oil = result.items.find((i) => i.itemName === 'Cooking Oil');
      expect(oil).toBeDefined();
      expect(oil!.totalConsumed).toBe(0.5);
      expect(oil!.currentStock).toBe(1);
      expect(oil!.minimumStock).toBe(2);
      expect(oil!.isLow).toBe(true);

      // Cooking Oil should appear in lowStockItems
      expect(result.lowStockItems).toHaveLength(1);
      expect(result.lowStockItems[0].itemName).toBe('Cooking Oil');
    });

    it('should query with tenantId and type SALE', async () => {
      mockPrisma.stockMovement.findMany.mockResolvedValue([]);

      await service.inventoryConsumption(tenantId, defaultDto);

      expect(mockPrisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            inventoryItem: { tenantId },
            createdAt: { gte: new Date('2026-07-10'), lte: new Date('2026-07-11T23:59:59.999Z') },
            type: 'SALE',
          },
        }),
      );
    });
  });

  // ---------- exportReport ----------

  describe('exportReport', () => {
    it('should delegate to dailySales when type is daily-sales', async () => {
      mockPrisma.order.findMany.mockResolvedValue([orderDay1]);
      const spy = jest.spyOn(service, 'dailySales');

      const result = await service.exportReport(tenantId, 'daily-sales', defaultDto);

      expect(spy).toHaveBeenCalledWith(tenantId, defaultDto);
      expect(result.exportType).toBe('daily-sales');
      expect(result.format).toBe('PDF');
      expect(result.data).toBeDefined();
      expect(result.downloadUrl).toBeNull();
      expect(result.generatedAt).toBeDefined();
    });

    it('should delegate to revenue when type is revenue', async () => {
      mockPrisma.orderItem.findMany.mockResolvedValue([mockOrderItem1]);
      const spy = jest.spyOn(service, 'revenue');

      await service.exportReport(tenantId, 'revenue', defaultDto);

      expect(spy).toHaveBeenCalledWith(tenantId, defaultDto);
    });

    it('should delegate to itemPerformance when type is items', async () => {
      mockPrisma.orderItem.findMany.mockResolvedValue([mockOrderItem1]);
      const spy = jest.spyOn(service, 'itemPerformance');

      await service.exportReport(tenantId, 'items', defaultDto);

      expect(spy).toHaveBeenCalledWith(tenantId, defaultDto);
    });

    it('should default to dailySales for unknown types', async () => {
      mockPrisma.order.findMany.mockResolvedValue([orderDay1]);
      const spy = jest.spyOn(service, 'dailySales');

      await service.exportReport(tenantId, 'unknown-type', defaultDto);

      expect(spy).toHaveBeenCalled();
    });

    it('should use the format from dto', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      const csvDto: ReportFilterDto = { ...defaultDto, format: 'CSV' };

      const result = await service.exportReport(tenantId, 'daily-sales', csvDto);

      expect(result.format).toBe('CSV');
    });
  });
});
