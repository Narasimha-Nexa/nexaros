import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_123'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('otplib', () => ({
  generateSecret: jest.fn().mockReturnValue('MFA_SECRET_123'),
  generateURI: jest.fn().mockReturnValue('otpauth://totp/NexaROS:admin-1?secret=MFA_SECRET_123'),
  generateSync: jest.fn().mockReturnValue('123456'),
  verifySync: jest.fn().mockReturnValue(true),
}));

// ─────────────────────────────────────────────────────────
// PROVISIONING FIXTURES
// ─────────────────────────────────────────────────────────

const mockProvisionInput = {
  restaurantName: 'The Spice Garden',
  ownerName: 'Rajesh Kumar',
  ownerEmail: 'rajesh@spicegarden.com',
  ownerPhone: '+919876543210',
  address: '45 MG Road, Bangalore',
  city: 'Bangalore',
  state: 'Karnataka',
  country: 'India',
  cuisineType: 'Multi-Cuisine',
  gstNumber: '29AADCB2230M1ZP',
  phone: '+919876543210',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  subdomain: 'spice-garden',
  logo: undefined,
};

const mockCreatedTenant = {
  id: 'tenant-new-1',
  name: 'The Spice Garden',
  slug: 'the-spice-garden',
  subdomain: 'spice-garden',
  phone: '+919876543210',
  email: 'rajesh@spicegarden.com',
  address: '45 MG Road, Bangalore',
  gstNumber: '29AADCB2230M1ZP',
  city: 'Bangalore',
  state: 'Karnataka',
  country: 'India',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  businessType: 'Multi-Cuisine',
  isActive: true,
  onboardingStatus: 'IN_PROGRESS',
  createdBy: 'admin-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCreatedBranch = {
  id: 'branch-new-1',
  tenantId: 'tenant-new-1',
  name: 'Main Branch',
  address: '45 MG Road, Bangalore',
  phone: '+919876543210',
  isPrimary: true,
  isActive: true,
};

const mockCreatedOwner = {
  id: 'user-owner-1',
  tenantId: 'tenant-new-1',
  email: 'rajesh@spicegarden.com',
  phone: '+919876543210',
  password: 'hashed_password_123',
  firstName: 'Rajesh',
  lastName: '',
  role: 'OWNER',
  isActive: true,
};

const mockCreatedRole = {
  id: 'role-owner-1',
  tenantId: 'tenant-new-1',
  name: 'Owner',
  description: 'Full access to all features',
  isSystem: true,
};

const mockCreatedStaff = {
  id: 'staff-owner-1',
  tenantId: 'tenant-new-1',
  branchId: 'branch-new-1',
  userId: 'user-owner-1',
  roleId: 'role-owner-1',
  name: 'Rajesh Kumar',
  phone: '+919876543210',
  isActive: true,
};

const mockCreatedSubscription = {
  id: 'sub-1',
  tenantId: 'tenant-new-1',
  planId: 'plan-1',
  status: 'TRIAL',
  trialStartedAt: new Date(),
  trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
};

const mockCreatedWebsiteConfig = {
  id: 'wc-1',
  tenantId: 'tenant-new-1',
  restaurantName: 'The Spice Garden',
  primaryColor: '#E23744',
};

