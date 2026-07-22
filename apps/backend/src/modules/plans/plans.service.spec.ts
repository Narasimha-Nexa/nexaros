import { Test, TestingModule } from '@nestjs/testing';
import { PlansService } from './plans.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PlansService', () => {
  let service: PlansService;
  let prisma: any;

  const mockPlan = {
    id: 'plan-123',
    name: 'Starter',
    slug: 'starter',
    description: 'For small restaurants',
    price: 4999,
    billingCycle: 'MONTHLY',
    trialDays: 14,
    maxBranches: 1,
    maxStaff: 10,
    features: {},
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    entitlements: [],
    subscriptions: [],
    _count: { subscriptions: 10 },
  };

  beforeEach(async () => {
    prisma = {
      platformPlan: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      planEntitlement: {
        findMany: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all plans with entitlements and subscription count', async () => {
      prisma.platformPlan.findMany.mockResolvedValue([mockPlan]);
      const result = await service.findAll();
      expect(result).toEqual([mockPlan]);
      expect(prisma.platformPlan.findMany).toHaveBeenCalledWith({
        include: {
          entitlements: true,
          _count: { select: { subscriptions: true } },
        },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a plan by id', async () => {
      prisma.platformPlan.findUnique.mockResolvedValue(mockPlan);
      const result = await service.findOne('plan-123');
      expect(result).toEqual(mockPlan);
    });

    it('should throw NotFoundException when plan not found', async () => {
      prisma.platformPlan.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a plan with slugified code', async () => {
      const dto = { name: 'Business Pro', price: 9999, billingCycle: 'MONTHLY' as const, maxBranches: 5, maxStaff: 50 };
      prisma.platformPlan.findUnique.mockResolvedValue(null);
      prisma.planEntitlement.createMany.mockResolvedValue({ count: 0 });
      prisma.platformPlan.create.mockResolvedValue({ ...mockPlan, ...dto, id: 'plan-456' });

      const result = await service.create(dto);
      expect(result.name).toBe('Business Pro');
      expect(prisma.platformPlan.create).toHaveBeenCalled();
    });

    it('should create a plan without entitlements', async () => {
      const dto = { name: 'Basic', price: 2999 };
      prisma.platformPlan.findUnique.mockResolvedValue(null);
      prisma.planEntitlement.createMany.mockResolvedValue({ count: 0 });
      prisma.platformPlan.create.mockResolvedValue({ ...mockPlan, ...dto, id: 'plan-789', entitlements: [] });

      const result = await service.create(dto);
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update plan fields', async () => {
      prisma.platformPlan.findUnique.mockResolvedValue(mockPlan);
      prisma.planEntitlement.deleteMany.mockResolvedValue({ count: 0 });
      prisma.planEntitlement.createMany.mockResolvedValue({ count: 0 });
      prisma.platformPlan.update.mockResolvedValue({ ...mockPlan, name: 'Updated Plan' });

      const result = await service.update('plan-123', { name: 'Updated Plan' });
      expect(result.name).toBe('Updated Plan');
    });

    it('should throw NotFoundException when plan not found', async () => {
      prisma.platformPlan.findUnique.mockResolvedValue(null);
      await expect(service.update('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should hard delete a plan', async () => {
      prisma.platformPlan.findUnique.mockResolvedValue(mockPlan);
      prisma.platformPlan.delete.mockResolvedValue(mockPlan);
      await expect(service.remove('plan-123')).resolves.toBeDefined();
    });

    it('should throw NotFoundException when plan not found', async () => {
      prisma.platformPlan.findUnique.mockResolvedValue(null);
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
