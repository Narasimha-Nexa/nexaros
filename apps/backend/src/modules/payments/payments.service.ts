import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  private async validateOrderTenant(orderId: string, tenantId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, branch: { tenantId } },
    });
    if (!order) throw new NotFoundException('Order not found or does not belong to this tenant');
    return order;
  }

  private async validatePaymentTenant(paymentId: string, tenantId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, branch: { tenantId } },
      include: { order: true },
    });
    if (!payment) throw new NotFoundException('Payment not found or does not belong to this tenant');
    return payment;
  }

  async createPayment(orderId: string, data: {
    method: string;
    amount: number;
    reference?: string;
  }, tenantId: string) {
    const order = await this.validateOrderTenant(orderId, tenantId);

    const existingPayments = await this.prisma.payment.findMany({
      where: { orderId, status: 'COMPLETED' },
    });
    const alreadyPaid = existingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(order.totalAmount) - alreadyPaid;

    if (data.amount > remaining + 0.01) {
      throw new BadRequestException(`Amount exceeds remaining balance of ₹${remaining.toFixed(2)}`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const newTotalPaid = alreadyPaid + data.amount;
    const isFullyPaid = newTotalPaid >= Number(order.totalAmount) - 0.01;
    const completableStatuses = ['READY', 'ORDER_READY', 'SERVED', 'BILLING'];
    const shouldComplete = isFullyPaid && completableStatuses.includes(order.status);

    const payment = await this.prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          orderId,
          tenantId,
          branchId: order.branchId,
          method: data.method as any,
          amount: data.amount,
          reference: data.reference || `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          status: 'COMPLETED',
        },
      });

      if (shouldComplete) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'COMPLETED' },
        });

        await tx.orderStatusHistory.create({
          data: { orderId, status: 'COMPLETED', notes: 'Auto-completed: fully paid' },
        });
      }

      return createdPayment;
    });

    if (shouldComplete && order.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: 'FREE' },
      });
    }

    if (shouldComplete) {
      await this.eventBus.invoiceGenerated(order.tenantId || order.branchId, order.branchId, {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    }

    this.eventBus.emitToBranch(order.branchId, 'payment:received', {
      orderId,
      orderNumber: order.orderNumber,
      amount: data.amount,
      method: data.method,
      totalPaid: newTotalPaid,
      remaining: Number(order.totalAmount) - newTotalPaid,
    });

    return payment;
  }

  async getPayments(branchId: string, tenantId: string, orderId?: string) {
    return this.prisma.payment.findMany({
      where: {
        branchId,
        ...(orderId ? { orderId } : {}),
      },
      include: {
        order: { select: { id: true, orderNumber: true, totalAmount: true } },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async getOrderPayments(orderId: string, tenantId: string) {
    await this.validateOrderTenant(orderId, tenantId);
    const payments = await this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { receivedAt: 'asc' },
    });

    const totalPaid = payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    return {
      payments,
      totalPaid,
      totalAmount: order?.totalAmount || 0,
      remaining: Number(order?.totalAmount || 0) - totalPaid,
    };
  }

  async refundPayment(paymentId: string, tenantId: string) {
    const payment = await this.validatePaymentTenant(paymentId, tenantId);
    if (payment.status === 'REFUNDED') throw new BadRequestException('Payment already refunded');

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' },
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        status: payment.order.status,
        notes: `Payment refunded: ₹${payment.amount} via ${payment.method}`,
      },
    });

    this.eventBus.emitToBranch(payment.branchId, 'payment:refunded', {
      orderId: payment.orderId,
      amount: payment.amount,
      method: payment.method,
    });

    return updated;
  }
}
