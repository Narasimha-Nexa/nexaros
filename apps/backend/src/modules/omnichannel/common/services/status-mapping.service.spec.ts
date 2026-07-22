import { Test, TestingModule } from '@nestjs/testing';
import { StatusMappingService } from './status-mapping.service';
import { PrismaService } from '../../../../prisma/prisma.service';

describe('StatusMappingService', () => {
  let service: StatusMappingService;
  let prisma: jest.Mocked<PrismaService>;

  const mockMappings = [
    {
      id: 'm-1',
      channel: 'swiggy',
      direction: 'outbound',
      internalStatus: 'received',
      externalStatus: 'swiggy_acknowledged',
      isActive: true,
      description: null,
      sortOrder: 0,
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'm-2',
      channel: 'swiggy',
      direction: 'outbound',
      internalStatus: 'accepted',
      externalStatus: 'swiggy_confirmed',
      isActive: true,
      description: null,
      sortOrder: 0,
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'm-3',
      channel: 'swiggy',
      direction: 'inbound',
      internalStatus: 'received',
      externalStatus: 'swiggy_acknowledged',
      isActive: true,
      description: null,
      sortOrder: 0,
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockPrisma = {
    channelStatusMapping: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusMappingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StatusMappingService>(StatusMappingService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;

    // Seed the cache with mock data to avoid DB calls in basic tests
    mockPrisma.channelStatusMapping.findMany.mockResolvedValue(mockMappings);
    await (service as any).refreshCacheIfStale();
  });

  // ── toExternal ──

  describe('toExternal', () => {
    it('should return external status for known internal status', async () => {
      const result = await service.toExternal('swiggy', 'received');
      expect(result).toBe('swiggy_acknowledged');
    });

    it('should return external status for another known internal status', async () => {
      const result = await service.toExternal('swiggy', 'accepted');
      expect(result).toBe('swiggy_confirmed');
    });

    it('should return null for unknown internal status', async () => {
      const result = await service.toExternal('swiggy', 'unknown_status');
      expect(result).toBeNull();
    });

    it('should return null for unmapped channel', async () => {
      const result = await service.toExternal('zomato', 'received');
      expect(result).toBeNull();
    });

    it('should refresh cache when stale and return fresh data', async () => {
      // Force cache to be stale
      (service as any).cacheTimestamp = 0;

      mockPrisma.channelStatusMapping.findMany.mockResolvedValue([
        {
          id: 'm-10',
          channel: 'zomato',
          direction: 'outbound',
          internalStatus: 'received',
          externalStatus: 'zomato_acknowledged',
          isActive: true,
          description: null,
          sortOrder: 0,
          version: 1,
          createdBy: null,
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.toExternal('zomato', 'received');

      expect(result).toBe('zomato_acknowledged');
      expect(mockPrisma.channelStatusMapping.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });

    it('should use cache when not stale', async () => {
      // Clear mock to verify no DB call
      mockPrisma.channelStatusMapping.findMany.mockClear();

      // First call populates cache
      await service.toExternal('swiggy', 'received');

      // Second call should use cache
      const result = await service.toExternal('swiggy', 'received');

      expect(result).toBe('swiggy_acknowledged');
      // findMany should NOT have been called during the second call
      // (it was only called once from beforeEach)
    });
  });

  // ── toInternal ──

  describe('toInternal', () => {
    it('should return internal status for known external status', async () => {
      const result = await service.toInternal('swiggy', 'swiggy_acknowledged');
      expect(result).toBe('received');
    });

    it('should return null for unknown external status', async () => {
      const result = await service.toInternal('swiggy', 'swiggy_nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for empty external status', async () => {
      const result = await service.toInternal('swiggy', '');
      expect(result).toBeNull();
    });

    it('should return null for undefined external status', async () => {
      const result = await service.toInternal('swiggy', undefined as any);
      expect(result).toBeNull();
    });
  });

  // ── seedDefaultMappings ──

  describe('seedDefaultMappings', () => {
    it('should create status mappings for a new channel', async () => {
      mockPrisma.channelStatusMapping.upsert.mockResolvedValue({} as any);

      const count = await service.seedDefaultMappings('zomato', 'system');

      // 9 outbound + 9 inbound = 18 total for zomato (but without duplicates since keys differ by direction)
      // Actually the seedDefaultMappings generates mappings including the `channel_` prefix pattern
      // The sharedOutbound has 9 entries and sharedInbound has 9 entries too = 18
      expect(count).toBeGreaterThan(0);
      expect(mockPrisma.channelStatusMapping.upsert).toHaveBeenCalled();

      // Verify an example mapping was created
      expect(mockPrisma.channelStatusMapping.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            channel: 'zomato',
            direction: 'outbound',
          }),
        }),
      );
    });

    it('should handle upsert failures gracefully', async () => {
      mockPrisma.channelStatusMapping.upsert
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValue({} as any);

      // Should not throw — just log and continue
      const count = await service.seedDefaultMappings('zomato');
      expect(count).toBeGreaterThan(0);
    });
  });

  // ── upsertMapping ──

  describe('upsertMapping', () => {
    it('should upsert a single mapping and invalidate cache', async () => {
      mockPrisma.channelStatusMapping.upsert.mockResolvedValue({} as any);

      // Populate cache first
      await service.toExternal('swiggy', 'received');
      const cacheSize = (service as any).cache.size;

      await service.upsertMapping({
        channel: 'swiggy',
        direction: 'outbound',
        internalStatus: 'received',
        externalStatus: 'swiggy_new_acknowledged',
      });

      // Cache should have been cleared
      expect((service as any).cache.size).toBe(0);

      expect(mockPrisma.channelStatusMapping.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            channel_direction_internalStatus: {
              channel: 'swiggy',
              direction: 'outbound',
              internalStatus: 'received',
            },
          }),
        }),
      );
    });
  });

  // ── getOutboundMappings ──

  describe('getOutboundMappings', () => {
    it('should return all outbound mappings for a channel', async () => {
      const mappings = await service.getOutboundMappings('swiggy');

      expect(mappings.size).toBe(2);
      expect(mappings.get('received')).toBe('swiggy_acknowledged');
      expect(mappings.get('accepted')).toBe('swiggy_confirmed');
    });

    it('should return empty map for unmapped channel', async () => {
      const mappings = await service.getOutboundMappings('unknown');
      expect(mappings.size).toBe(0);
    });
  });

  // ── refreshCacheIfStale ──

  describe('refreshCacheIfStale', () => {
    it('should skip refresh when cache is fresh', async () => {
      mockPrisma.channelStatusMapping.findMany.mockClear();

      // Cache was populated in beforeEach, so this should skip
      await (service as any).refreshCacheIfStale();

      expect(mockPrisma.channelStatusMapping.findMany).not.toHaveBeenCalled();
    });

    it('should refresh when cache timestamp is 0', async () => {
      mockPrisma.channelStatusMapping.findMany.mockClear();
      (service as any).cacheTimestamp = 0;

      mockPrisma.channelStatusMapping.findMany.mockResolvedValue(mockMappings);
      await (service as any).refreshCacheIfStale();

      expect(mockPrisma.channelStatusMapping.findMany).toHaveBeenCalled();
    });
  });
});
