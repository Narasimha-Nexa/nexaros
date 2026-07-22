import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyService } from './idempotency.service';
import { RedisService } from '../../../../common/redis/redis.service';
import { PrismaService } from '../../../../prisma/prisma.service';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let prisma: jest.Mocked<PrismaService>;
  let redisClient: { status: string; exists: jest.Mock; set: jest.Mock; del: jest.Mock; get: jest.Mock };

  const mockRedisClient = {
    status: 'ready',
    exists: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    get: jest.fn(),
  };

  const mockRedis = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  const mockPrisma = {
    order: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    // Reset ALL mock implementations and calls to prevent state leakage
    // between tests (especially important for lifecycle tests that set permanent return values)
    jest.resetAllMocks();

    // Re-establish the default mock for getClient (cleared by resetAllMocks)
    mockRedis.getClient.mockReturnValue(mockRedisClient);
    mockRedisClient.status = 'ready';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        { provide: RedisService, useValue: mockRedis },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    redisClient = mockRedisClient;
  });

  // ── buildKey ──

  describe('buildKey', () => {
    it('should construct deterministic key from channel and external ID', () => {
      const key = service.buildKey('swiggy', 'order-123');
      expect(key).toBe('swiggy:order-123');
    });

    it('should handle special characters in IDs', () => {
      const key = service.buildKey('zomato', 'ORD_2024_001');
      expect(key).toBe('zomato:ORD_2024_001');
    });
  });

  // ── check ──

  describe('check', () => {
    it('should return true when key exists in Redis', async () => {
      redisClient.exists.mockResolvedValue(1);

      const result = await service.check('swiggy:order-123');

      expect(result).toBe(true);
      expect(redisClient.exists).toHaveBeenCalledWith('idempotency:swiggy:order-123');
    });

    it('should fall back to DB when Redis returns false', async () => {
      redisClient.exists.mockResolvedValue(0);
      mockPrisma.order.findFirst.mockResolvedValue({ id: 'order-1' });

      const result = await service.check('swiggy:order-123');

      expect(result).toBe(true);
      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
        where: { idempotencyKey: 'swiggy:order-123' },
        select: { id: true },
      });
    });

    it('should return false when neither Redis nor DB has the key', async () => {
      redisClient.exists.mockResolvedValue(0);
      mockPrisma.order.findFirst.mockResolvedValue(null);

      const result = await service.check('swiggy:new-order');

      expect(result).toBe(false);
    });

    it('should handle Redis unavailability gracefully', async () => {
      redisClient.status = 'not-ready';
      mockPrisma.order.findFirst.mockResolvedValue(null);

      const result = await service.check('swiggy:order-123');

      expect(result).toBe(false);
    });

    it('should handle Redis error gracefully', async () => {
      redisClient.exists.mockRejectedValue(new Error('Connection refused'));
      mockPrisma.order.findFirst.mockResolvedValue(null);

      const result = await service.check('swiggy:order-123');

      expect(result).toBe(false);
    });
  });

  // ── claim ──

  describe('claim', () => {
    it('should return true when SETNX succeeds (key not set)', async () => {
      redisClient.set.mockResolvedValue('OK');

      const result = await service.claim('swiggy:order-123');

      expect(result).toBe(true);
      expect(redisClient.set).toHaveBeenCalledWith(
        'idempotency:swiggy:order-123',
        'pending',
        'EX',
        86400,
        'NX',
      );
    });

    it('should return false when SETNX fails (key already set)', async () => {
      redisClient.set.mockResolvedValue(null);

      const result = await service.claim('swiggy:order-123');

      expect(result).toBe(false);
    });

    it('should fall back to DB check when Redis is unavailable', async () => {
      redisClient.set.mockRejectedValue(new Error('Connection refused'));
      mockPrisma.order.findFirst.mockResolvedValue(null); // No existing order

      const result = await service.claim('swiggy:order-123');

      expect(result).toBe(true); // No order found, so we can claim it
    });

    it('should return false from fallback when DB has the key', async () => {
      redisClient.set.mockRejectedValue(new Error('Connection refused'));
      mockPrisma.order.findFirst.mockResolvedValue({ id: 'order-1' });

      const result = await service.claim('swiggy:existing-order');

      expect(result).toBe(false);
    });

    it('should use TTL of 86400 seconds (24 hours)', async () => {
      redisClient.set.mockResolvedValue('OK');

      await service.claim('swiggy:order-123');

      // Verify the EX (expire) parameter is 86400
      expect(redisClient.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'EX',
        86400,
        'NX',
      );
    });
  });

  // ── markConsumed ──

  describe('markConsumed', () => {
    it('should update Redis with order ID', async () => {
      redisClient.set.mockResolvedValue('OK');

      await service.markConsumed('swiggy:order-123', 'order-42');

      expect(redisClient.set).toHaveBeenCalledWith(
        'idempotency:swiggy:order-123',
        'order-42',
        'EX',
        86400,
      );
    });

    it('should not throw when Redis is unavailable', async () => {
      redisClient.set.mockRejectedValue(new Error('Connection refused'));

      await expect(
        service.markConsumed('swiggy:order-123', 'order-42'),
      ).resolves.not.toThrow();
    });
  });

  // ── release ──

  describe('release', () => {
    it('should delete the Redis key', async () => {
      redisClient.del.mockResolvedValue(1);

      await service.release('swiggy:order-123');

      expect(redisClient.del).toHaveBeenCalledWith('idempotency:swiggy:order-123');
    });

    it('should not throw when Redis is unavailable', async () => {
      redisClient.del.mockRejectedValue(new Error('Connection refused'));

      await expect(service.release('swiggy:order-123')).resolves.not.toThrow();
    });
  });

  // ── Integration-style: claim + check + markConsumed + check again ──

  describe('idempotency lifecycle', () => {
    it('should allow claiming, then detect as already processed', async () => {
      // Initial claim succeeds
      redisClient.set.mockResolvedValueOnce('OK');
      const claimResult = await service.claim('swiggy:order-456');
      expect(claimResult).toBe(true);

      // Check returns true (exists in Redis)
      redisClient.exists.mockResolvedValue(1);
      const checkResult = await service.check('swiggy:order-456');
      expect(checkResult).toBe(true);

      // Mark as consumed
      redisClient.set.mockResolvedValue('OK');
      await service.markConsumed('swiggy:order-456', 'order-99');

      // Check still returns true
      redisClient.exists.mockResolvedValue(1);
      const finalCheck = await service.check('swiggy:order-456');
      expect(finalCheck).toBe(true);
    });

    it('should handle concurrent claims — second caller loses', async () => {
      // First caller claims successfully
      redisClient.set.mockResolvedValueOnce('OK');
      const first = await service.claim('swiggy:concurrent');
      expect(first).toBe(true);

      // Second caller fails to claim (key already exists)
      redisClient.set.mockResolvedValueOnce(null);
      const second = await service.claim('swiggy:concurrent');
      expect(second).toBe(false);
    });
  });
});
