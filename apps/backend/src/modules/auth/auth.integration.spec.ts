import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Mock bcrypt at module level
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_123'),
  compare: jest.fn().mockResolvedValue(true),
}));

/**
 * Auth Integration Test
 * Tests the full register → login → refresh flow
 * Uses mocked PrismaService — no real database needed.
 */
describe('Auth Flow (Integration)', () => {
  let app: INestApplication;
  let authController: AuthController;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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

  const mockUser = {
    id: 'user-1',
    email: 'owner@test.com',
    password: 'hashed_password_123',
    firstName: 'Owner',
    lastName: 'User',
    role: 'OWNER',
    tenantId: 'tenant-1',
    isActive: true,
    phone: '+919999999999',
    avatar: null,
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTenant = {
    id: 'tenant-1',
    name: 'Test Kitchen',
    slug: 'test-kitchen',
    logo: null,
    phone: '',
    email: 'owner@test.com',
    address: null,
    gstNumber: null,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    isActive: true,
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRATION = '15m';
    process.env.JWT_REFRESH_EXPIRATION = '7d';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          useFactory: () => ({
            secret: 'test-secret-key',
            signOptions: { expiresIn: '15m' },
          }),
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, string> = {
                JWT_EXPIRATION: '15m',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_REFRESH_EXPIRATION: '7d',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: false }));
    await app.init();

    authController = app.get<AuthController>(AuthController);
    prisma = app.get(PrismaService) as jest.Mocked<PrismaService>;
    jwtService = app.get(JwtService) as jest.Mocked<JwtService>;
    configService = app.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Token generation: first call = access token, second = refresh token
    jest.spyOn(jwtService, 'signAsync')
      .mockResolvedValueOnce('mock-access-token')
      .mockResolvedValueOnce('mock-refresh-token');

    jest.spyOn(jwtService, 'verifyAsync')
      .mockResolvedValue({ sub: 'user-1', tenantId: 'tenant-1' });
  });

  afterAll(async () => {
    await app.close();
  });

  // ── REGISTER FLOW ──

  describe('register → login → refresh flow', () => {
    it('should register a new owner successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (cb: any) =>
        cb({
          tenant: {
            create: jest.fn().mockResolvedValue({ id: 'tenant-1', name: 'Test Kitchen', slug: 'test-kitchen' }),
            findUnique: jest.fn().mockResolvedValue(null),
          },
          user: { create: jest.fn().mockResolvedValue(mockUser) },
          permission: { upsert: jest.fn().mockResolvedValue({ id: 'perm-1' }) },
          role: { create: jest.fn().mockResolvedValue({ id: 'role-1', name: 'Owner' }) },
          branch: { create: jest.fn().mockResolvedValue({ id: 'branch-1', name: 'Test Kitchen - Main', isPrimary: true }) },
        }),
      );

      const result = await authController.register({
        email: 'owner@test.com',
        password: 'securePassword123',
        firstName: 'Owner',
        lastName: 'User',
        phone: '+919999999999',
        restaurantName: 'Test Kitchen',
      });

      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(result.user).toMatchObject({
        email: 'owner@test.com',
        firstName: 'Owner',
        lastName: 'User',
      });
    });

    it('should reject duplicate email with 409', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authController.register({
          email: 'taken@test.com',
          password: 'securePassword123',
          firstName: 'Test',
          lastName: 'User',
          restaurantName: 'Test',
        }),
      ).rejects.toThrow('Email already registered');
    });

    it('should login with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenant: mockTenant,
      });

      const result = await authController.login({
        email: 'owner@test.com',
        password: 'securePassword123',
      });

      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(result.user).toMatchObject({ email: 'owner@test.com' });
    });

    it('should reject invalid email with 401', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authController.login({ email: 'wrong@test.com', password: 'x' }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should refresh tokens successfully', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: 'old-refresh-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000),
        userAgent: null,
        ipAddress: null,
        createdAt: new Date(),
        user: mockUser,
      });

      const result = await authController.refresh({ refreshToken: 'old-refresh-token' });

      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
    });

    it('should reject expired refresh token with 401', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: 'expired-token',
        userId: 'user-1',
        expiresAt: new Date('2020-01-01'),
        userAgent: null,
        ipAddress: null,
        createdAt: new Date(),
        user: mockUser,
      });

      await expect(
        authController.refresh({ refreshToken: 'expired-token' }),
      ).rejects.toThrow('Invalid refresh token');
    });
  });
});
