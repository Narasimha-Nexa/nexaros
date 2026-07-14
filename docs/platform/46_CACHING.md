# Caching

## Redis Caching

### Cache Service

```typescript
// cache.service.ts
@Injectable()
export class CacheService {
  constructor(private redis: Redis) {}
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set<T>(key: string, value: T, ttl?: number) {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }
  
  async del(key: string) {
    await this.redis.del(key);
  }
  
  async flush() {
    await this.redis.flushall();
  }
}
```

### Cache Strategies

| Strategy | Usage | TTL |
|----------|-------|-----|
| Menu items | Read-heavy | 1 hour |
| Reports | Expensive queries | 15 min |
| User sessions | Auth tokens | 15 min |
| Settings | Config data | 24 hours |

### Cache Keys

```
menu:{tenantId}:{branchId}     → Menu items
report:{tenantId}:{type}:{date} → Report data
user:{userId}                   → User profile
session:{token}                 → Session data
settings:{tenantId}             → Tenant settings
```

## Flutter Caching

### Hive Cache

```dart
// cache_service.dart
class CacheService {
  late Box _cache;
  
  Future<void> init() async {
    _cache = await Hive.openBox('cache');
  }
  
  Future<void> set(String key, dynamic value, {Duration? ttl}) async {
    await _cache.put(key, {
      'value': value,
      'expiry': ttl != null ? DateTime.now().add(ttl) : null,
    });
  }
  
  dynamic get(String key) {
    final data = _cache.get(key);
    if (data == null) return null;
    
    if (data['expiry'] != null && DateTime.now().isAfter(data['expiry'])) {
      _cache.delete(key);
      return null;
    }
    
    return data['value'];
  }
}
```

### Image Cache

```dart
// CachedNetworkImage
CachedNetworkImage(
  imageUrl: url,
  memCacheWidth: 200,
  memCacheHeight: 200,
);
```

## Cache Invalidation

```typescript
// Cache invalidation
async invalidateMenu(tenantId: string, branchId: string) {
  await this.cache.del(`menu:${tenantId}:${branchId}`);
}

async invalidateUser(userId: string) {
  await this.cache.del(`user:${userId}`);
}
```

## Related Documents

- [Performance](30_PERFORMANCE.md)
- [System Architecture](05_SYSTEM_ARCHITECTURE.md)
