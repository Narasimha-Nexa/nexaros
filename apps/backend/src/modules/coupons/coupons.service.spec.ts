import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('CouponsService', () => {
  let service: CouponsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockCoupon = {
    id: 'coupon-1',
    code: 'FEST20',
    description: 'Festival Special',
    type: 'PERCENTAGE',
    value: 20,
    maxDiscount: 1000,
    minPlanPrice: 0,
    expiry: new Date(Date.now() + 86400000),
    maxTotalUses: 100,
    maxUsesPerUser: 1,
    applicablePlans: [],
    festivalTag: 'Pongal 2026',
    isActive: true,
  };

  const mockPrisma = {
    coupon: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    couponUsage: {
      count: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('create', () => {
    it('should create a coupon with uppercase code', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);
      mockPrisma.coupon.create.mockResolvedValue(mockCoupon as any);

      const result = await service.create({
        code: 'fest20',
        type: 'PERCENTAGE',
        value: 20,
        expiry: '2026-12-31',
      });

      expect(result.code).toBe('FEST20');
    });

    it('should throw ConflictException for duplicate code', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon as any);

      await expect(service.create({
        code: 'FEST20',
        type: 'PERCENTAGE',
        value: 20,
        expiry: '2026-12-31',
      })).rejects.toThrow(ConflictException);
    });
  });

  describe('validate', () => {
    it('should return valid coupon details', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon as any);
      mockPrisma.couponUsage.count.mockResolvedValue(0);

      const result = await service.validate('FEST20', 'tenant-1');

      expect(result.valid).toBe(true);
      expect(result.value).toBe(20);
    });

    it('should throw NotFoundException for unknown code', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.validate('NOPE', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for inactive coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({ ...mockCoupon, isActive: false } as any);

      await expect(service.validate('FEST20', 'tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        expiry: new Date(Date.now() - 86400000),
      } as any);

      await expect(service.validate('FEST20', 'tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw when usage limit reached', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon as any);
      mockPrisma.couponUsage.count.mockResolvedValue(100);

      await expect(service.validate('FEST20', 'tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject when coupon not applicable to plan', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        applicablePlans: ['enterprise'],
      } as any);
      mockPrisma.couponUsage.count.mockResolvedValue(0);

      await expect(service.validate('FEST20', 'tenant-1', 'professional')).rejects.toThrow(BadRequestException);
    });
  });

  describe('apply', () => {
    it('should apply coupon and return discount', async () => {
      mockPrisma.coupon.findUnique
        .mockResolvedValueOnce(mockCoupon as any)
        .mockResolvedValueOnce(mockCoupon as any);
      mockPrisma.couponUsage.count.mockResolvedValue(0);
      mockPrisma.couponUsage.create.mockResolvedValue({} as any);

      const result = await service.apply('FEST20', 'tenant-1', 'sub-1', 2999);

      expect(result.discount).toBe(599.8);
      expect(result.finalAmount).toBe(2399.2);
      expect(mockPrisma.couponUsage.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated coupons', async () => {
      mockPrisma.coupon.findMany.mockResolvedValue([mockCoupon] as any);
      mockPrisma.coupon.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);

      expect(result.coupons).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return coupon by id', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon as any);

      const result = await service.findOne('coupon-1');

      expect(result.code).toBe('FEST20');
    });

    it('should throw NotFoundException for missing coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        usages: [
          { id: 'u1', amount: 500, tenantId: 't1', usedAt: new Date() },
          { id: 'u2', amount: 300, tenantId: 't2', usedAt: new Date() },
        ],
      } as any);

      const result = await service.getUsageStats('coupon-1');

      expect(result.stats.totalUsed).toBe(2);
      expect(result.stats.totalDiscount).toBe(800);
    });
  });

  describe('createFestivalCampaign', () => {
    it('should create a festival coupon with tag', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);
      mockPrisma.coupon.create.mockResolvedValue({
        ...mockCoupon,
        code: expect.stringContaining('PONGAL'),
      } as any);

      const result = await service.createFestivalCampaign('pongal', 25, '2026-01-15', 500);

      expect(result).toBeDefined();
    });
  });
});
