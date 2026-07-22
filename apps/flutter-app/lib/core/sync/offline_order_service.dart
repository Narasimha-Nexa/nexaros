import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';
import '../database/local_database.dart';
import '../constants/app_constants.dart';
import '../network/api_client.dart';

class OfflineOrderService {
  final LocalDatabase _db;
  final ApiClient _api;
  static const _uuid = Uuid();

  OfflineOrderService(this._db, this._api);

  Future<OfflineOrderResult> createOrder({
    required String branchId,
    String? tableId,
    String? staffId,
    String type = 'DINE_IN',
    String? customerName,
    String? customerPhone,
    int? guestCount,
    double? discountAmount,
    String? notes,
    required List<OfflineOrderItem> items,
  }) async {
    // Enforce offline order limit
    final offlineCount = await _db.getOfflineOrderCount();
    if (offlineCount >= AppConstants.maxOfflineOrders) {
      throw OfflineLimitException(
        'Maximum offline orders (${AppConstants.maxOfflineOrders}) reached. '
        'Please sync before creating more orders.',
      );
    }

    // Try online first
    try {
      final result = await _api.createOrder({
        'branchId': branchId,
        'tableId': tableId,
        'staffId': staffId,
        'type': type,
        'customerName': customerName,
        'customerPhone': customerPhone,
        'guestCount': guestCount,
        'discountAmount': discountAmount,
        'notes': notes,
        'items': items
            .map((i) => {
                  'menuItemId': i.menuItemId,
                  'name': i.name,
                  'quantity': i.quantity,
                  'unitPrice': i.unitPrice,
                  'notes': i.notes,
                })
            .toList(),
      });

      // Save to local DB as synced
      final orderId = result['id'] as String;
      await _saveOrderLocally(orderId, branchId, tableId, staffId, type,
          customerName, discountAmount, notes, items, true, result['orderNumber'] as int);

      return OfflineOrderResult(
        orderId: orderId,
        orderNumber: result['orderNumber'] as int,
        isOffline: false,
      );
    } catch (_) {
      // Offline fallback
      return _createOrderOffline(branchId, tableId, staffId, type,
          customerName, customerPhone, guestCount, discountAmount, notes, items);
    }
  }

  Future<OfflineOrderResult> _createOrderOffline(
    String branchId,
    String? tableId,
    String? staffId,
    String type,
    String? customerName,
    String? customerPhone,
    int? guestCount,
    double? discountAmount,
    String? notes,
    List<OfflineOrderItem> items,
  ) async {
    final localId = _uuid.v4();

    // Get next local order number
    final lastOrder = await (_db.select(_db.localOrders)
          ..where((t) => t.branchId.equals(branchId))
          ..orderBy([(t) => OrderingTerm.desc(t.orderNumber)])
          ..limit(1))
        .get();
    final orderNumber = (lastOrder.isNotEmpty ? lastOrder.first.orderNumber : 0) + 1;

    await _saveOrderLocally(localId, branchId, tableId, staffId, type,
        customerName, discountAmount, notes, items, false, orderNumber);

    // Build the full order payload for the sync queue
    double subtotal = 0;
    for (final item in items) {
      subtotal += item.unitPrice * item.quantity;
    }
    final totalAmount = subtotal - (discountAmount ?? 0);

    final payload = jsonEncode({
      'localId': localId,
      'branchId': branchId,
      'tableId': tableId,
      'type': type,
      'status': 'PENDING',
      'customerName': customerName,
      'customerPhone': customerPhone,
      'guestCount': guestCount,
      'subtotal': subtotal,
      'discountAmount': discountAmount ?? 0,
      'totalAmount': totalAmount,
      'notes': notes,
      'items': items
          .map((i) => {
                'menuItemId': i.menuItemId,
                'name': i.name,
                'quantity': i.quantity,
                'unitPrice': i.unitPrice,
                'notes': i.notes,
              })
          .toList(),
    });

    // Add to sync queue with full payload
    await _db.addToSyncQueue(LocalSyncQueueCompanion(
      entityType: const Value('order'),
      entityId: Value(localId),
      action: const Value('create'),
      payload: Value(payload),
    ));

    return OfflineOrderResult(
      orderId: localId,
      orderNumber: orderNumber,
      isOffline: true,
    );
  }

  Future<void> _saveOrderLocally(
    String id,
    String branchId,
    String? tableId,
    String? staffId,
    String type,
    String? customerName,
    double? discountAmount,
    String? notes,
    List<OfflineOrderItem> items,
    bool synced,
    int orderNumber,
  ) async {
    double subtotal = 0;
    for (final item in items) {
      subtotal += item.unitPrice * item.quantity;
    }
    final totalAmount = subtotal - (discountAmount ?? 0);

    await _db.into(_db.localOrders).insertOnConflictUpdate(
      LocalOrdersCompanion(
        id: Value(id),
        branchId: Value(branchId),
        tableId: Value(tableId),
        orderNumber: Value(orderNumber),
        type: Value(type),
        status: const Value('PENDING'),
        customerName: Value(customerName),
        subtotal: Value(subtotal),
        totalAmount: Value(totalAmount),
        synced: Value(synced),
      ),
    );

    for (final item in items) {
      await _db.into(_db.localOrderItems).insert(
        LocalOrderItemsCompanion(
          id: Value(_uuid.v4()),
          orderId: Value(id),
          menuItemId: Value(item.menuItemId),
          name: Value(item.name),
          quantity: Value(item.quantity),
          unitPrice: Value(item.unitPrice),
          totalPrice: Value(item.unitPrice * item.quantity),
        ),
      );
    }
  }

  Future<void> updateOrderStatus(String orderId, String status) async {
    await _db.updateOrderStatus(orderId, status);
    await _db.addToSyncQueueWithPayload(
      entityType: 'order',
      entityId: orderId,
      action: 'update_status',
      payload: {'status': status},
    );
  }

  Future<void> cancelOrder(String orderId) async {
    await _db.deleteLocalOrder(orderId);
    await _db.addToSyncQueueWithPayload(
      entityType: 'order',
      entityId: orderId,
      action: 'cancel',
      payload: {'reason': 'Cancelled offline'},
    );
  }
}

class OfflineOrderItem {
  final String menuItemId;
  final String name;
  final int quantity;
  final double unitPrice;
  final String? notes;

  OfflineOrderItem({
    required this.menuItemId,
    required this.name,
    required this.quantity,
    required this.unitPrice,
    this.notes,
  });
}

class OfflineOrderResult {
  final String orderId;
  final int orderNumber;
  final bool isOffline;

  OfflineOrderResult({
    required this.orderId,
    required this.orderNumber,
    required this.isOffline,
  });
}

class OfflineLimitException implements Exception {
  final String message;
  OfflineLimitException(this.message);
  @override
  String toString() => message;
}
