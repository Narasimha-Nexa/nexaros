import 'dart:async';
import '../../../core/network/api_client.dart';
import '../../../core/services/event_bus.dart';
import 'order_models.dart';

class OrderService {
  final ApiClient _api;
  final EventBus _eventBus;

  OrderService(this._api, this._eventBus);

  Future<OrderSearchResult> getOrders({
    OrderFilter? filter, int page = 1, int limit = 50,
  }) async {
    final params = <String, String>{
      'page': page.toString(), 'limit': limit.toString(),
    };
    if (filter != null) {
      if (filter.statuses.isNotEmpty) params['status'] = filter.statuses.first.name.toUpperCase();
      if (filter.branchId != null) params['branchId'] = filter.branchId!;
      if (filter.tableId != null) params['tableId'] = filter.tableId!;
      if (filter.customerId != null) params['customerId'] = filter.customerId!;
      if (filter.dateRange != null) {
        params['startDate'] = filter.dateRange!.start.toIso8601String();
        params['endDate'] = filter.dateRange!.end.toIso8601String();
      }
      if (filter.minAmount != null) params['minAmount'] = filter.minAmount!.toString();
      if (filter.maxAmount != null) params['maxAmount'] = filter.maxAmount!.toString();
    }

    final rawOrders = await _api.getOrders(
      status: params['status'], branchId: params['branchId'],
      limit: limit, page: page,
    );

    var orders = rawOrders.map((o) => OrderModel.fromJson(o as Map<String, dynamic>)).toList();

    orders = _applyClientFilter(orders, filter);
    orders = _applySort(orders, filter?.sortOrder ?? SortOrder.newest);

    final totalCount = orders.length;
    return OrderSearchResult(orders: orders, totalCount: totalCount, hasMore: orders.length >= limit);
  }

  Future<OrderModel> getOrder(String orderId) async {
    final response = await _api.getOrder(orderId);
    return OrderModel.fromJson(response);
  }

  Future<OrderModel> createOrder({
    required OrderType type, required List<OrderItemModel> items,
    String? tableId, String? customerId, String? customerName,
    String? customerPhone, int? guestCount, String? notes,
    double? discountAmount, OrderChannel? channel,
  }) async {
    final data = <String, dynamic>{
      'type': type.name.toUpperCase(),
      'items': items.map((i) => {
        'menuItemId': i.menuItemId, 'name': i.name,
        'quantity': i.quantity, 'unitPrice': i.unitPrice,
        if (i.notes != null) 'notes': i.notes,
      }).toList(),
      if (tableId != null) 'tableId': tableId,
      if (customerId != null) 'customerId': customerId,
      if (customerName != null) 'customerName': customerName,
      if (customerPhone != null) 'customerPhone': customerPhone,
      if (guestCount != null) 'guestCount': guestCount,
      if (notes != null) 'notes': notes,
      if (discountAmount != null) 'discountAmount': discountAmount,
      if (channel != null) 'channel': channel.name.toUpperCase(),
    };

    final response = await _api.createOrder(data);
    return OrderModel.fromJson(response);
  }

  Future<OrderModel> updateOrderStatus(String orderId, OrderStatus status, {String? notes}) async {
    final response = await _api.updateOrderStatus(orderId, status.name.toUpperCase(), notes: notes);
    return OrderModel.fromJson(response);
  }

  Future<OrderModel> cancelOrder(String orderId, {String? reason}) async {
    await _api.cancelOrder(orderId);
    return getOrder(orderId);
  }

  Future<OrderModel> addItem(String orderId, OrderItemModel item) async {
    final data = {
      'menuItemId': item.menuItemId, 'name': item.name,
      'quantity': item.quantity, 'unitPrice': item.unitPrice,
      if (item.notes != null) 'notes': item.notes,
    };
    final response = await _api.addItemToOrder(orderId, data);
    return OrderModel.fromJson(response);
  }

  Future<OrderModel> removeItem(String orderId, String itemId) async {
    await _api.removeItemFromOrder(orderId, itemId);
    return getOrder(orderId);
  }

  Future<void> printKot(String orderId) async {
    await _api.printKot(orderId);
  }

