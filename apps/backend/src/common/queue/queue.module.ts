import { Module, Global, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QueueNames } from './queue.constants';
import { QueueService } from './queue.service';

function createRedisConnection(): any {
  return new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 200, 5000);
    },
  });
}

const queueProviders = Object.values(QueueNames).map((name) => ({
  provide: `QUEUE_${name}`,
  useFactory: () => {
    const connection = createRedisConnection();
    return new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
        removeOnFail: { age: 30 * 24 * 3600, count: 500 },
      },
    });
  },
}));

@Global()
@Module({
  providers: [...queueProviders, QueueService],
  exports: [...queueProviders, QueueService],
})
export class QueueModule {
  private readonly logger = new Logger(QueueModule.name);

  onModuleDestroy() {
    this.logger.log('QueueModule shutting down');
  }
}
