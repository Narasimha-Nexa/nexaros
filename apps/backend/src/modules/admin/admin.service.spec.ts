import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('otplib', () => ({
  generateSecret: jest.fn().mockReturnValue('MFA_SECRET_123'),
  generateURI: jest.fn().mockReturnValue('otpauth://totp/NexaROS:admin-1?secret=MFA_SECRET_123'),
  generateSync: jest.fn().mockReturnValue('123456'),
  verifySync: jest.fn().mockReturnValue(true),
}));

describe('AdminService', () => {
  let service: AdminService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockAdmin = {
    id: 'admin-1',
    email: 'admin@nexaros.com',
    name: 'Super Admin',
    password: '$2a$10$hashedpassword',
    role: 'SUPER_ADMIN',
    isActive: true,
    mfaEnabled: false,
    mfaSecret: null,
    lastLoginAt: null,
  };

  const mockPrisma = {
    adminUser: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    adminSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    adminAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('jwt-admin-token-123'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
  });

  describe('login', () => {
    it('should return token and admin info on valid login', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue(mockAdmin as any);
      mockPrisma.adminSession.create.mockResolvedValue({} as any);
      mockPrisma.adminUser.update.mockResolvedValue({} as any);

      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true as any);

      const result = await service.login('admin@nexaros.com', 'admin123', '127.0.0.1', 'Mozilla');

      expect(result.token).toBe('jwt-admin-token-123');
      expect(result.admin.email).toBe('admin@nexaros.com');
      expect(mockPrisma.adminSession.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue(null);

      await expect(service.login('bad@email.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for disabled account', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue({ ...mockAdmin, isActive: false } as any);

      await expect(service.login('admin@nexaros.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue(mockAdmin as any);

      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false as any);

      await expect(service.login('admin@nexaros.com', 'wrongpass')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getSessions', () => {
    it('should return active sessions', async () => {
      mockPrisma.adminSession.findMany.mockResolvedValue([
        { token: 'tok1', createdAt: new Date() },
      ] as any);

      const result = await service.getSessions('admin-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session', async () => {
      mockPrisma.adminSession.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.revokeSession('tok1');

      expect(result.revoked).toBe(true);
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      mockPrisma.adminAuditLog.findMany.mockResolvedValue([
        { id: 'log-1', action: 'LOGIN', entity: 'admin' },
      ] as any);
      mockPrisma.adminAuditLog.count.mockResolvedValue(1);

      const result = await service.getAuditLogs(1, 10);

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('logAction', () => {
    it('should create audit log entry', async () => {
      mockPrisma.adminAuditLog.create.mockResolvedValue({ id: 'log-1' } as any);

      const result = await service.logAction('admin-1', 'UPDATE', 'subscription', 'sub-1');

      expect(result.id).toBe('log-1');
      expect(mockPrisma.adminAuditLog.create).toHaveBeenCalled();
    });
  });
});
