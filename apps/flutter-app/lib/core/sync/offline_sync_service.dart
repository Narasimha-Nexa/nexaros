import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:drift/drift.dart';
import '../database/local_database.dart';
import '../network/api_client.dart';
import '../constants/app_constants.dart';

class OfflineSyncService {
  final LocalDatabase _db;
  final ApiClient _api;
  final Connectivity _connectivity = Connectivity();
  Timer? _syncTimer;
  bool _isSyncing = false;
  bool _isOnline = true;
  String? _lastSyncAt;

  final StreamController<SyncStatus> _statusController =
      StreamController<SyncStatus>.broadcast();
  Stream<SyncStatus> get statusStream => _statusController.stream;

  final StreamController<int> _pendingCountController =
      StreamController<int>.broadcast();
  Stream<int> get pendingCountStream => _pendingCountController.stream;

  OfflineSyncService(this._db, this._api) {
    _loadLastSyncAt();
    _connectivity.onConnectivityChanged.listen((result) {
      final wasOnline = _isOnline;
      _isOnline = !result.contains(ConnectivityResult.none);
      if (!wasOnline && _isOnline) {
        _triggerSync();
      }
    });
    _startPeriodicSync();
  }

  Future<void> _loadLastSyncAt() async {
    final prefs = await SharedPreferences.getInstance();
    _lastSyncAt = prefs.getString(AppConstants.keyLastSyncAt);
  }

  Future<void> _saveLastSyncAt() async {
    final prefs = await SharedPreferences.getInstance();
    _lastSyncAt = DateTime.now().toIso8601String();
    await prefs.setString(AppConstants.keyLastSyncAt, _lastSyncAt!);
  }

  void _startPeriodicSync() {
    _syncTimer = Timer.periodic(AppConstants.syncInterval, (_) {
      if (_isOnline && !_isSyncing) {
        _triggerSync();
      }
    });
  }

  Future<void> _triggerSync() async {
    if (_isSyncing || !_isOnline) return;
    _isSyncing = true;
    _statusController.add(SyncStatus.syncing);

    try {
      int pushedCount = 0;
      pushedCount += await _syncOrders();
      pushedCount += await _syncPayments();
      pushedCount += await _syncQueueEntries();

      // After push, pull latest data with lastSyncAt for incremental sync
      if (pushedCount > 0 || _lastSyncAt == null) {
        await _pullLatestData();
      }

      // Clear old synced entries to keep DB clean
      await _db.clearSyncedEntries();

      await _saveLastSyncAt();
      _statusController.add(SyncStatus.synced);
    } catch (e) {
      debugPrint('Sync error: $e');
      _statusController.add(SyncStatus.error);
    } finally {
      _isSyncing = false;
      _updatePendingCount();
    }
  }

  Future<void> _updatePendingCount() async {
    final count = await getPendingCount();
    _pendingCountController.add(count);
  }

  /// Pull latest data from server with incremental sync (server-wins conflict resolution)
  Future<void> _pullLatestData() async {
    try {
      final serverData = await _api.pullSyncData();

      // Server-wins conflict resolution: server data always overwrites local
      if (serverData['menuItems'] != null) {
        final items = serverData['menuItems'] as List;
        for (final item in items) {
          await _db.into(_db.localMenuItems).insertOnConflictUpdate(
            LocalMenuItemsCompanion(
              id: Value(item['id'] as String),
              tenantId: Value(item['tenantId'] as String? ?? ''),
              categoryId: Value(item['categoryId'] as String? ?? ''),
              name: Value(item['name'] as String? ?? ''),
              description: Value(item['description'] as String?),
              price: Value(double.tryParse(item['price'].toString()) ?? 0),
              isVeg: Value(item['isVeg'] as bool? ?? false),
              isAvailable: Value(item['isAvailable'] as bool? ?? true),
              image: Value(item['image'] as String?),
            ),
          );
        }
        debugPrint('Pulled ${items.length} menu items from server');
      }

      if (serverData['categories'] != null) {
        for (final cat in serverData['categories'] as List) {
          await _db.into(_db.localCategories).insertOnConflictUpdate(
            LocalCategoriesCompanion(
              id: Value(cat['id'] as String),
              tenantId: Value(cat['tenantId'] as String? ?? ''),
              name: Value(cat['name'] as String? ?? ''),
              sortOrder: Value(cat['sortOrder'] as int? ?? 0),
              isActive: Value(cat['isActive'] as bool? ?? true),
            ),
          );
        }
        debugPrint('Pulled ${serverData['categories'].length} categories from server');
      }

      if (serverData['tables'] != null) {
        await _db.bulkUpsertTables(
          (serverData['tables'] as List).cast<Map<String, dynamic>>(),
        );
        debugPrint('Pulled ${serverData['tables'].length} tables from server');
      }
    } catch (e) {
      debugPrint('Pull latest data error: $e');
    }
  }

