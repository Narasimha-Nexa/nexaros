import { Test, TestingModule } from '@nestjs/testing';
import { CrmService } from './crm.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { NotFoundException } from '@nestjs/common';

describe('CrmService', () => {
  let service: CrmService;
  let prisma: jest.Mocked<PrismaService>;
  let eventBus: jest.Mocked<EventBusService>;

  const tenantId = 'tenant-1';

  const mockCustomer = {
    id: 'cust-1',
    tenantId,
    name: 'Alice Customer',
    phone: '+911111111111',
    email: 'alice@example.com',
    notes: null,
    tags: ['vip'],
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoyaltyPoints = {
    id: 'lp-1',
    customerId: 'cust-1',
    tenantId,
    points: 100,
    lifetimePoints: 500,
    tierId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWallet = {
    id: 'wallet-1',
    customerId: 'cust-1',
    tenantId,
    balance: 200,
    lifetimeCredit: 500,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTier = {
    id: 'tier-1',
    tenantId,
    name: 'Gold',
    color: '#FFD700',
    sortOrder: 1,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReview = {
    id: 'rev-1',
    tenantId,
    customerId: 'cust-1',
    rating: 5,
    comment: 'Great!',
    reply: null,
    repliedAt: null,
    repliedBy: null,
    isPublished: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFeedback = {
    id: 'fb-1',
    tenantId,
    customerId: 'cust-1',
    message: 'Love the food',
    resolved: false,
    resolvedAt: null,
    resolvedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWalletTx = {
    id: 'wtx-1',
    walletId: 'wallet-1',
    type: 'TOP_UP',
    amount: 100,
    balanceAfter: 300,
    description: 'Top-up',
    createdBy: null,
    createdAt: new Date(),
  };

  const mockPrisma = {
    customer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    loyaltyPoints: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    membershipTier: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    walletTransaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    loyaltyTransaction: {
      create: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    feedback: {
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  const mockEventBus = {
    emitToTenant: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<CrmService>(CrmService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    eventBus = module.get(EventBusService) as jest.Mocked<EventBusService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── Customers ──

  describe('getCustomers', () => {
    it('should return paginated customers', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([mockCustomer]);
      mockPrisma.customer.count.mockResolvedValue(1);

      const result = await service.getCustomers(tenantId);

      expect(result.customers).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by search query', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([mockCustomer]);
      mockPrisma.customer.count.mockResolvedValue(1);

      await service.getCustomers(tenantId, { search: 'alice' });

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'alice', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });

    it('should respect pagination params', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);
      mockPrisma.customer.count.mockResolvedValue(50);

      const result = await service.getCustomers(tenantId, { page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should cap limit at 100', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);
      mockPrisma.customer.count.mockResolvedValue(0);

      await service.getCustomers(tenantId, { limit: 999 });

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  describe('getCustomer', () => {
    it('should return a single customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);

      const result = await service.getCustomer(tenantId, 'cust-1');

      expect(result).toMatchObject({ id: 'cust-1', name: 'Alice Customer' });
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.getCustomer(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCustomer', () => {
    it('should create customer with auto loyalty and wallet', async () => {
      mockPrisma.customer.create.mockResolvedValue(mockCustomer);
      mockPrisma.loyaltyPoints.create.mockResolvedValue(mockLoyaltyPoints);
      mockPrisma.wallet.create.mockResolvedValue(mockWallet);

      const result = await service.createCustomer(tenantId, {
        name: 'Alice Customer',
        phone: '+911111111111',
      });

      expect(result).toMatchObject({ name: 'Alice Customer' });
      expect(mockPrisma.loyaltyPoints.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { customerId: 'cust-1', tenantId } }),
      );
      expect(mockPrisma.wallet.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { customerId: 'cust-1', tenantId } }),
      );
      expect(mockEventBus.emitToTenant).toHaveBeenCalledWith(
        tenantId,
        'crm:customer-created',
        { id: 'cust-1', name: 'Alice Customer' },
      );
    });
  });

  describe('updateCustomer', () => {
    it('should update customer details', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.customer.update.mockResolvedValue({ ...mockCustomer, name: 'Alice Updated' });

      const result = await service.updateCustomer(tenantId, 'cust-1', { name: 'Alice Updated' });

      expect(result.name).toBe('Alice Updated');
      expect(mockEventBus.emitToTenant).toHaveBeenCalledWith(tenantId, 'crm:customer-updated', { id: 'cust-1' });
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.updateCustomer(tenantId, 'missing', { name: 'Nope' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCustomer', () => {
    it('should soft-delete a customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.customer.update.mockResolvedValue({ ...mockCustomer, deletedAt: new Date() });

      await service.deleteCustomer(tenantId, 'cust-1');

      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cust-1' },
          data: { deletedAt: expect.any(Date) },
        }),
      );
      expect(mockEventBus.emitToTenant).toHaveBeenCalledWith(tenantId, 'crm:customer-deleted', { id: 'cust-1' });
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.deleteCustomer(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Loyalty Points ──

  describe('getLoyaltySummary', () => {
    it('should return loyalty summary with tiers and totals', async () => {
      mockPrisma.membershipTier.findMany.mockResolvedValue([mockTier]);
      mockPrisma.loyaltyPoints.aggregate.mockResolvedValue({
        _sum: { points: 500, lifetimePoints: 2000 },
        _count: 10,
      } as any);

      const result = await service.getLoyaltySummary(tenantId);

      expect(result.tiers).toHaveLength(1);
      expect(result.totalPoints).toBe(500);
      expect(result.totalLifetime).toBe(2000);
      expect(result.activeCustomers).toBe(10);
    });
  });

  describe('adjustLoyaltyPoints', () => {
    it('should adjust points and create a transaction', async () => {
      mockPrisma.loyaltyPoints.findUnique.mockResolvedValue(mockLoyaltyPoints);
      mockPrisma.loyaltyPoints.update.mockResolvedValue({ ...mockLoyaltyPoints, points: 150 });
      mockPrisma.loyaltyTransaction.create.mockResolvedValue({} as any);

      const result = await service.adjustLoyaltyPoints(tenantId, 'cust-1', 50, 'Bonus');

      expect(result.points).toBe(150);
      expect(mockPrisma.loyaltyTransaction.create).toHaveBeenCalled();
      expect(mockEventBus.emitToTenant).toHaveBeenCalledWith(tenantId, 'crm:loyalty-updated', { customerId: 'cust-1', points: 150 });
    });

    it('should not go below zero when deducting', async () => {
      mockPrisma.loyaltyPoints.findUnique.mockResolvedValue(mockLoyaltyPoints);
      mockPrisma.loyaltyPoints.update.mockResolvedValue({ ...mockLoyaltyPoints, points: 0 });
      mockPrisma.loyaltyTransaction.create.mockResolvedValue({} as any);

      await service.adjustLoyaltyPoints(tenantId, 'cust-1', -999, 'Penalty');

      expect(mockPrisma.loyaltyPoints.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { points: 0, lifetimePoints: 500 } }),
      );
    });

    it('should throw NotFoundException when loyalty account not found', async () => {
      mockPrisma.loyaltyPoints.findUnique.mockResolvedValue(null);

      await expect(service.adjustLoyaltyPoints(tenantId, 'missing', 10, 'x')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Membership Tiers ──

  describe('getTiers', () => {
    it('should return all active tiers', async () => {
      mockPrisma.membershipTier.findMany.mockResolvedValue([mockTier]);

      const result = await service.getTiers(tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Gold');
    });
  });

  describe('createTier', () => {
    it('should create a new membership tier', async () => {
      mockPrisma.membershipTier.create.mockResolvedValue(mockTier);

      const result = await service.createTier(tenantId, {
        name: 'Gold',
        color: '#FFD700',
        sortOrder: 1,
      });

      expect(result).toMatchObject({ name: 'Gold' });
      expect(mockPrisma.membershipTier.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { tenantId, name: 'Gold', color: '#FFD700', sortOrder: 1 } }),
      );
    });
  });

  // ── Wallet ──

  describe('getWalletTransactions', () => {
    it('should return paginated wallet transactions', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.walletTransaction.findMany.mockResolvedValue([mockWalletTx]);
      mockPrisma.walletTransaction.count.mockResolvedValue(1);

      const result = await service.getWalletTransactions(tenantId, 'cust-1');

      expect(result.transactions).toHaveLength(1);
      expect(result.balance).toBe(200);
      expect(result.total).toBe(1);
    });

    it('should throw NotFoundException when wallet not found', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);

      await expect(service.getWalletTransactions(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('topUpWallet', () => {
    it('should top up wallet and create a transaction', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.wallet.update.mockResolvedValue({ ...mockWallet, balance: 300 });
      mockPrisma.walletTransaction.create.mockResolvedValue(mockWalletTx);

      const result = await service.topUpWallet(tenantId, 'cust-1', 100, 'Bonus credit', 'admin-1');

      expect(result.amount).toBe(100);
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 'cust-1' },
          data: { balance: 300, lifetimeCredit: 600 },
        }),
      );
      expect(mockEventBus.emitToTenant).toHaveBeenCalledWith(tenantId, 'crm:wallet-updated', { customerId: 'cust-1', balance: 300 });
    });

    it('should throw NotFoundException when wallet not found', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);

      await expect(service.topUpWallet(tenantId, 'missing', 50, 'test')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Reviews ──

  describe('getReviews', () => {
    it('should return paginated reviews', async () => {
      mockPrisma.review.findMany.mockResolvedValue([mockReview]);
      mockPrisma.review.count.mockResolvedValue(1);

      const result = await service.getReviews(tenantId);

      expect(result.reviews).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by rating and published status', async () => {
      mockPrisma.review.findMany.mockResolvedValue([mockReview]);
      mockPrisma.review.count.mockResolvedValue(1);

      await service.getReviews(tenantId, { rating: 5, published: true });

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ rating: 5, isPublished: true }),
        }),
      );
    });
  });

  describe('replyToReview', () => {
    it('should add a reply to a review', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(mockReview);
      mockPrisma.review.update.mockResolvedValue({
        ...mockReview,
        reply: 'Thanks!',
        repliedAt: new Date(),
        repliedBy: 'admin-1',
      });

      const result = await service.replyToReview(tenantId, 'rev-1', 'Thanks!', 'admin-1');

      expect(result.reply).toBe('Thanks!');
      expect(result.repliedBy).toBe('admin-1');
    });

    it('should throw NotFoundException when review not found', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(null);

      await expect(service.replyToReview(tenantId, 'missing', 'x', 'admin')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Feedback ──

  describe('getFeedback', () => {
    it('should return paginated feedback', async () => {
      mockPrisma.feedback.findMany.mockResolvedValue([mockFeedback]);
      mockPrisma.feedback.count.mockResolvedValue(1);

      const result = await service.getFeedback(tenantId);

      expect(result.feedback).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by resolved status', async () => {
      mockPrisma.feedback.findMany.mockResolvedValue([mockFeedback]);
      mockPrisma.feedback.count.mockResolvedValue(1);

      await service.getFeedback(tenantId, { resolved: false });

      expect(mockPrisma.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ resolved: false }),
        }),
      );
    });
  });

  describe('resolveFeedback', () => {
    it('should mark feedback as resolved', async () => {
      const resolved = { ...mockFeedback, resolved: true, resolvedAt: new Date(), resolvedBy: 'admin-1' };
      mockPrisma.feedback.update.mockResolvedValue(resolved);

      const result = await service.resolveFeedback(tenantId, 'fb-1', 'admin-1');

      expect(result.resolved).toBe(true);
      expect(result.resolvedBy).toBe('admin-1');
      expect(mockPrisma.feedback.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'fb-1' },
          data: { resolved: true, resolvedAt: expect.any(Date), resolvedBy: 'admin-1' },
        }),
      );
    });
  });
});
