import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { AddSharedItemDto } from './dto/shared-item.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SharedItemService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async addSharedItem(sessionId: string, dto: AddSharedItemDto, tenantId: string) {
    const session = await this.prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, deletedAt: null, status: { in: ['ACTIVE', 'ORDERING', 'DINING'] } },
      include: { table: { select: { branchId: true } } },
    });
    if (!session) throw new NotFoundException('Active dining session not found');

    if (!dto.allocations || dto.allocations.length === 0) {
      throw new BadRequestException('At least one allocation is required for shared items');
    }

    const guestIds = dto.allocations.map((a) => a.guestSessionId);
    const validGuests = await this.prisma.guestSession.findMany({
      where: { id: { in: guestIds }, diningSessionId: sessionId, leftAt: null },
    });
    if (validGuests.length !== guestIds.length) {
      throw new BadRequestException('One or more guest sessions are invalid');
    }

    const itemTotal = new Decimal(dto.unitPrice).mul(dto.quantity);

    const sharedItem = await this.prisma.$transaction(async (tx) => {
      const item = await tx.sharedItem.create({
        data: {
          diningSessionId: sessionId,
          menuItemId: dto.menuItemId,
          variantId: dto.variantId,
          name: dto.name,
          quantity: dto.quantity,
          unitPrice: new Decimal(dto.unitPrice),
          totalPrice: itemTotal,
          splitMode: dto.allocations[0].percentage ? 'PERCENTAGE' : dto.allocations[0].amount ? 'CUSTOM_AMOUNT' : 'EQUAL',
          notes: dto.notes,
        },
      });

      const equalShare = itemTotal.div(dto.allocations.length);

      for (const alloc of dto.allocations) {
        const shareAmount = alloc.amount
          ? new Decimal(alloc.amount)
          : alloc.percentage
            ? itemTotal.mul(new Decimal(alloc.percentage).div(100))
            : equalShare;

        await tx.sharedItemAllocation.create({
          data: {
            sharedItemId: item.id,
            guestSessionId: alloc.guestSessionId,
            percentage: alloc.percentage ? new Decimal(alloc.percentage) : null,
            amount: shareAmount,
          },
        });
      }

      await tx.sessionTimeline.create({
        data: {
          diningSessionId: sessionId,
          event: 'shared.added',
          description: `Shared item: ${dto.name} x${dto.quantity} (₹${itemTotal}) split among ${dto.allocations.length} guests`,
          metadata: { sharedItemId: item.id, itemName: dto.name, total: Number(itemTotal), guestCount: dto.allocations.length },
        },
      });

      return item;
    });

    this.eventBus.emitToBranch(session.table.branchId, 'dining:shared-added', {
      sessionId,
      sharedItemId: sharedItem.id,
      itemName: dto.name,
      total: Number(itemTotal),
      guestCount: dto.allocations.length,
    });

    return this.prisma.sharedItem.findUnique({
      where: { id: sharedItem.id },
      include: { allocations: { include: { guestSession: { select: { id: true, guestName: true, guestNumber: true } } } } },
    });
  }

  async getSharedItems(sessionId: string, tenantId: string) {
    const session = await this.prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, deletedAt: null },
    });
    if (!session) throw new NotFoundException('Dining session not found');

    return this.prisma.sharedItem.findMany({
      where: { diningSessionId: sessionId },
      include: {
        allocations: { include: { guestSession: { select: { id: true, guestName: true, guestNumber: true } } } },
        menuItem: { select: { id: true, name: true, image: true } },
      },
    });
  }

  async removeSharedItem(sessionId: string, sharedItemId: string, tenantId: string) {
    const session = await this.prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, deletedAt: null, status: { in: ['ACTIVE', 'ORDERING'] } },
    });
    if (!session) throw new NotFoundException('Active dining session not found');

    const item = await this.prisma.sharedItem.findFirst({
      where: { id: sharedItemId, diningSessionId: sessionId },
    });
    if (!item) throw new NotFoundException('Shared item not found');

    await this.prisma.sharedItem.delete({ where: { id: sharedItemId } });
    return { deleted: true };
  }
}
