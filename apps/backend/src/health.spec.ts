import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { RedisService } from './common/redis/redis.service';
import { QueueService } from './common/queue/queue.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockRedis = {
    isReady: jest.fn().mockReturnValue(true),
  };

  const mockQueueService = {
    getQueueStats: jest.fn().mockResolvedValue({
      notifications: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      invoices: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
        { provide: QueueService, useValue: mockQueueService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', async () => {
    mockRedis.isReady.mockReturnValue(true);
    const result = await controller.check();
    expect(result).toHaveProperty('service', 'nexaros-backend');
    expect(result).toHaveProperty('version', '0.1.0');
    expect(result).toHaveProperty('checks');
    expect(result.checks).toHaveProperty('redis');
  });

  it('should return liveness', () => {
    const result = controller.live();
    expect(result).toEqual({ status: 'alive' });
  });

  it('should return readiness', async () => {
    mockRedis.isReady.mockReturnValue(true);
    const result = await controller.ready();
    expect(result).toHaveProperty('status');
  });

  it('should return deep health', async () => {
    mockRedis.isReady.mockReturnValue(true);
    const result = await controller.deep();
    expect(result).toHaveProperty('checks');
    expect(result).toHaveProperty('uptime');
    expect(result.checks).toHaveProperty('memory');
    expect(result.checks).toHaveProperty('queues');
  });
});
