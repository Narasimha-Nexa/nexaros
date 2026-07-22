import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesService } from './purchases.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PurchasesService', () => {
  let service: PurchasesService;
  let prisma: any;

  const mockTenantId = 'tenant-123';
  const mockPurchase = {
    id: 'pur-123',
    tenantId: mockTenantId,
    supplierId: 'sup-123',
    totalAmount: 15000,
    status: 'PENDING',
    notes: 'Weekly restock',
    createdAt: new Date(),
    updatedAt: new Date(),
    supplier: { id: 'sup-123', name: 'Fresh Foods Co' },
    items: [
      { id: 'pi-1', inventoryItemId: 'inv-1', quantity: 10, unitPrice: 500, total: 5000, inventoryItem: { id: 'inv-1', name: 'Rice 25kg', unit: 'kg' } },
      { id: 'pi-2', inventoryItemId: 'inv-2', quantity: 5, unitPrice: 2000, total: 10000, inventoryItem: { id: 'inv-2', name: 'Cooking Oil 5L', unit: 'litre' } },
    ],
  };

  beforeEach(async () => {
    prisma = {
      purchase: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      inventoryItem: {
        update: jest.fn(),
      },
      stockMovement: {
        create: jest.fn(),
      },
      $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PurchasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return purchases with supplier and items', async () => {
      prisma.purchase.findMany.mockResolvedValue([mockPurchase]);
      const result = await service.findAll(mockTenantId);
      expect(result).toEqual([mockPurchase]);
      expect(prisma.purchase.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        include: {
          supplier: { select: { id: true, name: true } },
          items: { include: { inventoryItem: { select: { id: true, name: true, unit: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a purchase by id', async () => {
      prisma.purchase.findFirst.mockResolvedValue(mockPurchase);
      const result = await service.findOne('pur-123', mockTenantId);
      expect(result).toEqual(mockPurchase);
    });

    it('should throw NotFoundException when purchase not found', async () => {
      prisma.purchase.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent', mockTenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a purchase with items and update inventory', async () => {
      const dto = {
        supplierId: 'sup-123',
        notes: 'Test purchase',
        items: [
          { inventoryItemId: 'inv-1', quantity: 10, unitPrice: 500 },
          { inventoryItemId: 'inv-2', quantity: 5, unitPrice: 2000 },
        ],
      };

      const mockCreated = { ...mockPurchase, totalAmount: 15000 };

      prisma.$transaction.mockImplementation(async (fns: any[]) => {
        const results = [];
        for (const fn of fns) {
          results.push(await fn);
        }
        return results;
      });

      prisma.purchase.create.mockResolvedValue(mockCreated);
      prisma.inventoryItem.update.mockResolvedValue({});
      prisma.stockMovement.create.mockResolvedValue({});

      const result = await service.create(mockTenantId, dto);
      expect(prisma.purchase.create).toHaveBeenCalled();
      expect(prisma.inventoryItem.update).toHaveBeenCalledTimes(2);
      expect(prisma.stockMovement.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateStatus', () => {
    it('should update purchase status', async () => {
      prisma.purchase.findFirst.mockResolvedValue(mockPurchase);
      prisma.purchase.update.mockResolvedValue({ ...mockPurchase, status: 'RECEIVED' });

      const result = await service.updateStatus('pur-123', mockTenantId, 'RECEIVED');
      expect(result.status).toBe('RECEIVED');
    });

    it('should throw NotFoundException when purchase not found', async () => {
      prisma.purchase.findFirst.mockResolvedValue(null);
      await expect(service.updateStatus('nonexistent', mockTenantId, 'RECEIVED')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should hard delete a purchase', async () => {
      prisma.purchase.findFirst.mockResolvedValue(mockPurchase);
      prisma.purchase.delete.mockResolvedValue(mockPurchase);
      const result = await service.remove('pur-123', mockTenantId);
      expect(result).toBeDefined();
      expect(prisma.purchase.delete).toHaveBeenCalledWith({ where: { id: 'pur-123' } });
    });

    it('should throw NotFoundException when purchase not found', async () => {
      prisma.purchase.findFirst.mockResolvedValue(null);
      await expect(service.remove('nonexistent', mockTenantId)).rejects.toThrow(NotFoundException);
    });
  });
});
