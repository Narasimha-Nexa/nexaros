import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: jest.Mocked<PrismaService>;

  const mockRole = {
    id: 'role-1',
    tenantId: 'tenant-1',
    name: 'Manager',
    description: 'Full manager access',
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [
      {
        id: 'rp-1',
        roleId: 'role-1',
        permissionId: 'perm-1',
        permission: { id: 'perm-1', module: 'orders', action: 'create' },
      },
    ],
    _count: { staff: 3 },
  };

  const mockSystemRole = {
    ...mockRole,
    id: 'role-sys',
    name: 'Owner',
    isSystem: true,
  };

  const mockPrisma = {
    role: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    rolePermission: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('findAll', () => {
    it('should return roles for tenant with permissions and staff count', async () => {
      mockPrisma.role.findMany.mockResolvedValue([mockRole]);

      const result = await service.findAll('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0].permissions).toBeDefined();
      expect(result[0]._count.staff).toBe(3);
      expect(mockPrisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-1' },
          include: expect.objectContaining({
            permissions: { include: { permission: true } },
            _count: { select: { staff: true } },
          }),
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return role by id with permissions', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(mockRole);

      const result = await service.findOne('role-1', 'tenant-1');

      expect(result.id).toBe('role-1');
      expect(result.permissions).toHaveLength(1);
      expect(mockPrisma.role.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'role-1', tenantId: 'tenant-1' },
        }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create role with name, description, and optional permissionIds', async () => {
      const createdRole = {
        ...mockRole,
        name: 'Chef',
        description: 'Kitchen staff',
      };
      mockPrisma.role.create.mockResolvedValue(createdRole);

      const result = await service.create('tenant-1', {
        name: 'Chef',
        description: 'Kitchen staff',
        permissionIds: ['perm-1', 'perm-2'],
      });

      expect(result.name).toBe('Chef');
      expect(mockPrisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
            name: 'Chef',
            description: 'Kitchen staff',
            permissions: {
              create: [
                { permissionId: 'perm-1' },
                { permissionId: 'perm-2' },
              ],
            },
          }),
        }),
      );
    });

    it('should create role without permissions when permissionIds omitted', async () => {
      mockPrisma.role.create.mockResolvedValue({ ...mockRole, name: 'Staff' });

      await service.create('tenant-1', { name: 'Staff' });

      expect(mockPrisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            permissions: undefined,
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update role name and description', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(mockRole);
      mockPrisma.role.update.mockResolvedValue({
        ...mockRole,
        name: 'Head Chef',
      });

      const result = await service.update('role-1', 'tenant-1', {
        name: 'Head Chef',
        description: 'Updated desc',
      });

      expect(result.name).toBe('Head Chef');
      expect(mockPrisma.role.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'role-1' },
          data: { name: 'Head Chef', description: 'Updated desc' },
        }),
      );
    });

    it('should replace permissions when permissionIds provided', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(mockRole);
      mockPrisma.rolePermission.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.rolePermission.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.role.update.mockResolvedValue(mockRole);

      await service.update('role-1', 'tenant-1', {
        permissionIds: ['perm-3', 'perm-4'],
      });

      expect(mockPrisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 'role-1' },
      });
      expect(mockPrisma.rolePermission.createMany).toHaveBeenCalledWith({
        data: [
          { roleId: 'role-1', permissionId: 'perm-3' },
          { roleId: 'role-1', permissionId: 'perm-4' },
        ],
      });
    });

    it('should not touch permissions when permissionIds not provided', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(mockRole);
      mockPrisma.role.update.mockResolvedValue(mockRole);

      await service.update('role-1', 'tenant-1', { name: 'Renamed' });

      expect(mockPrisma.rolePermission.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.rolePermission.createMany).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete non-system role', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(mockRole);
      mockPrisma.role.delete.mockResolvedValue(mockRole);

      await service.remove('role-1', 'tenant-1');

      expect(mockPrisma.role.delete).toHaveBeenCalledWith({
        where: { id: 'role-1' },
      });
    });

    it('should throw error when trying to delete system role', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(mockSystemRole);

      await expect(
        service.remove('role-sys', 'tenant-1'),
      ).rejects.toThrow('Cannot delete system roles');
    });
  });

  describe('getPermissions', () => {
    it('should return all permissions', async () => {
      const mockPermissions = [
        { id: 'perm-1', module: 'orders', action: 'create', description: 'Create orders' },
        { id: 'perm-2', module: 'orders', action: 'read', description: 'Read orders' },
      ];
      mockPrisma.permission.findMany.mockResolvedValue(mockPermissions);

      const result = await service.getPermissions();

      expect(result).toHaveLength(2);
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        orderBy: [{ module: 'asc' }, { action: 'asc' }],
      });
    });
  });
});
