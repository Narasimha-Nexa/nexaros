import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  webhook: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  webhookDelivery: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomBytes: jest.fn().mockReturnValue({ toString: () => 'generated-secret-123' }),
    createHmac: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        digest: jest.fn().mockReturnValue('fake-signature'),
      }),
    }),
  };
});

describe('WebhooksService', () => {
  let service: WebhooksService;

  const tenantId = 'tenant-1';

  const mockWebhook = {
    id: 'wh-1',
    tenantId,
    name: 'Order Events',
    url: 'https://example.com/hook',
    events: ['order.created', 'order.updated'],
    secret: 'secret-123',
    headers: null,
    isActive: true,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDelivery = {
    id: 'del-1',
    webhookId: 'wh-1',
    event: 'order.created',
    payload: { orderId: '1' },
    status: 'PENDING',
    attempt: 0,
    maxAttempts: 3,
    statusCode: null,
    response: null,
    deliveredAt: null,
    nextRetryAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  describe('create', () => {
    it('should create a webhook with generated secret', async () => {
      mockPrisma.webhook.create.mockResolvedValue(mockWebhook);

      const result = await service.create(tenantId, {
        name: 'Order Events',
        url: 'https://example.com/hook',
        events: ['order.created'],
      });

      expect(result).toMatchObject({ name: 'Order Events' });
      expect(mockPrisma.webhook.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            name: 'Order Events',
            url: 'https://example.com/hook',
            events: ['order.created'],
          }),
        }),
      );
    });

    it('should use provided secret when given', async () => {
      mockPrisma.webhook.create.mockResolvedValue(mockWebhook);

      await service.create(tenantId, {
        name: 'Test',
        url: 'https://example.com/hook',
        events: ['order.created'],
        secret: 'my-custom-secret',
      });

      expect(mockPrisma.webhook.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ secret: 'my-custom-secret' }),
        }),
      );
    });

    it('should pass custom headers when provided', async () => {
      mockPrisma.webhook.create.mockResolvedValue(mockWebhook);

      await service.create(tenantId, {
        name: 'Test',
        url: 'https://example.com/hook',
        events: ['order.created'],
        headers: { 'X-Custom': 'value' },
      });

      expect(mockPrisma.webhook.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            headers: { 'X-Custom': 'value' },
          }),
        }),
      );
    });
  });

  describe('list', () => {
    it('should return webhooks with delivery counts', async () => {
      mockPrisma.webhook.findMany.mockResolvedValue([
        { ...mockWebhook, _count: { deliveries: 5 } },
      ]);

      const result = await service.list(tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].deliveryCount).toBe(5);
      expect(result[0].id).toBe('wh-1');
      expect(mockPrisma.webhook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should return empty array when no webhooks exist', async () => {
      mockPrisma.webhook.findMany.mockResolvedValue([]);

      const result = await service.list(tenantId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should return a webhook with recent deliveries', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue({
        ...mockWebhook,
        deliveries: [mockDelivery],
      });

      const result = await service.getById(tenantId, 'wh-1');

      expect(result).toMatchObject({ id: 'wh-1' });
      expect(mockPrisma.webhook.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wh-1', tenantId },
        }),
      );
    });

    it('should throw NotFoundException when webhook not found', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(null);

      await expect(service.getById(tenantId, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update webhook fields', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(mockWebhook);
      mockPrisma.webhook.update.mockResolvedValue({
        ...mockWebhook,
        name: 'Updated Name',
      });

      const result = await service.update(tenantId, 'wh-1', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should update multiple fields at once', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(mockWebhook);
      mockPrisma.webhook.update.mockResolvedValue(mockWebhook);

      await service.update(tenantId, 'wh-1', {
        name: 'New Name',
        url: 'https://new-url.com/hook',
        isActive: false,
      });

      expect(mockPrisma.webhook.update).toHaveBeenCalledWith({
        where: { id: 'wh-1' },
        data: {
          name: 'New Name',
          url: 'https://new-url.com/hook',
          isActive: false,
        },
      });
    });

    it('should throw NotFoundException when webhook not found', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(null);

      await expect(
        service.update(tenantId, 'missing', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete an existing webhook', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(mockWebhook);
      mockPrisma.webhook.delete.mockResolvedValue(mockWebhook);

      await service.delete(tenantId, 'wh-1');

      expect(mockPrisma.webhook.delete).toHaveBeenCalledWith({
        where: { id: 'wh-1' },
      });
    });

    it('should throw NotFoundException when webhook not found', async () => {
      mockPrisma.webhook.findFirst.mockResolvedValue(null);

      await expect(service.delete(tenantId, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('triggerEvent', () => {
    it('should create deliveries for matching active webhooks', async () => {
      mockPrisma.webhook.findMany.mockResolvedValue([mockWebhook]);
      mockPrisma.webhookDelivery.create.mockResolvedValue(mockDelivery);

      const result = await service.triggerEvent(tenantId, 'order.created', {
        orderId: '1',
      });

      expect(result.triggered).toBe(1);
      expect(result.deliveryIds).toEqual(['del-1']);
      expect(mockPrisma.webhookDelivery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            webhookId: 'wh-1',
            event: 'order.created',
            status: 'PENDING',
          }),
        }),
      );
    });

    it('should return triggered 0 when no webhooks match', async () => {
      mockPrisma.webhook.findMany.mockResolvedValue([]);

      const result = await service.triggerEvent(tenantId, 'order.cancelled', {});

      expect(result.triggered).toBe(0);
      expect(result.deliveryIds).toEqual([]);
    });
  });

  describe('retryDelivery', () => {
    it('should retry a failed delivery', async () => {
      mockPrisma.webhookDelivery.findUnique.mockResolvedValue({
        ...mockDelivery,
        status: 'FAILED',
        attempt: 1,
        webhook: mockWebhook,
      });
      mockPrisma.webhookDelivery.update.mockResolvedValue(mockDelivery);

      jest.spyOn(service, 'deliverWebhook').mockResolvedValue({ success: true, statusCode: 200 });

      const result = await service.retryDelivery('del-1');

      expect(mockPrisma.webhookDelivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'del-1' },
          data: expect.objectContaining({
            status: 'PENDING',
            attempt: 2,
          }),
        }),
      );
      expect(service.deliverWebhook).toHaveBeenCalled();
    });

    it('should return message when delivery already succeeded', async () => {
      mockPrisma.webhookDelivery.findUnique.mockResolvedValue({
        ...mockDelivery,
        status: 'SUCCESS',
      });

      const result = await service.retryDelivery('del-1');

      expect(result).toEqual({ message: 'Delivery already succeeded' });
    });

    it('should return message when max attempts reached', async () => {
      mockPrisma.webhookDelivery.findUnique.mockResolvedValue({
        ...mockDelivery,
        status: 'FAILED',
        attempt: 3,
        maxAttempts: 3,
      });

      const result = await service.retryDelivery('del-1');

      expect(result).toEqual({ message: 'Max attempts reached' });
    });

    it('should throw NotFoundException when delivery not found', async () => {
      mockPrisma.webhookDelivery.findUnique.mockResolvedValue(null);

      await expect(service.retryDelivery('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDeliveries', () => {
    it('should return paginated deliveries', async () => {
      mockPrisma.webhookDelivery.findMany.mockResolvedValue([mockDelivery]);
      mockPrisma.webhookDelivery.count.mockResolvedValue(1);

      const result = await service.getDeliveries('wh-1');

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should calculate correct pagination for multiple pages', async () => {
      mockPrisma.webhookDelivery.findMany.mockResolvedValue([]);
      mockPrisma.webhookDelivery.count.mockResolvedValue(50);

      const result = await service.getDeliveries('wh-1', 2, 20);

      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(3);
      expect(mockPrisma.webhookDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20 }),
      );
    });
  });

  describe('cleanupOldDeliveries', () => {
    it('should delete old deliveries and return count', async () => {
      mockPrisma.webhookDelivery.deleteMany.mockResolvedValue({ count: 15 });

      const result = await service.cleanupOldDeliveries(30);

      expect(result.deleted).toBe(15);
      expect(mockPrisma.webhookDelivery.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['SUCCESS', 'FAILED'] },
          }),
        }),
      );
    });

    it('should return 0 deleted when no old deliveries exist', async () => {
      mockPrisma.webhookDelivery.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.cleanupOldDeliveries(7);

      expect(result.deleted).toBe(0);
    });
  });
});
