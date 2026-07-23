import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { JoinDiningSessionDto } from './dto/join-dining-session.dto';
import * as crypto from 'crypto';

@Injectable()
export class GuestSessionService {
  private readonly AVATAR_COLORS = [
    '#E51A24', '#16A34A', '#F1B31C', '#7C3AED', '#0891B2',
    '#E51A24', '#E51A24', '#9333EA', '#CA8A04', '#059669',
  ];

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  private generateGuestToken(): string {
    return `gst_${crypto.randomBytes(16).toString('hex')}`;
  }

  private getNextGuestNumber(sessionId: string, existingCount: number): number {
    return existingCount + 1;
  }

  private getNextColor(existingColors: string[]): string {
    const usedColors = new Set(existingColors);
    const available = this.AVATAR_COLORS.filter((c) => !usedColors.has(c));
    return available[0] || this.AVATAR_COLORS[existingColors.length % this.AVATAR_COLORS.length];
  }

  async joinSession(sessionId: string, dto: JoinDiningSessionDto) {
    const session = await this.prisma.diningSession.findFirst({
      where: {
        id: sessionId,
        status: { in: ['ACTIVE', 'ORDERING', 'DINING'] },
        deletedAt: null,
      },
      include: {
        guestSessions: { where: { leftAt: null }, select: { id: true, avatarColor: true, guestNumber: true } },
        table: { select: { capacity: true, number: true } },
      },
    });
    if (!session) throw new NotFoundException('Active dining session not found');

    if (dto.deviceFingerprint) {
      const existingGuest = await this.prisma.guestSession.findFirst({
        where: {
          diningSessionId: sessionId,
          deviceFingerprint: dto.deviceFingerprint,
          leftAt: null,
        },
      });
      if (existingGuest) {
        return this.prisma.guestSession.update({
          where: { id: existingGuest.id },
          data: { lastActivityAt: new Date() },
          include: {
            cartItems: { include: { menuItem: { select: { id: true, name: true, image: true, isVeg: true } } } },
            orders: { include: { items: true } },
          },
        });
      }
    }

    const activeGuestCount = session.guestSessions.length;
    if (activeGuestCount >= session.table.capacity) {
      throw new BadRequestException(`Table capacity (${session.table.capacity}) reached`);
    }

    const guestNumber = this.getNextGuestNumber(sessionId, activeGuestCount);
    const avatarColor = dto.avatarColor || this.getNextColor(
      session.guestSessions.map((g) => g.avatarColor || ''),
    );

    const guest = await this.prisma.$transaction(async (tx) => {
      const g = await tx.guestSession.create({
        data: {
          diningSessionId: sessionId,
          guestToken: dto.guestToken || this.generateGuestToken(),
          guestName: dto.guestName,
          guestNumber,
          avatarColor,
          deviceFingerprint: dto.deviceFingerprint,
          status: 'JOINED',
        },
      });

      await tx.diningSession.update({
        where: { id: sessionId },
        data: { guestCount: activeGuestCount + 1 },
      });

      await tx.sessionTimeline.create({
        data: {
          diningSessionId: sessionId,
          event: 'guest.joined',
          description: `Guest ${guestNumber}${dto.guestName ? ` (${dto.guestName})` : ''} joined`,
          metadata: { guestSessionId: g.id, guestNumber, guestName: dto.guestName },
        },
      });

      return g;
    });

    this.eventBus.emitToBranch(session.branchId, 'dining:guest-joined', {
      sessionId,
      guestSessionId: guest.id,
      guestNumber: guest.guestNumber,
      guestName: guest.guestName,
      totalGuests: activeGuestCount + 1,
    });

    return {
      ...guest,
      tableNumber: session.table.number,
      sessionCode: session.sessionCode,
    };
  }

  async getGuestSession(guestToken: string) {
    const guest = await this.prisma.guestSession.findFirst({
      where: { guestToken, leftAt: null },
      include: {
        diningSession: {
          include: {
            table: { select: { id: true, number: true, name: true } },
            guestSessions: { where: { leftAt: null }, select: { id: true, guestName: true, guestNumber: true, avatarColor: true } },
          },
        },
        cartItems: { include: { menuItem: { select: { id: true, name: true, image: true, isVeg: true, price: true } } } },
        orders: { include: { items: true, payments: true }, where: { deletedAt: null } },
        splitAllocations: true,
      },
    });
    if (!guest) throw new NotFoundException('Guest session not found');
    return guest;
  }

  async updateGuestProfile(guestToken: string, data: { guestName?: string; avatarColor?: string }) {
    const guest = await this.prisma.guestSession.findFirst({
      where: { guestToken, leftAt: null },
    });
    if (!guest) throw new NotFoundException('Guest session not found');

    return this.prisma.guestSession.update({
      where: { id: guest.id },
      data: {
        ...(data.guestName !== undefined && { guestName: data.guestName }),
        ...(data.avatarColor !== undefined && { avatarColor: data.avatarColor }),
        lastActivityAt: new Date(),
      },
    });
  }

  async leaveSession(guestSessionId: string) {
    const guest = await this.prisma.guestSession.findUnique({
      where: { id: guestSessionId },
      include: { diningSession: true },
    });
    if (!guest) throw new NotFoundException('Guest session not found');
    if (guest.leftAt) return guest;

    const updated = await this.prisma.$transaction(async (tx) => {
      const g = await tx.guestSession.update({
        where: { id: guestSessionId },
        data: { leftAt: new Date(), status: 'LEFT' },
      });

      const activeCount = await tx.guestSession.count({
        where: { diningSessionId: guest.diningSessionId, leftAt: null },
      });

      await tx.diningSession.update({
        where: { id: guest.diningSessionId },
        data: { guestCount: activeCount },
      });

      await tx.sessionTimeline.create({
        data: {
          diningSessionId: guest.diningSessionId,
          event: 'guest.left',
          description: `Guest ${guest.guestNumber || '?'} left`,
          metadata: { guestSessionId, guestNumber: guest.guestNumber },
        },
      });

      return g;
    });

    this.eventBus.emitToBranch(guest.diningSession.branchId, 'dining:guest-left', {
      sessionId: guest.diningSessionId,
      guestSessionId,
      guestNumber: guest.guestNumber,
    });

    return updated;
  }

  async touchActivity(guestToken: string) {
    const guest = await this.prisma.guestSession.findFirst({
      where: { guestToken, leftAt: null },
    });
    if (!guest) return null;

    return this.prisma.guestSession.update({
      where: { id: guest.id },
      data: { lastActivityAt: new Date() },
    });
  }
}
