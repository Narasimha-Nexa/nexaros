import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockTenant = {
    id: 'tenant-1',
    name: 'NexaROS',
    slug: 'nexaros',
    logo: null,
    phone: '+911234567890',
    address: '123 Main St',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('findOne', () => {
    it('should return tenant by id', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findOne('tenant-1');

      expect(result).toMatchObject({ id: 'tenant-1', name: 'NexaROS' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return tenant by slug', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findBySlug('nexaros');

      expect(result).toMatchObject({ slug: 'nexaros' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update tenant data', async () => {
      mockPrisma.tenant.update.mockResolvedValue({ ...mockTenant, name: 'Updated Name' });

      const result = await service.update('tenant-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { name: 'Updated Name' },
      });
    });
  });
});