  Future<void> processPayment(String orderId, {
    required PaymentMethod method, required double amount, String? reference,
  }) async {
    await _api.processPayment(orderId, method: method.name.toUpperCase(), amount: amount, reference: reference);
  }

  Future<List<Map<String, dynamic>>> getOrderPayments(String orderId) async {
    final response = await _api.getOrderPayments(orderId);
    return (response as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
  }

  Future<BulkActionResult> executeBulkAction(BulkActionRequest request) async {
    int succeeded = 0;
    int failed = 0;
    final failedIds = <String>[];

    for (final orderId in request.orderIds) {
      try {
        switch (request.action) {
          case BulkActionType.accept:
            await updateOrderStatus(orderId, OrderStatus.confirmed);
          case BulkActionType.reject:
            await updateOrderStatus(orderId, OrderStatus.rejected, notes: request.notes);
          case BulkActionType.cancel:
            await cancelOrder(orderId, reason: request.notes);
          case BulkActionType.print:
            await printKot(orderId);
          case BulkActionType.updateStatus:
            if (request.targetStatus != null) {
              await updateOrderStatus(orderId, request.targetStatus!, notes: request.notes);
            }
          default:
            failed++;
            failedIds.add(orderId);
            continue;
        }
        succeeded++;
      } catch (e) {
        failed++;
        failedIds.add(orderId);
      }
    }

    return BulkActionResult(succeeded: succeeded, failed: failed, failedIds: failedIds);
  }

  List<OrderModel> _applyClientFilter(List<OrderModel> orders, OrderFilter? filter) {
    if (filter == null) return orders;
    var result = orders;

    if (filter.statuses.isNotEmpty) {
      final statusNames = filter.statuses.map((s) => s.name.toUpperCase()).toSet();
      result = result.where((o) => statusNames.contains(o.status)).toList();
    }
    if (filter.types.isNotEmpty) {
      result = result.where((o) => filter.types.contains(o.type)).toList();
    }
    if (filter.channels.isNotEmpty) {
      result = result.where((o) => filter.channels.contains(o.channel)).toList();
    }
    if (filter.paymentStatus != null) {
      result = result.where((o) => o.paymentStatus == filter.paymentStatus).toList();
    }
    if (filter.searchQuery != null && filter.searchQuery!.isNotEmpty) {
      final q = filter.searchQuery!.toLowerCase();
      result = result.where((o) =>
        o.orderNumberDisplay.toLowerCase().contains(q) ||
        (o.customerName?.toLowerCase().contains(q) ?? false) ||
        (o.customerPhone?.contains(q) ?? false) ||
        (o.displayTable.toLowerCase().contains(q)) ||
        o.items.any((i) => i.name.toLowerCase().contains(q))
      ).toList();
    }
    if (filter.minAmount != null) {
      result = result.where((o) => o.totalAmount >= filter.minAmount!).toList();
    }
    if (filter.maxAmount != null) {
      result = result.where((o) => o.totalAmount <= filter.maxAmount!).toList();
    }

    return result;
  }

  List<OrderModel> _applySort(List<OrderModel> orders, SortOrder sort) {
    return List.of(orders)..sort((a, b) => switch (sort) {
      SortOrder.newest => b.createdAt.compareTo(a.createdAt),
      SortOrder.oldest => a.createdAt.compareTo(b.createdAt),
      SortOrder.orderValue => b.totalAmount.compareTo(a.totalAmount),
      SortOrder.customerName => (a.customerName ?? '').compareTo(b.customerName ?? ''),
      SortOrder.table => (a.displayTable).compareTo(b.displayTable),
      SortOrder.status => a.status.compareTo(b.status),
      SortOrder.priority => b.age.compareTo(a.age),
      SortOrder.prepTime => b.items.length.compareTo(a.items.length),
    });
  }

  void subscribeToEvents(void Function(BusEventType, dynamic) handler) {
    final types = [
      BusEventType.orderCreated, BusEventType.orderUpdated,
      BusEventType.orderStatusChanged, BusEventType.orderReady,
      BusEventType.itemStatusChanged,
    ];
    for (final type in types) {
      _eventBus.listen(type, (event) {
        handler(event.type, event.data);
      });
    }
  }
}
