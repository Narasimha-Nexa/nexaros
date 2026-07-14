# Monitoring

## Overview

NexaROS uses monitoring for system health and performance tracking.

## Health Checks

### Backend

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    };
  }
  
  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }
  
  private async checkRedis() {
    try {
      await this.redis.ping();
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }
}
```

### Docker

```yaml
# docker-compose.yml
services:
  nexaros-backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Metrics (Planned)

### Prometheus

```typescript
// prometheus.module.ts
@Module({
  imports: [
    PromModule.forRoot({
      defaultLabels: { app: 'nexaros-backend' },
    }),
  ],
})
export class PrometheusModule {}
```

### Key Metrics

- Request count
- Response time
- Error rate
- Database connections
- Redis connections
- Memory usage
- CPU usage

## Alerting (Planned)

### Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| High Error Rate | >5% errors | Notify team |
| Slow Response | >1s avg | Investigate |
| Database Down | Connection lost | Auto-restart |
| Memory High | >80% usage | Scale up |
| Disk Full | >90% usage | Cleanup |

## Logging

### Structured Logging

```typescript
// logger.service.ts
@Injectable()
export class LoggerService {
  log(message: string, context?: string) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
  }
  
  error(message: string, stack?: string, context?: string) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      stack,
      context,
      timestamp: new Date().toISOString(),
    }));
  }
}
```

## Related Documents

- [Performance](30_PERFORMANCE.md)
- [Deployment](37_DEPLOYMENT.md)