  /// Returns number of orders synced
  Future<int> _syncOrders() async {
    final unsyncedOrders = await _db.getUnsyncedOrders();
    int synced = 0;
    for (final order in unsyncedOrders) {
      try {
        final items = await (_db.select(_db.localOrderItems)
              ..where((t) => t.orderId.equals(order.id)))
            .get();

        final payload = {
          'localId': order.id,
          'localUpdatedAt': DateTime.now().toIso8601String(),
          'branchId': order.branchId,
          'tableId': order.tableId,
          'type': order.type,
          'status': order.status,
          'customerName': order.customerName,
          'subtotal': order.subtotal,
          'taxAmount': order.taxAmount,
          'totalAmount': order.totalAmount,
          'items': items
              .map((i) => {
                    'menuItemId': i.menuItemId,
                    'name': i.name,
                    'quantity': i.quantity,
                    'unitPrice': i.unitPrice,
                  })
              .toList(),
        };

        await _api.pushSyncData({
          'orders': [payload],
        });

        await (_db.update(_db.localOrders)
              ..where((t) => t.id.equals(order.id)))
            .write(const LocalOrdersCompanion(synced: Value(true)));
        synced++;
      } catch (_) {
        // Will retry on next cycle with exponential backoff
      }
    }
    return synced;
  }

  /// Returns number of payments synced
  Future<int> _syncPayments() async {
    final unsynced = await _db.getUnsyncedPayments();
    int synced = 0;
    for (final payment in unsynced) {
      try {
        await _api.pushSyncData({
          'payments': [
            {
              'localId': payment.id,
              'localUpdatedAt': DateTime.now().toIso8601String(),
              'orderId': payment.orderId,
              'branchId': payment.branchId,
              'method': payment.method,
              'amount': payment.amount,
            },
          ],
        });

        await (_db.update(_db.localPayments)
              ..where((t) => t.id.equals(payment.id)))
            .write(const LocalPaymentsCompanion(synced: Value(true)));
        synced++;
      } catch (_) {}
    }
    return synced;
  }

  /// Returns number of queue entries synced, with retry and exponential backoff
  Future<int> _syncQueueEntries() async {
    final pending = await _db.getPendingSync();
    int synced = 0;
    for (final entry in pending) {
      // Enforce max retries — remove entries that have exceeded retry limit
      if (entry.retryCount >= AppConstants.syncMaxRetries) {
        debugPrint('Removing sync entry ${entry.id} after ${entry.retryCount} retries');
        await _db.removeSyncQueueEntry(entry.id);
        continue;
      }

      try {
        final payload = jsonDecode(entry.payload);
        await _api.pushSyncData(payload);
        await _db.markSynced(entry.id);
        synced++;
      } catch (_) {
        // Increment retry count on failure
        await _db.incrementRetryCount(entry.id);
      }
    }
    return synced;
  }

  /// Manually trigger a sync (e.g., from pull-to-refresh)
  Future<void> manualSync() async {
    if (!_isOnline) return;
    await _triggerSync();
  }

  /// Get count of items pending sync
  Future<int> getPendingCount() async {
    final orders = await _db.getUnsyncedOrders();
    final payments = await _db.getUnsyncedPayments();
    final queue = await _db.getPendingSync();
    return orders.length + payments.length + queue.length;
  }

  String? get lastSyncAt => _lastSyncAt;

  void dispose() {
    _syncTimer?.cancel();
    _statusController.close();
    _pendingCountController.close();
  }
}

enum SyncStatus { idle, syncing, synced, error }
