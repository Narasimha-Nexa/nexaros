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
    const updateData: Record<string, unknown> = { status: status as any };
    if (status === 'OCCUPIED') updateData.occupiedSince = new Date();
    if (status === 'FREE') updateData.occupiedSince = null;

    const updated = await this.prisma.restaurantTable.update({
      where: { id },
      data: updateData,
    });
    this.eventBus.emitToBranch(table.branch.id, 'table:status-changed', {
      tableId: updated.id,
      tableNumber: updated.number,
      status: updated.status,
      occupiedSince: updated.occupiedSince,
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
        section: true,
        posX: true,
        posY: true,
        occupiedSince: true,
        mergedFrom: true,
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

  // ─── Table Merge ───

  async mergeTables(
    tableIds: string[],
    tenantId: string,
    options?: { name?: string; capacity?: number },
  ) {
    if (tableIds.length < 2) {
      throw new BadRequestException('At least 2 tables are required to merge');
    }

    // Validate all tables belong to the same branch and tenant
    const tables = await this.prisma.restaurantTable.findMany({
      where: { id: { in: tableIds }, branch: { tenantId } },
      include: {
        orders: { where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } }, select: { id: true } },
      },
    });

    if (tables.length !== tableIds.length) {
      throw new BadRequestException('One or more tables not found or do not belong to this tenant');
    }

    const branchIds = [...new Set(tables.map((t) => t.branchId))];
    if (branchIds.length > 1) {
      throw new BadRequestException('All tables must belong to the same branch');
    }

    // Check that no table has active orders
    const tablesWithOrders = tables.filter((t) => t.orders.length > 0);
    if (tablesWithOrders.length > 0) {
      throw new BadRequestException(
        `Tables ${tablesWithOrders.map((t) => t.number).join(', ')} have active orders and cannot be merged`,
      );
    }

    // Check that no table has an active dining session
    const tablesWithSessions = tables.filter((t) => t.activeSessionId != null);
    if (tablesWithSessions.length > 0) {
      throw new BadRequestException(
        `Tables ${tablesWithSessions.map((t) => t.number).join(', ')} have active dining sessions and cannot be merged`,
      );
    }

    const branchId = branchIds[0];
    const maxNumber = Math.max(...tables.map((t) => t.number));
    const totalCapacity = options?.capacity ?? tables.reduce((sum, t) => sum + t.capacity, 0);
    const mergedName = options?.name ?? tables.map((t) => `T${t.number}`).join('+');

    // Use a transaction to create merged table and deactivate sources
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the merged table
      const merged = await tx.restaurantTable.create({
        data: {
          branchId,
          number: maxNumber + 1,
          name: mergedName,
          capacity: totalCapacity,
          status: 'FREE',
          section: tables[0].section,
          posX: tables[0].posX,
          posY: tables[0].posY,
          mergedFrom: tableIds,
        },
      });

      // Deactivate source tables
      await tx.restaurantTable.updateMany({
        where: { id: { in: tableIds } },
        data: { isActive: false },
      });

      return merged;
    });

    // Emit merge event
    await this.eventBus.tableMerged(tenantId, branchId, {
      mergedTableId: result.id,
      mergedTableNumber: result.number,
      mergedTableName: result.name,
      sourceTableIds: tableIds,
      sourceTableNumbers: tables.map((t) => t.number),
      capacity: totalCapacity,
    });

    return result;
  }

  // ─── Table Split ───

  async splitTable(tableId: string, tenantId: string, splitCount?: number) {
    const table = await this.findOneWithTenantValidation(tableId, tenantId);

    const mergedFrom = table.mergedFrom as string[] | null;
    if (!mergedFrom || mergedFrom.length === 0) {
      throw new BadRequestException('This table was not created from a merge and cannot be split');
    }

    const sourceIds = mergedFrom;
    const targetCount = splitCount ?? sourceIds.length;

    if (targetCount < 2) {
      throw new BadRequestException('Split count must be at least 2');
    }

    // Check no active orders on the merged table
    const activeOrders = await this.prisma.order.findMany({
      where: { tableId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    });
    if (activeOrders.length > 0) {
      throw new BadRequestException('Cannot split a table with active orders');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Reactivate the original source tables
      const reactivated = await tx.restaurantTable.updateMany({
        where: { id: { in: sourceIds }, branchId: table.branchId },
        data: { isActive: true, status: 'FREE' },
      });

      // Delete the merged table
      await tx.restaurantTable.delete({ where: { id: tableId } });

      // Get the reactivated tables
      return tx.restaurantTable.findMany({
        where: { id: { in: sourceIds }, branchId: table.branchId },
        orderBy: { number: 'asc' },
      });
    });

    // Emit split event
    await this.eventBus.tableSplit(tenantId, table.branchId, {
      splitTableId: tableId,
      splitTableNumber: table.number,
      restoredTableIds: result.map((t) => t.id),
      restoredTableNumbers: result.map((t) => t.number),
    });

    return result;
  }

  // ─── Batch Status Update ───

  async batchUpdateStatus(tableIds: string[], status: string, tenantId: string) {
    if (tableIds.length === 0) {
      throw new BadRequestException('At least one table ID is required');
    }

    // Validate all tables belong to the same branch and tenant
    const tables = await this.prisma.restaurantTable.findMany({
      where: { id: { in: tableIds }, branch: { tenantId } },
    });

    if (tables.length !== tableIds.length) {
      throw new BadRequestException('One or more tables not found or do not belong to this tenant');
    }

    const branchIds = [...new Set(tables.map((t) => t.branchId))];
    if (branchIds.length > 1) {
      throw new BadRequestException('All tables must belong to the same branch');
    }

    await this.prisma.restaurantTable.updateMany({
      where: { id: { in: tableIds } },
      data: { status: status as any },
    });

    // Emit individual events for each table so all clients update correctly
    for (const table of tables) {
      await this.eventBus.tableStatusChanged(tenantId, table.branchId, {
        tableId: table.id,
        tableNumber: table.number,
        status,
        batchUpdate: true,
      });
    }

    // Emit batch event for aggregate updates
    await this.eventBus.tableBatchUpdated(tenantId, branchIds[0], {
      tableIds,
      status,
      count: tableIds.length,
    });

    return { updated: tableIds.length, status };
  }

  // ─── Table Utilization Stats ───

  async getTableUtilization(branchId: string, tenantId: string, period: string = 'today') {
    await this.validateBranch(branchId, tenantId);

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const tables = await this.prisma.restaurantTable.findMany({
      where: { branchId, isActive: true },
      select: {
        id: true,
        number: true,
        name: true,
        capacity: true,
        status: true,
        occupiedSince: true,
      },
      orderBy: { number: 'asc' },
    });

    // Get completed orders for this period with table info
    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        tableId: { not: null },
        createdAt: { gte: startDate },
        status: { in: ['COMPLETED', 'CANCELLED'] },
      },
      select: {
        id: true,
        tableId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        totalAmount: true,
      },
    });

    // Calculate per-table stats
    const tableStats = tables.map((table) => {
      const tableOrders = orders.filter((o) => o.tableId === table.id);
      const completedOrders = tableOrders.filter((o) => o.status === 'COMPLETED');

      // Calculate average duration (time from first order to completion)
      let avgDurationMinutes = 0;
      if (completedOrders.length > 0) {
        const durations = completedOrders.map((o) =>
          (o.updatedAt.getTime() - o.createdAt.getTime()) / 60000,
        );
        avgDurationMinutes = durations.reduce((a, b) => a + b, 0) / durations.length;
      }

      // Calculate turnover (number of completed orders / hours open)
      const hoursOpen = Math.max(1, (now.getTime() - startDate.getTime()) / 3600000);
      const turnoverRate = completedOrders.length / hoursOpen;

      // Revenue per table
      const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

      // Current occupancy duration
      let currentOccupancyMinutes = 0;
      if (table.status === 'OCCUPIED' && table.occupiedSince) {
        currentOccupancyMinutes = (now.getTime() - new Date(table.occupiedSince).getTime()) / 60000;
      }

      return {
        tableId: table.id,
        tableNumber: table.number,
        tableName: table.name,
        capacity: table.capacity,
        currentStatus: table.status,
        totalOrders: tableOrders.length,
        completedOrders: completedOrders.length,
        avgDurationMinutes: Math.round(avgDurationMinutes),
        turnoverRate: Math.round(turnoverRate * 10) / 10,
        totalRevenue,
        currentOccupancyMinutes: Math.round(currentOccupancyMinutes),
        utilizationPercent: Math.round((tableOrders.length / Math.max(1, hoursOpen)) * 100),
      };
    });

    // Branch-level summary
    const totalTables = tables.length;
    const occupiedNow = tables.filter((t) => t.status === 'OCCUPIED').length;
    const avgOccupancyRate = totalTables > 0 ? Math.round((occupiedNow / totalTables) * 100) : 0;
    const totalRevenue = orders.filter((o) => o.status === 'COMPLETED').reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders = orders.length;
    const avgTurnover = tableStats.reduce((sum, t) => sum + t.turnoverRate, 0) / Math.max(1, totalTables);

    // Peak hours analysis
    const hourCounts = new Array(24).fill(0);
    orders.forEach((o) => {
      hourCounts[new Date(o.createdAt).getHours()]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    return {
      period,
      startDate,
      endDate: now,
      summary: {
        totalTables,
        occupiedNow,
        avgOccupancyRate,
        totalOrders,
        totalRevenue,
        avgTurnoverPerHour: Math.round(avgTurnover * 10) / 10,
        peakHour: `${peakHour}:00-${peakHour + 1}:00`,
      },
      tables: tableStats,
    };
  }

  // ─── Floor Plan Position Update ───

  async updateTablePosition(
    id: string,
    posX: number,
    posY: number,
    section: string | undefined,
    tenantId: string,
  ) {
    const table = await this.findOneWithTenantValidation(id, tenantId);
    const updateData: Record<string, unknown> = { posX, posY };
    if (section !== undefined) updateData.section = section;

    return this.prisma.restaurantTable.update({
      where: { id },
      data: updateData,
    });
  }

  // ─── Batch Position Update ───

  async batchUpdatePositions(
    positions: Array<{ id: string; posX: number; posY: number; section?: string }>,
    tenantId: string,
  ) {
    for (const pos of positions) {
      await this.updateTablePosition(pos.id, pos.posX, pos.posY, pos.section, tenantId);
    }
    return { updated: positions.length };
  }
}
