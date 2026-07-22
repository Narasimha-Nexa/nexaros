import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementsService } from './announcements.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RedisService } from '../../common/redis/redis.service';
import { NotFoundException } from '@nestjs/common';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let prisma: any;
  let eventBus: any;
  let redis: any;

  const mockTenantId = 'tenant-123';
  const mockAnnouncement = {
    id: 'ann-123',
    tenantId: mockTenantId,
    title: 'Holiday Hours',
    message: 'We are open on Christmas Eve from 10am to 4pm.',
    type: 'INFO',
    status: 'ACTIVE',
    isActive: true,
    isPinned: false,
    priority: 0,
    displayOrder: 1,
    startDate: null,
    endDate: null,
    branchId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      announcement: {
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
        AnnouncementsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBusService, useValue: eventBus },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get(AnnouncementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return announcements ordered by pinned, priority, order, date', async () => {
      prisma.announcement.findMany.mockResolvedValue([mockAnnouncement]);
      const result = await service.findAll(mockTenantId);
      expect(result).toEqual([mockAnnouncement]);
      expect(prisma.announcement.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, deletedAt: null },
        orderBy: [
          { isPinned: 'desc' },
          { priority: 'desc' },
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      });
    });
  });

  describe('findOne', () => {
    it('should return a single announcement', async () => {
      prisma.announcement.findFirst.mockResolvedValue(mockAnnouncement);
      const result = await service.findOne(mockTenantId, 'ann-123');
      expect(result).toEqual(mockAnnouncement);
    });

    it('should throw NotFoundException when announcement not found', async () => {
      prisma.announcement.findFirst.mockResolvedValue(null);
      await expect(service.findOne(mockTenantId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create an announcement and emit event', async () => {
      const dto = { title: 'New Announcement', message: 'Important notice.', type: 'INFO' as const };
      prisma.announcement.create.mockResolvedValue({ ...mockAnnouncement, ...dto, id: 'ann-456' });
      prisma.tenant.findUnique.mockResolvedValue({ slug: 'test-restaurant' });

      const result = await service.create(mockTenantId, dto);
      expect(result.title).toBe('New Announcement');
      expect(eventBus.emitToTenant).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an announcement and emit event', async () => {
      prisma.announcement.findFirst.mockResolvedValue(mockAnnouncement);
      prisma.announcement.update.mockResolvedValue({ ...mockAnnouncement, title: 'Updated Title' });
      prisma.tenant.findUnique.mockResolvedValue({ slug: 'test-restaurant' });

      const result = await service.update(mockTenantId, 'ann-123', { title: 'Updated Title' });
      expect(result.title).toBe('Updated Title');
      expect(eventBus.emitToTenant).toHaveBeenCalled();
    });

    it('should throw NotFoundException when announcement not found', async () => {
      prisma.announcement.findFirst.mockResolvedValue(null);
      await expect(service.update(mockTenantId, 'nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete an announcement', async () => {
      prisma.announcement.findFirst.mockResolvedValue(mockAnnouncement);
      prisma.announcement.update.mockResolvedValue({ ...mockAnnouncement, deletedAt: new Date(), status: 'ARCHIVED' });
      prisma.tenant.findUnique.mockResolvedValue({ slug: 'test-restaurant' });

      await expect(service.remove(mockTenantId, 'ann-123')).resolves.toBeDefined();
      expect(prisma.announcement.update).toHaveBeenCalledWith({
        where: { id: 'ann-123' },
        data: { deletedAt: expect.any(Date), status: 'ARCHIVED' },
      });
      expect(eventBus.emitToTenant).toHaveBeenCalled();
    });

    it('should throw NotFoundException when announcement not found', async () => {
      prisma.announcement.findFirst.mockResolvedValue(null);
      await expect(service.remove(mockTenantId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
