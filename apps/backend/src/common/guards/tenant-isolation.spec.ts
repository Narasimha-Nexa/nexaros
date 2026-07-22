import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { BranchScopeGuard } from './branch-scope.guard';
import { PermissionsGuard } from './permissions.guard';
import { RolesGuard } from './roles.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('Tenant Isolation Enforcement', () => {
  // ═══════════════════════════════════════════════════════
  // JWT AUTH GUARD — Tenant Context Injection
  // ═══════════════════════════════════════════════════════

  describe('JwtAuthGuard — Tenant Context', () => {
    let guard: JwtAuthGuard;

    const mockPrisma = {
      user: { findUnique: jest.fn() },
      staff: { findFirst: jest.fn() },
    };

    const mockJwtService = {
      verifyAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          JwtAuthGuard,
          { provide: JwtService, useValue: mockJwtService },
          { provide: ConfigService, useValue: mockConfigService },
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    });

    /**
     * Create an ExecutionContext with a SHARED request object.
     * The guard mutates this object in-place, so the test can read it after canActivate completes.
     */
    function createMockContext(token?: string) {
      const request: Record<string, any> = {
        headers: {
          authorization: token ? `Bearer ${token}` : undefined,
        },
      };
      return {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as unknown as ExecutionContext;
    }

    it('should throw when no token is provided', async () => {
      await expect(guard.canActivate(createMockContext(undefined)))
        .rejects.toThrow('Missing authentication token');
    });

    it('should throw when token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt malformed'));
      await expect(guard.canActivate(createMockContext('invalid-token')))
        .rejects.toThrow('Invalid or expired token');
    });

    it('should attach user context with tenantId, role, and permissions', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'test@example.com',
        firstName: 'Test', lastName: 'User',
        role: 'MANAGER', tenantId: 'tenant-1', isActive: true,
      } as any);
      mockPrisma.staff.findFirst.mockResolvedValue({
        id: 'staff-1', branchId: 'branch-1', roleId: 'role-1',
        role: {
          permissions: [
            { permission: { module: 'orders', action: 'read' } },
            { permission: { module: 'orders', action: 'write' } },
          ],
        },
      } as any);

      const ctx = createMockContext('valid-token');
      const request = ctx.switchToHttp().getRequest();

      await guard.canActivate(ctx);

      expect(request.user).toBeDefined();
      expect(request.user.tenantId).toBe('tenant-1');
      expect(request.user.role).toBe('MANAGER');
      expect(request.user.permissions).toContain('orders:read');
      expect(request.user.permissions).toContain('orders:write');
    });

    it('should return wildcard permissions for OWNER role', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-2' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2', email: 'owner@test.com',
        firstName: 'Owner', lastName: '',
        role: 'OWNER', tenantId: 'tenant-1', isActive: true,
      } as any);
      mockPrisma.staff.findFirst.mockResolvedValue(null as any);

      const ctx = createMockContext('owner-token');
      const request = ctx.switchToHttp().getRequest();

      await guard.canActivate(ctx);

      expect(request.user.permissions).toEqual(['*:*']);
    });

    it('should throw when user is inactive', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', isActive: false,
      } as any);

      await expect(guard.canActivate(createMockContext('valid-token')))
        .rejects.toThrow('User not found or inactive');
    });
  });

  // ═══════════════════════════════════════════════════════
  // BRANCH SCOPE GUARD — Cross-Tenant Access Prevention
  // ═══════════════════════════════════════════════════════

  describe('BranchScopeGuard — Cross-Tenant Prevention', () => {
    let guard: BranchScopeGuard;
    let prisma: jest.Mocked<PrismaService>;

    const mockPrisma = {
      branch: { findUnique: jest.fn() },
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BranchScopeGuard,
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      guard = module.get<BranchScopeGuard>(BranchScopeGuard);
      prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    });

    /**
     * Create a context with a shared request that has both `user` and `params`.
     */
    function createContext(user: any, params: any = {}): ExecutionContext {
      const request = { user, params };
      return {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as unknown as ExecutionContext;
    }

    it('should allow access for OWNER role (bypasses tenant scoping)', async () => {
      const result = await guard.canActivate(
        createContext({ role: 'OWNER', tenantId: 'tenant-1' }),
      );
      expect(result).toBe(true);
    });

    it('should allow access when no user tenantId (public route)', async () => {
      const result = await guard.canActivate(
        createContext({ role: 'STAFF', tenantId: undefined }),
      );
      expect(result).toBe(true);
    });

    it('should allow access when user belongs to same tenant as branch', async () => {
      mockPrisma.branch.findUnique.mockResolvedValue({
        id: 'branch-1', tenantId: 'tenant-1',
      } as any);

      const result = await guard.canActivate(
        createContext(
          { role: 'MANAGER', tenantId: 'tenant-1' },
          { id: 'branch-1' },
        ),
      );
      expect(result).toBe(true);
    });

    it('should deny access when user tries to access another tenant branch', async () => {
      mockPrisma.branch.findUnique.mockResolvedValue({
        id: 'branch-2', tenantId: 'tenant-other',
      } as any);

      // Guard extracts branchId from query.params.branchId, body.branchId, or params.branchId
      const ctx = createContext(
        { role: 'MANAGER', tenantId: 'tenant-1' },
        { branchId: 'branch-2' },
      );
      await expect(guard.canActivate(ctx)).rejects.toThrow('Access denied');
    });

    it('should deny access when branch is not found', async () => {
      mockPrisma.branch.findUnique.mockResolvedValue(null);

      const ctx = createContext(
        { role: 'MANAGER', tenantId: 'tenant-1' },
        { branchId: 'nonexistent' },
      );
      await expect(guard.canActivate(ctx)).rejects.toThrow('Access denied');
    });
  });

  // ═══════════════════════════════════════════════════════
  // PERMISSIONS GUARD — Fine-Grained Access Control
  // ═══════════════════════════════════════════════════════

  describe('PermissionsGuard — RBAC Enforcement', () => {
    let guard: PermissionsGuard;
    let reflector: Reflector;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PermissionsGuard,
          { provide: Reflector, useValue: new Reflector() },
        ],
      }).compile();

      guard = module.get<PermissionsGuard>(PermissionsGuard);
      reflector = module.get<Reflector>(Reflector);
    });

    function createContext(user: any, handler: any): ExecutionContext {
      const request = { user };
      return {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
        getHandler: () => handler,
        getClass: () => ({}),
      } as unknown as ExecutionContext;
    }

    it('should allow access when no permissions are required', async () => {
      const result = await guard.canActivate(
        createContext({ permissions: [] }, {}),
      );
      expect(result).toBe(true);
    });

    it('should allow access when user has required permissions', async () => {
      const handler = () => {};
      // Use NestJS Reflector metadata API
      Reflect.defineMetadata('permissions', ['orders:read'], handler);

      const result = await guard.canActivate(
        createContext({ permissions: ['orders:read', 'orders:write'] }, handler),
      );
      expect(result).toBe(true);
    });

    it('should deny access when user lacks required permissions', async () => {
      const handler = () => {};
      Reflect.defineMetadata('permissions', ['orders:delete'], handler);

      const result = await guard.canActivate(
        createContext({ permissions: ['orders:read'] }, handler),
      );
      expect(result).toBe(false);
    });

    it('should allow access for OWNER with wildcard permissions', async () => {
      const handler = () => {};
      Reflect.defineMetadata('permissions', ['settings:delete'], handler);

      const result = await guard.canActivate(
        createContext({ permissions: ['*:*'] }, handler),
      );
      expect(result).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════
  // TENANT ISOLATION — Every entity must belong to a tenant
  // ═══════════════════════════════════════════════════════

  describe('Tenant Isolation — Schema Enforcement', () => {
    it('all core business entities should reference a tenant', () => {
      // These models should ALL have a tenantId field
      // Tenant is the root aggregate — it IS the tenant, so it has no tenantId field
      // Delivery is scoped through order/branch relationships instead of direct tenantId
      const entitiesWithTenant = [
        'Branch', 'User', 'Role', 'Staff', 'Category', 'MenuItem',
        'InventoryItem', 'Supplier', 'Purchase', 'Reservation',
        'Order', 'AuditLog', 'Subscription',
        'Customer', 'Review', 'Feedback', 'Campaign',
        'TenantSetting', 'TaxSetting', 'TenantFeatureFlag',
        'SupportTicket', 'ConversationSession',
        'MembershipTier', 'LoyaltyPoints', 'Wallet',
        'DeliveryPartner', 'Webhook',
        'ApiKey', 'WorkflowTemplate', 'WorkflowRequest',
        'LeaveRequest', 'Payroll', 'Transaction',
      ];

      // These platform-level models do NOT have tenantId (platform-wide, not tenant-scoped)
      const platformModels = [
        'PlatformPlan', 'PlanEntitlement', 'PlatformSettings',
        'FeatureFlag', 'Coupon', 'CouponUsage',
        'AdminUser', 'AdminSession', 'AdminAuditLog',
        'DemoRequest', 'DeadLetterLog',
      ];

      // These models use indirect tenant association through relations
      const indirectlyScoped = [
        'ChannelRestaurantMapping', 'ChannelItemMapping',
        'ChannelStatusMapping', 'Payment', 'Invoice',
        'SubscriptionPayment', 'SubscriptionInvoice',
        'PaymentPromise', 'PurchaseItem', 'StockMovement',
        'RecipeItem', 'Shift', 'StaffShift', 'Attendance',
        'MenuItemImage', 'MenuItemVariant', 'MenuItemAddOn',
        'OrderItem', 'OrderItemAddOn', 'OrderStatusHistory',
        'CustomerAddress', 'LoyaltyTransaction', 'WalletTransaction',
        'DeliveryLocation', 'TicketMessage', 'EmailTemplate',
        'AudienceSegment', 'RefreshToken', 'Menu',
      ];

      const fs = require('fs');
      const path = require('path');
      const schema = fs.readFileSync(
        path.join(__dirname, '../../../prisma/schema.prisma'),
        'utf-8',
      );

      // Verify each entity has a tenantId field in its model definition
      for (const entity of entitiesWithTenant) {
        const lines = schema.split('\n');
        let inModel = false;
        let modelBlock = '';
        for (const line of lines) {
          // Use trailing-space check to avoid prefix-matching (e.g. 'Role' matching 'RolePermission')
          if (line.startsWith(`model ${entity} `) || line.trim() === `model ${entity}`) {
            inModel = true;
            modelBlock = line + '\n';
            continue;
          }
          if (inModel) {
            modelBlock += line + '\n';
            if (line.trim() === '}') break;
          }
        }
        expect(modelBlock).toBeTruthy();
        expect(modelBlock).toContain('tenantId');
      }
    });
  });
});
