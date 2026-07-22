import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffDto} from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { ProcessPayrollDto } from './dto/process-payroll.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  private async validateStaffTenant(id: string, tenantId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id, branch: { tenantId } },
    });
    if (!staff) throw new NotFoundException('Staff not found or does not belong to this tenant');
    return staff;
  }

  private async validateShiftTenant(id: string, tenantId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { id, branch: { tenantId } },
    });
    if (!shift) throw new NotFoundException('Shift not found or does not belong to this tenant');
    return shift;
  }

  private async validateBranchTenant(branchId: string, tenantId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId, isActive: true },
    });
    if (!branch) throw new NotFoundException('Branch not found or does not belong to this tenant');
    return branch;
  }

  // ── STAFF CRUD ──

  async findAllStaff(branchId: string, tenantId: string, skip = 0, take = 20) {
    await this.validateBranchTenant(branchId, tenantId);
    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where: { branchId, isActive: true },
        skip,
        take,
        include: {
          role: { select: { id: true, name: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { orders: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.staff.count({ where: { branchId, isActive: true } }),
    ]);
    return { staff, total, skip, take };
  }

  async findOneStaff(id: string, tenantId: string) {
    await this.validateStaffTenant(id, tenantId);
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        role: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        attendance: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  async createStaff(branchId: string, dto: CreateStaffDto, tenantId: string) {
    await this.validateBranchTenant(branchId, tenantId);

    const staffBranch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (staffBranch) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: staffBranch.tenantId },
        include: { subscriptions: { where: { status: 'ACTIVE' }, include: { plan: true } } },
      });
      const activeSub = tenant?.subscriptions?.[0];
      if (activeSub?.plan?.maxStaff) {
        const currentCount = await this.prisma.staff.count({
          where: { branch: { tenantId: staffBranch.tenantId }, isActive: true },
        });
        if (currentCount >= activeSub.plan.maxStaff) {
          throw new BadRequestException(
            `Staff limit reached (${activeSub.plan.maxStaff}). Upgrade your plan to add more staff.`,
          );
        }
      }
    }

    return this.prisma.staff.create({
      data: { branchId, tenantId, ...dto, status: (dto as any).status || 'ACTIVE' },
      include: {
        role: { select: { id: true, name: true } },
      },
    });
  }

  async updateStaff(id: string, dto: UpdateStaffDto, tenantId: string) {
    await this.validateStaffTenant(id, tenantId);
    return this.prisma.staff.update({
      where: { id },
      data: dto,
      include: {
        role: { select: { id: true, name: true } },
      },
    });
  }

  async removeStaff(id: string, tenantId: string) {
    await this.validateStaffTenant(id, tenantId);
    return this.prisma.staff.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── SHIFTS ──

  async findAllShifts(branchId: string, tenantId: string) {
    await this.validateBranchTenant(branchId, tenantId);
    return this.prisma.shift.findMany({
      where: { branchId },
      include: {
        staffShifts: {
          include: { staff: { select: { id: true, name: true } } },
          take: 50,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createShift(branchId: string, dto: CreateShiftDto, tenantId: string) {
    await this.validateBranchTenant(branchId, tenantId);
    return this.prisma.shift.create({
      data: { branchId, ...dto },
    });
  }

  async updateShift(id: string, dto: UpdateShiftDto, tenantId: string) {
    await this.validateShiftTenant(id, tenantId);
    return this.prisma.shift.update({
      where: { id },
      data: dto,
    });
  }

  async removeShift(id: string, tenantId: string) {
    await this.validateShiftTenant(id, tenantId);
    return this.prisma.shift.delete({ where: { id } });
  }

  // ── STAFF-SHIFT ASSIGNMENT ──

  async assignShift(staffId: string, shiftId: string, date: string, tenantId: string) {
    await this.validateStaffTenant(staffId, tenantId);
    await this.validateShiftTenant(shiftId, tenantId);
    const shiftDate = new Date(date);
    return this.prisma.staffShift.create({
      data: {
        staffId,
        shiftId,
        date: shiftDate,
      },
      include: {
        staff: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true, startTime: true, endTime: true } },
      },
    });
  }

  async getSchedule(branchId: string, date: string, tenantId: string) {
    await this.validateBranchTenant(branchId, tenantId);
    const scheduleDate = new Date(date);
    const startOfDay = new Date(scheduleDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(scheduleDate.setHours(23, 59, 59, 999));

    return this.prisma.staffShift.findMany({
      where: {
        shift: { branchId },
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        staff: { select: { id: true, name: true, phone: true, pin: true } },
        shift: { select: { id: true, name: true, startTime: true, endTime: true } },
      },
      orderBy: [{ shift: { startTime: 'asc' } }, { staff: { name: 'asc' } }],
    });
  }

  // ── ATTENDANCE / CLOCK IN/OUT ──

  async clockIn(staffId: string, tenantId: string) {
    await this.validateStaffTenant(staffId, tenantId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findFirst({
      where: { staffId, date: today },
    });

    if (existing) {
      throw new BadRequestException('Already clocked in today');
    }

    return this.prisma.attendance.create({
      data: {
        staffId,
        date: today,
        checkIn: new Date(),
        status: 'PRESENT',
      },
      include: { staff: { select: { id: true, name: true } } },
    });
  }

  async clockOut(staffId: string, tenantId: string) {
    await this.validateStaffTenant(staffId, tenantId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: { staffId, date: today },
    });

    if (!attendance) {
      throw new BadRequestException('Not clocked in today');
    }
    if (attendance.checkOut) {
      throw new BadRequestException('Already clocked out today');
    }

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOut: new Date() },
    });
  }

  async getTodayAttendance(branchId: string, tenantId: string) {
    await this.validateBranchTenant(branchId, tenantId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.attendance.findMany({
      where: {
        staff: { branchId },
        date: { gte: today, lt: tomorrow },
      },
      include: {
        staff: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { checkIn: 'desc' },
    });
  }

  async getAttendanceReport(staffId: string, from: string, to: string, tenantId: string) {
    await this.validateStaffTenant(staffId, tenantId);
    return this.prisma.attendance.findMany({
      where: {
        staffId,
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  // ── LEAVE REQUESTS ──

  async createLeaveRequest(staffId: string, dto: CreateLeaveRequestDto, tenantId: string) {
    const staff = await this.validateStaffTenant(staffId, tenantId);

    return this.prisma.leaveRequest.create({
      data: {
        staffId,
        branchId: staff.branchId,
        tenantId: staff.tenantId || '',
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
      },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });
  }

  async findAllLeaveRequests(branchId: string, tenantId: string, status?: string) {
    await this.validateBranchTenant(branchId, tenantId);
    const where: any = { branchId };
    if (status) where.status = status;

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        staff: { select: { id: true, name: true, phone: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLeaveStatus(id: string, staffId: string, dto: UpdateLeaveStatusDto, tenantId: string) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id, branch: { tenantId } },
    });
    if (!leave) throw new NotFoundException('Leave request not found or does not belong to this tenant');

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: dto.status,
        approvedById: staffId,
        approvedAt: dto.status === 'APPROVED' ? new Date() : null,
        rejectionReason: dto.rejectionReason,
      },
      include: {
        staff: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
  }

  // ── PAYROLL ──

  async generatePayroll(branchId: string, dto: GeneratePayrollDto, tenantId: string) {
    await this.validateBranchTenant(branchId, tenantId);
    const staffMembers = await this.prisma.staff.findMany({
      where: { branchId, isActive: true },
      include: { role: { select: { id: true, name: true } } },
    });

    const startDate = new Date(dto.year, dto.month - 1, 1);
    const endDate = new Date(dto.year, dto.month, 0);

    const results = [];
    for (const staff of staffMembers) {
      const attendanceRecords = await this.prisma.attendance.findMany({
        where: {
          staffId: staff.id,
          date: { gte: startDate, lte: endDate },
        },
      });

      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;

      const baseSalary = Number(staff.salary || 0);
      const dailyRate = baseSalary / 30;
      const netPay = dailyRate * presentDays;

      const existing = await this.prisma.payroll.findUnique({
        where: { staffId_month_year: { staffId: staff.id, month: dto.month, year: dto.year } },
      });

      if (existing) {
        results.push(existing);
      } else {
        const payroll = await this.prisma.payroll.create({
          data: {
            staffId: staff.id,
            branchId,
            tenantId: staff.tenantId || '',
            month: dto.month,
            year: dto.year,
            baseSalary,
            totalDays,
            paidDays: presentDays,
            netPay,
          },
          include: {
            staff: { select: { id: true, name: true, roleId: true } },
          },
        });
        results.push(payroll);
      }
    }

    return results;
  }

  async getPayrollsByBranch(branchId: string, tenantId: string, month?: number, year?: number) {
    await this.validateBranchTenant(branchId, tenantId);
    const where: any = { branchId };
    if (month) where.month = month;
    if (year) where.year = year;

    return this.prisma.payroll.findMany({
      where,
      include: {
        staff: { select: { id: true, name: true, roleId: true, phone: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getPayrollsByStaff(staffId: string, tenantId: string) {
    await this.validateStaffTenant(staffId, tenantId);
    return this.prisma.payroll.findMany({
      where: { staffId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async processPayroll(id: string, dto: ProcessPayrollDto, tenantId: string) {
    const payroll = await this.prisma.payroll.findFirst({
      where: { id, branch: { tenantId } },
    });
    if (!payroll) throw new NotFoundException('Payroll not found or does not belong to this tenant');

    const allowances = dto.allowances ?? Number(payroll.allowances);
    const deductions = dto.deductions ?? Number(payroll.deductions);
    const bonuses = dto.bonuses ?? Number(payroll.bonuses);
    const netPay = Number(payroll.baseSalary) + allowances - deductions + bonuses;

    return this.prisma.payroll.update({
      where: { id },
      data: {
        allowances,
        deductions,
        bonuses,
        netPay,
        status: 'PAID',
        paidAt: new Date(),
        notes: dto.notes,
      },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });
  }
}
