import { Test, TestingModule } from '@nestjs/testing';
import { DeadLetterService } from './dead-letter.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('DeadLetterService', () => {
  let service: DeadLetterService;
  let prisma: jest.Mocked<PrismaService>;

  const mockDeadLetterLog = {
    id: 'dl-1',
    channel: 'swiggy',
    error: 'Invalid signature',
    rawPayload: { order_id: '123' },
    metadata: { ip: '1.2.3.4' },
    status: 'UNRESOLVED' as const,
    retryCount: 0,
    lastRetryAt: null,
    resolvedAt: null,
    resolvedBy: null,
    resolution: null,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  const mockPrisma = {
    deadLetterLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeadLetterService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DeadLetterService>(DeadLetterService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  // ── sendToDeadLetter ──

  describe('sendToDeadLetter', () => {
    it('should persist a failed webhook payload to the DB', async () => {
      mockPrisma.deadLetterLog.create.mockResolvedValue(mockDeadLetterLog);

      const id = await service.sendToDeadLetter(
        'swiggy',
        'Invalid signature',
        { order_id: '123' },
        { ip: '1.2.3.4' },
      );

      expect(id).toBe('dl-1');
      expect(mockPrisma.deadLetterLog.create).toHaveBeenCalledWith({
        data: {
          channel: 'swiggy',
          error: 'Invalid signature',
          rawPayload: { order_id: '123' },
          metadata: { ip: '1.2.3.4' },
          status: 'UNRESOLVED',
        },
      });
    });

    it('should cap error message at 2000 characters', async () => {
      const longError = 'x'.repeat(5000);
      mockPrisma.deadLetterLog.create.mockResolvedValue(mockDeadLetterLog);

      await service.sendToDeadLetter('swiggy', longError, {});

      const createCall = mockPrisma.deadLetterLog.create.mock.calls[0][0];
      expect(createCall.data.error.length).toBe(2000);
    });

    it('should handle missing metadata gracefully', async () => {
      mockPrisma.deadLetterLog.create.mockResolvedValue(mockDeadLetterLog);

      const id = await service.sendToDeadLetter('zomato', 'Parse error', {});

      expect(id).toBe('dl-1');
      expect(mockPrisma.deadLetterLog.create).toHaveBeenCalledWith({
        data: {
          channel: 'zomato',
          error: 'Parse error',
          rawPayload: {},
          metadata: {},
          status: 'UNRESOLVED',
        },
      });
    });

    it('should return fallback ID when DB write fails', async () => {
      mockPrisma.deadLetterLog.create.mockRejectedValue(new Error('Connection lost'));

      const id = await service.sendToDeadLetter('swiggy', 'Error', {});

      expect(id).toMatch(/^fallback-/);
    });
  });

  // ── getDeadLetters ──

  describe('getDeadLetters', () => {
    it('should return paginated dead-letter entries', async () => {
      mockPrisma.deadLetterLog.findMany.mockResolvedValue([mockDeadLetterLog]);
      mockPrisma.deadLetterLog.count.mockResolvedValue(1);

      const result = await service.getDeadLetters({ limit: 10, offset: 0 });

      expect(result.entries).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.entries[0].id).toBe('dl-1');
      expect(result.entries[0].channel).toBe('swiggy');
    });

    it('should filter by channel when specified', async () => {
      mockPrisma.deadLetterLog.findMany.mockResolvedValue([mockDeadLetterLog]);
      mockPrisma.deadLetterLog.count.mockResolvedValue(1);

      await service.getDeadLetters({ channel: 'swiggy' });

      expect(mockPrisma.deadLetterLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ channel: 'swiggy' }),
        }),
      );
    });

    it('should return empty result when no entries match', async () => {
      mockPrisma.deadLetterLog.findMany.mockResolvedValue([]);
      mockPrisma.deadLetterLog.count.mockResolvedValue(0);

      const result = await service.getDeadLetters({ channel: 'unknown' });

      expect(result.entries).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should use default pagination when limits are not provided', async () => {
      mockPrisma.deadLetterLog.findMany.mockResolvedValue([]);
      mockPrisma.deadLetterLog.count.mockResolvedValue(0);

      await service.getDeadLetters();

      expect(mockPrisma.deadLetterLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50, skip: 0 }),
      );
    });
  });

  // ── resolveDeadLetter ──

  describe('resolveDeadLetter', () => {
    it('should mark an entry as resolved', async () => {
      mockPrisma.deadLetterLog.update.mockResolvedValue(mockDeadLetterLog as any);

      await service.resolveDeadLetter('dl-1', 'Manually verified', 'admin@nexaros.com');

      expect(mockPrisma.deadLetterLog.update).toHaveBeenCalledWith({
        where: { id: 'dl-1' },
        data: {
          status: 'RESOLVED',
          resolvedAt: expect.any(Date),
          resolvedBy: 'admin@nexaros.com',
          resolution: 'Manually verified',
        },
      });
    });

    it('should use defaults when optional params are omitted', async () => {
      mockPrisma.deadLetterLog.update.mockResolvedValue(mockDeadLetterLog as any);

      await service.resolveDeadLetter('dl-1');

      expect(mockPrisma.deadLetterLog.update).toHaveBeenCalledWith({
        where: { id: 'dl-1' },
        data: expect.objectContaining({
          status: 'RESOLVED',
          resolvedBy: 'system',
          resolution: 'Manually resolved',
        }),
      });
    });
  });

  // ── markForRetry ──

  describe('markForRetry', () => {
    it('should increment retry count and set lastRetryAt', async () => {
      mockPrisma.deadLetterLog.update.mockResolvedValue({
        ...mockDeadLetterLog,
        retryCount: 1,
        status: 'RETRYING',
      } as any);

      await service.markForRetry('dl-1');

      expect(mockPrisma.deadLetterLog.update).toHaveBeenCalledWith({
        where: { id: 'dl-1' },
        data: {
          status: 'RETRYING',
          retryCount: { increment: 1 },
          lastRetryAt: expect.any(Date),
        },
      });
    });
  });

  // ── getStats ──

  describe('getStats', () => {
    it('should return aggregated stats per channel', async () => {
      mockPrisma.deadLetterLog.groupBy.mockResolvedValue([
        { channel: 'swiggy', _count: { id: 5 }, _max: { createdAt: new Date('2024-01-15') } },
        { channel: 'zomato', _count: { id: 3 }, _max: { createdAt: new Date('2024-01-14') } },
      ]);

      mockPrisma.deadLetterLog.findFirst
        .mockResolvedValueOnce({ error: 'Invalid signature', createdAt: new Date('2024-01-15') })
        .mockResolvedValueOnce({ error: 'Parse error', createdAt: new Date('2024-01-14') });

      const stats = await service.getStats();

      expect(stats.swiggy.count).toBe(5);
      expect(stats.swiggy.latestError).toBe('Invalid signature');
      expect(stats.zomato.count).toBe(3);
      expect(stats.zomato.latestError).toBe('Parse error');
    });

    it('should return empty object when no dead letters exist', async () => {
      mockPrisma.deadLetterLog.groupBy.mockResolvedValue([]);

      const stats = await service.getStats();

      expect(stats).toEqual({});
    });
  });

  // ── getTotalCount ──

  describe('getTotalCount', () => {
    it('should return total number of dead-letter entries', async () => {
      mockPrisma.deadLetterLog.count.mockResolvedValue(42);

      const count = await service.getTotalCount();

      expect(count).toBe(42);
    });
  });

  // ── cleanupOldEntries ──

  describe('cleanupOldEntries', () => {
    it('should delete resolved entries older than retention period', async () => {
      mockPrisma.deadLetterLog.deleteMany.mockResolvedValue({ count: 10 });

      const deleted = await service.cleanupOldEntries(90);

      expect(deleted).toBe(10);
      expect(mockPrisma.deadLetterLog.deleteMany).toHaveBeenCalledWith({
        where: {
          status: { in: ['RESOLVED', 'IGNORED'] },
          createdAt: { lt: expect.any(Date) },
        },
      });
    });

    it('should use default 90 days retention', async () => {
      mockPrisma.deadLetterLog.deleteMany.mockResolvedValue({ count: 0 });

      await service.cleanupOldEntries();

      expect(mockPrisma.deadLetterLog.deleteMany).toHaveBeenCalled();

      // Verify the cutoff is approximately 90 days ago
      const callArg = mockPrisma.deadLetterLog.deleteMany.mock.calls[0][0];
      const cutoff = callArg.where.createdAt.lt as Date;
      const diffMs = Date.now() - cutoff.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(88);
      expect(diffDays).toBeLessThan(92);
    });
  });
});
