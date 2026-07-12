import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffDto} from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  // ── STAFF CRUD ──

  async findAllStaff(branchId: string) {
    return this.prisma.staff.findMany({
      where: { branchId, isActive: true },
      include: {
        role: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneStaff(id: string) {
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

  async createStaff(branchId: string, dto: CreateStaffDto) {
    return this.prisma.staff.create({
      data: { branchId, ...dto },
      include: {
        role: { select: { id: true, name: true } },
      },
    });
  }

  async updateStaff(id: string, dto: UpdateStaffDto) {
    await this.findOneStaff(id);
    return this.prisma.staff.update({
      where: { id },
      data: dto,
      include: {
        role: { select: { id: true, name: true } },
      },
    });
  }

  async removeStaff(id: string) {
    await this.findOneStaff(id);
    return this.prisma.staff.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── SHIFTS ──

  async findAllShifts(branchId: string) {
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

  async createShift(branchId: string, dto: CreateShiftDto) {
    return this.prisma.shift.create({
      data: { branchId, ...dto },
    });
  }

  async updateShift(id: string, dto: UpdateShiftDto) {
    return this.prisma.shift.update({
      where: { id },
      data: dto,
    });
  }

  async removeShift(id: string) {
    return this.prisma.shift.delete({ where: { id } });
  }

  // ── STAFF-SHIFT ASSIGNMENT ──

  async assignShift(staffId: string, shiftId: string, date: string) {
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

  async getSchedule(branchId: string, date: string) {
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

  async clockIn(staffId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existing = await this.prisma.attendance.findFirst({
      where: {
        staffId,
        date: today,
      },
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

  async clockOut(staffId: string) {
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

  async getTodayAttendance(branchId: string) {
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

  async getAttendanceReport(staffId: string, from: string, to: string) {
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
}
