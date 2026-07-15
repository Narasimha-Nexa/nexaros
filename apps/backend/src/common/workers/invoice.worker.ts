import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueNames } from '../queue/queue.constants';

@Processor(QueueNames.INVOICES, { concurrency: 3 })
export class InvoiceWorker extends WorkerHost {
  private readonly logger = new Logger(InvoiceWorker.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<{ generated: boolean; invoiceId?: string }> {
    if (job.name === 'generate') {
      return this.generateOrderInvoice(job);
    }
    if (job.name === 'subscription') {
      return this.generateSubscriptionInvoice(job);
    }
    return { generated: false };
  }

  private async generateOrderInvoice(job: Job) {
    const { paymentId } = job.data;

    this.logger.debug(`Generating invoice for payment ${paymentId}`);

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      this.logger.warn(`Payment ${paymentId} not found, skipping invoice`);
      return { generated: false };
    }

    const existing = await this.prisma.invoice.findUnique({ where: { paymentId } });
    if (existing) {
      this.logger.debug(`Invoice already exists for payment ${paymentId}`);
      return { generated: true, invoiceId: existing.id };
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const gstAmount = Number(payment.amount) * 0.18;

    const invoice = await this.prisma.invoice.create({
      data: {
        paymentId,
        number: invoiceNumber,
        gstAmount,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0,
      },
    });

    this.logger.log(`Invoice ${invoiceNumber} generated for payment ${paymentId}`);
    return { generated: true, invoiceId: invoice.id };
  }

  private async generateSubscriptionInvoice(job: Job) {
    const { subscriptionId } = job.data;

    this.logger.debug(`Generating subscription invoice for ${subscriptionId}`);

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      this.logger.warn(`Subscription ${subscriptionId} not found`);
      return { generated: false };
    }

    const invoiceNumber = `SUB-INV-${Date.now()}`;
    const invoice = await this.prisma.subscriptionInvoice.create({
      data: {
        subscriptionId,
        number: invoiceNumber,
        amount: Number(subscription.plan?.price || 0),
        taxAmount: 0,
        status: 'PENDING',
      },
    });

    this.logger.log(`Subscription invoice ${invoiceNumber} generated`);
    return { generated: true, invoiceId: invoice.id };
  }
}
