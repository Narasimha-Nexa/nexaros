import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { CreateTableDto } from './dto/create-table.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  private async validateBranch(branchId: string, tenantId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId, isActive: true },
      select: { id: true },
    });
    if (!branch) throw new NotFoundException('Branch not found or does not belong to this tenant');
    return branch;
  }

  private async findOneWithTenantValidation(id: string, tenantId: string) {
    const table = await this.prisma.restaurantTable.findFirst({
      where: { id, branch: { tenantId } },
      include: {
        branch: { select: { id: true, tenantId: true } },
      },
    });
    if (!table) throw new NotFoundException('Table not found or does not belong to this tenant');
    return table;
  }

  async findAll(branchId: string, tenantId: string) {
    await this.validateBranch(branchId, tenantId);
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

  async findOne(id: string, tenantId: string) {
    const table = await this.findOneWithTenantValidation(id, tenantId);
    const fullTable = await this.prisma.restaurantTable.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          include: {
            items: { include: { menuItem: { select: { name: true } }, addOns: true } },
          },
        },
      },
    });
    return fullTable;
  }

  async create(branchId: string, dto: CreateTableDto, tenantId: string) {
    await this.validateBranch(branchId, tenantId);
    return this.prisma.restaurantTable.create({
      data: { ...dto, branchId },
    });
  }

  async update(id: string, data: { name?: string; capacity?: number }, tenantId: string) {
    await this.findOneWithTenantValidation(id, tenantId);
    return this.prisma.restaurantTable.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: string, tenantId: string) {
    const table = await this.findOneWithTenantValidation(id, tenantId);
    const updated = await this.prisma.restaurantTable.update({
      where: { id },
      data: { status: status as any },
    });
    this.eventBus.emitToBranch(table.branch.id, 'table:status-changed', {
      tableId: updated.id,
      tableNumber: updated.number,
      status: updated.status,
    });
    return updated;
  }

  async generateQrCode(id: string, tenantId: string) {
    const table = await this.findOneWithTenantValidation(id, tenantId);

    const qrToken = randomBytes(16).toString('hex');
    const qrUrl = `${process.env.APP_URL || 'http://localhost:3000'}/order/${table.branch.id}/${table.id}?token=${qrToken}`;

    const updated = await this.prisma.restaurantTable.update({
      where: { id },
      data: { qrCode: qrUrl },
    });

    return { tableId: id, tableNumber: table.number, qrCode: qrUrl };
  }

  async remove(id: string, tenantId: string) {
    await this.findOneWithTenantValidation(id, tenantId);
    return this.prisma.restaurantTable.delete({ where: { id } });
  }

  async getFloorPlan(branchId: string, tenantId: string) {
    await this.validateBranch(branchId, tenantId);
    const tables = await this.prisma.restaurantTable.findMany({
      where: { branchId, isActive: true },
      select: {
        id: true,
        number: true,
        name: true,
        capacity: true,
        status: true,
        qrCode: true,
      },
      orderBy: { number: 'asc' },
    });

    const summary = {
      total: tables.length,
      free: tables.filter((t) => t.status === 'FREE').length,
      occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
      reserved: tables.filter((t) => t.status === 'RESERVED').length,
      cleaning: tables.filter((t) => t.status === 'CLEANING').length,
      orderReady: tables.filter((t) => t.status === 'ORDER_READY').length,
      billing: tables.filter((t) => t.status === 'BILLING').length,
    };

    return { tables, summary };
  }
}
