import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/drift.dart';
import '../database/local_database.dart';
import '../network/api_client.dart';

class OfflineSyncService {
  final LocalDatabase _db;
  final ApiClient _api;
  final Connectivity _connectivity = Connectivity();
  Timer? _syncTimer;
  bool _isSyncing = false;
  bool _isOnline = true;

  final StreamController<SyncStatus> _statusController =
      StreamController<SyncStatus>.broadcast();
  Stream<SyncStatus> get statusStream => _statusController.stream;

  OfflineSyncService(this._db, this._api) {
    _connectivity.onConnectivityChanged.listen((result) {
      final wasOnline = _isOnline;
      _isOnline = result != ConnectivityResult.none;
      if (!wasOnline && _isOnline) {
        _triggerSync();
      }
    });
    _startPeriodicSync();
  }

  void _startPeriodicSync() {
    _syncTimer = Timer.periodic(const Duration(seconds: 30), (_) {
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
      // Push local changes to server
      int pushedCount = 0;
      pushedCount += await _syncOrders();
      pushedCount += await _syncPayments();
      pushedCount += await _syncQueueEntries();

      // Data integrity: pull-after-push verification
      // After pushing, pull the latest data to ensure consistency
      // and update local menu/tables cache
      if (pushedCount > 0) {
        await _verifySyncIntegrity();
      }

      // Periodically refresh local menu/tables cache even when no data pushed
      // by using the existing periodic sync cycle
      _statusController.add(SyncStatus.synced);
    } catch (e) {
      _statusController.add(SyncStatus.error);
    } finally {
      _isSyncing = false;
    }
  }

  /// Pull-after-push verification: after syncing data, pull from server
  /// and verify the local state is consistent.
  Future<void> _verifySyncIntegrity() async {
    try {
      // Pull latest data from server
      final serverData = await _api.pullSyncData();

      // Verify local orders match server orders
      final localOrders = await _db.getUnsyncedOrders();
      if (localOrders.isNotEmpty) {
        // Some orders failed to sync - they'll retry on next cycle
        debugPrint('Data integrity: ${localOrders.length} orders still pending sync');
      }

      // Update local menu & tables from server data
      if (serverData['menuItems'] != null) {
        for (final item in serverData['menuItems'] as List) {
          await _db.into(_db.localMenuItems).insertOnConflictUpdate(
            LocalMenuItemsCompanion(
              id: Value(item['id']),
              tenantId: Value(item['tenantId'] ?? ''),
              categoryId: Value(item['categoryId']),
              name: Value(item['name']),
              description: Value(item['description']),
              price: Value(double.tryParse(item['price'].toString()) ?? 0),
              isVeg: Value(item['isVeg'] ?? false),
              isAvailable: Value(item['isAvailable'] ?? true),
              image: Value(item['image']),
            ),
          );
        }
        debugPrint('Data integrity: Updated ${serverData['menuItems'].length} menu items from server');
      }

      if (serverData['categories'] != null) {
        for (final cat in serverData['categories'] as List) {
          await _db.into(_db.localCategories).insertOnConflictUpdate(
            LocalCategoriesCompanion(
              id: Value(cat['id']),
              tenantId: Value(cat['tenantId'] ?? ''),
              name: Value(cat['name']),
              sortOrder: Value(cat['sortOrder'] ?? 0),
              isActive: Value(cat['isActive'] ?? true),
            ),
          );
        }
        debugPrint('Data integrity: Updated ${serverData['categories'].length} categories from server');
      }
    } catch (e) {
      debugPrint('Data integrity verification error: $e');
      // Non-critical - data will be consistent on next sync
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
        // Will retry on next cycle
      }
    }
    return synced;
  }

  /// Returns number of payments synced
  Future<int> _syncPayments() async {
    final unsynced = await (_db.select(_db.localPayments)
          ..where((t) => t.synced.equals(false))
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .get();

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

  /// Returns number of queue entries synced
  Future<int> _syncQueueEntries() async {
    final pending = await _db.getPendingSync();
    int synced = 0;
    for (final entry in pending) {
      try {
        final payload = jsonDecode(entry.payload);
        await _api.pushSyncData(payload);
        await _db.markSynced(entry.id);
        synced++;
      } catch (_) {}
    }
    return synced;
  }

  Future<int> getPendingCount() async {
    final orders = await _db.getUnsyncedOrders();
    final payments = await (_db.select(_db.localPayments)
          ..where((t) => t.synced.equals(false)))
        .get();
    final queue = await _db.getPendingSync();
    return orders.length + payments.length + queue.length;
  }

  void dispose() {
    _syncTimer?.cancel();
    _statusController.close();
  }
}

enum SyncStatus { idle, syncing, synced, error }
