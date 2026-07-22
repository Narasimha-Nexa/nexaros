import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { ProcessPaymentDto, FullPaymentDto, MultiPaymentDto } from './dto/payment.dto';
import { SplitType, PaymentMethod } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SplitPaymentService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async calculateSplit(sessionId: string, tenantId: string, splitType: SplitType) {
    const session = await this.prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, deletedAt: null },
      include: {
        guestSessions: {
          where: { leftAt: null },
          include: {
            orders: { where: { deletedAt: null }, include: { items: true } },
          },
        },
        sharedItems: true,
      },
    });
    if (!session) throw new NotFoundException('Dining session not found');

    const guestTotals = session.guestSessions.map((guest) => {
      const itemTotal = guest.orders.reduce((sum, order) => {
        return sum + Number(order.totalAmount);
      }, 0);
      return {
        guestSessionId: guest.id,
        guestName: guest.guestName || `Guest ${guest.guestNumber || '?'}`,
        guestNumber: guest.guestNumber,
        itemTotal,
        orderCount: guest.orders.length,
      };
    });

    const totalItemAmount = guestTotals.reduce((sum, g) => sum + g.itemTotal, 0);
    const sharedAmount = session.sharedItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const grandTotal = totalItemAmount + sharedAmount;

    let allocations;

    switch (splitType) {
      case SplitType.FULL_BILL:
        allocations = guestTotals.map((g, i) => ({
          guestSessionId: g.guestSessionId,
          guestName: g.guestName,
          itemTotal: g.itemTotal,
          sharedTotal: i === 0 ? sharedAmount : 0,
          totalOwed: i === 0 ? grandTotal : g.itemTotal,
          splitType: SplitType.FULL_BILL,
        }));
        break;

      case SplitType.BY_GUEST:
        const perGuestShared = session.guestSessions.length > 0
          ? sharedAmount / session.guestSessions.length
          : 0;
        allocations = guestTotals.map((g) => ({
          guestSessionId: g.guestSessionId,
          guestName: g.guestName,
          itemTotal: g.itemTotal,
          sharedTotal: perGuestShared,
          totalOwed: g.itemTotal + perGuestShared,
          splitType: SplitType.BY_GUEST,
        }));
        break;

      case SplitType.EQUAL_SPLIT:
        const perPerson = session.guestSessions.length > 0
          ? grandTotal / session.guestSessions.length
          : 0;
        allocations = guestTotals.map((g) => ({
          guestSessionId: g.guestSessionId,
          guestName: g.guestName,
          itemTotal: g.itemTotal,
          sharedTotal: perPerson - g.itemTotal,
          totalOwed: perPerson,
          splitType: SplitType.EQUAL_SPLIT,
        }));
        break;

      case SplitType.BY_ITEM:
      case SplitType.CUSTOM:
        allocations = guestTotals.map((g) => ({
          guestSessionId: g.guestSessionId,
          guestName: g.guestName,
          itemTotal: g.itemTotal,
          sharedTotal: 0,
          totalOwed: g.itemTotal,
          splitType,
        }));
        break;

      default:
        throw new BadRequestException(`Unsupported split type: ${splitType}`);
    }

    await this.prisma.$transaction(async (tx) => {
      for (const alloc of allocations) {
        const existing = await tx.splitAllocation.findFirst({
          where: { diningSessionId: sessionId, guestSessionId: alloc.guestSessionId },
        });
        if (existing) {
          await tx.splitAllocation.update({
            where: { id: existing.id },
            data: {
              splitType: alloc.splitType as any,
              itemTotal: new Decimal(alloc.itemTotal),
              sharedTotal: new Decimal(alloc.sharedTotal),
              totalOwed: new Decimal(alloc.totalOwed),
              status: 'PENDING',
            },
          });
        } else {
          await tx.splitAllocation.create({
            data: {
              diningSessionId: sessionId,
              guestSessionId: alloc.guestSessionId,
              splitType: alloc.splitType as any,
              itemTotal: new Decimal(alloc.itemTotal),
              sharedTotal: new Decimal(alloc.sharedTotal),
              totalOwed: new Decimal(alloc.totalOwed),
              status: 'PENDING',
            },
          });
        }
      }
    });

    this.eventBus.emitToBranch(session.branchId, 'dining:split-changed', {
      sessionId,
      splitType,
      grandTotal,
      allocations,
    });

    return { grandTotal, splitType, allocations };
  }

  async processGuestPayment(sessionId: string, dto: ProcessPaymentDto, tenantId: string) {
    const session = await this.prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, deletedAt: null },
      include: { table: { select: { number: true, branchId: true } } },
    });
    if (!session) throw new NotFoundException('Dining session not found');

    const allocation = await this.prisma.splitAllocation.findFirst({
      where: { diningSessionId: sessionId, guestSessionId: dto.guestSessionId },
    });
    if (!allocation) throw new NotFoundException('Split allocation not found for this guest');

    const remaining = Number(allocation.totalOwed) - Number(allocation.totalPaid);
    if (dto.amount > remaining + 0.01) {
      throw new BadRequestException(`Amount ₹${dto.amount} exceeds remaining ₹${remaining.toFixed(2)}`);
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id: session.table.branchId },
      select: { tenantId: true },
    });

    const payment = await this.prisma.$transaction(async (tx) => {
      const latestOrder = await tx.order.findFirst({
        where: { guestSessionId: dto.guestSessionId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      const p = await tx.payment.create({
        data: {
          tenantId: branch!.tenantId,
          orderId: latestOrder?.id || '',
          branchId: session.table.branchId,
          guestSessionId: dto.guestSessionId,
          method: dto.method,
          amount: new Decimal(dto.amount),
          reference: dto.reference,
          status: 'COMPLETED',
          receivedAt: new Date(),
        },
      });

      await tx.paymentTransaction.create({
        data: {
          paymentId: p.id,
          guestSessionId: dto.guestSessionId,
          method: dto.method,
          amount: new Decimal(dto.amount),
          reference: dto.reference,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      const newPaid = Number(allocation.totalPaid) + dto.amount;
      const isFullyPaid = newPaid >= Number(allocation.totalOwed) - 0.01;

      await tx.splitAllocation.update({
        where: { id: allocation.id },
        data: {
          totalPaid: new Decimal(newPaid),
          status: isFullyPaid ? 'PAID' : 'PENDING',
          ...(isFullyPaid && { paidAt: new Date() }),
        },
      });

      await tx.guestSession.update({
        where: { id: dto.guestSessionId },
        data: { status: 'PAYING' },
      });

      await tx.sessionTimeline.create({
        data: {
          diningSessionId: sessionId,
          event: 'payment.received',
          description: `₹${dto.amount} paid by guest via ${dto.method}`,
          metadata: {
            guestSessionId: dto.guestSessionId,
            paymentId: p.id,
            amount: dto.amount,
            method: dto.method,
            remaining: Number(allocation.totalOwed) - newPaid,
          },
        },
      });

      return p;
    });

    this.eventBus.emitToBranch(session.table.branchId, 'dining:payment-received', {
      sessionId,
      guestSessionId: dto.guestSessionId,
      amount: dto.amount,
      method: dto.method,
      paymentId: payment.id,
    });

    return payment;
  }

  async processFullPayment(sessionId: string, dto: FullPaymentDto, tenantId: string) {
    const session = await this.prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, deletedAt: null },
      include: {
        guestSessions: { where: { leftAt: null } },
        table: { select: { number: true, branchId: true } },
      },
    });
    if (!session) throw new NotFoundException('Dining session not found');

    const totalOwed = await this.getTotalOwed(sessionId);
    const totalPaid = await this.getTotalPaid(sessionId);
    const remaining = totalOwed - totalPaid + (dto.tip || 0);

    const branch = await this.prisma.branch.findUnique({
      where: { id: session.table.branchId },
      select: { tenantId: true },
    });

    const payment = await this.prisma.$transaction(async (tx) => {
      const latestOrder = await tx.order.findFirst({
        where: { diningSessionId: sessionId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      const p = await tx.payment.create({
        data: {
          tenantId: branch!.tenantId,
          orderId: latestOrder?.id || '',
          branchId: session.table.branchId,
          method: dto.method,
          amount: new Decimal(remaining),
          reference: dto.reference,
          status: 'COMPLETED',
          receivedAt: new Date(),
        },
      });

      await tx.paymentTransaction.create({
        data: {
          paymentId: p.id,
          method: dto.method,
          amount: new Decimal(remaining),
          reference: dto.reference,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      await tx.splitAllocation.updateMany({
        where: { diningSessionId: sessionId, status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date() },
      });

      await tx.diningSession.update({
        where: { id: sessionId },
        data: { status: 'SETTLED' },
      });

      await tx.sessionTimeline.create({
        data: {
          diningSessionId: sessionId,
          event: 'payment.full',
          description: `Full payment of ₹${remaining} via ${dto.method}${dto.tip ? ` (₹${dto.tip} tip)` : ''}`,
          metadata: { paymentId: p.id, amount: remaining, method: dto.method, tip: dto.tip },
        },
      });

      return p;
    });

    this.eventBus.emitToBranch(session.table.branchId, 'dining:session-settled', {
      sessionId,
      paymentId: payment.id,
      amount: remaining,
      method: dto.method,
    });

    return payment;
  }

  async processMultiPayment(sessionId: string, dto: MultiPaymentDto, tenantId: string) {
    const session = await this.prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, deletedAt: null },
      include: { table: { select: { number: true, branchId: true } } },
    });
    if (!session) throw new NotFoundException('Dining session not found');

    const totalOwed = await this.getTotalOwed(sessionId);
    const totalPaid = await this.getTotalPaid(sessionId);
    const remaining = totalOwed - totalPaid + (dto.tip || 0);
    const paymentTotal = dto.payments.reduce((sum, p) => sum + p.amount, 0);

    if (Math.abs(paymentTotal - remaining) > 0.01) {
      throw new BadRequestException(`Payment total ₹${paymentTotal} does not match remaining ₹${remaining.toFixed(2)}`);
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id: session.table.branchId },
      select: { tenantId: true },
    });

    const payments = await this.prisma.$transaction(async (tx) => {
      const latestOrder = await tx.order.findFirst({
        where: { diningSessionId: sessionId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      const results = [];
      for (const payDto of dto.payments) {
        const p = await tx.payment.create({
          data: {
            tenantId: branch!.tenantId,
            orderId: latestOrder?.id || '',
            branchId: session.table.branchId,
            method: payDto.method,
            amount: new Decimal(payDto.amount),
            reference: payDto.reference,
            status: 'COMPLETED',
            receivedAt: new Date(),
          },
        });

        await tx.paymentTransaction.create({
          data: {
            paymentId: p.id,
            method: payDto.method,
            amount: new Decimal(payDto.amount),
            reference: payDto.reference,
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });

        results.push(p);
      }

      await tx.splitAllocation.updateMany({
        where: { diningSessionId: sessionId, status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date() },
      });

      await tx.diningSession.update({
        where: { id: sessionId },
        data: { status: 'SETTLED' },
      });

      await tx.sessionTimeline.create({
        data: {
          diningSessionId: sessionId,
          event: 'payment.multi',
          description: `Multi-payment: ${dto.payments.map((p) => `₹${p.amount} ${p.method}`).join(' + ')}`,
          metadata: { paymentCount: dto.payments.length, total: paymentTotal, tip: dto.tip },
        },
      });

      return results;
    });

    this.eventBus.emitToBranch(session.table.branchId, 'dining:session-settled', {
      sessionId,
      payments: payments.map((p) => ({ id: p.id, amount: Number(p.amount), method: p.method })),
      total: paymentTotal,
    });

    return payments;
  }

  async getPaymentSummary(sessionId: string, tenantId: string) {
    const session = await this.prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, deletedAt: null },
      include: {
        guestSessions: {
          where: { leftAt: null },
          include: {
            splitAllocations: true,
            orders: { where: { deletedAt: null } },
          },
        },
        sharedItems: true,
      },
    });
    if (!session) throw new NotFoundException('Dining session not found');

    const totalOwed = await this.getTotalOwed(sessionId);
    const totalPaid = await this.getTotalPaid(sessionId);

    const sessionPayments = await this.prisma.payment.findMany({
      where: {
        branch: { tenantId },
        OR: [
          { guestSession: { diningSessionId: sessionId } },
          { orderId: { in: (await this.prisma.order.findMany({ where: { diningSessionId: sessionId, deletedAt: null }, select: { id: true } })).map((o) => o.id) } },
        ],
        status: 'COMPLETED',
      },
      select: { id: true, method: true, amount: true, receivedAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      sessionId: session.id,
      status: session.status,
      totalOwed,
      totalPaid,
      remaining: totalOwed - totalPaid,
      guestPayments: session.guestSessions.map((g: any) => ({
        guestSessionId: g.id,
        guestName: g.guestName || `Guest ${g.guestNumber || '?'}`,
        guestNumber: g.guestNumber,
        itemTotal: g.orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0),
        totalPaid: 0,
        allocation: g.splitAllocations[0] || null,
      })),
      payments: sessionPayments.map((p: any) => ({
        id: p.id,
        method: p.method,
        amount: Number(p.amount),
        receivedAt: p.receivedAt,
      })),
    };
  }

  private async getTotalOwed(sessionId: string): Promise<number> {
    const allocations = await this.prisma.splitAllocation.findMany({
      where: { diningSessionId: sessionId },
    });
    return allocations.reduce((sum, a) => sum + Number(a.totalOwed), 0);
  }

  private async getTotalPaid(sessionId: string): Promise<number> {
    const allocations = await this.prisma.splitAllocation.findMany({
      where: { diningSessionId: sessionId },
    });
    return allocations.reduce((sum, a) => sum + Number(a.totalPaid), 0);
  }
}
