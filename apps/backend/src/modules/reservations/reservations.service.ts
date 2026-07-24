import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  private readonly DURATION_MINUTES = 120;

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private async findOverlappingReservation(
    tenantId: string,
    tableId: string,
    date: Date,
    time: string,
    excludeReservationId?: string,
  ) {
    const requestedStart = this.timeToMinutes(time);
    const requestedEnd = requestedStart + this.DURATION_MINUTES;

    const existingForTable = await this.prisma.reservation.findMany({
      where: {
        tenantId,
        tableId,
        deletedAt: null,
        date: { equals: date },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] as any },
        ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
      },
      select: { id: true, time: true, guestCount: true },
    });

    for (const existing of existingForTable) {
      const existStart = this.timeToMinutes(existing.time);
      const existEnd = existStart + this.DURATION_MINUTES;
      if (requestedStart < existEnd && requestedEnd > existStart) {
        return existing;
      }
    }

    return null;
  }

  async findAll(
    tenantId: string,
    query: { date?: string; status?: string; branchId?: string; search?: string; page?: number; limit?: number },
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = { tenantId, deletedAt: null };

    if (query.date) {
      const date = new Date(query.date);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      where.date = { gte: startOfDay, lte: endOfDay };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.branchId) {
      where.table = { branchId: query.branchId };
    }

    if (query.search) {
      where.OR = [
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { customerPhone: { contains: query.search } },
      ];
    }

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        include: {
          table: {
            select: { id: true, number: true, name: true, capacity: true, branchId: true },
          },
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      data: reservations,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        table: {
          select: { id: true, number: true, name: true, capacity: true, status: true, branchId: true },
        },
      },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  async create(tenantId: string, dto: CreateReservationDto, userId?: string) {
    const dateObj = new Date(dto.date);
    dateObj.setHours(0, 0, 0, 0);

    if (dto.tableId) {
      const table = await this.prisma.restaurantTable.findFirst({
        where: { id: dto.tableId, branch: { tenantId } },
        select: { id: true, number: true, capacity: true },
      });
      if (!table) throw new BadRequestException('Table not found or does not belong to this tenant');
      if (dto.guestCount > table.capacity) {
        throw new BadRequestException(`Table capacity (${table.capacity}) exceeded by guest count (${dto.guestCount})`);
      }

      const overlapping = await this.findOverlappingReservation(tenantId, dto.tableId, dateObj, dto.time);
      if (overlapping) {
        throw new BadRequestException(`Table already has a reservation overlapping with this time slot`);
      }
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        tenantId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        date: dateObj,
        time: dto.time,
        guestCount: dto.guestCount,
        tableId: dto.tableId || null,
        notes: dto.notes,
        status: 'CONFIRMED' as any,
        version: 1,
        createdBy: userId || null,
      },
      include: {
        table: {
          select: { id: true, number: true, name: true, capacity: true, branchId: true },
        },
      },
    });

    if (dto.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: dto.tableId },
        data: { status: 'RESERVED' as any },
      });
    }

    this.eventBus.emitToTenant(tenantId, 'reservation:created', {
      id: reservation.id,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      date: reservation.date,
      time: reservation.time,
      guestCount: reservation.guestCount,
      tableId: reservation.tableId,
      tableNumber: reservation.table?.number,
      branchId: reservation.table?.branchId,
      status: reservation.status,
      notes: reservation.notes,
    });

    return reservation;
  }

  async createPublic(tenantId: string, dto: CreateReservationDto) {
    return this.create(tenantId, dto);
  }

  async update(id: string, tenantId: string, dto: UpdateReservationDto, userId?: string) {
    const existing = await this.findOne(id, tenantId);
    const previousTableId = existing.tableId;

    const data: any = { ...dto, updatedBy: userId || undefined };
    if (dto.date) {
      data.date = new Date(dto.date);
      data.date.setHours(0, 0, 0, 0);
    }
    data.version = { increment: 1 };

    const targetTableId = dto.tableId || previousTableId;
    const targetDate = dto.date ? new Date(dto.date) : existing.date;
    targetDate.setHours(0, 0, 0, 0);
    const targetTime = dto.time || existing.time;

    if (targetTableId) {
      const overlapping = await this.findOverlappingReservation(
        tenantId, targetTableId, targetDate, targetTime, id,
      );
      if (overlapping) {
        throw new BadRequestException(`Table already has a reservation overlapping with this time slot`);
      }

      if (dto.guestCount && targetTableId) {
        const table = await this.prisma.restaurantTable.findUnique({
          where: { id: targetTableId },
          select: { capacity: true },
        });
        if (table && dto.guestCount > table.capacity) {
          throw new BadRequestException(`Table capacity (${table.capacity}) exceeded`);
        }
      }
    }

    const reservation = await this.prisma.reservation.update({
      where: { id },
      data,
      include: {
        table: {
          select: { id: true, number: true, name: true, capacity: true, branchId: true },
        },
      },
    });

    if (dto.tableId && dto.tableId !== previousTableId) {
      if (previousTableId) {
        await this.prisma.restaurantTable.update({
          where: { id: previousTableId },
          data: { status: 'FREE' as any },
        });
      }
      await this.prisma.restaurantTable.update({
        where: { id: dto.tableId },
        data: { status: 'RESERVED' as any },
      });
    }

    if (dto.status && ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(dto.status)) {
      if (reservation.tableId) {
        await this.prisma.restaurantTable.update({
          where: { id: reservation.tableId },
          data: { status: 'FREE' as any },
        });
      }
    }

    if (dto.status === 'ARRIVED' && reservation.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: reservation.tableId },
        data: { status: 'OCCUPIED' as any },
      });
    }

    this.eventBus.emitToTenant(tenantId, 'reservation:updated', {
      id: reservation.id,
      status: reservation.status,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      date: reservation.date,
      time: reservation.time,
      guestCount: reservation.guestCount,
      tableId: reservation.tableId,
      tableNumber: reservation.table?.number,
      branchId: reservation.table?.branchId,
      version: reservation.version,
    });

    return reservation;
  }

  async remove(id: string, tenantId: string, userId?: string) {
    const reservation = await this.findOne(id, tenantId);

    if (reservation.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: reservation.tableId },
        data: { status: 'FREE' as any },
      });
    }

    await this.prisma.reservation.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId || null, version: { increment: 1 } },
    });

    this.eventBus.emitToTenant(tenantId, 'reservation:deleted', {
      id,
      tableId: reservation.tableId,
      branchId: (reservation as any).table?.branchId,
    });

    return { message: 'Reservation deleted' };
  }

  async getTodayReservations(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.reservation.findMany({
      where: {
        tenantId,
        date: { gte: today, lte: endOfDay },
        status: { not: 'CANCELLED' as any },
        deletedAt: null,
      },
      include: {
        table: {
          select: { id: true, number: true, name: true, capacity: true, branchId: true },
        },
      },
      orderBy: { time: 'asc' },
    });
  }

  async getUpcomingReservations(tenantId: string, limit = 10) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.reservation.findMany({
      where: {
        tenantId,
        date: { gte: today },
        status: { in: ['CONFIRMED', 'ARRIVED'] as any },
        deletedAt: null,
      },
      include: {
        table: {
          select: { id: true, number: true, name: true, capacity: true, branchId: true },
        },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      take: limit,
    });
  }

  async getAvailability(
    tenantId: string,
    branchId: string,
    date: string,
    guestCount: number,
  ) {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const tables = await this.prisma.restaurantTable.findMany({
      where: {
        branchId,
        branch: { tenantId },
        isActive: true,
        capacity: { gte: guestCount },
      },
      select: { id: true, number: true, name: true, capacity: true, status: true },
      orderBy: { number: 'asc' },
    });

    const reservations = await this.prisma.reservation.findMany({
      where: {
        tenantId,
        date: dateObj,
        tableId: { not: null },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] as any },
        deletedAt: null,
      },
      select: { tableId: true, time: true },
    });

    const bookedTableIds = new Set<string>();
    for (const r of reservations) {
      if (r.tableId) bookedTableIds.add(r.tableId);
    }

    return tables.map((t) => ({
      ...t,
      isAvailable: !bookedTableIds.has(t.id),
    }));
  }

  async getStats(tenantId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const baseWhere: any = { tenantId, deletedAt: null };
    if (branchId) baseWhere.table = { branchId };

    const [todayTotal, todayConfirmed, todayArrived, todayCancelled, todayNoShow, upcoming] = await Promise.all([
      this.prisma.reservation.count({ where: { ...baseWhere, date: { gte: today, lt: tomorrow } } }),
      this.prisma.reservation.count({ where: { ...baseWhere, date: { gte: today, lt: tomorrow }, status: 'CONFIRMED' } }),
      this.prisma.reservation.count({ where: { ...baseWhere, date: { gte: today, lt: tomorrow }, status: 'ARRIVED' } }),
      this.prisma.reservation.count({ where: { ...baseWhere, date: { gte: today, lt: tomorrow }, status: 'CANCELLED' } }),
      this.prisma.reservation.count({ where: { ...baseWhere, date: { gte: today, lt: tomorrow }, status: 'NO_SHOW' } }),
      this.prisma.reservation.count({ where: { ...baseWhere, date: { gte: tomorrow }, status: 'CONFIRMED' } }),
    ]);

    return {
      todayTotal,
      todayConfirmed,
      todayArrived,
      todayCancelled,
      todayNoShow,
      upcomingCount: upcoming,
      occupancyRate: todayTotal > 0 ? Math.round((todayArrived / todayTotal) * 100) : 0,
    };
  }
}