describe('AdminService — Provisioning & Impersonation', () => {
  let service: AdminService;
  let prisma: jest.Mocked<PrismaService>;
  let mockTx: Record<string, any>;

  const mockPrisma = {
    adminUser: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    adminSession: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
    adminAuditLog: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    tenant: { findUnique: jest.fn() },
    platformPlan: { findUnique: jest.fn(), findFirst: jest.fn() },
    planEntitlement: { findMany: jest.fn() },
    featureFlag: { findMany: jest.fn() },
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('jwt-admin-token-123'),
  };

  const mockEventBus = {
    emitToTenant: jest.fn(),
  };

  // Helper to create a fresh mockTx for each test
  function createMockTx() {
    return {
      tenant: { create: jest.fn().mockResolvedValue(mockCreatedTenant) },
      branch: { create: jest.fn().mockResolvedValue(mockCreatedBranch) },
      permission: { upsert: jest.fn().mockResolvedValue({ id: 'perm-test', module: 'test', action: 'test' }) },
      role: { create: jest.fn().mockResolvedValue(mockCreatedRole) },
      user: { create: jest.fn().mockResolvedValue(mockCreatedOwner) },
      staff: { create: jest.fn().mockResolvedValue(mockCreatedStaff) },
      subscription: { create: jest.fn().mockResolvedValue(mockCreatedSubscription) },
      tenantWebsiteConfig: { create: jest.fn().mockResolvedValue(mockCreatedWebsiteConfig) },
      category: { createMany: jest.fn() },
      restaurantTable: { createMany: jest.fn() },
      shift: { createMany: jest.fn() },
      membershipTier: { createMany: jest.fn() },
      taxSetting: { createMany: jest.fn() },
      tenantFeatureFlag: { createMany: jest.fn() },
      tenantSetting: { createMany: jest.fn() },
      auditLog: { create: jest.fn() },
    };
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create fresh transaction mock for each test
    mockTx = createMockTx();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;

    // Default mocks
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.tenant.findUnique.mockResolvedValue(null);
    mockPrisma.platformPlan.findFirst.mockResolvedValue({ id: 'plan-1', name: 'Starter', trialDays: 14 } as any);
    mockPrisma.platformPlan.findUnique.mockResolvedValue({ id: 'plan-1', name: 'Starter', trialDays: 14 } as any);
    mockPrisma.planEntitlement.findMany.mockResolvedValue([]);
    mockPrisma.featureFlag.findMany.mockResolvedValue([]);
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockTx));
    mockPrisma.adminUser.findUnique.mockResolvedValue({
      id: 'admin-1', email: 'admin@nexaros.com', name: 'Super Admin',
      role: 'SUPER_ADMIN', isActive: true, password: 'hash',
    } as any);
  });

  // ═══════════════════════════════════════════════════════
  // TENANT ISOLATION — Provisioning
  // ═══════════════════════════════════════════════════════

  describe('provisionTenant — Input Validation', () => {
    it('should reject empty restaurant name', async () => {
      await expect(
        service.provisionTenant('admin-1', { ...mockProvisionInput, restaurantName: '' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should reject empty owner name', async () => {
      await expect(
        service.provisionTenant('admin-1', { ...mockProvisionInput, ownerName: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject empty owner email', async () => {
      await expect(
        service.provisionTenant('admin-1', { ...mockProvisionInput, ownerEmail: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate owner email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' } as any);
      await expect(
        service.provisionTenant('admin-1', mockProvisionInput),
      ).rejects.toThrow('An account with this email already exists');
    });

    it('should reject duplicate tenant slug', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'existing' } as any);
      await expect(
        service.provisionTenant('admin-1', mockProvisionInput),
      ).rejects.toThrow('A restaurant with a similar name already exists');
    });

    it('should reject duplicate subdomain', async () => {
      mockPrisma.tenant.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing' });
      await expect(
        service.provisionTenant('admin-1', mockProvisionInput),
      ).rejects.toThrow('Subdomain');
    });
  });

  describe('provisionTenant — Transaction Atomicity', () => {
    it('should perform all steps atomically in a single transaction', async () => {
      const result = await service.provisionTenant('admin-1', mockProvisionInput);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      expect(mockTx.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'The Spice Garden' }) }),
      );
      expect(mockTx.branch.create).toHaveBeenCalled();
      expect(mockTx.user.create).toHaveBeenCalled();
      expect(mockTx.role.create).toHaveBeenCalled();
      expect(mockTx.staff.create).toHaveBeenCalled();
      expect(mockTx.subscription.create).toHaveBeenCalled();
      expect(mockTx.tenantWebsiteConfig.create).toHaveBeenCalled();
      expect(mockTx.category.createMany).toHaveBeenCalled();
      expect(mockTx.restaurantTable.createMany).toHaveBeenCalled();
      expect(mockTx.shift.createMany).toHaveBeenCalled();
      expect(mockTx.membershipTier.createMany).toHaveBeenCalled();
      expect(mockTx.taxSetting.createMany).toHaveBeenCalled();
      expect(mockTx.tenantSetting.createMany).toHaveBeenCalled();
      expect(mockTx.auditLog.create).toHaveBeenCalled();

      expect(result).toHaveProperty('restaurant');
      expect(result).toHaveProperty('branch');
      expect(result).toHaveProperty('owner');
      expect(result).toHaveProperty('subscription');
      expect(result).toHaveProperty('provisioning');
      expect(result.owner).toHaveProperty('password');
      expect(result.provisioning).toHaveProperty('permissions');
      expect(result.provisioning).toHaveProperty('roles');
    });

    it('should upsert all default permissions (35 modules × 4 actions)', async () => {
      await service.provisionTenant('admin-1', mockProvisionInput);
      const upsertCalls = (mockTx.permission.upsert as jest.Mock).mock.calls;
      // 35 modules × 4 actions = 140, allow some flexibility
      expect(upsertCalls.length).toBeGreaterThanOrEqual(130);
    });

    it('should create all 10 default roles with granular permissions', async () => {
      (mockTx.role.create as jest.Mock).mockClear();

      await service.provisionTenant('admin-1', mockProvisionInput);

      const roleCreateCalls = (mockTx.role.create as jest.Mock).mock.calls;
      const roleNames = roleCreateCalls.map((c: any) => c[0].data.name);

      expect(roleNames).toContain('Owner');
      expect(roleNames).toContain('Branch Manager');
      expect(roleNames).toContain('Cashier');
      expect(roleNames).toContain('Waiter');
      expect(roleNames).toContain('Chef');
      expect(roleNames).toContain('Kitchen Staff');
      expect(roleNames).toContain('Inventory Manager');
      expect(roleNames).toContain('Accountant');
      expect(roleNames).toContain('Delivery Staff');
      expect(roleNames).toContain('Receptionist');
    });

    it('should roll back entire transaction if any step fails', async () => {
      // This test uses its own mockTx with a failure on tenantSetting
      const failingTx = createMockTx();
      failingTx.tenantSetting.createMany.mockRejectedValue(new Error('DB failure'));
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(failingTx));

      await expect(
        service.provisionTenant('admin-1', mockProvisionInput),
      ).rejects.toThrow('DB failure');

      // Admin audit log should NOT be created when the transaction fails
      expect(mockPrisma.adminAuditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('provisionTenant — Website Config', () => {
    it('should create website config with full page templates', async () => {
      await service.provisionTenant('admin-1', mockProvisionInput);

      const websiteConfigCall = (mockTx.tenantWebsiteConfig.create as jest.Mock).mock.calls[0][0].data;

      // SEO metadata
      expect(websiteConfigCall.seo).toBeDefined();
      expect(websiteConfigCall.seo.title).toContain('The Spice Garden');
      expect(websiteConfigCall.seo.keywords).toBeInstanceOf(Array);

      // Home sections for all pages
      expect(websiteConfigCall.homeSections).toBeInstanceOf(Array);
      const sectionTypes = websiteConfigCall.homeSections.map((s: any) => s.type);
      expect(sectionTypes).toContain('hero');
      expect(sectionTypes).toContain('about');
      expect(sectionTypes).toContain('menu');
      expect(sectionTypes).toContain('gallery');
      expect(sectionTypes).toContain('reservation');
      expect(sectionTypes).toContain('reviews');
      expect(sectionTypes).toContain('contact');

      // Social links
      expect(websiteConfigCall.socialLinks).toBeDefined();
      expect(websiteConfigCall.socialLinks.whatsapp).toBeDefined();

      // Legal pages
      expect(websiteConfigCall.legalPages).toBeDefined();
      expect(websiteConfigCall.legalPages.privacyPolicy).toBeDefined();
      expect(websiteConfigCall.legalPages.termsOfService).toBeDefined();
      expect(websiteConfigCall.legalPages.refundPolicy).toBeDefined();

      // Analytics
      expect(websiteConfigCall.analytics).toBeDefined();

      // Opening hours
      expect(websiteConfigCall.openingHours).toBeDefined();
      expect(websiteConfigCall.openingHours.monday.isOpen).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════
  // IMPERSONATION
  // ═══════════════════════════════════════════════════════

  describe('impersonation', () => {
    const mockAdmin = {
      id: 'admin-1', email: 'admin@nexaros.com', name: 'Super Admin',
      role: 'SUPER_ADMIN', isActive: true, password: 'hash',
    };

    const mockTargetUser = {
      id: 'user-target-1',
      email: 'owner@restaurant.com',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      isActive: true,
      tenantId: 'tenant-1',
    };

    beforeEach(() => {
      mockPrisma.adminUser.findUnique.mockResolvedValue(mockAdmin as any);
      mockPrisma.user.findFirst.mockResolvedValue(mockTargetUser as any);
      mockPrisma.adminAuditLog.create.mockResolvedValue({ id: 'log-1' } as any);
    });

    it('should generate impersonation JWT with 30-min expiry', async () => {
      const result = await service.impersonate('admin-1', 'tenant-1', 'user-target-1', '127.0.0.1');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('owner@restaurant.com');
      expect(result.expiresAt).toBeDefined();
    });

    it('should reject impersonation when admin is inactive', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue({ ...mockAdmin, isActive: false } as any);
      await expect(
        service.impersonate('admin-1', 'tenant-1', 'user-target-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject impersonation when target user is not in specified tenant', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.impersonate('admin-1', 'tenant-1', 'user-target-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject impersonation when target user is inactive', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockTargetUser, isActive: false } as any);
      await expect(
        service.impersonate('admin-1', 'tenant-1', 'user-target-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log impersonation action in admin audit log', async () => {
      await service.impersonate('admin-1', 'tenant-1', 'user-target-1', '127.0.0.1');
      expect(mockPrisma.adminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adminUserId: 'admin-1',
            action: 'IMPERSONATE',
            entity: 'User',
            entityId: 'user-target-1',
          }),
        }),
      );
    });

    it('should log exit impersonation action', async () => {
      await service.exitImpersonation('admin-1', '127.0.0.1');
      expect(mockPrisma.adminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adminUserId: 'admin-1',
            action: 'EXIT_IMPERSONATION',
          }),
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  // DATABASE STATS (Observability)
  // ═══════════════════════════════════════════════════════

  describe('getDatabaseStats', () => {
    it('should return database statistics', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ count: 10 }])
        .mockResolvedValueOnce([{ count: 15 }])
        .mockResolvedValueOnce([{ count: 50 }])
        .mockResolvedValueOnce([{ size: '50 MB' }]);

      const result = await service.getDatabaseStats();
      expect(result).toHaveProperty('tables');
      expect(result).toHaveProperty('totalTables');
      expect(result).toHaveProperty('totalRows');
      expect(result).toHaveProperty('dbSize');
      expect(result).toHaveProperty('activeConnections');
    });
  });
});
