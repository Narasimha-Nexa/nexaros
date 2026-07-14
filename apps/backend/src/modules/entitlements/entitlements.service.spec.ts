import { Test, TestingModule } from '@nestjs/testing';
import { EntitlementsService } from './entitlements.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('EntitlementsService', () => {
  let service: EntitlementsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPlan = {
    id: 'plan-pro',
    name: 'Professional',
    slug: 'professional',
    price: 2999,
    entitlements: [
      { moduleKey: 'pos', enabled: true },
      { moduleKey: 'kitchen', enabled: true },
      { moduleKey: 'reports', enabled: true },
      { moduleKey: 'ai_analytics', enabled: false },
    ],
  };

  const mockPrisma = {
    platformPlan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    planEntitlement: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    featureFlag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    tenantFeatureFlag: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EntitlementsService>(EntitlementsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('getModuleKeys', () => {
    it('should return 21 module keys', async () => {
      const result = await service.getModuleKeys();

      expect(result).toHaveLength(21);
      expect(result.map((m) => m.key)).toContain('pos');
      expect(result.map((m) => m.key)).toContain('ai_analytics');
      expect(result.map((m) => m.key)).toContain('white_label');
    });
  });

  describe('getPlans', () => {
    it('should return all active plans with entitlements', async () => {
      mockPrisma.platformPlan.findMany.mockResolvedValue([mockPlan] as any);

      const result = await service.getPlans();

      expect(result).toHaveLength(1);
      expect(result[0].entitlements).toHaveLength(4);
    });
  });

  describe('getPlan', () => {
    it('should return plan by slug', async () => {
      mockPrisma.platformPlan.findUnique.mockResolvedValue(mockPlan as any);

      const result = await service.getPlan('professional');

      expect(result.name).toBe('Professional');
    });

    it('should throw NotFoundException for missing plan', async () => {
      mockPrisma.platformPlan.findUnique.mockResolvedValue(null);

      await expect(service.getPlan('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPlan', () => {
    it('should create plan with entitlements', async () => {
      mockPrisma.platformPlan.create.mockResolvedValue({
        ...mockPlan,
        entitlements: mockPlan.entitlements,
      } as any);

      const result = await service.createPlan({
        name: 'Professional',
        slug: 'professional',
        price: 2999,
        entitlements: { pos: true, kitchen: true, reports: true },
      });

      expect(result).toBeDefined();
      expect(mockPrisma.platformPlan.create).toHaveBeenCalled();
    });
  });

  describe('updatePlanEntitlements', () => {
    it('should replace plan entitlements', async () => {
      mockPrisma.planEntitlement.deleteMany.mockResolvedValue({ count: 4 });
      mockPrisma.planEntitlement.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.platformPlan.findUnique.mockResolvedValue({
        ...mockPlan,
        entitlements: [{ moduleKey: 'pos', enabled: true }, { moduleKey: 'kitchen', enabled: true }, { moduleKey: 'reports', enabled: true }],
      } as any);

      const result = await service.updatePlanEntitlements('plan-pro', {
        pos: true, kitchen: true, reports: true,
      });

      expect(mockPrisma.planEntitlement.deleteMany).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('setCustomEntitlements', () => {
    it('should update subscription entitlements', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({ id: 'sub-1' } as any);
      mockPrisma.subscription.update.mockResolvedValue({} as any);

      await service.setCustomEntitlements('tenant-1', { loyalty: true, crm: false });

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { entitlements: { loyalty: true, crm: false } },
        }),
      );
    });

    it('should throw NotFoundException when no subscription exists', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      await expect(service.setCustomEntitlements('tenant-x', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('feature flags', () => {
    it('should return all feature flags', async () => {
      mockPrisma.featureFlag.findMany.mockResolvedValue([
        { key: 'dark_mode', name: 'Dark Mode', enabled: true },
      ] as any);

      const result = await service.getFeatureFlags();

      expect(result).toHaveLength(1);
    });

    it('should toggle feature flag via upsert', async () => {
      mockPrisma.featureFlag.upsert.mockResolvedValue({
        key: 'dark_mode', name: 'Dark Mode', enabled: true,
      } as any);

      const result = await service.toggleFeatureFlag('dark_mode', true);

      expect(result.enabled).toBe(true);
    });

    it('should set tenant feature flag', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        id: 'ff-1', key: 'dark_mode', enabled: true,
      } as any);
      mockPrisma.tenantFeatureFlag.upsert.mockResolvedValue({} as any);

      await service.setTenantFeatureFlag('tenant-1', 'dark_mode', false);

      expect(mockPrisma.tenantFeatureFlag.upsert).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown feature flag', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue(null);

      await expect(service.setTenantFeatureFlag('tenant-1', 'nonexistent', true)).rejects.toThrow(NotFoundException);
    });

    it('should return tenant-specific feature flags', async () => {
      mockPrisma.featureFlag.findMany.mockResolvedValue([
        { id: 'ff-1', key: 'dark_mode', name: 'Dark Mode', enabled: true },
      ] as any);
      mockPrisma.tenantFeatureFlag.findMany.mockResolvedValue([
        { featureFlagId: 'ff-1', enabled: false },
      ] as any);

      const result = await service.getTenantFeatureFlags('tenant-1');

      expect(result[0].enabled).toBe(false);
    });
  });
});
