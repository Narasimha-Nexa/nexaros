import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: jest.Mocked<PrismaService>;
  let eventBus: jest.Mocked<EventBusService>;

  const mockOrder = {
    id: 'order-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    tableId: 'table-1',
    orderNumber: 101,
    totalAmount: 550,
    status: 'PENDING',
    type: 'DINE_IN',
    subtotal: 500,
    taxAmount: 50,
    discountAmount: 0,
    notes: null,
    kotPrinted: false,
    synced: false,
    localId: null,
    staffId: 'staff-1',
    customerName: null,
    customerPhone: null,
    guestCount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPayment = {
    id: 'pay-1',
    orderId: 'order-1',
    branchId: 'branch-1',
    method: 'CASH',
    amount: 550,
    reference: 'REF-001',
    status: 'COMPLETED',
    receivedAt: new Date(),
    createdAt: new Date(),
  };

  const mockPrisma = {
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    restaurantTable: { update: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
  };

  const mockEventBus = {
    emitToBranch: jest.fn(),
    emitToTenant: jest.fn(),
    paymentReceived: jest.fn(),
    paymentRefunded: jest.fn(),
    invoiceGenerated: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    eventBus = module.get(EventBusService) as jest.Mocked<EventBusService>;
  });

  describe('createPayment', () => {
    beforeEach(() => {
      mockPrisma.order.findFirst.mockResolvedValue({ ...mockOrder, status: 'READY' });
      mockPrisma.payment.findMany.mockResolvedValue([]);
    });

    it('should create a completed payment', async () => {
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      const result = await service.createPayment('order-1', {
        method: 'CASH',
        amount: 550,
      }, 'tenant-1');

      expect(result).toMatchObject({ id: 'pay-1', status: 'COMPLETED' });
      expect(mockPrisma.payment.create).toHaveBeenCalled();
    });

    it('should mark order as COMPLETED when fully paid', async () => {
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      await service.createPayment('order-1', { method: 'CASH', amount: 550 }, 'tenant-1');

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: { status: 'COMPLETED' },
        }),
      );
    });

    it('should free the table when order is fully paid', async () => {
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      await service.createPayment('order-1', { method: 'CASH', amount: 550 }, 'tenant-1');

      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'table-1' },
          data: { status: 'FREE' },
        }),
      );
    });

    it('should accept partial payment and not complete order', async () => {
      mockPrisma.payment.create.mockResolvedValue({ ...mockPayment, amount: 300 });

      await service.createPayment('order-1', { method: 'UPI', amount: 300 }, 'tenant-1');

      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.createPayment('missing', { method: 'CASH', amount: 100 }, 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when amount exceeds remaining', async () => {
      await expect(
        service.createPayment('order-1', { method: 'CASH', amount: 9999 }, 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should emit payment:received event', async () => {
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      await service.createPayment('order-1', { method: 'CASH', amount: 550 }, 'tenant-1');

      expect(mockEventBus.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'payment:received',
        expect.objectContaining({ orderId: 'order-1', amount: 550 }),
      );
    });
  });

  describe('getPayments', () => {
    it('should return payments for a branch', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);

      const result = await service.getPayments('branch-1', 'tenant-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { branchId: 'branch-1' } }),
      );
    });

    it('should filter by orderId when provided', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);

      await service.getPayments('branch-1', 'tenant-1', 'order-1');

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { branchId: 'branch-1', orderId: 'order-1' } }),
      );
    });
  });

  describe('getOrderPayments', () => {
    it('should return payments summary for an order', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ ...mockOrder, branch: { tenantId: 'tenant-1' } });
      mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderPayments('order-1', 'tenant-1');

      expect(result).toMatchObject({
        totalPaid: 550,
        totalAmount: 550,
        remaining: 0,
      });
      expect(result.payments).toHaveLength(1);
    });

    it('should calculate remaining balance correctly', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ ...mockOrder, branch: { tenantId: 'tenant-1' } });
      mockPrisma.payment.findMany.mockResolvedValue([{ ...mockPayment, amount: 200 }]);
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderPayments('order-1', 'tenant-1');

      expect(result.totalPaid).toBe(200);
      expect(result.totalAmount).toBe(550);
      expect(result.remaining).toBe(350);
    });
  });

  describe('refundPayment', () => {
    beforeEach(() => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        order: mockOrder,
      });
    });

    it('should mark payment as REFUNDED', async () => {
      mockPrisma.payment.update.mockResolvedValue({ ...mockPayment, status: 'REFUNDED' });

      const result = await service.refundPayment('pay-1', 'tenant-1');

      expect(result.status).toBe('REFUNDED');
    });

    it('should throw NotFoundException when payment not found', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.refundPayment('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when already refunded', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: 'REFUNDED',
        order: mockOrder,
      });

      await expect(service.refundPayment('pay-1', 'tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('should emit payment:refunded event', async () => {
      mockPrisma.payment.update.mockResolvedValue({ ...mockPayment, status: 'REFUNDED' });

      await service.refundPayment('pay-1', 'tenant-1');

      expect(mockEventBus.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'payment:refunded',
        expect.objectContaining({ orderId: 'order-1', amount: 550 }),
      );
    });
  });
});
