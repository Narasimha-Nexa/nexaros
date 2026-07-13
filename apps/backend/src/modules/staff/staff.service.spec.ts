import { Test, TestingModule } from '@nestjs/testing';
import { StaffService } from './staff.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('StaffService', () => {
  let service: StaffService;
  let prisma: jest.Mocked<PrismaService>;

  const mockStaff = {
    id: 'staff-1',
    branchId: 'branch-1',
    userId: null,
    roleId: 'role-1',
    name: 'John Waiter',
    phone: '+911234567890',
    pin: '1234',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockShift = {
    id: 'shift-1',
    branchId: 'branch-1',
    name: 'Morning',
    startTime: '09:00',
    endTime: '17:00',
  };

  const mockAttendance = {
    id: 'att-1',
    staffId: 'staff-1',
    date: new Date(),
    checkIn: new Date(),
    checkOut: null,
    status: 'PRESENT',
    notes: null,
  };

  const mockPrisma = {
    staff: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    branch: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'branch-1',
        tenantId: 'tenant-1',
        tenant: {
          subscriptions: [{ plan: { features: { maxStaff: 50 } } }],
        },
      }),
    },
    tenant: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'tenant-1',
        subscriptions: [{ plan: { features: { maxStaff: 50 } } }],
      }),
    },
    shift: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    staffShift: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  // ── STAFF CRUD ──

  describe('findAllStaff', () => {
    it('should return paginated staff list', async () => {
      mockPrisma.staff.findMany.mockResolvedValue([mockStaff]);
      mockPrisma.staff.count.mockResolvedValue(1);

      const result = await service.findAllStaff('branch-1');

      expect(result.staff).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findOneStaff', () => {
    it('should return staff when found', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue(mockStaff);

      const result = await service.findOneStaff('staff-1');

      expect(result).toMatchObject({ name: 'John Waiter' });
    });

    it('should throw NotFoundException when staff not found', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue(null);

      await expect(service.findOneStaff('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createStaff', () => {
    it('should create a new staff member', async () => {
      mockPrisma.staff.create.mockResolvedValue(mockStaff);

      const result = await service.createStaff('branch-1', {
        name: 'John Waiter',
        roleId: 'role-1',
        phone: '+911234567890',
      });

      expect(result).toMatchObject({ name: 'John Waiter' });
      expect(mockPrisma.staff.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ branchId: 'branch-1' }),
        }),
      );
    });
  });

  describe('updateStaff', () => {
    it('should update staff details', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue(mockStaff);
      mockPrisma.staff.update.mockResolvedValue({ ...mockStaff, name: 'John Updated' });

      const result = await service.updateStaff('staff-1', { name: 'John Updated' });

      expect(result.name).toBe('John Updated');
    });
  });

  describe('removeStaff', () => {
    it('should soft-delete staff by setting isActive to false', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue(mockStaff);
      mockPrisma.staff.update.mockResolvedValue({ ...mockStaff, isActive: false });

      await service.removeStaff('staff-1');

      expect(mockPrisma.staff.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'staff-1' },
          data: { isActive: false },
        }),
      );
    });

    it('should throw NotFoundException when staff not found', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue(null);

      await expect(service.removeStaff('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── SHIFTS ──

  describe('createShift', () => {
    it('should create a new shift', async () => {
      mockPrisma.shift.create.mockResolvedValue(mockShift);

      const result = await service.createShift('branch-1', {
        name: 'Morning',
        startTime: '09:00',
        endTime: '17:00',
      });

      expect(result).toMatchObject({ name: 'Morning' });
    });
  });

  describe('assignShift', () => {
    it('should assign staff to a shift', async () => {
      const assignment = {
        id: 'ss-1',
        staffId: 'staff-1',
        shiftId: 'shift-1',
        date: new Date('2026-07-14'),
        status: 'ASSIGNED',
      };
      mockPrisma.staffShift.create.mockResolvedValue(assignment);

      const result = await service.assignShift('staff-1', 'shift-1', '2026-07-14');

      expect(result).toMatchObject({ staffId: 'staff-1', shiftId: 'shift-1' });
    });
  });

  // ── ATTENDANCE / CLOCK IN/OUT ──

  describe('clockIn', () => {
    it('should create attendance record with check-in time', async () => {
      mockPrisma.attendance.findFirst.mockResolvedValue(null);
      mockPrisma.attendance.create.mockResolvedValue(mockAttendance);

      const result = await service.clockIn('staff-1');

      expect(result.status).toBe('PRESENT');
      expect(result.checkIn).toBeDefined();
    });

    it('should throw BadRequestException when already clocked in today', async () => {
      mockPrisma.attendance.findFirst.mockResolvedValue(mockAttendance);

      await expect(service.clockIn('staff-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('clockOut', () => {
    it('should update attendance with check-out time', async () => {
      mockPrisma.attendance.findFirst.mockResolvedValue(mockAttendance);
      mockPrisma.attendance.update.mockResolvedValue({ ...mockAttendance, checkOut: new Date() });

      const result = await service.clockOut('staff-1');

      expect(result.checkOut).toBeDefined();
    });

    it('should throw BadRequestException when not clocked in', async () => {
      mockPrisma.attendance.findFirst.mockResolvedValue(null);

      await expect(service.clockOut('staff-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when already clocked out', async () => {
      mockPrisma.attendance.findFirst.mockResolvedValue({
        ...mockAttendance,
        checkOut: new Date(),
      });

      await expect(service.clockOut('staff-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTodayAttendance', () => {
    it('should return today attendance records', async () => {
      mockPrisma.attendance.findMany.mockResolvedValue([mockAttendance]);

      const result = await service.getTodayAttendance('branch-1');

      expect(result).toHaveLength(1);
    });
  });
});
