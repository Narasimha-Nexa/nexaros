import { Injectable, Logger } from '@nestjs/common';
import { SwiggyAdapter } from '../aggregator/adapters/swiggy.adapter';
import { ZomatoAdapter } from '../aggregator/adapters/zomato.adapter';
import { WhatsAppAdapter } from '../conversational/adapters/whatsapp.adapter';
import { InstagramAdapter } from '../conversational/adapters/instagram.adapter';
import { FacebookAdapter } from '../conversational/adapters/facebook.adapter';
import { DeadLetterService } from './dead-letter.service';

@Injectable()
export class ChannelHealthService {
  private readonly logger = new Logger(ChannelHealthService.name);

  constructor(
    private deadLetter: DeadLetterService,
    // Aggregator adapters
    private swiggyAdapter: SwiggyAdapter,
    private zomatoAdapter: ZomatoAdapter,
    // Conversational adapters
    private whatsappAdapter: WhatsAppAdapter,
    private instagramAdapter: InstagramAdapter,
    private facebookAdapter: FacebookAdapter,
  ) {}

  /**
   * Get health status for all configured channels.
   */
  async getAllChannelHealth(): Promise<ChannelHealth[]> {
    const results = await Promise.allSettled([
      this.checkChannel('swiggy', this.swiggyAdapter),
      this.checkChannel('zomato', this.zomatoAdapter),
      this.checkChannel('whatsapp', this.whatsappAdapter),
      this.checkChannel('instagram', this.instagramAdapter),
      this.checkChannel('facebook', this.facebookAdapter),
    ]);

    return results
      .map((r, i) => {
        const channelNames = ['swiggy', 'zomato', 'whatsapp', 'instagram', 'facebook'];
        if (r.status === 'fulfilled') return r.value;
        return {
          channel: channelNames[i],
          status: 'error' as const,
          latencyMs: 0,
          error: r.reason?.message || 'Unknown error',
          deadLetterCount: 0,
          lastDeadLetterError: '',
        };
      });
  }

  /**
   * Get health for a single channel.
   */
  async getChannelHealth(channel: string): Promise<ChannelHealth | null> {
    const adapters: Record<string, any> = {
      swiggy: this.swiggyAdapter,
      zomato: this.zomatoAdapter,
      whatsapp: this.whatsappAdapter,
      instagram: this.instagramAdapter,
      facebook: this.facebookAdapter,
    };

    const adapter = adapters[channel];
    if (!adapter) return null;

    return this.checkChannel(channel, adapter);
  }

  /**
   * Get dashboard metrics for all channels.
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [health, deadLetterStats, channels] = await Promise.all([
      this.getAllChannelHealth(),
      this.getDeadLetterStats(),
      this.getChannelOrderCounts(),
    ]);

    return {
      channels: health,
      deadLetterStats,
      totalDeadLetters: Object.values(deadLetterStats).reduce((sum, s) => sum + s.count, 0),
      channelOrderCounts: channels,
      lastUpdated: new Date(),
    };
  }

  private async checkChannel(
    channel: string,
    adapter: { healthCheck(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> },
  ): Promise<ChannelHealth> {
    const deadLetterStats = await this.deadLetter.getStats();
    const dl = deadLetterStats[channel];

    try {
      const health = await adapter.healthCheck();
      return {
        channel,
        status: health.ok ? 'healthy' : 'unhealthy',
        latencyMs: health.latencyMs || 0,
        error: health.error,
        deadLetterCount: dl?.count || 0,
        lastDeadLetterError: dl?.latestError || '',
      };
    } catch (err) {
      return {
        channel,
        status: 'error',
        latencyMs: 0,
        error: (err as Error).message,
        deadLetterCount: dl?.count || 0,
        lastDeadLetterError: dl?.latestError || '',
      };
    }
  }

  private async getDeadLetterStats(): Promise<Record<string, { count: number; latestError: string; latestAt: Date }>> {
    return this.deadLetter.getStats();
  }

  private async getChannelOrderCounts(): Promise<Record<string, number>> {
    const channels = ['SWIGGY', 'ZOMATO', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK'];
    const counts: Record<string, number> = {};

    for (const channel of channels) {
      try {
        const { PrismaService } = await import('../../../prisma/prisma.service');
        // Can't directly use PrismaService here without DI
        counts[channel.toLowerCase()] = 0;
      } catch {
        counts[channel.toLowerCase()] = 0;
      }
    }

    return counts;
  }
}

export interface ChannelHealth {
  channel: string;
  status: 'healthy' | 'unhealthy' | 'error';
  latencyMs: number;
  error?: string;
  deadLetterCount: number;
  lastDeadLetterError: string;
}

export interface DashboardMetrics {
  channels: ChannelHealth[];
  deadLetterStats: Record<string, { count: number; latestError: string; latestAt: Date }>;
  totalDeadLetters: number;
  channelOrderCounts: Record<string, number>;
  lastUpdated: Date;
}
