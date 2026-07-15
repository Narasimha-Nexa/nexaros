import { Module, Global, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (): Redis => {
        const client = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          maxRetriesPerRequest: 3,
          retryStrategy(times: number) {
            const delay = Math.min(times * 200, 2000);
            return delay;
          },
          lazyConnect: true,
        });

        client.on('connect', () => console.log('  🔗 Redis connected'));
        client.on('error', (err) => console.error('  ❌ Redis error:', err.message));
        client.on('reconnecting', () => console.log('  🔄 Redis reconnecting...'));

        return client;
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    await this.redisService.connect();
  }

  async onModuleDestroy() {
    await this.redisService.disconnect();
  }
}
