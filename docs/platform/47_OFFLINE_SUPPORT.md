# Offline Support

## Overview

NexaROS Flutter app is built with offline-first approach.

## Offline Capabilities

### Fully Offline

| Feature | Storage | Sync |
|---------|---------|------|
| POS | SQLite | When online |
| Payments | SQLite | When online |
| Kitchen | SQLite | When online |
| Menu | SQLite | Daily |
| Tables | SQLite | When online |
| Receipts | Local | N/A |

### Requires Internet

| Feature | Reason |
|---------|--------|
| Registration | Server validation |
| Payment gateway | Real-time |
| Push notifications | Firebase |
| Cloud backup | Server |
| AI analytics | Server |

## Local Storage

### SQLite

```dart
class LocalDatabase {
  Future<List<MenuItem>> getMenuItems(String branchId);
  Future<void> saveMenuItems(List<MenuItem> items);
  Future<List<Order>> getOrders(String branchId);
  Future<void> saveOrder(Order order);
}
```

### Hive

```dart
class LocalSettings {
  Future<void> saveTheme(String theme);
  Future<void> saveLanguage(String language);
  Future<void> saveBranchId(String branchId);
}
```

## Sync System

### Sync Queue

```dart
class SyncQueue {
  List<SyncOperation> pendingOperations;
  
  Future<void> addOperation(SyncOperation op);
  Future<void> processQueue();
  Future<void> retryFailed();
}
```

### Sync Flow

```
1. User performs operation
2. Saved to SQLite
3. Added to sync queue
4. If online → Immediate sync
5. If offline → Queue
6. When online → Process queue
7. Resolve conflicts
8. Update local DB
9. Remove from queue
```

## Conflict Resolution

```dart
enum Resolution {
  KEEP_LOCAL,
  KEEP_SERVER,
  MERGE,
  ASK_USER,
}
```

## Connectivity

```dart
class ConnectivityService {
  Stream<ConnectivityStatus> get status;
  Future<bool> get isOnline;
  void onConnectionChange(Function callback);
}
```

## Related Documents

- [System Architecture](05_SYSTEM_ARCHITECTURE.md)
- [Flutter App](32_FLUTTER_APP.md)
