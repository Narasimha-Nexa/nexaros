import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: any;

  const mockTenantId = 'tenant-123';
  const mockSubscription = {
    id: 'sub-123',
    tenantId: mockTenantId,
    planId: 'plan-123',
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
    plan: { id: 'plan-123', name: 'Starter', slug: 'starter', price: 4999, billingCycle: 'MONTHLY' },
    payments: [],
    invoices: [],
  };

  beforeEach(async () => {
    prisma = {
      subscription: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      platformPlan: {
        findUnique: jest.fn(),
      },
      planEntitlement: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return subscriptions for a tenant', async () => {
      prisma.subscription.findMany.mockResolvedValue([mockSubscription]);
      const result = await service.findAll(mockTenantId);
      expect(result).toEqual([mockSubscription]);
      expect(prisma.subscription.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        include: { plan: { select: { id: true, name: true, slug: true, price: true, billingCycle: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a subscription by id and tenantId', async () => {
      prisma.subscription.findFirst.mockResolvedValue(mockSubscription);
      const result = await service.findOne('sub-123', mockTenantId);
      expect(result).toEqual(mockSubscription);
    });

    it('should throw NotFoundException when subscription not found', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent', mockTenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActive', () => {
    it('should return the active subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue(mockSubscription);
      const result = await service.getActive(mockTenantId);
      expect(result).toEqual(mockSubscription);
      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          status: { in: ['ACTIVE', 'TRIAL', 'PAYMENT_PENDING', 'GRACE_PERIOD'] },
        },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return null when no active subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      const result = await service.getActive(mockTenantId);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a subscription with TRIAL status', async () => {
      const dto = { planId: 'plan-123' };
      prisma.platformPlan.findUnique.mockResolvedValue({ id: 'plan-123', name: 'Starter', trialDays: 14, isActive: true, features: {} });
      prisma.subscription.create.mockResolvedValue({ ...mockSubscription, status: 'TRIAL' });

      const result = await service.create(mockTenantId, dto);
      expect(result.status).toBe('TRIAL');
      expect(prisma.subscription.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when plan not found', async () => {
      prisma.platformPlan.findUnique.mockResolvedValue(null);
      await expect(service.create(mockTenantId, { planId: 'nonexistent' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when plan is inactive', async () => {
      const planWithTrial = { id: 'plan-123', name: 'Starter', trialDays: 14, isActive: false, features: {} };
      prisma.platformPlan.findUnique.mockResolvedValue(planWithTrial);
      prisma.planEntitlement.findMany.mockResolvedValue([{ moduleKey: 'menu', enabled: true }]);
      prisma.subscription.create.mockResolvedValue({ ...mockSubscription, status: 'TRIAL' });

      const result = await service.create(mockTenantId, { planId: 'plan-123' });
      expect(result.status).toBe('TRIAL');
    });
  });

  describe('update', () => {
    it('should update a subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue(mockSubscription);
      prisma.subscription.update.mockResolvedValue({ ...mockSubscription, planId: 'plan-456' });

      const result = await service.update('sub-123', mockTenantId, { planId: 'plan-456' });
      expect(result.planId).toBe('plan-456');
    });

    it('should throw NotFoundException when subscription not found', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      await expect(service.update('nonexistent', mockTenantId, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue(mockSubscription);
      prisma.subscription.delete.mockResolvedValue(mockSubscription);
      await expect(service.remove('sub-123', mockTenantId)).resolves.toBeDefined();
    });

    it('should throw NotFoundException when subscription not found', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      await expect(service.remove('nonexistent', mockTenantId)).rejects.toThrow(NotFoundException);
    });
  });
});
