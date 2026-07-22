import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { CreateDiningSessionDto } from './dto/create-dining-session.dto';
import { DiningSessionStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class DiningSessionService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  private generateSessionCode(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `DS-${dateStr}-${rand}`;
  }

  async createSession(dto: CreateDiningSessionDto, tenantId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, tenantId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const table = await this.prisma.restaurantTable.findFirst({
      where: { id: dto.tableId, branchId: dto.branchId },
    });
    if (!table) throw new NotFoundException('Table not found');

    const existingSession = await this.prisma.diningSession.findFirst({
      where: {
        tableId: dto.tableId,
        status: { in: ['ACTIVE', 'ORDERING', 'DINING', 'BILLING'] },
        deletedAt: null,
      },
    });
    if (existingSession) {
      throw new ConflictException('Table already has an active dining session');
    }

    const session = await this.prisma.$transaction(async (tx) => {
      const s = await tx.diningSession.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          tableId: dto.tableId,
          sessionCode: this.generateSessionCode(),
          status: 'ACTIVE',
          guestCount: dto.guestCount || 1,
        },
      });

      await tx.restaurantTable.update({
        where: { id: dto.tableId },
        data: { status: 'OCCUPIED', activeSessionId: s.id },
      });

      await tx.sessionTimeline.create({
        data: {
          diningSessionId: s.id,
          event: 'session.created',
          description: `Dining session started at table ${table.number}`,
        },
      });

      return s;
    });

    this.eventBus.emitToBranch(dto.branchId, 'dining:session-created', {
      sessionId: session.id,
      tableId: dto.tableId,
      tableNumber: table.number,
      sessionCode: session.sessionCode,
    });

    return session;
  }

  async getSession(sessionId: string, tenantId: string) {
    const session = await this.prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, deletedAt: null },
      include: {
        table: { select: { id: true, number: true, name: true, capacity: true } },
        guestSessions: {
          where: { leftAt: null },
          include: {
            cartItems: { include: { menuItem: { select: { id: true, name: true, image: true, isVeg: true } } } },
            orders: { include: { items: true, payments: true } },
            splitAllocations: true,
          },
        },
        sharedItems: { include: { allocations: true, menuItem: { select: { id: true, name: true } } } },
        splitAllocations: true,
        sessionTimelines: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!session) throw new NotFoundException('Dining session not found');
    return session;
  }

  async getSessionByCode(sessionCode: string) {
    const session = await this.prisma.diningSession.findFirst({
      where: { sessionCode, deletedAt: null },
      include: {
        table: { select: { id: true, number: true, name: true, capacity: true } },
        guestSessions: {
          where: { leftAt: null },
          include: {
            cartItems: { include: { menuItem: { select: { id: true, name: true, image: true, isVeg: true } } } },
            orders: { include: { items: true } },
          },
        },
        sharedItems: true,
      },
    });
    if (!session) throw new NotFoundException('Dining session not found');
    return session;
  }

  async getSessionByQrCode(qrCode: string) {
    const table = await this.prisma.restaurantTable.findFirst({
      where: { qrCode, isActive: true },
      include: {
        activeSession: {
          where: { status: { in: ['ACTIVE', 'ORDERING', 'DINING', 'BILLING'] }, deletedAt: null },
          include: {
            guestSessions: { where: { leftAt: null } },
          },
        },
      },
    });
    if (!table) throw new NotFoundException('Table not found');

    return {
      tableId: table.id,
      tableNumber: table.number,
      tableName: table.name,
      capacity: table.capacity,
      branchId: table.branchId,
      activeSession: table.activeSession || null,
    };
  }

  async getActiveSessionsByBranch(branchId: string, tenantId: string) {
    return this.prisma.diningSession.findMany({
      where: {
        branchId,
        tenantId,
        status: { in: ['ACTIVE', 'ORDERING', 'DINING', 'BILLING'] },
        deletedAt: null,
      },
      include: {
        table: { select: { id: true, number: true, name: true } },
        guestSessions: { where: { leftAt: null } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSessionStatus(sessionId: string, status: DiningSessionStatus, tenantId: string) {
    const session = await this.prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, deletedAt: null },
      include: { table: true },
    });
    if (!session) throw new NotFoundException('Dining session not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      const s = await tx.diningSession.update({
        where: { id: sessionId },
        data: {
          status,
          ...(status === 'CLOSED' || status === 'SETTLED' ? { closedAt: new Date() } : {}),
        },
      });

      await tx.sessionTimeline.create({
        data: {
          diningSessionId: sessionId,
          event: `session.${status.toLowerCase()}`,
          description: `Session status changed to ${status}`,
        },
      });

      if (status === 'CLOSED' || status === 'SETTLED') {
        await tx.restaurantTable.update({
          where: { id: session.tableId },
          data: { status: 'FREE', activeSessionId: null },
        });
      }

      return s;
    });

    this.eventBus.emitToBranch(session.branchId, 'dining:session-updated', {
      sessionId: updated.id,
      status: updated.status,
      tableNumber: session.table.number,
    });

    return updated;
  }

  async closeSession(sessionId: string, tenantId: string) {
    const session = await this.prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, deletedAt: null },
      include: {
        guestSessions: { where: { leftAt: null } },
        table: true,
      },
    });
    if (!session) throw new NotFoundException('Dining session not found');

    const unpaidGuests = await this.prisma.splitAllocation.findMany({
      where: {
        diningSessionId: sessionId,
        status: 'PENDING',
      },
    });
    if (unpaidGuests.length > 0) {
      throw new BadRequestException('Cannot close session: there are still unpaid amounts');
    }

    return this.updateSessionStatus(sessionId, 'CLOSED', tenantId);
  }

  async getBill(sessionId: string, tenantId: string) {
    const session = await this.prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, deletedAt: null },
      include: {
        table: { select: { number: true } },
        guestSessions: {
          where: { leftAt: null },
          include: {
            orders: {
              include: { items: true },
              where: { deletedAt: null },
            },
            splitAllocations: true,
          },
        },
        sharedItems: { include: { allocations: true } },
      },
    });
    if (!session) throw new NotFoundException('Dining session not found');

    let totalItemAmount = 0;
    let totalTaxAmount = 0;
    const guestBills = session.guestSessions.map((guest) => {
      const itemTotal = guest.orders.reduce((sum, order) => {
        return sum + Number(order.totalAmount);
      }, 0);
      totalItemAmount += itemTotal;

      const taxAmount = guest.orders.reduce((sum, order) => {
        return sum + Number(order.taxAmount);
      }, 0);
      totalTaxAmount += taxAmount;

      return {
        guestSessionId: guest.id,
        guestName: guest.guestName || `Guest ${guest.guestNumber || '?'}`,
        itemTotal,
        taxAmount,
        splitAllocation: guest.splitAllocations[0] || null,
      };
    });

    const sharedAmount = session.sharedItems.reduce((sum, item) => {
      return sum + Number(item.totalPrice);
    }, 0);

    const grandTotal = totalItemAmount + totalTaxAmount + sharedAmount;

    return {
      sessionId: session.id,
      sessionCode: session.sessionCode,
      tableNumber: session.table.number,
      status: session.status,
      openedAt: session.openedAt,
      guestBills,
      sharedAmount,
      totalItemAmount,
      totalTaxAmount,
      grandTotal,
      guestCount: session.guestSessions.length,
    };
  }

  async addTimelineEvent(sessionId: string, event: string, description: string, metadata?: Record<string, any>) {
    return this.prisma.sessionTimeline.create({
      data: {
        diningSessionId: sessionId,
        event,
        description,
        metadata: metadata || undefined,
      },
    });
  }
}
