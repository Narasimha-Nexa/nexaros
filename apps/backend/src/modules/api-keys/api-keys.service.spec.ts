import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prisma: any;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockApiKey = {
    id: 'key-123',
    tenantId: mockTenantId,
    name: 'Mobile App Key',
    keyHash: 'abcdef1234567890',
    keyPrefix: 'nexa_a1b2',
    permissions: ['read', 'write'],
    isActive: true,
    expiresAt: new Date('2025-12-31'),
    lastUsedAt: null,
    createdById: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      apiKey: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ApiKeysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an API key with raw key shown once', async () => {
      const dto = { name: 'Test Key', permissions: ['read'] };
      prisma.apiKey.create.mockResolvedValue(mockApiKey);

      const result = await service.create(mockTenantId, mockUserId, dto);
      expect(result.rawKey).toBeDefined();
      expect(typeof result.rawKey).toBe('string');
      expect(prisma.apiKey.create).toHaveBeenCalled();
    });

    it('should store SHA-256 hash of the key', async () => {
      const dto = { name: 'Hash Test', permissions: ['read'] };
      prisma.apiKey.create.mockResolvedValue(mockApiKey);

      await service.create(mockTenantId, mockUserId, dto);
      const createCall = prisma.apiKey.create.mock.calls[0][0];
      expect(createCall.data.keyHash).toBeDefined();
      expect(createCall.data.keyHash.length).toBe(64);
    });
  });

  describe('list', () => {
    it('should return all keys ordered by creation date', async () => {
      prisma.apiKey.findMany.mockResolvedValue([mockApiKey]);
      const result = await service.list(mockTenantId);
      expect(result).toEqual([mockApiKey]);
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('revoke', () => {
    it('should revoke an active key', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(mockApiKey);
      prisma.apiKey.update.mockResolvedValue({ ...mockApiKey, isActive: false });

      await expect(service.revoke(mockTenantId, 'key-123')).resolves.toBeDefined();
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when key not found', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(null);
      await expect(service.revoke(mockTenantId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when key already revoked', async () => {
      prisma.apiKey.findFirst.mockResolvedValue({ ...mockApiKey, isActive: false });
      await expect(service.revoke(mockTenantId, 'key-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('rotate', () => {
    it('should revoke old key and create new one', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(mockApiKey);
      prisma.apiKey.update.mockResolvedValue({ ...mockApiKey, isActive: false });
      prisma.apiKey.create.mockResolvedValue({ ...mockApiKey, id: 'key-456', keyPrefix: 'nexa_x9y8' });

      const result = await service.rotate(mockTenantId, 'key-123');
      expect(result.rawKey).toBeDefined();
      expect(prisma.apiKey.update).toHaveBeenCalled();
      expect(prisma.apiKey.create).toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it('should validate an active, non-expired key', async () => {
      const activeKey = { ...mockApiKey, expiresAt: new Date('2027-12-31'), isActive: true };
      prisma.apiKey.findUnique.mockResolvedValue(activeKey);
      prisma.apiKey.update.mockResolvedValue(activeKey);

      const result = await service.validate('test-hash');
      expect(result).toEqual({ tenantId: mockTenantId, permissions: ['read', 'write'] });
    });

    it('should return null for non-existent key', async () => {
      prisma.apiKey.findUnique.mockResolvedValue(null);
      const result = await service.validate('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for inactive key', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({ ...mockApiKey, isActive: false, expiresAt: new Date('2027-12-31') });
      const result = await service.validate('inactive-hash');
      expect(result).toBeNull();
    });

    it('should return null for expired key', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({
        ...mockApiKey,
        expiresAt: new Date('2020-01-01'),
        isActive: true,
      });
      const result = await service.validate('expired-hash');
      expect(result).toBeNull();
    });

    it('should update lastUsedAt on validation', async () => {
      const activeKey = { ...mockApiKey, expiresAt: new Date('2027-12-31'), isActive: true };
      prisma.apiKey.findUnique.mockResolvedValue(activeKey);
      prisma.apiKey.update.mockResolvedValue(activeKey);

      await service.validate('valid-hash');
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-123' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });
  });

  describe('delete', () => {
    it('should hard delete a key', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(mockApiKey);
      prisma.apiKey.delete.mockResolvedValue(mockApiKey);

      await expect(service.delete(mockTenantId, 'key-123')).resolves.toBeDefined();
      expect(prisma.apiKey.delete).toHaveBeenCalledWith({ where: { id: 'key-123' } });
    });

    it('should throw NotFoundException when key not found', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(null);
      await expect(service.delete(mockTenantId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
