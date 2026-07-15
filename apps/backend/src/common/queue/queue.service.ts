import { Injectable, Logger, Inject } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import { QueueNames } from './queue.constants';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @Inject(`QUEUE_${QueueNames.NOTIFICATIONS}`) private notifQueue: Queue,
    @Inject(`QUEUE_${QueueNames.INVOICES}`) private invoiceQueue: Queue,
    @Inject(`QUEUE_${QueueNames.REPORTS}`) private reportQueue: Queue,
    @Inject(`QUEUE_${QueueNames.ORDERS}`) private orderQueue: Queue,
    @Inject(`QUEUE_${QueueNames.SUBSCRIPTIONS}`) private subQueue: Queue,
  ) {}

  private getQueue(name: QueueNames): Queue {
    const map: Record<QueueNames, Queue> = {
      [QueueNames.NOTIFICATIONS]: this.notifQueue,
      [QueueNames.INVOICES]: this.invoiceQueue,
      [QueueNames.REPORTS]: this.reportQueue,
      [QueueNames.ORDERS]: this.orderQueue,
      [QueueNames.SUBSCRIPTIONS]: this.subQueue,
    };
    return map[name];
  }

  // ── Notifications ──

  async sendNotification(data: {
    tenantId: string;
    branchId?: string;
    type: 'email' | 'sms' | 'push' | 'whatsapp';
    to: string;
    subject?: string;
    template: string;
    payload: Record<string, unknown>;
  }): Promise<Job | null> {
    return this.addJob(QueueNames.NOTIFICATIONS, 'send', data);
  }

  // ── Invoices ──

  async generateInvoice(data: {
    tenantId: string;
    orderId: string;
    branchId: string;
  }): Promise<Job | null> {
    return this.addJob(QueueNames.INVOICES, 'generate', data);
  }

  async generateSubscriptionInvoice(data: {
    tenantId: string;
    subscriptionId: string;
  }): Promise<Job | null> {
    return this.addJob(QueueNames.INVOICES, 'subscription', data);
  }

  // ── Reports ──

  async generateReport(data: {
    tenantId: string;
    branchId?: string;
    type: 'daily_sales' | 'inventory' | 'staff_performance' | 'tax' | 'custom';
    dateRange?: { from: string; to: string };
    format?: 'pdf' | 'csv' | 'json';
  }): Promise<Job | null> {
    return this.addJob(QueueNames.REPORTS, 'generate', data);
  }

  // ── Orders ──

  async processOrderEvent(data: {
    tenantId: string;
    branchId: string;
    orderId: string;
    event: 'created' | 'status_changed' | 'ready' | 'completed' | 'cancelled';
  }): Promise<Job | null> {
    return this.addJob(QueueNames.ORDERS, 'process', data);
  }

  // ── Subscriptions ──

  async processSubscriptionTransition(data: {
    tenantId: string;
    subscriptionId: string;
    transition: 'trial_expiry' | 'payment_pending' | 'grace_expiry' | 'suspension' | 'archive';
  }): Promise<Job | null> {
    return this.addJob(QueueNames.SUBSCRIPTIONS, 'transition', data);
  }

  // ── Generic ──

  private async addJob(queueName: QueueNames, name: string, data: Record<string, unknown>, opts?: Record<string, unknown>): Promise<Job | null> {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.add(name, data, opts);
      this.logger.debug(`Job ${job.id} added to ${queueName}:${name}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to add job to ${queueName}:${name}: ${(error as Error).message}`);
      return null;
    }
  }

  // ── Health / Stats ──

  async getQueueStats(): Promise<Record<string, { waiting: number; active: number; completed: number; failed: number; delayed: number }>> {
    const stats: Record<string, { waiting: number; active: number; completed: number; failed: number; delayed: number }> = {};

    for (const name of Object.values(QueueNames)) {
      try {
        const queue = this.getQueue(name as QueueNames);
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
        ]);
        stats[name] = { waiting, active, completed, failed, delayed };
      } catch {
        stats[name] = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
      }
    }

    return stats;
  }
}
