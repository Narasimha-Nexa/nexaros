import { Test, TestingModule } from '@nestjs/testing';
import { SessionStateService } from './session-state.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RedisService } from '../../../../common/redis/redis.service';

describe('SessionStateService', () => {
  let service: SessionStateService;
  let prisma: jest.Mocked<PrismaService>;
  let redisClient: { status: string; get: jest.Mock; set: jest.Mock; expire: jest.Mock; del: jest.Mock };

  const mockRedisClient = {
    status: 'ready',
    get: jest.fn(),
    set: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
  };

  const mockRedis = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  const mockSession = {
    id: 'session-1',
    channel: 'WHATSAPP',
    platformUserId: 'wa-user-123',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    state: 'GREETING',
    cartData: { items: [], total: 0 },
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    metadata: null,
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    orderId: null,
    version: 1,
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    conversationSession: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionStateService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<SessionStateService>(SessionStateService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    redisClient = mockRedisClient;
  });

  // ── getOrCreateSession ──

  describe('getOrCreateSession', () => {
    const params = {
      channel: 'whatsapp',
      platformUserId: 'wa-user-123',
      tenantId: 'tenant-1',
      branchId: 'branch-1',
    };

    it('should return cached session from Redis when available', async () => {
      const cachedSession = {
        id: 'session-1',
        channel: 'whatsapp',
        platformUserId: 'wa-user-123',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        state: 'greeting',
        cart: { items: [], total: 0 },
        lastActivityAt: new Date().toISOString(),
      };
      redisClient.get.mockResolvedValue(JSON.stringify(cachedSession));
      redisClient.expire.mockResolvedValue(1);

      const result = await service.getOrCreateSession(params);

      expect(result.id).toBe('session-1');
      expect(result.state).toBe('greeting');
      expect(redisClient.expire).toHaveBeenCalled();
      expect(mockPrisma.conversationSession.findFirst).not.toHaveBeenCalled();
    });

    it('should create new session in DB when not cached and not in DB', async () => {
      redisClient.get.mockResolvedValue(null);
      mockPrisma.conversationSession.findFirst.mockResolvedValue(null);
      mockPrisma.conversationSession.create.mockResolvedValue(mockSession);

      const result = await service.getOrCreateSession(params);

      expect(result.id).toBe('session-1');
      expect(result.state).toBe('greeting');
      expect(result.channel).toBe('whatsapp');
      expect(mockPrisma.conversationSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channel: 'WHATSAPP',
          platformUserId: 'wa-user-123',
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          state: 'GREETING',
        }),
      });
      // Verify it was cached in Redis
      expect(redisClient.set).toHaveBeenCalled();
    });

    it('should return existing session from DB when not cached', async () => {
      redisClient.get.mockResolvedValue(null);
      mockPrisma.conversationSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.conversationSession.update.mockResolvedValue(mockSession);

      const result = await service.getOrCreateSession(params);

      expect(result.id).toBe('session-1');
      expect(result.state).toBe('greeting');
      expect(mockPrisma.conversationSession.create).not.toHaveBeenCalled();
      expect(mockPrisma.conversationSession.update).toHaveBeenCalled();
    });

    it('should reset session to browsing when previous order was placed', async () => {
      const completedSession = { ...mockSession, state: 'ORDER_PLACED', orderId: 'order-1' };
      redisClient.get.mockResolvedValue(null);
      mockPrisma.conversationSession.findFirst.mockResolvedValue(completedSession);
      mockPrisma.conversationSession.update.mockResolvedValue({
        ...completedSession,
        state: 'BROWSING',
        cartData: { items: [], total: 0 },
        orderId: null,
      });

      const result = await service.getOrCreateSession(params);

      expect(result.state).toBe('browsing');
      expect(mockPrisma.conversationSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          state: 'BROWSING',
          cartData: { items: [], total: 0 },
          orderId: null,
        }),
      });
    });

    it('should handle Redis cache failures gracefully', async () => {
      redisClient.get.mockRejectedValue(new Error('Redis down'));
      redisClient.status = 'ready';
      mockPrisma.conversationSession.findFirst.mockResolvedValue(mockSession);

      const result = await service.getOrCreateSession(params);

      expect(result).toBeDefined();
      expect(result.id).toBe('session-1');
    });
  });

  // ── transitionState ──

  describe('transitionState', () => {
    it('should transition to a new state and update activity timestamp', async () => {
      mockPrisma.conversationSession.update.mockResolvedValue({} as any);
      mockPrisma.conversationSession.findUnique.mockResolvedValue({
        channel: 'WHATSAPP',
        platformUserId: 'wa-user-123',
        tenantId: 'tenant-1',
      });

      await service.transitionState('session-1', 'cart_building');

      expect(mockPrisma.conversationSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          state: 'CART_BUILDING',
          lastActivityAt: expect.any(Date),
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should update cart data when provided', async () => {
      mockPrisma.conversationSession.update.mockResolvedValue({} as any);
      mockPrisma.conversationSession.findUnique.mockResolvedValue({
        channel: 'WHATSAPP',
        platformUserId: 'wa-user-123',
        tenantId: 'tenant-1',
      });

      await service.transitionState('session-1', 'cart_review', {
        cartData: { items: [{ menuItemId: 'item-1', name: 'Pizza', quantity: 1, unitPrice: 200 }], total: 200 },
      });

      expect(mockPrisma.conversationSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          state: 'CART_REVIEW',
          cartData: { items: [{ menuItemId: 'item-1', name: 'Pizza', quantity: 1, unitPrice: 200 }], total: 200 },
        }),
      });
    });

    it('should set longer TTL when transitioning to awaiting_payment', async () => {
      mockPrisma.conversationSession.update.mockResolvedValue({} as any);
      mockPrisma.conversationSession.findUnique.mockResolvedValue({
        channel: 'WHATSAPP',
        platformUserId: 'wa-user-123',
        tenantId: 'tenant-1',
      });

      await service.transitionState('session-1', 'awaiting_payment');

      // Mock calls[0] = [where, data], so calls[0] = [where, data]...
      // update.mock.calls[0] returns [whereClause, dataClause]
      const calls = mockPrisma.conversationSession.update.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const updateArgs = calls[0][0];
      expect(updateArgs).toBeDefined();
      const expiresAt = updateArgs.data.expiresAt as Date;
      const twoHoursFromNow = Date.now() + 7200 * 1000;

      expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 7100 * 1000);
      expect(expiresAt.getTime()).toBeLessThan(twoHoursFromNow + 1000);
    });

    it('should update customer info when provided', async () => {
      mockPrisma.conversationSession.update.mockResolvedValue({} as any);
      mockPrisma.conversationSession.findUnique.mockResolvedValue({
        channel: 'WHATSAPP',
        platformUserId: 'wa-user-123',
        tenantId: 'tenant-1',
      });

      await service.transitionState('session-1', 'cart_building', {
        customerName: 'John Doe',
        customerPhone: '+919999999999',
      });

      expect(mockPrisma.conversationSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          customerName: 'John Doe',
          customerPhone: '+919999999999',
        }),
      });
    });

    it('should invalidate Redis cache after state transition', async () => {
      mockPrisma.conversationSession.update.mockResolvedValue({} as any);
      mockPrisma.conversationSession.findUnique.mockResolvedValue({
        channel: 'WHATSAPP',
        platformUserId: 'wa-user-123',
        tenantId: 'tenant-1',
      });

      await service.transitionState('session-1', 'cart_building');

      // Should delete the Redis cache key
      expect(redisClient.del).toHaveBeenCalledWith(
        'conv_session:whatsapp:wa-user-123:tenant-1',
      );
    });
  });

  // ── updateCart ──

  describe('updateCart', () => {
    it('should update cart data and activity timestamp', async () => {
      mockPrisma.conversationSession.update.mockResolvedValue({} as any);

      const cartData = {
        items: [{ menuItemId: 'item-1', name: 'Burger', quantity: 2, unitPrice: 150 }],
        total: 300,
      };

      await service.updateCart('session-1', cartData);

      expect(mockPrisma.conversationSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: {
          cartData,
          lastActivityAt: expect.any(Date),
        },
      });
    });
  });

  // ── getSession ──

  describe('getSession', () => {
    it('should return session data when found', async () => {
      mockPrisma.conversationSession.findUnique.mockResolvedValue(mockSession);

      const result = await service.getSession('session-1');

      expect(result).toBeDefined();
      expect(result!.id).toBe('session-1');
      expect(result!.state).toBe('greeting');
      expect(result!.channel).toBe('whatsapp');
    });

    it('should return null when session not found', async () => {
      mockPrisma.conversationSession.findUnique.mockResolvedValue(null);

      const result = await service.getSession('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when session is soft-deleted', async () => {
      mockPrisma.conversationSession.findUnique.mockResolvedValue({
        ...mockSession,
        deletedAt: new Date(),
      });

      const result = await service.getSession('session-1');

      expect(result).toBeNull();
    });
  });

  // ── cleanupExpiredSessions ──

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions excluding active ones', async () => {
      mockPrisma.conversationSession.deleteMany.mockResolvedValue({ count: 5 });

      const deleted = await service.cleanupExpiredSessions();

      expect(deleted).toBe(5);
      expect(mockPrisma.conversationSession.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
          state: { notIn: ['ORDER_PLACED', 'AWAITING_PAYMENT'] },
        },
      });
    });

    it('should return 0 when no expired sessions', async () => {
      mockPrisma.conversationSession.deleteMany.mockResolvedValue({ count: 0 });

      const deleted = await service.cleanupExpiredSessions();

      expect(deleted).toBe(0);
    });
  });
});
