# Logging

## Overview

NexaROS uses structured logging for debugging and auditing.

## Log Levels

| Level | Usage |
|-------|-------|
| error | System errors |
| warn | Warnings |
| info | General information |
| debug | Debug information |
| verbose | Detailed debug |

## Structured Logging

```typescript
// logger.service.ts
@Injectable()
export class LoggerService {
  log(level: string, message: string, context?: any) {
    const logEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      service: 'nexaros-backend',
    };
    
    console.log(JSON.stringify(logEntry));
  }
  
  info(message: string, context?: any) {
    this.log('info', message, context);
  }
  
  error(message: string, error?: Error, context?: any) {
    this.log('error', message, {
      ...context,
      stack: error?.stack,
      name: error?.name,
    });
  }
  
  warn(message: string, context?: any) {
    this.log('warn', message, context);
  }
  
  debug(message: string, context?: any) {
    this.log('debug', message, context);
  }
}
```

## Audit Logging

```typescript
// audit-log.service.ts
@Injectable()
export class AuditLogService {
  async log(data: AuditLogData) {
    await this.prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldData: data.oldData,
        newData: data.newData,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}
```

## Log Storage

### Development

- Console output
- Colored for readability

### Production

- JSON format
- File rotation
- Cloud logging (planned)

## Related Documents

- [Monitoring](39_MONITORING.md)
- [Security](31_SECURITY.md)
