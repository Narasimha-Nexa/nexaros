import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private gateway: GatewayService,
  ) {}

  async createPayment(orderId: string, data: {
    method: string;
    amount: number;
    reference?: string;
  }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const existingPayments = await this.prisma.payment.findMany({
      where: { orderId, status: 'COMPLETED' },
    });
    const alreadyPaid = existingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(order.totalAmount) - alreadyPaid;

    if (data.amount > remaining + 0.01) {
      throw new BadRequestException(`Amount exceeds remaining balance of ₹${remaining.toFixed(2)}`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        branchId: order.branchId,
        method: data.method as any,
        amount: data.amount,
        reference: data.reference || `MOCK-${Date.now()}`,
        status: 'COMPLETED',
      },
    });

    const newTotalPaid = alreadyPaid + data.amount;
    if (newTotalPaid >= Number(order.totalAmount) - 0.01) {
      // Only auto-complete if order is in a completable state
      const completableStatuses = ['READY', 'ORDER_READY', 'SERVED', 'BILLING'];
      if (completableStatuses.includes(order.status)) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'COMPLETED' },
        });

        await this.prisma.orderStatusHistory.create({
          data: { orderId, status: 'COMPLETED', notes: 'Auto-completed: fully paid' },
        });

        if (order.tableId) {
          await this.prisma.restaurantTable.update({
            where: { id: order.tableId },
            data: { status: 'FREE' },
          });
        }
      }
    }

    this.gateway.emitToBranch(order.branchId, 'payment:received', {
      orderId,
      orderNumber: order.orderNumber,
      amount: data.amount,
      method: data.method,
      totalPaid: newTotalPaid,
      remaining: Number(order.totalAmount) - newTotalPaid,
    });

    return payment;
  }

  async getPayments(branchId: string, orderId?: string) {
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

  async getOrderPayments(orderId: string) {
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

  async refundPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'REFUNDED') throw new BadRequestException('Payment already refunded');

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' },
    });

    // Record refund in order status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        status: payment.order.status,
        notes: `Payment refunded: ₹${payment.amount} via ${payment.method}`,
      },
    });

    this.gateway.emitToBranch(payment.branchId, 'payment:refunded', {
      orderId: payment.orderId,
      amount: payment.amount,
      method: payment.method,
    });

    return updated;
  }
}
