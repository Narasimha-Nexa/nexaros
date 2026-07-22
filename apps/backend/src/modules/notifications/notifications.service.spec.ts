import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';

const mockPrisma = {
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockEventBus = {
  emitToTenant: jest.fn(),
  emitToBranch: jest.fn(),
  notificationSent: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  const tenantId = 'tenant-1';
  const userId = 'user-1';

  const mockNotification = {
    id: 'notif-1',
    tenantId,
    userId,
    branchId: null,
    title: 'Order Ready',
    message: 'Order #101 is ready',
    channel: 'IN_APP',
    isRead: false,
    readAt: null,
    entityType: 'ORDER',
    entityId: 'order-1',
    deletedAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('findAll', () => {
    it('should return notifications for a tenant', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);

      const result = await service.findAll(tenantId);

      expect(result).toHaveLength(1);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      );
    });

    it('should filter by userId when provided', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);

      await service.findAll(tenantId, userId);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, deletedAt: null, userId },
        }),
      );
    });

    it('should filter by branchId when provided', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await service.findAll(tenantId, undefined, 'branch-1');

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, deletedAt: null, branchId: 'branch-1' },
        }),
      );
    });

    it('should respect custom limit', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await service.findAll(tenantId, undefined, undefined, 10);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount(tenantId, userId);

      expect(result).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { tenantId, userId, isRead: false, deletedAt: null },
      });
    });

    it('should return 0 when no unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValue(0);

      const result = await service.getUnreadCount(tenantId, userId);

      expect(result).toBe(0);
    });
  });

  describe('markRead', () => {
    it('should mark a notification as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.markRead(tenantId, 'notif-1', userId);

      expect(result.count).toBe(1);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1', tenantId, userId },
          data: expect.objectContaining({ isRead: true }),
        }),
      );
    });
  });

  describe('markAllRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 10 });

      const result = await service.markAllRead(tenantId, userId);

      expect(result.count).toBe(10);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, userId, isRead: false, deletedAt: null },
          data: expect.objectContaining({ isRead: true }),
        }),
      );
    });
  });

  describe('send', () => {
    it('should create an IN_APP notification and emit to tenant', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.send(tenantId, {
        title: 'Order Ready',
        message: 'Order #101 is ready',
        channel: 'IN_APP',
        recipientId: userId,
      });

      expect(result.title).toBe('Order Ready');
      expect(result.channel).toBe('IN_APP');
      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(mockEventBus.emitToTenant).toHaveBeenCalledWith(
        tenantId,
        'notification',
        expect.objectContaining({ title: 'Order Ready' }),
      );
    });

    it('should emit to specific branches when branchIds provided', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      await service.send(tenantId, {
        title: 'Alert',
        message: 'Fire drill',
        branchIds: ['branch-1', 'branch-2'],
      });

      expect(mockEventBus.emitToBranch).toHaveBeenCalledTimes(2);
      expect(mockEventBus.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'notification',
        expect.any(Object),
      );
      expect(mockEventBus.emitToBranch).toHaveBeenCalledWith(
        'branch-2',
        'notification',
        expect.any(Object),
      );
      expect(mockEventBus.emitToTenant).not.toHaveBeenCalled();
    });

    it('should enqueue email job when channel is EMAIL', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      await service.send(tenantId, {
        title: 'Welcome',
        message: 'Hello',
        channel: 'EMAIL',
        recipientEmail: 'user@example.com',
      });

      expect(mockEventBus.notificationSent).toHaveBeenCalledWith(
        tenantId,
        undefined,
        expect.objectContaining({
          channel: 'email',
          to: 'user@example.com',
        }),
      );
    });

    it('should enqueue SMS job when channel is SMS', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      await service.send(tenantId, {
        title: 'OTP',
        message: '123456',
        channel: 'SMS',
        recipientPhone: '+911234567890',
      });

      expect(mockEventBus.notificationSent).toHaveBeenCalledWith(
        tenantId,
        undefined,
        expect.objectContaining({
          channel: 'sms',
          to: '+911234567890',
        }),
      );
    });

    it('should not emit WS event for non-IN_APP channels', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      await service.send(tenantId, {
        title: 'Email',
        message: 'Body',
        channel: 'EMAIL',
        recipientEmail: 'a@b.com',
      });

      expect(mockEventBus.emitToTenant).not.toHaveBeenCalled();
      expect(mockEventBus.emitToBranch).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft-delete a notification', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.delete(tenantId, 'notif-1', userId);

      expect(result.count).toBe(1);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1', tenantId, userId },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
