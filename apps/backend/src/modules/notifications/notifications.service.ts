import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async findAll(tenantId: string, userId?: string, branchId?: string, limit = 50) {
    const where: any = { tenantId, deletedAt: null };
    if (userId) where.userId = userId;
    if (branchId) where.branchId = branchId;

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(tenantId: string, userId: string) {
    return this.prisma.notification.count({
      where: { tenantId, userId, isRead: false, deletedAt: null },
    });
  }

  async markRead(tenantId: string, notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, tenantId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(tenantId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { tenantId, userId, isRead: false, deletedAt: null },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async send(tenantId: string, dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        userId: dto.recipientId || dto.actorId || null,
        branchId: dto.branchIds?.[0] || null,
        title: dto.title,
        message: dto.message,
        channel: dto.channel || 'IN_APP',
        entityType: dto.entityType,
        entityId: dto.entityId,
      },
    });

    // Broadcast via EventBus (triggers WS + background jobs)
    if (!dto.channel || dto.channel === 'IN_APP') {
      if (dto.branchIds?.length) {
        for (const branchId of dto.branchIds) {
          await this.eventBus.emitToBranch(branchId, 'notification', {
            id: notification.id,
            title: dto.title,
            message: dto.message,
            createdAt: notification.createdAt,
          });
        }
      } else {
        await this.eventBus.emitToTenant(tenantId, 'notification', {
          id: notification.id,
          title: dto.title,
          message: dto.message,
          createdAt: notification.createdAt,
        });
      }
    }

    // For email/SMS channels, enqueue background job
    if (dto.channel === 'EMAIL' && dto.recipientEmail) {
      await this.eventBus.notificationSent(tenantId, dto.branchIds?.[0], {
        channel: 'email',
        to: dto.recipientEmail,
        subject: dto.title,
        template: 'generic',
        payload: { title: dto.title, message: dto.message },
      });
    }

    if (dto.channel === 'SMS' && dto.recipientPhone) {
      await this.eventBus.notificationSent(tenantId, dto.branchIds?.[0], {
        channel: 'sms',
        to: dto.recipientPhone,
        subject: dto.title,
        template: 'generic',
        payload: { title: dto.title, message: dto.message },
      });
    }

    return {
      id: notification.id,
      title: dto.title,
      message: dto.message,
      channel: dto.channel || 'IN_APP',
      sentAt: notification.createdAt,
    };
  }

  async delete(tenantId: string, notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, tenantId, userId },
      data: { deletedAt: new Date() },
    });
  }
}
