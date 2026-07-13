import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('BranchesService', () => {
  let service: BranchesService;
  let prisma: jest.Mocked<PrismaService>;

  const mockBranch = {
    id: 'branch-1',
    tenantId: 'tenant-1',
    name: 'Main Branch',
    address: '123 Main St',
    phone: '+911234567890',
    isPrimary: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    branch: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    tenant: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'tenant-1',
        subscriptions: [{ plan: { features: { maxBranches: 10 } } }],
      }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('findAll', () => {
    it('should return all branches for a tenant', async () => {
      mockPrisma.branch.findMany.mockResolvedValue([mockBranch]);

      const result = await service.findAll('tenant-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-1' },
          orderBy: { isPrimary: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return branch when found', async () => {
      mockPrisma.branch.findFirst.mockResolvedValue(mockBranch);

      const result = await service.findOne('branch-1', 'tenant-1');

      expect(result).toMatchObject({ name: 'Main Branch', isPrimary: true });
    });

    it('should throw NotFoundException when branch not found', async () => {
      mockPrisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new branch', async () => {
      mockPrisma.branch.create.mockResolvedValue(mockBranch);

      const result = await service.create('tenant-1', {
        name: 'Main Branch',
        address: '123 Main St',
        phone: '+911234567890',
      });

      expect(result).toMatchObject({ name: 'Main Branch' });
      expect(mockPrisma.branch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: 'tenant-1' }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update branch details', async () => {
      mockPrisma.branch.findFirst.mockResolvedValue(mockBranch);
      mockPrisma.branch.update.mockResolvedValue({ ...mockBranch, name: 'Updated Branch' });

      const result = await service.update('branch-1', 'tenant-1', { name: 'Updated Branch' });

      expect(result.name).toBe('Updated Branch');
    });

    it('should throw NotFoundException when branch not found', async () => {
      mockPrisma.branch.findFirst.mockResolvedValue(null);

      await expect(
        service.update('missing', 'tenant-1', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete branch', async () => {
      mockPrisma.branch.findFirst.mockResolvedValue(mockBranch);
      mockPrisma.branch.delete.mockResolvedValue(mockBranch);

      await service.remove('branch-1', 'tenant-1');

      expect(mockPrisma.branch.delete).toHaveBeenCalledWith({ where: { id: 'branch-1' } });
    });

    it('should throw NotFoundException when branch not found', async () => {
      mockPrisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.remove('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});
