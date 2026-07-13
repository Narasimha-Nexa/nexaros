import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: jest.Mocked<PrismaService>;
  let gateway: jest.Mocked<GatewayService>;

  const mockOrder = {
    id: 'order-1',
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
      update: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    restaurantTable: { update: jest.fn() },
  };

  const mockGateway = { emitToBranch: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GatewayService, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    gateway = module.get(GatewayService) as jest.Mocked<GatewayService>;
  });

  describe('createPayment', () => {
    beforeEach(() => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.payment.findMany.mockResolvedValue([]);
    });

    it('should create a completed payment', async () => {
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      const result = await service.createPayment('order-1', {
        method: 'CASH',
        amount: 550,
      });

      expect(result).toMatchObject({ id: 'pay-1', status: 'COMPLETED' });
      expect(mockPrisma.payment.create).toHaveBeenCalled();
    });

    it('should mark order as COMPLETED when fully paid', async () => {
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      await service.createPayment('order-1', { method: 'CASH', amount: 550 });

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: { status: 'COMPLETED' },
        }),
      );
    });

    it('should free the table when order is fully paid', async () => {
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      await service.createPayment('order-1', { method: 'CASH', amount: 550 });

      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'table-1' },
          data: { status: 'FREE' },
        }),
      );
    });

    it('should accept partial payment and not complete order', async () => {
      mockPrisma.payment.create.mockResolvedValue({ ...mockPayment, amount: 300 });

      await service.createPayment('order-1', { method: 'UPI', amount: 300 });

      // Order should NOT be marked as COMPLETED if totalAmount (550) isn't reached
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createPayment('missing', { method: 'CASH', amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when amount exceeds remaining', async () => {
      await expect(
        service.createPayment('order-1', { method: 'CASH', amount: 9999 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should emit payment:received event', async () => {
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      await service.createPayment('order-1', { method: 'CASH', amount: 550 });

      expect(mockGateway.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'payment:received',
        expect.objectContaining({ orderId: 'order-1', amount: 550 }),
      );
    });
  });

  describe('getPayments', () => {
    it('should return payments for a branch', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);

      const result = await service.getPayments('branch-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { branchId: 'branch-1' } }),
      );
    });

    it('should filter by orderId when provided', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);

      await service.getPayments('branch-1', 'order-1');

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { branchId: 'branch-1', orderId: 'order-1' } }),
      );
    });
  });

  describe('getOrderPayments', () => {
    it('should return payments summary for an order', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderPayments('order-1');

      expect(result).toMatchObject({
        totalPaid: 550,
        totalAmount: 550,
        remaining: 0,
      });
      expect(result.payments).toHaveLength(1);
    });

    it('should calculate remaining balance correctly', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([{ ...mockPayment, amount: 200 }]);
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderPayments('order-1');

      expect(result.totalPaid).toBe(200);
      expect(result.totalAmount).toBe(550);
      expect(result.remaining).toBe(350);
    });
  });

  describe('refundPayment', () => {
    beforeEach(() => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        order: mockOrder,
      });
    });

    it('should mark payment as REFUNDED', async () => {
      mockPrisma.payment.update.mockResolvedValue({ ...mockPayment, status: 'REFUNDED' });

      const result = await service.refundPayment('pay-1');

      expect(result.status).toBe('REFUNDED');
    });

    it('should throw NotFoundException when payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await expect(service.refundPayment('missing')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when already refunded', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        status: 'REFUNDED',
        order: mockOrder,
      });

      await expect(service.refundPayment('pay-1')).rejects.toThrow(BadRequestException);
    });

    it('should emit payment:refunded event', async () => {
      mockPrisma.payment.update.mockResolvedValue({ ...mockPayment, status: 'REFUNDED' });

      await service.refundPayment('pay-1');

      expect(mockGateway.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'payment:refunded',
        expect.objectContaining({ orderId: 'order-1', amount: 550 }),
      );
    });
  });
});
