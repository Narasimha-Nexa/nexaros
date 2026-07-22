import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../../core/services/event_bus.dart';
import '../../../core/sync/offline_order_service.dart';
import '../data/order_models.dart';
import '../data/order_service.dart';

class OrdersState {
  final List<OrderModel> orders;
  final OrderModel? selectedOrder;
  final OrderFilter filter;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int totalCount;
  final int currentPage;
  final bool hasMore;
  final Set<String> selectedOrderIds;
  final bool isBulkActionInProgress;
  final bool isOffline;
  final List<OfflineOrderItem> offlineQueue;

  const OrdersState({
    this.orders = const [], this.selectedOrder, this.filter = const OrderFilter(),
    this.isLoading = false, this.isLoadingMore = false, this.error,
    this.totalCount = 0, this.currentPage = 1, this.hasMore = false,
    this.selectedOrderIds = const {}, this.isBulkActionInProgress = false,
    this.isOffline = false, this.offlineQueue = const [],
  });

  OrdersState copyWith({
    List<OrderModel>? orders, OrderModel? selectedOrder, bool clearSelectedOrder = false,
    OrderFilter? filter, bool? isLoading, bool? isLoadingMore, String? error, bool clearError = false,
    int? totalCount, int? currentPage, bool? hasMore,
    Set<String>? selectedOrderIds, bool? isBulkActionInProgress,
    bool? isOffline, List<OfflineOrderItem>? offlineQueue,
  }) => OrdersState(
    orders: orders ?? this.orders,
    selectedOrder: clearSelectedOrder ? null : (selectedOrder ?? this.selectedOrder),
    filter: filter ?? this.filter,
    isLoading: isLoading ?? this.isLoading,
    isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    error: clearError ? null : (error ?? this.error),
    totalCount: totalCount ?? this.totalCount,
    currentPage: currentPage ?? this.currentPage,
    hasMore: hasMore ?? this.hasMore,
    selectedOrderIds: selectedOrderIds ?? this.selectedOrderIds,
    isBulkActionInProgress: isBulkActionInProgress ?? this.isBulkActionInProgress,
    isOffline: isOffline ?? this.isOffline,
    offlineQueue: offlineQueue ?? this.offlineQueue,
  );

  List<OrderModel> get pendingOrders => orders.where((o) => o.parsedStatus == OrderStatus.pending || o.parsedStatus == OrderStatus.confirmed).toList();
  List<OrderModel> get preparingOrders => orders.where((o) => [OrderStatus.preparing, OrderStatus.cooking].contains(o.parsedStatus)).toList();
  List<OrderModel> get readyOrders => orders.where((o) => o.parsedStatus == OrderStatus.ready || o.parsedStatus == OrderStatus.packed).toList();
  List<OrderModel> get completedOrders => orders.where((o) => o.parsedStatus == OrderStatus.completed).toList();
  List<OrderModel> get cancelledOrders => orders.where((o) => [OrderStatus.cancelled, OrderStatus.rejected].contains(o.parsedStatus)).toList();
  List<OrderModel> get activeOrders => orders.where((o) => o.parsedStatus.isActive).toList();
  int get totalActive => activeOrders.length;
  int get totalPending => pendingOrders.length;
  int get totalPreparing => preparingOrders.length;
  int get totalReady => readyOrders.length;
  double get totalRevenue => orders.fold(0, (s, o) => s + o.totalAmount);
}

class OrdersProvider extends ChangeNotifier {
  final OrderService _service;
  final EventBus _eventBus;
  OrdersState _state = const OrdersState();
  final List<StreamSubscription> _eventSubscriptions = [];

  OrdersState get state => _state;

  OrdersProvider(this._service, this._eventBus) {
    _subscribeToEvents();
  }

  void _subscribeToEvents() {
    final types = [
      BusEventType.orderCreated, BusEventType.orderStatusChanged,
      BusEventType.orderReady, BusEventType.orderUpdated, BusEventType.itemStatusChanged,
    ];
    for (final type in types) {
      _eventSubscriptions.add(_eventBus.listen(type, (event) {
        switch (event.type) {
          case BusEventType.orderCreated:
          case BusEventType.orderStatusChanged:
          case BusEventType.orderReady:
            loadOrders();
          case BusEventType.orderUpdated:
            if (_state.selectedOrder != null) {
              final data = event.data as Map<String, dynamic>?;
              if (data?['id'] == _state.selectedOrder!.id) {
                _loadOrderDetail(_state.selectedOrder!.id);
              }
            }
            loadOrders();
          default:
            break;
        }
      }));
    }
  }

  Future<void> loadOrders({bool refresh = false}) async {
    if (_state.isLoading) return;
    _state = _state.copyWith(isLoading: true, clearError: true);
    notifyListeners();

    try {
      final result = await _service.getOrders(filter: _state.filter, page: 1);
      _state = _state.copyWith(
        orders: result.orders, totalCount: result.totalCount,
        currentPage: 1, hasMore: result.hasMore, isLoading: false,
      );
    } catch (e) {
      _state = _state.copyWith(isLoading: false, error: e.toString());
    }
    notifyListeners();
  }

  Future<void> loadMore() async {
    if (_state.isLoadingMore || !_state.hasMore) return;
    _state = _state.copyWith(isLoadingMore: true);
    notifyListeners();

    try {
      final nextPage = _state.currentPage + 1;
      final result = await _service.getOrders(filter: _state.filter, page: nextPage);
      _state = _state.copyWith(
        orders: [..._state.orders, ...result.orders],
        totalCount: result.totalCount, currentPage: nextPage,
        hasMore: result.hasMore, isLoadingMore: false,
      );
    } catch (e) {
      _state = _state.copyWith(isLoadingMore: false, error: e.toString());
    }
    notifyListeners();
  }

