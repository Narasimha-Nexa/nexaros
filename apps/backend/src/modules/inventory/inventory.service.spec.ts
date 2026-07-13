import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: jest.Mocked<PrismaService>;

  const mockItem = {
    id: 'inv-1',
    tenantId: 'tenant-1',
    name: 'Chicken Breast',
    unit: 'kg',
    currentStock: 50,
    minimumStock: 5,
    costPrice: 200,
    reorderQuantity: 10,
    barcode: '890123456789',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMovement = {
    id: 'mov-1',
    inventoryItemId: 'inv-1',
    type: 'PURCHASE',
    quantity: 10,
    reference: 'PO-001',
    notes: 'Restock',
    createdAt: new Date(),
  };

  const mockPrisma = {
    inventoryItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    stockMovement: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('findAll', () => {
    it('should return inventory items with recent stock movements', async () => {
      mockPrisma.inventoryItem.findMany.mockResolvedValue([mockItem]);

      const result = await service.findAll('tenant-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-1' } }),
      );
    });
  });

  describe('findOne', () => {
    it('should return inventory item when found', async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue(mockItem);

      const result = await service.findOne('inv-1', 'tenant-1');

      expect(result).toMatchObject({ name: 'Chicken Breast', currentStock: 50 });
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new inventory item', async () => {
      mockPrisma.inventoryItem.create.mockResolvedValue(mockItem);

      const result = await service.create('tenant-1', {
        name: 'Chicken Breast',
        unit: 'kg',
        costPrice: 200,
        currentStock: 50,
        minimumStock: 5,
      });

      expect(result).toMatchObject({ name: 'Chicken Breast' });
      expect(mockPrisma.inventoryItem.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      );
    });
  });

  describe('update', () => {
    it('should update inventory item details', async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      mockPrisma.inventoryItem.update.mockResolvedValue({ ...mockItem, costPrice: 220 });

      const result = await service.update('inv-1', 'tenant-1', { costPrice: 220 });

      expect(result.costPrice).toBe(220);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue(null);

      await expect(
        service.update('missing', 'tenant-1', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('adjustStock', () => {
    beforeEach(() => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
    });

    it('should increase stock on PURCHASE type', async () => {
      mockPrisma.stockMovement.create.mockResolvedValue(mockMovement);
      mockPrisma.inventoryItem.update.mockResolvedValue({ ...mockItem, currentStock: 60 });

      const result = await service.adjustStock('inv-1', 'tenant-1', {
        type: 'PURCHASE',
        quantity: 10,
        notes: 'Restock',
      });

      expect(result.currentStock).toBe(60);
    });

    it('should decrease stock on SALE type', async () => {
      mockPrisma.stockMovement.create.mockResolvedValue({ ...mockMovement, type: 'SALE' });
      mockPrisma.inventoryItem.update.mockResolvedValue({ ...mockItem, currentStock: 40 });

      const result = await service.adjustStock('inv-1', 'tenant-1', {
        type: 'SALE',
        quantity: 10,
      });

      expect(result.currentStock).toBe(40);
    });

    it('should create a stock movement record', async () => {
      mockPrisma.stockMovement.create.mockResolvedValue(mockMovement);
      mockPrisma.inventoryItem.update.mockResolvedValue(mockItem);

      await service.adjustStock('inv-1', 'tenant-1', {
        type: 'PURCHASE',
        quantity: 10,
        notes: 'Restock',
      });

      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inventoryItemId: 'inv-1',
            type: 'PURCHASE',
            quantity: 10,
          }),
        }),
      );
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue(null);

      await expect(
        service.adjustStock('missing', 'tenant-1', { type: 'ADJUSTMENT', quantity: 5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMovements', () => {
    it('should return stock movements for an item', async () => {
      mockPrisma.stockMovement.findMany.mockResolvedValue([mockMovement]);

      const result = await service.getMovements('inv-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { inventoryItemId: 'inv-1' } }),
      );
    });
  });

  describe('getLowStock', () => {
    it('should return items where currentStock <= minimumStock', async () => {
      mockPrisma.inventoryItem.findMany.mockResolvedValue([
        { ...mockItem, currentStock: 3, minimumStock: 5 },  // Low stock
        { ...mockItem, id: 'inv-2', currentStock: 50, minimumStock: 5 },  // OK
      ]);

      const result = await service.getLowStock('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('inv-1');
    });

    it('should return empty array when all items are well-stocked', async () => {
      mockPrisma.inventoryItem.findMany.mockResolvedValue([
        { ...mockItem, currentStock: 50, minimumStock: 5 },
      ]);

      const result = await service.getLowStock('tenant-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('remove', () => {
    it('should delete inventory item', async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      mockPrisma.inventoryItem.delete.mockResolvedValue(mockItem);

      await service.remove('inv-1', 'tenant-1');

      expect(mockPrisma.inventoryItem.delete).toHaveBeenCalledWith({ where: { id: 'inv-1' } });
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue(null);

      await expect(service.remove('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});
