import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { RedisService } from './common/redis/redis.service';
import { QueueService } from './common/queue/queue.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const checks: Record<string, string> = {};

    // Database
    try {
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    // Redis
    checks.redis = this.redis.isReady() ? 'ok' : 'unavailable';

    const allOk = Object.values(checks).every(v => v === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'nexaros-backend',
      version: '0.1.0',
      checks,
    };
  }

  @Get('deep')
  @ApiOperation({ summary: 'Deep health with queue stats' })
  async deep() {
    const checks: Record<string, { status: string; details?: Record<string, number> }> = {};

    // Database
    try {
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      checks.database = { status: 'ok' };
    } catch {
      checks.database = { status: 'error' };
    }

    // Redis
    checks.redis = { status: this.redis.isReady() ? 'ok' : 'unavailable' };

    // Queues
    try {
      const queueStats = await this.queueService.getQueueStats();
      const totalFailed = Object.values(queueStats).reduce((sum, q) => sum + q.failed, 0);
      const totalActive = Object.values(queueStats).reduce((sum, q) => sum + q.active, 0);
      const totalWaiting = Object.values(queueStats).reduce((sum, q) => sum + q.waiting, 0);

      checks.queues = {
        status: totalFailed > 100 ? 'degraded' : 'ok',
        details: {
          active: totalActive,
          waiting: totalWaiting,
          failed: totalFailed,
        },
      };
    } catch {
      checks.queues = { status: 'unavailable' };
    }

    // Memory
    const mem = process.memoryUsage();
    const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
    checks.memory = {
      status: heapUsedMB > 512 ? 'degraded' : 'ok',
      details: {
        heapUsed: heapUsedMB,
        heapTotal: heapTotalMB,
        rss: Math.round(mem.rss / 1024 / 1024),
      },
    };

    const allOk = Object.values(checks).every(c => c.status === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'nexaros-backend',
      version: '0.1.0',
      uptime: Math.round(process.uptime()),
      checks,
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async ready() {
    const dbOk = await this.checkDatabase();
    const redisOk = this.redis.isReady();

    if (dbOk && redisOk) {
      return { status: 'ready' };
    }

    return { status: 'not_ready', database: dbOk, redis: redisOk };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'alive' };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      return true;
    } catch {
      return false;
    }
  }
}
