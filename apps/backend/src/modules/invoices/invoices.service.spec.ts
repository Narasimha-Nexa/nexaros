import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPayment = {
    id: 'payment-1',
    method: 'CASH',
    amount: 1500,
    reference: null,
    receivedAt: new Date(),
    orderId: 'order-1',
    branchId: 'branch-1',
    invoice: null,
    order: {
      id: 'order-1',
      orderNumber: 'ORD-001',
      type: 'DINE_IN',
      subtotal: 1200,
      taxAmount: 180,
      discountAmount: 0,
      totalAmount: 1380,
      branchId: 'branch-1',
      tableId: 'table-1',
      table: { number: 5 },
      branch: {
        name: 'Main Branch',
        address: '123 Street',
        phone: '9999999999',
        tenant: {
          name: 'Test Restaurant',
          gstNumber: 'GST123',
          address: '456 Avenue',
          phone: '8888888888',
          email: 'test@rest.com',
        },
      },
      items: [
        {
          id: 'item-1',
          name: 'Burger',
          quantity: 2,
          unitPrice: 600,
          totalPrice: 1200,
          menuItem: { name: 'Burger', isVeg: true },
        },
      ],
    },
  };

  const mockInvoiceRecord = {
    id: 'invoice-1',
    paymentId: 'payment-1',
    number: 'INV-000001',
    gstAmount: 180,
    cgst: 90,
    sgst: 90,
    igst: 0,
    pdfUrl: null,
    version: 1,
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInvoiceWithPayment = {
    ...mockInvoiceRecord,
    payment: {
      ...mockPayment,
      order: {
        ...mockPayment.order,
        items: mockPayment.order.items.map(i => ({
          ...i,
          menuItem: { name: i.menuItem.name },
        })),
      },
    },
  };

  const mockPrisma = {
    payment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    invoice: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('generateInvoice', () => {
    it('should generate a new invoice from payment', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.create.mockResolvedValue(mockInvoiceRecord);

      const result = await service.generateInvoice('payment-1', 'tenant-1');

      expect(result).toMatchObject({
        number: 'INV-000001',
        gstAmount: 180,
        payment: { id: 'payment-1', method: 'CASH', amount: 1500 },
        restaurant: { name: 'Test Restaurant', gstNumber: 'GST123' },
        order: { orderNumber: 'ORD-001', table: 'Table 5' },
      });
      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paymentId: 'payment-1', number: 'INV-000001' }),
        }),
      );
    });

    it('should return existing invoice if payment already has one', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        invoice: mockInvoiceRecord,
      });

      const result = await service.generateInvoice('payment-1', 'tenant-1');

      expect(result).toEqual(mockInvoiceRecord);
      expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment not found', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.generateInvoice('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInvoice', () => {
    it('should return invoice when found', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoiceWithPayment);

      const result = await service.getInvoice('invoice-1', 'tenant-1');

      expect(result).toMatchObject({ id: 'invoice-1', number: 'INV-000001' });
      expect(mockPrisma.invoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'invoice-1', tenantId: 'tenant-1' } }),
      );
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null);

      await expect(service.getInvoice('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInvoices', () => {
    it('should return invoices for a branch', async () => {
      const mockInvoices = [
        {
          ...mockInvoiceRecord,
          payment: {
            id: 'payment-1',
            method: 'CASH',
            amount: 1500,
            reference: null,
            order: { orderNumber: 'ORD-001', type: 'DINE_IN', createdAt: new Date() },
          },
        },
      ];
      mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.getInvoices('branch-1', 'tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0].payment.method).toBe('CASH');
      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-1', payment: { branchId: 'branch-1' } },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('getInvoicePdf', () => {
    it('should return invoice data formatted for PDF', async () => {
      const paymentWithInvoice = {
        ...mockPayment,
        invoice: {
          ...mockInvoiceRecord,
          cgst: 90,
          sgst: 90,
          igst: 0,
        },
      };
      mockPrisma.invoice.findFirst.mockResolvedValue({
        ...mockInvoiceRecord,
        payment: paymentWithInvoice,
      });

      const result = await service.getInvoicePdf('invoice-1', 'tenant-1');

      expect(result).toMatchObject({
        invoice: { number: 'INV-000001', cgst: 90, sgst: 90, igst: 0 },
        restaurant: { name: 'Test Restaurant' },
        order: { orderNumber: 'ORD-001', table: 'Table 5' },
        payment: { method: 'CASH', amount: 1500 },
      });
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null);

      await expect(service.getInvoicePdf('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});
