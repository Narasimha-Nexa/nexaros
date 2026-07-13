import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: GatewayService,
  ) {}

  async findAll(tenantId: string, query: { date?: string; status?: string; branchId?: string }) {
    const where: any = { tenantId };

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

    return this.prisma.reservation.findMany({
      where,
      include: {
        table: {
          select: { id: true, number: true, name: true, capacity: true },
        },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  async findOne(id: string, tenantId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, tenantId },
      include: {
        table: {
          select: { id: true, number: true, name: true, capacity: true, status: true },
        },
      },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  async create(tenantId: string, dto: CreateReservationDto) {
    // Check for overlapping reservations on the same table, date, and time
    if (dto.tableId) {
      const overlapping = await this.prisma.reservation.findFirst({
        where: {
          tenantId,
          tableId: dto.tableId,
          date: new Date(dto.date),
          time: dto.time,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] as any },
        },
      });
      if (overlapping) {
        throw new BadRequestException('This table already has a reservation at this date and time');
      }
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        tenantId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        date: new Date(dto.date),
        time: dto.time,
        guestCount: dto.guestCount,
        tableId: dto.tableId,
        notes: dto.notes,
        status: 'CONFIRMED' as any,
      },
      include: {
        table: {
          select: { id: true, number: true, name: true, capacity: true },
        },
      },
    });

    // If a table was assigned, mark it as RESERVED
    if (dto.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: dto.tableId },
        data: { status: 'RESERVED' as any },
      });
    }

    // Broadcast via WebSocket
    this.gateway.emitToTenant(tenantId, 'reservation:created', {
      id: reservation.id,
      customerName: reservation.customerName,
      date: reservation.date,
      time: reservation.time,
      guestCount: reservation.guestCount,
      tableNumber: reservation.table?.number,
    });

    return reservation;
  }

  async update(id: string, tenantId: string, dto: UpdateReservationDto) {
    const existing = await this.findOne(id, tenantId);

    const previousTableId = existing.tableId;

    const reservation = await this.prisma.reservation.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: {
        table: {
          select: { id: true, number: true, name: true, capacity: true },
        },
      },
    });

    // If table changed, free the old table and reserve the new one
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

    // If status changed to CANCELLED or COMPLETED or NO_SHOW, free the table
    if (dto.status && ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(dto.status)) {
      if (reservation.tableId) {
        await this.prisma.restaurantTable.update({
          where: { id: reservation.tableId },
          data: { status: 'FREE' as any },
        });
      }
    }

    // If status changed to ARRIVED, mark table as OCCUPIED
    if (dto.status === 'ARRIVED' && reservation.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: reservation.tableId },
        data: { status: 'OCCUPIED' as any },
      });
    }

    // Broadcast via WebSocket
    this.gateway.emitToTenant(tenantId, 'reservation:updated', {
      id: reservation.id,
      status: reservation.status,
      customerName: reservation.customerName,
    });

    return reservation;
  }

  async remove(id: string, tenantId: string) {
    const reservation = await this.findOne(id, tenantId);

    // Free the table if it was assigned
    if (reservation.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: reservation.tableId },
        data: { status: 'FREE' as any },
      });
    }

    await this.prisma.reservation.delete({ where: { id } });

    this.gateway.emitToTenant(tenantId, 'reservation:deleted', { id });

    return { message: 'Reservation deleted' };
  }

  async getTodayReservations(tenantId: string) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.prisma.reservation.findMany({
      where: {
        tenantId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' as any },
      },
      include: {
        table: {
          select: { id: true, number: true, name: true, capacity: true },
        },
      },
      orderBy: { time: 'asc' },
    });
  }

  async getUpcomingReservations(tenantId: string, limit = 10) {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    return this.prisma.reservation.findMany({
      where: {
        tenantId,
        date: { gte: startOfDay },
        status: { in: ['CONFIRMED', 'ARRIVED'] as any },
      },
      include: {
        table: {
          select: { id: true, number: true, name: true, capacity: true },
        },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      take: limit,
    });
  }
}
