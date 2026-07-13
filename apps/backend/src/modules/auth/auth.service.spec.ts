import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt at module level — it's imported directly, not injected
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_123'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  // ── FIXTURES ──────────────────────────────────────────────

  const mockUser = {
    id: 'user-1',
    email: 'john@example.com',
    password: 'hashed_password_123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'OWNER',
    tenantId: 'tenant-1',
    isActive: true,
    phone: '+919876543210',
    avatar: null,
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTenant = {
    id: 'tenant-1',
    name: 'The Spice Kitchen',
    slug: 'the-spice-kitchen',
    logo: null,
    phone: '+919876543210',
    email: 'john@example.com',
    address: null,
    gstNumber: null,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    isActive: true,
  };

  // Prisma mock — covers every model/method the service touches
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    tenant: { create: jest.fn() },
    permission: { upsert: jest.fn() },
    role: { create: jest.fn() },
    branch: { create: jest.fn() },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = { get: jest.fn() };

  // ── SETUP ─────────────────────────────────────────────────

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default config values
    mockConfigService.get.mockImplementation(
      (key: string, defaultValue?: any) => {
        const config: Record<string, string> = {
          JWT_EXPIRATION: '15m',
          JWT_REFRESH_SECRET: 'refresh-secret-key',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return config[key] ?? defaultValue;
      },
    );

    // Default JWT: first call = access token, second = refresh token
    mockJwtService.signAsync
      .mockResolvedValueOnce('mock-access-token')
      .mockResolvedValueOnce('mock-refresh-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  // ─────────────────────────────────────────────────────────
  //  LOGIN
  // ─────────────────────────────────────────────────────────

  describe('login', () => {
    it('should authenticate valid credentials and return tokens + user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenant: mockTenant,
      });

      const result = await service.login({
        email: 'john@example.com',
        password: 'password123',
      });

      // Response shape
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(result.user).toMatchObject({
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'OWNER',
      });
      expect(result.tenant).toMatchObject({
        id: 'tenant-1',
        name: 'The Spice Kitchen',
        slug: 'the-spice-kitchen',
      });

      // Side-effects
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          token: 'mock-refresh-token',
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should throw UnauthorizedException when email does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is deactivated', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
        tenant: mockTenant,
      });

      await expect(
        service.login({ email: 'inactive@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when tenant is suspended', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenant: { ...mockTenant, isActive: false },
      });

      await expect(
        service.login({ email: 'suspended@example.com', password: 'x' }),
      ).rejects.toThrow('Restaurant account is suspended');
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenant: mockTenant,
      });

      await expect(
        service.login({ email: 'john@example.com', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call bcrypt.compare with the correct arguments', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenant: mockTenant,
      });

      await service.login({
        email: 'john@example.com',
        password: 'plainPassword',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plainPassword',
        'hashed_password_123',
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  //  REGISTER
  // ─────────────────────────────────────────────────────────

  describe('register', () => {
    const registerDto = {
      email: 'jane@example.com',
      password: 'securePass123',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+919999999999',
      restaurantName: "Jane's Kitchen",
    };

    // Factory so each test gets a fresh mockTx (prevents cross-test mutations)
    const createMockTx = () => ({
      tenant: {
        create: jest
          .fn()
          .mockResolvedValue({ id: 'tenant-2', name: "Jane's Kitchen", slug: 'jane-s-kitchen' }),
      },
      user: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'user-2',
            ...data,
            role: 'OWNER',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
      },
      permission: { upsert: jest.fn().mockResolvedValue({ id: 'perm-1' }) },
      role: {
        create: jest
          .fn()
          .mockResolvedValue({ id: 'role-1', name: 'Owner', isSystem: true }),
      },
      branch: {
        create: jest
          .fn()
          .mockResolvedValue({ id: 'branch-1', name: "Jane's Kitchen - Main", isPrimary: true }),
      },
    });

    let mockTx: ReturnType<typeof createMockTx>;

    beforeEach(() => {
      mockTx = createMockTx();
      // Transaction executes the callback with mocked tx
      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: any) => Promise<any>) => cb(mockTx),
      );
      // No user with this email yet
      mockPrisma.user.findUnique.mockResolvedValue(null);
    });

    it('should create tenant, user, role, branch and return tokens', async () => {
      const result = await service.register(registerDto);

      // Response shape
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(result.user).toMatchObject({
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      });
      expect(result.tenant).toMatchObject({
        name: "Jane's Kitchen",
        slug: 'jane-s-kitchen',
      });
      expect(result.branch).toMatchObject({
        name: "Jane's Kitchen - Main",
      });

      // Password was hashed
      expect(bcrypt.hash).toHaveBeenCalledWith('securePass123', 12);
    });

    it('should call all transaction steps in order', async () => {
      await service.register(registerDto);

      // Tenant was created
      expect(mockTx.tenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Jane's Kitchen",
          slug: 'jane-s-kitchen',
        }),
      });

      // User was created with hashed password
      expect(mockTx.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          password: 'hashed_password_123',
          role: 'OWNER',
          tenantId: 'tenant-2',
        }),
      });

      // Role was created
      expect(mockTx.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Owner',
            isSystem: true,
            tenantId: 'tenant-2',
          }),
        }),
      );

      // Branch was created
      expect(mockTx.branch.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-2',
          name: "Jane's Kitchen - Main",
          isPrimary: true,
        },
      });
    });

    it('should generate 56 default permissions (14 modules × 4 actions)', async () => {
      await service.register(registerDto);

      // Verify upsert was called for every module×action combination
      expect(mockTx.permission.upsert).toHaveBeenCalledTimes(56);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      // Transaction must NOT run when email exists
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should sanitise the restaurant name into a valid slug', async () => {
      // Simulate a fresh mockTx to capture the slug without sharing state
      const slugTx = createMockTx();
      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: any) => Promise<any>) => cb(slugTx),
      );

      await service.register({
        ...registerDto,
        restaurantName: '   My   Amazing   Cafe!!!  ',
      });

      expect(slugTx.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'my-amazing-cafe' }),
        }),
      );
    });

    it('should store the refresh token after registration', async () => {
      await service.register(registerDto);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-2',
          token: 'mock-refresh-token',
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  //  REFRESH TOKEN
  // ─────────────────────────────────────────────────────────

  describe('refreshToken', () => {
    const futureDate = new Date(Date.now() + 86_400_000); // +1 day
    const pastDate = new Date('2020-01-01');

    const storedToken = {
      id: 'rt-1',
      token: 'valid-refresh-token',
      userId: 'user-1',
      expiresAt: futureDate,
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
      user: { ...mockUser, tenantId: 'tenant-1' },
    };

    beforeEach(() => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        tenantId: 'tenant-1',
      });
      mockPrisma.refreshToken.findUnique.mockResolvedValue(storedToken);
    });

    it('should return new access and refresh tokens', async () => {
      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
    });

    it('should delete the old refresh token', async () => {
      await service.refreshToken('valid-refresh-token');

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
      });
    });

    it('should store a new refresh token', async () => {
      await service.refreshToken('valid-refresh-token');

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          token: 'mock-refresh-token',
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        ...storedToken,
        expiresAt: pastDate,
      });

      await expect(
        service.refreshToken('expired-token'),
      ).rejects.toThrow(UnauthorizedException);
      // Must NOT generate new tokens when expired
      expect(mockPrisma.refreshToken.delete).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is not in database', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshToken('missing-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when JWT verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(
        new Error('jwt malformed'),
      );

      await expect(
        service.refreshToken('garbage-token'),
      ).rejects.toThrow(UnauthorizedException);
      // Must NOT touch the database
      expect(mockPrisma.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('should use the refresh secret for JWT verification', async () => {
      await service.refreshToken('valid-refresh-token');

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-refresh-token',
        { secret: 'refresh-secret-key' },
      );
    });
  });
});
