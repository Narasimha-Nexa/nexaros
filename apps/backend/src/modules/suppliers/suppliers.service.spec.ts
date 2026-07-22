import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let prisma: any;

  const mockTenantId = 'tenant-123';
  const mockSupplier = {
    id: 'sup-123',
    tenantId: mockTenantId,
    name: 'Fresh Foods Co',
    phone: '+91-9876543210',
    email: 'fresh@example.com',
    address: '123 Market St',
    gstNumber: '27AABCU9603R1ZM',
    isActive: true,
    _count: { purchases: 5 },
  };

  beforeEach(async () => {
    prisma = {
      supplier: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SuppliersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return active suppliers with purchase count', async () => {
      prisma.supplier.findMany.mockResolvedValue([mockSupplier]);
      const result = await service.findAll(mockTenantId);
      expect(result).toEqual([mockSupplier]);
      expect(prisma.supplier.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, isActive: true },
        include: { _count: { select: { purchases: true } } },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a supplier with recent purchases', async () => {
      const supplierWithPurchases = { ...mockSupplier, purchases: [] };
      prisma.supplier.findFirst.mockResolvedValue(supplierWithPurchases);
      const result = await service.findOne('sup-123', mockTenantId);
      expect(result).toEqual(supplierWithPurchases);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent', mockTenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a supplier', async () => {
      const dto = { name: 'New Supplier', phone: '+91-1234567890' };
      prisma.supplier.create.mockResolvedValue({ ...mockSupplier, ...dto, id: 'sup-456' });

      const result = await service.create(mockTenantId, dto);
      expect(result.name).toBe('New Supplier');
      expect(prisma.supplier.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      prisma.supplier.findFirst.mockResolvedValue(mockSupplier);
      prisma.supplier.update.mockResolvedValue({ ...mockSupplier, name: 'Updated Name' });

      const result = await service.update('sup-123', mockTenantId, { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException when supplier not found', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(service.update('nonexistent', mockTenantId, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a supplier by setting isActive false', async () => {
      prisma.supplier.findFirst.mockResolvedValue(mockSupplier);
      prisma.supplier.update.mockResolvedValue({ ...mockSupplier, isActive: false });

      const result = await service.remove('sup-123', mockTenantId);
      expect(result).toBeDefined();
      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 'sup-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when supplier not found', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(service.remove('nonexistent', mockTenantId)).rejects.toThrow(NotFoundException);
    });
  });
});
