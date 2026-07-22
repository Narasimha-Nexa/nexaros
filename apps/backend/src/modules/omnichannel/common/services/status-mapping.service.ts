import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

/**
 * Status Mapping Service (Spec §5)
 *
 * Replaces hardcoded if/else status mapping chains in adapters
 * with a DB-backed lookup table.
 *
 * When an aggregator changes a status string (e.g., 'acknowledged' → 'received'),
 * the change is a data update, not a code deploy.
 *
 * Mappings are cached in-app with a TTL for performance.
 * In production, could also use Redis for cross-instance cache invalidation.
 */
@Injectable()
export class StatusMappingService {
  private readonly logger = new Logger(StatusMappingService.name);
  private cache: Map<string, string> = new Map();
  private cacheTimestamp = 0;
  private readonly CACHE_TTL_MS = 300_000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  /**
   * Map an internal NEXA ROS status to the external channel's status string.
   * Used for outbound status push-back (e.g., "accepted" → Swiggy "confirmed").
   */
  async toExternal(
    channel: string,
    internalStatus: string,
  ): Promise<string | null> {
    const cacheKey = `out:${channel}:${internalStatus}`;
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isCacheStale()) return cached;

    await this.refreshCacheIfStale();

    const fresh = this.cache.get(cacheKey);
    return fresh || null;
  }

  /**
   * Map an external channel's status string to the internal NEXA ROS status.
   * Used for inbound webhook normalization.
   */
  async toInternal(
    channel: string,
    externalStatus: string,
  ): Promise<string | null> {
    if (!externalStatus) return null;

    const cacheKey = `in:${channel}:${externalStatus}`;
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isCacheStale()) return cached;

    await this.refreshCacheIfStale();

    const fresh = this.cache.get(cacheKey);
    return fresh || null;
  }

  /**
   * Get all outbound mappings for a channel (used by adapters).
   */
  async getOutboundMappings(channel: string): Promise<Map<string, string>> {
    await this.refreshCacheIfStale();
    const result = new Map<string, string>();
    for (const [key, value] of this.cache) {
      if (key.startsWith(`out:${channel}:`)) {
        result.set(key.split(':')[2], value);
      }
    }
    return result;
  }

  /**
   * Seed default status mappings for a channel.
   * Called when a new channel restaurant mapping is created.
   */
  async seedDefaultMappings(channel: string, createdBy?: string): Promise<number> {
    const defaults = this.getDefaultMappings(channel);
    let count = 0;

    for (const mapping of defaults) {
      try {
        await this.prisma.channelStatusMapping.upsert({
          where: {
            channel_direction_internalStatus: {
              channel,
              direction: mapping.direction,
              internalStatus: mapping.internalStatus,
            },
          },
          update: { externalStatus: mapping.externalStatus, isActive: true },
          create: {
            channel,
            direction: mapping.direction,
            internalStatus: mapping.internalStatus,
            externalStatus: mapping.externalStatus,
            description: mapping.description,
            createdBy,
          },
        });
        count++;
      } catch (err) {
        this.logger.warn(`Failed to seed mapping ${mapping.internalStatus}→${mapping.externalStatus}: ${(err as Error).message}`);
      }
    }

    // Invalidate cache
    this.cache.clear();
    this.cacheTimestamp = 0;

    return count;
  }

  /**
   * Upsert a single status mapping.
   */
  async upsertMapping(data: {
    channel: string;
    direction: 'inbound' | 'outbound';
    internalStatus: string;
    externalStatus: string;
    description?: string;
    createdBy?: string;
  }): Promise<void> {
    await this.prisma.channelStatusMapping.upsert({
      where: {
        channel_direction_internalStatus: {
          channel: data.channel,
          direction: data.direction,
          internalStatus: data.internalStatus,
        },
      },
      update: { externalStatus: data.externalStatus, isActive: true },
      create: { ...data },
    });

    // Invalidate cache
    this.cache.clear();
    this.cacheTimestamp = 0;
  }

  async refreshCacheIfStale(): Promise<void> {
    if (!this.isCacheStale()) return;

    const mappings = await this.prisma.channelStatusMapping.findMany({
      where: { isActive: true },
    });

    this.cache.clear();
    for (const m of mappings) {
      // Outbound: internalStatus → externalStatus
      const outKey = `out:${m.channel}:${m.internalStatus}`;
      this.cache.set(outKey, m.externalStatus);

      // Inbound: externalStatus → internalStatus
      const inKey = `in:${m.channel}:${m.externalStatus}`;
      this.cache.set(inKey, m.internalStatus);
    }

    this.cacheTimestamp = Date.now();
    this.logger.debug(`Status mapping cache refreshed: ${mappings.length} mappings`);
  }

  private isCacheStale(): boolean {
    return Date.now() - this.cacheTimestamp > this.CACHE_TTL_MS;
  }

  /**
   * Default status mappings per channel.
   * These are seeded when a restaurant first connects a channel.
   * They can be overridden via the Owner Control Center UI.
   */
  private getDefaultMappings(channel: string): Array<{
    direction: string;
    internalStatus: string;
    externalStatus: string;
    description?: string;
  }> {
    const sharedOutbound: Record<string, string> = {
      received: 'acknowledged',
      accepted: 'confirmed',
      preparing: 'preparing',
      ready: 'ready',
      out_for_delivery: 'out_for_delivery',
      awaiting_pickup: 'ready_for_pickup',
      completed: 'delivered',
      cancelled: 'cancelled',
      rejected: 'rejected',
    };

    const sharedInbound: Record<string, string> = {
      acknowledged: 'received',
      confirmed: 'accepted',
      preparing: 'preparing',
      ready: 'ready',
      out_for_delivery: 'out_for_delivery',
      delivered: 'completed',
      cancelled: 'cancelled',
      rejected: 'rejected',
    };

    const mappings: Array<{
      direction: string;
      internalStatus: string;
      externalStatus: string;
      description?: string;
    }> = [];

    for (const [internal, external] of Object.entries(sharedOutbound)) {
      mappings.push({
        direction: 'outbound',
        internalStatus: internal,
        externalStatus: `${channel}_${external}`,
        description: `${channel} outbound status: ${internal} → ${channel}_${external}`,
      });
    }

    for (const [external, internal] of Object.entries(sharedInbound)) {
      mappings.push({
        direction: 'inbound',
        internalStatus: internal,
        externalStatus: `${channel}_${external}`,
        description: `${channel} inbound status: ${channel}_${external} → ${internal}`,
      });
    }

    return mappings;
  }
}
