import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async generateInvoice(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            items: { include: { menuItem: { select: { name: true, isVeg: true } } } },
            table: { select: { number: true } },
            branch: {
              select: {
                name: true,
                address: true,
                tenant: {
                  select: { name: true, gstNumber: true, address: true, phone: true, email: true },
                },
              },
            },
          },
        },
        invoice: true,
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.invoice) return payment.invoice;

    const order = payment.order;
    const totalTax = Number(order.taxAmount);
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    const igst = 0;

    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { payment: { branchId: payment.branchId } },
      orderBy: { createdAt: 'desc' },
    });
    const num = lastInvoice ? parseInt(lastInvoice.number.replace('INV-', '')) + 1 : 1;
    const invoiceNumber = `INV-${String(num).padStart(6, '0')}`;

    const invoice = await this.prisma.invoice.create({
      data: {
        paymentId,
        number: invoiceNumber,
        gstAmount: totalTax,
        cgst,
        sgst,
        igst,
      },
    });

    return {
      ...invoice,
      payment: {
        id: payment.id,
        method: payment.method,
        amount: payment.amount,
        reference: payment.reference,
      },
      restaurant: {
        name: order.branch.tenant.name,
        gstNumber: order.branch.tenant.gstNumber,
        address: order.branch.tenant.address,
        phone: order.branch.tenant.phone,
      },
      branch: {
        name: order.branch.name,
        address: order.branch.address,
      },
      order: {
        orderNumber: order.orderNumber,
        type: order.type,
        subtotal: Number(order.subtotal),
        totalAmount: Number(order.totalAmount),
        table: order.table ? `Table ${order.table.number}` : null,
        items: order.items.map(i => ({
          name: i.menuItem?.name || i.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
      },
    };
  }

  async getInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payment: {
          include: {
            order: {
              include: {
                items: { include: { menuItem: { select: { name: true } } } },
                table: { select: { number: true } },
                branch: {
                  select: {
                    name: true,
                    tenant: { select: { name: true, gstNumber: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async getInvoices(branchId: string) {
    return this.prisma.invoice.findMany({
      where: { payment: { branchId } },
      include: {
        payment: {
          select: {
            id: true,
            method: true,
            amount: true,
            reference: true,
            order: { select: { orderNumber: true, type: true, createdAt: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
