# Offline-First Architecture

> Detailed source: [apps/flutter-app/lib/core/](../../apps/flutter-app/lib/core/)

## Overview

NexaROS Flutter app is built with offline-first approach. Operations continue without internet, sync when connected.

## Core Principles

1. **Local storage is source of truth**
2. **Background sync when online**
3. **Conflict resolution via timestamps**
4. **Graceful degradation**
5. **Queue-based operations**

## Offline Capabilities

### Fully Offline

| Feature | Storage | Sync |
|---------|---------|------|
| POS (create orders) | SQLite | When online |
| Process payments | SQLite | When online |
| Kitchen display | SQLite | When online |
| View menu | SQLite | Daily |
| Table management | SQLite | When online |
| Print receipts | Local | N/A |

### Requires Internet

| Feature | Reason |
|---------|--------|
| New user registration | Server validation |
| Payment gateway | Real-time processing |
| Push notifications | Firebase |
| Cloud backup | Server storage |
| AI analytics | Server processing |

## Local Storage

### SQLite Database

```dart
class LocalDatabase {
  // Menu items
  Future<List<MenuItem>> getMenuItems(String branchId);
  Future<void> saveMenuItems(List<MenuItem> items);
  
  // Orders
  Future<List<Order>> getOrders(String branchId);
  Future<void> saveOrder(Order order);
  Future<void> updateOrderStatus(String orderId, String status);
  
  // Tables
  Future<List<Table>> getTables(String branchId);
  Future<void> updateTableStatus(String tableId, String status);
  
  // Payments
  Future<List<Payment>> getPayments(String branchId);
  Future<void> savePayment(Payment payment);
}
```

### Hive (Key-Value)

```dart
class LocalSettings {
  // User preferences
  Future<void> saveTheme(String theme);
  Future<void> saveLanguage(String language);
  Future<void> saveBranchId(String branchId);
  
  // Cache
  Future<void> saveLastSyncTime(DateTime time);
  Future<void> saveUserSession(UserSession session);
}
```

## Sync System

### Sync Queue

```dart
class SyncQueue {
  // Operations queued for sync
  List<SyncOperation> pendingOperations;
  
  // Add operation
  Future<void> addOperation(SyncOperation op);
  
  // Process queue
  Future<void> processQueue();
  
  // Retry failed
  Future<void> retryFailed();
}
```

### Sync Operation

```dart
class SyncOperation {
  String id;
  String type; // CREATE, UPDATE, DELETE
  String entity; // order, payment, table
  String entityId;
  Map<String, dynamic> data;
  DateTime createdAt;
  int retryCount;
}
```

### Sync Flow

```
1. User performs operation (e.g., create order)
2. Operation saved to SQLite
3. Operation added to sync queue
4. If online → Immediate sync
5. If offline → Queue operation
6. When online → Process queue
7. Resolve conflicts (timestamp wins)
8. Update local database
9. Remove from queue
```

## Conflict Resolution

### Timestamp-Based

```
Server time wins:
- Local time: 10:30:00
- Server time: 10:30:05
- Server data wins
```

### Manual Resolution

For critical conflicts:

```dart
class ConflictResolver {
  Future<void> resolveConflict(
    Conflict conflict,
    Resolution resolution,
  );
}

enum Resolution {
  KEEP_LOCAL,
  KEEP_SERVER,
  MERGE,
  ASK_USER,
}
```

## Connectivity Monitoring

```dart
class ConnectivityService {
  // Monitor connection
  Stream<ConnectivityStatus> get status;
  
  // Check if online
  Future<bool> get isOnline;
  
  // Handle connection change
  void onConnectionChange(Function callback);
}
```

## Offline UI

### Status Indicator

```dart
class OfflineIndicator extends StatelessWidget {
  // Shows connection status
  // Green: Online
  // Yellow: Syncing
  // Red: Offline
}
```

### Sync Progress

```dart
class SyncProgress extends StatelessWidget {
  // Shows pending operations
  // Progress bar
  // Retry button
}
```

## Background Sync

### SyncService

```dart
class SyncService {
  // Start background sync
  void startBackgroundSync();
  
  // Stop sync
  void stopBackgroundSync();
  
  // Sync interval
  Duration syncInterval = Duration(minutes: 5);
}
```

### Sync Strategy

```
1. App starts → Check connectivity
2. If online → Full sync
3. If offline → Queue operations
4. Background → Periodic sync (5 min)
5. On reconnect → Immediate sync
6. Battery optimization → Batch sync
```

## Data Integrity

### Checksums

```dart
class DataIntegrity {
  // Verify data integrity
  Future<bool> verifyChecksum(String entityId, String checksum);
  
  // Generate checksum
  String generateChecksum(Map<String, dynamic> data);
}
```

### Backup

```dart
class BackupService {
  // Local backup
  Future<void> createLocalBackup();
  
  // Cloud backup (when online)
  Future<void> createCloudBackup();
  
  // Restore
  Future<void> restoreBackup(String backupId);
}
```

## Related Documents

- [System Architecture](05_SYSTEM_ARCHITECTURE.md)
- [Flutter App](32_FLUTTER_APP.md)
- [Modules](08_MODULES.md)
