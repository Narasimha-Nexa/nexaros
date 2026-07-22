import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    phone: '+911234567890',
    firstName: 'John',
    lastName: 'Doe',
    avatar: null,
    role: 'STAFF',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
  };

  const tenantId = 'tenant-1';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return all users for a tenant', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll(tenantId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ email: 'test@example.com' });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should return empty array when no users exist', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.findAll(tenantId);

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1', tenantId);

      expect(result).toMatchObject({ id: 'user-1', email: 'test@example.com' });
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1', tenantId },
        }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const created = { ...mockUser, password: undefined };
      mockPrisma.user.create.mockResolvedValue(created);

      const result = await service.create(tenantId, {
        email: 'test@example.com',
        password: 'securePass123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('securePass123', 12);
      expect(result).toMatchObject({ email: 'test@example.com' });
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            email: 'test@example.com',
            role: 'STAFF',
          }),
        }),
      );
    });

    it('should default role to STAFF when not provided', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await service.create(tenantId, {
        email: 'test@example.com',
        password: 'securePass123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'STAFF' }),
        }),
      );
    });

    it('should use provided role when given', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrisma.user.create.mockResolvedValue({ ...mockUser, role: 'MANAGER' });

      await service.create(tenantId, {
        email: 'manager@example.com',
        password: 'securePass123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'MANAGER',
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'MANAGER' }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      const updated = { ...mockUser, firstName: 'Jane' };
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.update('user-1', tenantId, {
        firstName: 'Jane',
      });

      expect(result.firstName).toBe('Jane');
    });

    it('should hash password when updating it', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await service.update('user-1', tenantId, {
        password: 'newSecurePass',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('newSecurePass', 12);
    });

    it('should not call bcrypt.hash when password not provided', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await service.update('user-1', tenantId, { firstName: 'Jane' });

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.update('missing', tenantId, { firstName: 'Jane' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete user by setting isActive to false', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      await service.remove('user-1', tenantId);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.remove('missing', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
