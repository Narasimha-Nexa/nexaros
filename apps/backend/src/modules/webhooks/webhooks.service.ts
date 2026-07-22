import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: {
      name: string;
      url: string;
      events: string[];
      secret?: string;
      headers?: Record<string, string>;
    },
  ) {
    const secret = data.secret || crypto.randomBytes(24).toString('hex');

    return this.prisma.webhook.create({
      data: {
        tenantId,
        name: data.name,
        url: data.url,
        events: data.events,
        secret,
        headers: data.headers || undefined,
      },
    });
  }

  async list(tenantId: string) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return webhooks.map((wh) => ({
      id: wh.id,
      name: wh.name,
      url: wh.url,
      events: wh.events,
      isActive: wh.isActive,
      headers: wh.headers,
      createdBy: wh.createdBy,
      createdAt: wh.createdAt,
      updatedAt: wh.updatedAt,
      deliveryCount: wh._count.deliveries,
    }));
  }

  async getById(tenantId: string, id: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, tenantId },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  async update(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      url?: string;
      events?: string[];
      secret?: string | null;
      isActive?: boolean;
      headers?: Record<string, string> | null;
    },
  ) {
    const existing = await this.prisma.webhook.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.events !== undefined) updateData.events = data.events;
    if (data.secret !== undefined) updateData.secret = data.secret;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.headers !== undefined) updateData.headers = data.headers;

    return this.prisma.webhook.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(tenantId: string, id: string) {
    const existing = await this.prisma.webhook.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    return this.prisma.webhook.delete({ where: { id } });
  }

  async triggerEvent(tenantId: string, event: string, payload: Record<string, unknown>) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        tenantId,
        isActive: true,
        events: { has: event },
      },
    });

    const deliveries = await Promise.all(
      webhooks.map(async (webhook) => {
        const delivery = await this.prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event,
            payload: payload as any,
            status: 'PENDING',
          },
        });

        this.deliverWebhook(delivery.id, webhook, payload).catch((err) => {
          this.logger.error(`Failed to deliver webhook ${webhook.id}: ${err.message}`);
        });

        return delivery;
      }),
    );

    return {
      triggered: deliveries.length,
      deliveryIds: deliveries.map((d) => d.id),
    };
  }

  async deliverWebhook(
    deliveryId: string,
    webhook: { id: string; url: string; secret: string | null; headers: unknown },
    payload: Record<string, unknown>,
  ) {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-ID': webhook.id,
      'X-Webhook-Timestamp': new Date().toISOString(),
      ...(typeof webhook.headers === 'object' && webhook.headers !== null
        ? (webhook.headers as Record<string, string>)
        : {}),
    };

    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex');
      headers['x-webhook-signature'] = signature;
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(30000),
      });

      const responseText = await response.text();

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          statusCode: response.status,
          response: responseText.substring(0, 1000),
          status: response.ok ? 'SUCCESS' : 'FAILED',
          deliveredAt: response.ok ? new Date() : null,
          nextRetryAt: response.ok ? null : this.calculateNextRetry(1),
        },
      });

      return {
        success: response.ok,
        statusCode: response.status,
      };
    } catch (error) {
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'FAILED',
          response: (error as Error).message.substring(0, 1000),
          nextRetryAt: this.calculateNextRetry(1),
        },
      });

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async retryDelivery(deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status === 'SUCCESS') {
      return { message: 'Delivery already succeeded' };
    }

    if (delivery.attempt >= delivery.maxAttempts) {
      return { message: 'Max attempts reached' };
    }

    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'PENDING',
        attempt: delivery.attempt + 1,
        nextRetryAt: null,
      },
    });

    return this.deliverWebhook(deliveryId, delivery.webhook, delivery.payload as Record<string, unknown>);
  }

  async getDeliveries(webhookId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [deliveries, total] = await Promise.all([
      this.prisma.webhookDelivery.findMany({
        where: { webhookId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.webhookDelivery.count({
        where: { webhookId },
      }),
    ]);

    return {
      data: deliveries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async cleanupOldDeliveries(daysToKeep: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.webhookDelivery.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: ['SUCCESS', 'FAILED'] },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old webhook deliveries older than ${daysToKeep} days`);

    return { deleted: result.count };
  }

  private calculateNextRetry(attempt: number): Date {
    const delays = [60000, 300000, 900000];
    const delay = delays[Math.min(attempt, delays.length - 1)];
    return new Date(Date.now() + delay);
  }
}
