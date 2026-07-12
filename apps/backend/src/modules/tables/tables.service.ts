import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private gateway: GatewayService,
  ) {}

  async findAll(branchId: string) {
    return this.prisma.restaurantTable.findMany({
      where: { branchId },
      include: {
        orders: {
          where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
        },
        reservations: {
          where: { status: 'CONFIRMED' },
          select: { id: true, customerName: true, time: true, guestCount: true },
        },
      },
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.restaurantTable.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          include: { items: true },
        },
      },
    });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async create(branchId: string, data: any) {
    return this.prisma.restaurantTable.create({
      data: { ...data, branchId },
    });
  }

  async updateStatus(id: string, status: string) {
    const table = await this.prisma.restaurantTable.update({
      where: { id },
      data: { status: status as any },
    });
    this.gateway.emitToBranch(table.branchId, 'table:status-changed', {
      tableId: table.id,
      tableNumber: table.number,
      status: table.status,
    });
    return table;
  }

  async remove(id: string) {
    return this.prisma.restaurantTable.delete({ where: { id } });
  }

  async getFloorPlan(branchId: string) {
    const tables = await this.prisma.restaurantTable.findMany({
      where: { branchId, isActive: true },
      select: {
        id: true,
        number: true,
        name: true,
        capacity: true,
        status: true,
      },
      orderBy: { number: 'asc' },
    });

    const summary = {
      total: tables.length,
      free: tables.filter((t) => t.status === 'FREE').length,
      occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
      reserved: tables.filter((t) => t.status === 'RESERVED').length,
      cleaning: tables.filter((t) => t.status === 'CLEANING').length,
    };

    return { tables, summary };
  }
}
