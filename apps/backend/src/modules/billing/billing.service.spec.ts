import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGateway } from '../../common/providers/payment-gateway';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: jest.Mocked<PrismaService>;
  let paymentGateway: jest.Mocked<PaymentGateway>;

  const mockSubscription = {
    id: 'sub-1',
    tenantId: 'tenant-1',
    planId: 'plan-pro',
    status: 'ACTIVE',
    entitlements: {},
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    gracePeriodDays: 7,
    hasPromise: false,
    promiseUntil: null,
    plan: {
      slug: 'professional',
      entitlements: [
        { moduleKey: 'pos', enabled: true },
        { moduleKey: 'kitchen', enabled: true },
        { moduleKey: 'reports', enabled: true },
      ],
    },
  };

  const mockPlan = {
    id: 'plan-pro',
    name: 'Professional',
    slug: 'professional',
    price: 2999,
    entitlements: [],
  };

  const mockPrisma = {
    subscription: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    platformPlan: {
      findUnique: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
    coupon: {
      findUnique: jest.fn(),
    },
    paymentPromise: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    subscriptionInvoice: {
      findMany: jest.fn(),
    },
    subscriptionPayment: {
      findMany: jest.fn(),
    },
  };

  const mockPaymentGateway = {
    createOrder: jest.fn().mockResolvedValue({ razorpayOrderId: 'order_test123' }),
    verifyPayment: jest.fn(),
    processRefund: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaymentGateway, useValue: mockPaymentGateway },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    paymentGateway = module.get(PaymentGateway) as jest.Mocked<PaymentGateway>;
  });

  describe('getEntitlements', () => {
    it('should return entitlements with plan defaults merged with subscription overrides', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription as any);

      const result = await service.getEntitlements('tenant-1');
      const ent = result.entitlements as Record<string, boolean>;

      expect(result.status).toBe('ACTIVE');
      expect(ent['pos']).toBe(true);
      expect(ent['kitchen']).toBe(true);
      expect(ent['reports']).toBe(true);
    });

    it('should return NONE status when no subscription exists', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      const result = await service.getEntitlements('tenant-no-sub');

      expect(result.status).toBe('NONE');
      expect(result.entitlements).toEqual({});
    });

    it('should apply subscription-level entitlement overrides', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        ...mockSubscription,
        entitlements: { reports: false, loyalty: true },
      } as any);

      const result = await service.getEntitlements('tenant-1');
      const ent = result.entitlements as Record<string, boolean>;

      expect(ent['reports']).toBe(false);
      expect(ent['loyalty']).toBe(true);
    });
  });

  describe('transitionStatus', () => {
    it('should transition from TRIAL to ACTIVE', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        ...mockSubscription,
        status: 'TRIAL',
      } as any);
      mockPrisma.subscription.update.mockResolvedValue({} as any);

      const result = await service.transitionStatus('tenant-1', 'ACTIVE');

      expect(result.status).toBe('ACTIVE');
      expect(mockPrisma.subscription.update).toHaveBeenCalled();
    });

    it('should set grace period data when transitioning to GRACE_PERIOD', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription as any);
      mockPrisma.subscription.update.mockResolvedValue({} as any);

      await service.transitionStatus('tenant-1', 'GRACE_PERIOD');

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'GRACE_PERIOD',
            graceStartedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should set core-only entitlements when transitioning to RESTRICTED', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        ...mockSubscription,
        status: 'PAYMENT_PENDING',
      } as any);
      mockPrisma.subscription.update.mockResolvedValue({} as any);

      await service.transitionStatus('tenant-1', 'RESTRICTED');

      const updateCall = mockPrisma.subscription.update.mock.calls[0][0];
      expect(updateCall.data.entitlements).toEqual({
        pos: true, orders: true, kitchen: true, tables: true, payments: true, invoices: true,
      });
    });

    it('should throw BadRequestException for invalid transition', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        ...mockSubscription,
        status: 'ARCHIVED',
      } as any);

      await expect(service.transitionStatus('tenant-1', 'ACTIVE')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when no subscription found', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      await expect(service.transitionStatus('tenant-x', 'ACTIVE')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCheckout', () => {
    it('should create checkout with plan price', async () => {
      mockPrisma.platformPlan.findUnique.mockResolvedValue(mockPlan as any);
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1', email: 'test@test.com', phone: '+911234567890' } as any);

      const result = await service.createCheckout('tenant-1', 'plan-pro');

      expect(result.orderId).toBe('order_test123');
      expect(result.amount).toBe(2999);
      expect(result.planSlug).toBe('professional');
    });

    it('should apply percentage coupon discount', async () => {
      mockPrisma.platformPlan.findUnique.mockResolvedValue(mockPlan as any);
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1', email: 'test@test.com', phone: '+911234567890' } as any);
      mockPrisma.coupon.findUnique.mockResolvedValue({
        code: 'FEST20', type: 'PERCENTAGE', value: 20, maxDiscount: 1000,
        isActive: true, expiry: new Date(Date.now() + 86400000),
      } as any);

      const result = await service.createCheckout('tenant-1', 'plan-pro', 'FEST20');

      expect(result.discount).toBe(599.8);
      expect(result.amount).toBe(2399.2);
    });

    it('should apply fixed amount coupon discount', async () => {
      mockPrisma.platformPlan.findUnique.mockResolvedValue(mockPlan as any);
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1', email: 'test@test.com', phone: '+911234567890' } as any);
      mockPrisma.coupon.findUnique.mockResolvedValue({
        code: 'FLAT500', type: 'FIXED_AMOUNT', value: 500, maxDiscount: null,
        isActive: true, expiry: new Date(Date.now() + 86400000),
      } as any);

      const result = await service.createCheckout('tenant-1', 'plan-pro', 'FLAT500');

      expect(result.discount).toBe(500);
      expect(result.amount).toBe(2499);
    });

    it('should throw NotFoundException for invalid plan', async () => {
      mockPrisma.platformPlan.findUnique.mockResolvedValue(null);

      await expect(service.createCheckout('tenant-1', 'bad-plan')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPaymentPromise', () => {
    it('should create payment promise and update subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription as any);
      mockPrisma.paymentPromise.create.mockResolvedValue({
        id: 'promise-1', tenantId: 'tenant-1', status: 'APPROVED',
      } as any);
      mockPrisma.subscription.update.mockResolvedValue({} as any);

      const result = await service.createPaymentPromise('tenant-1', 'Cash flow issue', '2026-08-01');

      expect(result.status).toBe('APPROVED');
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ hasPromise: true }),
        }),
      );
    });

    it('should throw NotFoundException when no subscription exists', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      await expect(service.createPaymentPromise('tenant-x', 'reason', '2026-08-01')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInvoices', () => {
    it('should return invoices for subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({ id: 'sub-1' } as any);
      mockPrisma.subscriptionInvoice.findMany.mockResolvedValue([]);

      const result = await service.getInvoices('tenant-1');

      expect(result).toEqual([]);
    });

    it('should return empty array when no subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      const result = await service.getInvoices('tenant-x');

      expect(result).toEqual([]);
    });
  });

  describe('getAllSubscriptions', () => {
    it('should return paginated subscriptions', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([mockSubscription] as any);
      mockPrisma.subscription.count.mockResolvedValue(1);

      const result = await service.getAllSubscriptions(1, 10);

      expect(result.subscriptions).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getExpiringSoon', () => {
    it('should return subscriptions expiring within given days', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);

      const result = await service.getExpiringSoon(7);

      expect(result).toEqual([]);
      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['TRIAL', 'ACTIVE'] },
          }),
        }),
      );
    });
  });
});
