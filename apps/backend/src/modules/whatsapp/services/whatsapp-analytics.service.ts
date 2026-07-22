import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WhatsAppAnalytics, WhatsAppMessage } from '@prisma/client';

/**
 * WhatsApp Analytics Service
 *
 * Tracks and aggregates WhatsApp metrics:
 * - Message delivery rates
 * - Read rates
 * - Campaign performance
 * - Revenue attribution
 * - Response times
 */
@Injectable()
export class WhatsAppAnalyticsService {
  private readonly logger = new Logger(WhatsAppAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get analytics for a date range
   */
  async getAnalytics(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<WhatsAppAnalytics[]> {
    return this.prisma.whatsAppAnalytics.findMany({
      where: {
        accountId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get summary metrics for a period
   */
  async getSummaryMetrics(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SummaryMetrics> {
    const analytics = await this.getAnalytics(accountId, startDate, endDate);

    return {
      totalSent: analytics.reduce((sum, a) => sum + a.messagesSent, 0),
      totalDelivered: analytics.reduce((sum, a) => sum + a.messagesDelivered, 0),
      totalRead: analytics.reduce((sum, a) => sum + a.messagesRead, 0),
      totalFailed: analytics.reduce((sum, a) => sum + a.messagesFailed, 0),
      totalConversations: analytics.reduce((sum, a) => sum + a.conversationsStarted, 0),
      totalOrders: analytics.reduce((sum, a) => sum + a.ordersPlaced, 0),
      totalRevenue: analytics.reduce((sum, a) => sum + Number(a.revenue), 0),
      deliveryRate: this.calculateRate(
        analytics.reduce((sum, a) => sum + a.messagesDelivered, 0),
        analytics.reduce((sum, a) => sum + a.messagesSent, 0),
      ),
      readRate: this.calculateRate(
        analytics.reduce((sum, a) => sum + a.messagesRead, 0),
        analytics.reduce((sum, a) => sum + a.messagesDelivered, 0),
      ),
      avgResponseTimeMs: this.calculateAvgResponseTime(analytics),
    };
  }

  /**
   * Get daily trend data
   */
  async getDailyTrend(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyTrend[]> {
    const analytics = await this.getAnalytics(accountId, startDate, endDate);

    return analytics.map((a) => ({
      date: a.date,
      sent: a.messagesSent,
      delivered: a.messagesDelivered,
      read: a.messagesRead,
      failed: a.messagesFailed,
      conversations: a.conversationsStarted,
      orders: a.ordersPlaced,
      revenue: Number(a.revenue),
    }));
  }

  /**
   * Get top performing templates
   */
  async getTopTemplates(
    accountId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<TopTemplate[]> {
    const usages = await this.prisma.whatsAppTemplateUsage.findMany({
      where: {
        template: {
          accountId,
        },
        usageDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        template: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });

    // Aggregate by template
    const templateMap = new Map<string, TopTemplate>();

    for (const usage of usages) {
      const key = usage.templateId;
      if (!templateMap.has(key)) {
        templateMap.set(key, {
          templateId: usage.templateId,
          templateName: usage.template.name,
          category: usage.template.category,
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0,
        });
      }

      const template = templateMap.get(key)!;
      template.sent += usage.sentCount;
      template.delivered += usage.deliveredCount;
      template.read += usage.readCount;
      template.failed += usage.failedCount;
    }

    return Array.from(templateMap.values())
      .sort((a, b) => b.sent - a.sent)
      .slice(0, limit);
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignPerformance[]> {
    const campaigns = await this.prisma.whatsAppBulkCampaign.findMany({
      where: {
        accountId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((c: any) => ({
      campaignId: c.id,
      name: c.name,
      status: c.status,
      sent: c.sentCount,
      delivered: c.deliveredCount,
      read: c.readCount,
      failed: c.failedCount,
      deliveryRate: this.calculateRate(c.deliveredCount, c.sentCount),
      readRate: this.calculateRate(c.readCount, c.deliveredCount),
      revenue: Number(c.revenue || 0),
      startedAt: c.startedAt,
      completedAt: c.completedAt,
    }));
  }

  /**
   * Get message type distribution
   */
  async getMessageTypeDistribution(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TypeDistribution[]> {
    const messages = await this.prisma.whatsAppMessage.groupBy({
      by: ['type', 'direction'],
      where: {
        accountId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    return messages.map((m: any) => ({
      type: m.type,
      direction: m.direction,
      count: m._count.id,
    }));
  }

  /**
   * Get conversation metrics
   */
  async getConversationMetrics(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ConversationMetrics> {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return {
        totalConversations: 0,
        avgConversationLength: 0,
        conversionRate: 0,
        topIntents: [],
      };
    }

    // Get sessions in date range
    const sessions = await this.prisma.conversationSession.findMany({
      where: {
        tenantId: account.tenantId,
        channel: 'WHATSAPP',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        state: true,
        orderId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalConversations = sessions.length;
    const ordersPlaced = sessions.filter((s) => s.orderId).length;

    // Calculate average conversation length (in messages)
    const avgConversationLength = totalConversations > 0
      ? sessions.reduce((sum: number, s: any) => {
          const diff = new Date(s.updatedAt).getTime() - new Date(s.createdAt).getTime();
          return sum + diff;
        }, 0)
      : 0;

    // Get intent distribution
    const intentDistribution = await this.prisma.whatsAppMessage.groupBy({
      by: ['type'],
      where: {
        accountId,
        direction: 'INBOUND',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    return {
      totalConversations,
      avgConversationLength: Math.round(avgConversationLength / 1000 / 60), // Convert to minutes
      conversionRate: this.calculateRate(ordersPlaced, totalConversations),
      topIntents: intentDistribution.map((i: any) => ({
        intent: i.type,
        count: i._count.id,
      })),
    };
  }

  /**
   * Record daily analytics (called by cron job)
   */
  async recordDailyAnalytics(accountId: string, date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get message counts
    const [sent, delivered, read, failed] = await Promise.all([
      this.prisma.whatsAppMessage.count({
        where: {
          accountId,
          direction: 'OUTBOUND',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.whatsAppMessage.count({
        where: {
          accountId,
          direction: 'OUTBOUND',
          status: 'DELIVERED',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.whatsAppMessage.count({
        where: {
          accountId,
          direction: 'OUTBOUND',
          status: 'READ',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.whatsAppMessage.count({
        where: {
          accountId,
          direction: 'OUTBOUND',
          status: 'FAILED',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
    ]);

    // Get conversations and orders
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    let conversations = 0;
    let orders = 0;
    let revenue = 0;

    if (account) {
      conversations = await this.prisma.conversationSession.count({
        where: {
          tenantId: account.tenantId,
          channel: 'WHATSAPP',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      orders = await this.prisma.order.count({
        where: {
          tenantId: account.tenantId,
          channel: 'WHATSAPP',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      const orderAggregate = await this.prisma.order.aggregate({
        where: {
          tenantId: account.tenantId,
          channel: 'WHATSAPP',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: {
          totalAmount: true,
        },
      });

      revenue = Number(orderAggregate._sum.totalAmount || 0);
    }

    // Upsert analytics record
    await this.prisma.whatsAppAnalytics.upsert({
      where: {
        accountId_date: {
          accountId,
          date: startOfDay,
        },
      },
      create: {
        accountId,
        tenantId: account?.tenantId || '',
        date: startOfDay,
        messagesSent: sent,
        messagesDelivered: delivered,
        messagesRead: read,
        messagesFailed: failed,
        conversationsStarted: conversations,
        ordersPlaced: orders,
        revenue,
      },
      update: {
        messagesSent: sent,
        messagesDelivered: delivered,
        messagesRead: read,
        messagesFailed: failed,
        conversationsStarted: conversations,
        ordersPlaced: orders,
        revenue,
      },
    });
  }

  private calculateRate(numerator: number, denominator: number): number {
    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100 * 100) / 100;
  }

  private calculateAvgResponseTime(analytics: WhatsAppAnalytics[]): number | null {
    const withResponseTime = analytics.filter((a) => a.avgResponseTimeMs);
    if (withResponseTime.length === 0) return null;

    return Math.round(
      withResponseTime.reduce((sum, a) => sum + (a.avgResponseTimeMs || 0), 0) /
        withResponseTime.length,
    );
  }
}

export interface SummaryMetrics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  totalConversations: number;
  totalOrders: number;
  totalRevenue: number;
  deliveryRate: number;
  readRate: number;
  avgResponseTimeMs: number | null;
}

export interface DailyTrend {
  date: Date;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  conversations: number;
  orders: number;
  revenue: number;
}

export interface TopTemplate {
  templateId: string;
  templateName: string;
  category: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export interface CampaignPerformance {
  campaignId: string;
  name: string;
  status: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
  revenue: number;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface TypeDistribution {
  type: string;
  direction: string;
  count: number;
}

export interface ConversationMetrics {
  totalConversations: number;
  avgConversationLength: number;
  conversionRate: number;
  topIntents: Array<{ intent: string; count: number }>;
}
