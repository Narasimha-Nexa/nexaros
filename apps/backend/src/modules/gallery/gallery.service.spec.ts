import { Test, TestingModule } from '@nestjs/testing';
import { GalleryService } from './gallery.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RedisService } from '../../common/redis/redis.service';
import { NotFoundException } from '@nestjs/common';

describe('GalleryService', () => {
  let service: GalleryService;
  let prisma: any;
  let eventBus: any;
  let redis: any;

  const mockTenantId = 'tenant-123';
  const mockImage = {
    id: 'img-123',
    tenantId: mockTenantId,
    branchId: null,
    imageUrl: 'https://cdn.example.com/interior.jpg',
    thumbnailUrl: null,
    caption: 'Interior view',
    altText: 'Interior view',
    status: 'ACTIVE' as const,
    displayOrder: 1,
    isFeatured: false,
    imageMetadata: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      galleryImage: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
      },
    };
    eventBus = { emitToTenant: jest.fn(), emit: jest.fn() };
    redis = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GalleryService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBusService, useValue: eventBus },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get(GalleryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return active, non-deleted images ordered by displayOrder', async () => {
      prisma.galleryImage.findMany.mockResolvedValue([mockImage]);
      const result = await service.findAll(mockTenantId);
      expect(result).toEqual([mockImage]);
      expect(prisma.galleryImage.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, deletedAt: null, status: 'ACTIVE' },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('findOne', () => {
    it('should return a single image', async () => {
      prisma.galleryImage.findFirst.mockResolvedValue(mockImage);
      const result = await service.findOne(mockTenantId, 'img-123');
      expect(result).toEqual(mockImage);
    });

    it('should throw NotFoundException when image not found', async () => {
      prisma.galleryImage.findFirst.mockResolvedValue(null);
      await expect(service.findOne(mockTenantId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create image and emit event', async () => {
      const dto = { imageUrl: 'https://cdn.example.com/new.jpg', caption: 'New Image' };
      prisma.galleryImage.create.mockResolvedValue({ ...mockImage, imageUrl: dto.imageUrl, caption: dto.caption, id: 'img-456' });
      prisma.tenant.findUnique.mockResolvedValue({ slug: 'test-restaurant' });

      const result = await service.create(mockTenantId, dto);
      expect(result.imageUrl).toBe('https://cdn.example.com/new.jpg');
      expect(eventBus.emitToTenant).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an image and emit event', async () => {
      prisma.galleryImage.findFirst.mockResolvedValue(mockImage);
      prisma.galleryImage.update.mockResolvedValue({ ...mockImage, caption: 'Updated caption' });
      prisma.tenant.findUnique.mockResolvedValue({ slug: 'test-restaurant' });

      const result = await service.update(mockTenantId, 'img-123', { caption: 'Updated caption' });
      expect(result.caption).toBe('Updated caption');
      expect(eventBus.emitToTenant).toHaveBeenCalled();
    });

    it('should throw NotFoundException when image not found', async () => {
      prisma.galleryImage.findFirst.mockResolvedValue(null);
      await expect(service.update(mockTenantId, 'nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete an image', async () => {
      prisma.galleryImage.findFirst.mockResolvedValue(mockImage);
      prisma.galleryImage.update.mockResolvedValue({ ...mockImage, deletedAt: new Date(), status: 'ARCHIVED' as any });
      prisma.tenant.findUnique.mockResolvedValue({ slug: 'test-restaurant' });

      await expect(service.remove(mockTenantId, 'img-123')).resolves.toBeDefined();
      expect(prisma.galleryImage.update).toHaveBeenCalledWith({
        where: { id: 'img-123' },
        data: { deletedAt: expect.any(Date), status: 'ARCHIVED' },
      });
      expect(eventBus.emitToTenant).toHaveBeenCalled();
    });

    it('should throw NotFoundException when image not found', async () => {
      prisma.galleryImage.findFirst.mockResolvedValue(null);
      await expect(service.remove(mockTenantId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