  Future<void> _loadOrderDetail(String orderId) async {
    try {
      final order = await _service.getOrder(orderId);
      _state = _state.copyWith(selectedOrder: order);
      notifyListeners();
    } catch (_) {}
  }

  void selectOrder(String? orderId) {
    if (orderId == null) {
      _state = _state.copyWith(clearSelectedOrder: true);
      notifyListeners();
      return;
    }
    final existing = _state.orders.where((o) => o.id == orderId).firstOrNull;
    if (existing != null) {
      _state = _state.copyWith(selectedOrder: existing);
      notifyListeners();
    }
    _loadOrderDetail(orderId);
  }

  void applyFilter(OrderFilter filter) {
    _state = _state.copyWith(filter: filter, currentPage: 1);
    notifyListeners();
    loadOrders(refresh: true);
  }

  void updateFilter(OrderFilter Function(OrderFilter) updater) {
    _state = _state.copyWith(filter: updater(_state.filter));
    notifyListeners();
  }

  void clearFilters() {
    _state = _state.copyWith(filter: const OrderFilter().clearAll());
    notifyListeners();
    loadOrders(refresh: true);
  }

  Future<OrderModel?> updateStatus(String orderId, OrderStatus status, {String? notes}) async {
    try {
      final updated = await _service.updateOrderStatus(orderId, status, notes: notes);
      _replaceOrder(updated);
      if (_state.selectedOrder?.id == orderId) {
        _state = _state.copyWith(selectedOrder: updated);
      }
      notifyListeners();
      return updated;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  Future<OrderModel?> cancelOrder(String orderId, {String? reason}) async {
    try {
      final updated = await _service.cancelOrder(orderId, reason: reason);
      _replaceOrder(updated);
      if (_state.selectedOrder?.id == orderId) {
        _state = _state.copyWith(selectedOrder: updated);
      }
      notifyListeners();
      return updated;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  Future<OrderModel?> addItem(String orderId, OrderItemModel item) async {
    try {
      final updated = await _service.addItem(orderId, item);
      _replaceOrder(updated);
      if (_state.selectedOrder?.id == orderId) {
        _state = _state.copyWith(selectedOrder: updated);
      }
      notifyListeners();
      return updated;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  Future<OrderModel?> removeItem(String orderId, String itemId) async {
    try {
      final updated = await _service.removeItem(orderId, itemId);
      _replaceOrder(updated);
      if (_state.selectedOrder?.id == orderId) {
        _state = _state.copyWith(selectedOrder: updated);
      }
      notifyListeners();
      return updated;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  Future<void> printKot(String orderId) async {
    try {
      await _service.printKot(orderId);
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  Future<void> processPayment(String orderId, {
    required PaymentMethod method, required double amount, String? reference,
  }) async {
    try {
      await _service.processPayment(orderId, method: method, amount: amount, reference: reference);
      await _loadOrderDetail(orderId);
      loadOrders(refresh: true);
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  // Bulk Selection
  void toggleOrderSelection(String orderId) {
    final selected = Set<String>.from(_state.selectedOrderIds);
    if (selected.contains(orderId)) {
      selected.remove(orderId);
    } else {
      selected.add(orderId);
    }
    _state = _state.copyWith(selectedOrderIds: selected);
    notifyListeners();
  }

  void selectAllOrders() {
    final allIds = _state.orders.map((o) => o.id).toSet();
    final selected = Set<String>.from(_state.selectedOrderIds);
    if (selected.length == allIds.length) {
      _state = _state.copyWith(selectedOrderIds: {});
    } else {
      _state = _state.copyWith(selectedOrderIds: allIds);
    }
    notifyListeners();
  }

  void clearSelection() {
    _state = _state.copyWith(selectedOrderIds: {});
    notifyListeners();
  }

  Future<BulkActionResult> executeBulkAction(BulkActionRequest request) async {
    _state = _state.copyWith(isBulkActionInProgress: true);
    notifyListeners();

    final result = await _service.executeBulkAction(request);
    _state = _state.copyWith(isBulkActionInProgress: false, selectedOrderIds: {});
    notifyListeners();
    await loadOrders(refresh: true);
    return result;
  }

  void clearError() {
    _state = _state.copyWith(clearError: true);
    notifyListeners();
  }

  List<OrderModel> getFilteredByTab(String tab) {
    return switch (tab) {
      'active' => _state.activeOrders,
      'pending' => _state.pendingOrders,
      'preparing' => _state.preparingOrders,
      'ready' => _state.orders.where((o) => o.parsedStatus == OrderStatus.ready).toList(),
      'completed' => _state.orders.where((o) => o.parsedStatus == OrderStatus.completed).toList(),
      'cancelled' => _state.cancelledOrders,
      _ => _state.orders,
    };
  }

  void _replaceOrder(OrderModel updated) {
    final idx = _state.orders.indexWhere((o) => o.id == updated.id);
    if (idx != -1) {
      final newOrders = List<OrderModel>.from(_state.orders);
      newOrders[idx] = updated;
      _state = _state.copyWith(orders: newOrders);
    }
  }

  @override
  void dispose() {
    for (final sub in _eventSubscriptions) {
      sub.cancel();
    }
    super.dispose();
  }
}
