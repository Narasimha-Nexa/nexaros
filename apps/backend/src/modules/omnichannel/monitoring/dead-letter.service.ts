import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeadLetterStatus } from '@prisma/client';

/**
 * Dead Letter Service (Enterprise Durable Storage)
 *
 * Persists failed webhook payloads to PostgreSQL for:
 * - Durability (survives restarts, unlike in-memory buffers)
 * - Queryable monitoring dashboard
 * - Retry capability
 * - Audit trail for aggregator disputes
 *
 * Immediately persists on failure. A periodic cleanup job
 * archives resolved entries older than 90 days.
 */
@Injectable()
export class DeadLetterService {
  private readonly logger = new Logger(DeadLetterService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Persist a failed webhook payload to the dead_letter_logs table.
   * This is synchronous and durable — the caller should `await` it.
   */
  async sendToDeadLetter(
    channel: string,
    error: string,
    rawPayload: unknown,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    try {
      const log = await this.prisma.deadLetterLog.create({
        data: {
          channel,
          error: error.substring(0, 2000), // Cap error length
          rawPayload: rawPayload as any,
          metadata: (metadata || {}) as any,
          status: 'UNRESOLVED',
        },
      });

      this.logger.error(`[DEAD LETTER] ${channel}: ${error} (id: ${log.id})`);
      return log.id;
    } catch (prismaErr) {
      // Last-resort logging — if we can't write to DB, log to stdout
      this.logger.error(
        `[DEAD LETTER CRITICAL] Failed to persist dead letter: ${(prismaErr as Error).message}\n` +
        `Channel: ${channel}, Error: ${error}`,
      );
      return `fallback-${Date.now()}`;
    }
  }

  /**
   * Retrieve dead-letter entries with pagination and filtering.
   */
  async getDeadLetters(options?: {
    channel?: string;
    status?: DeadLetterStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: any[]; total: number }> {
    const where: any = {};
    if (options?.channel) where.channel = options.channel;
    if (options?.status) where.status = options.status;

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [entries, total] = await Promise.all([
      this.prisma.deadLetterLog.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deadLetterLog.count({ where }),
    ]);

    return { entries, total };
  }

  /**
   * Mark a dead-letter entry as resolved.
   */
  async resolveDeadLetter(id: string, resolution?: string, resolvedBy?: string): Promise<void> {
    await this.prisma.deadLetterLog.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: resolvedBy || 'system',
        resolution: resolution || 'Manually resolved',
      },
    });
  }

  /**
   * Mark a dead-letter entry for retry.
   */
  async markForRetry(id: string): Promise<void> {
    await this.prisma.deadLetterLog.update({
      where: { id },
      data: {
        status: 'RETRYING',
        retryCount: { increment: 1 },
        lastRetryAt: new Date(),
      },
    });
  }

  /**
   * Get aggregated dead-letter stats per channel.
   */
  async getStats(): Promise<Record<string, { count: number; latestError: string; latestAt: Date }>> {
    const logs = await this.prisma.deadLetterLog.groupBy({
      by: ['channel'],
      _count: { id: true },
      _max: { createdAt: true },
    });

    const stats: Record<string, { count: number; latestError: string; latestAt: Date }> = {};

    for (const group of logs) {
      // Get the latest error for each channel
      const latest = await this.prisma.deadLetterLog.findFirst({
        where: { channel: group.channel },
        orderBy: { createdAt: 'desc' },
        select: { error: true, createdAt: true },
      });

      stats[group.channel] = {
        count: group._count.id,
        latestError: latest?.error || '',
        latestAt: latest?.createdAt || new Date(),
      };
    }

    return stats;
  }

  /**
   * Get total dead-letter count (for dashboard metrics).
   */
  async getTotalCount(): Promise<number> {
    return this.prisma.deadLetterLog.count();
  }

  /**
   * Cleanup old resolved entries (call from scheduled job).
   */
  async cleanupOldEntries(retentionDays = 90): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await this.prisma.deadLetterLog.deleteMany({
      where: {
        status: { in: ['RESOLVED', 'IGNORED'] },
        createdAt: { lt: cutoff },
      },
    });
    return result.count;
  }
}
