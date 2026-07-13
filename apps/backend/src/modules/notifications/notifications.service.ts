import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: GatewayService,
  ) {}

  async findAll(tenantId: string, branchId?: string, limit = 50) {
    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async send(tenantId: string, dto: CreateNotificationDto) {
    // Create audit log entry for the notification
    const log = await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: dto.recipientId || 'system',
        action: `NOTIFICATION_${dto.channel || 'IN_APP'}`,
        entity: dto.entityType || 'notification',
        entityId: dto.entityId,
        newData: { title: dto.title, message: dto.message, channel: dto.channel },
      },
    });

    // Broadcast via WebSocket for in-app notifications
    if (!dto.channel || dto.channel === 'IN_APP') {
      if (dto.branchIds?.length) {
        for (const branchId of dto.branchIds) {
          this.gateway.emitToBranch(branchId, 'notification', {
            id: log.id,
            title: dto.title,
            message: dto.message,
            createdAt: log.createdAt,
          });
        }
      } else {
        this.gateway.emitToTenant(tenantId, 'notification', {
          id: log.id,
          title: dto.title,
          message: dto.message,
          createdAt: log.createdAt,
        });
      }
    }

    // For email/SMS channels, would integrate with email/SMS provider here
    if (dto.channel === 'EMAIL' && dto.recipientEmail) {
      // TODO: Integrate with email provider (Resend, SendGrid, etc.)
      this.logger.log(`[EMAIL] To: ${dto.recipientEmail} - ${dto.title}: ${dto.message}`);
    }

    if (dto.channel === 'SMS' && dto.recipientPhone) {
      // TODO: Integrate with SMS provider (Twilio, etc.)
      this.logger.log(`[SMS] To: ${dto.recipientPhone} - ${dto.title}: ${dto.message}`);
    }

    return {
      id: log.id,
      title: dto.title,
      message: dto.message,
      channel: dto.channel || 'IN_APP',
      sentAt: log.createdAt,
    };
  }

  async getUnreadCount(tenantId: string, userId: string) {
    // Count recent audit log entries as unread notifications
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.auditLog.count({
      where: {
        tenantId,
        userId,
        createdAt: { gte: oneDayAgo },
      },
    });
  }
}
