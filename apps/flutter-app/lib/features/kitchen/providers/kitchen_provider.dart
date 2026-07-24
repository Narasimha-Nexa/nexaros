import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_service.dart';
import '../../../core/services/event_bus.dart';
import '../data/kitchen_models.dart';
import '../data/kitchen_service.dart';

class KitchenState {
  final List<KitchenOrder> orders;
  final KitchenFilter filter;
  final KitchenSLAConfig slaConfig;
  final bool isLoading;
  final String? error;
  final String? selectedStationFilter;
  final KitchenOrder? selectedOrder;
  final List<KitchenNotification> notifications;
  final int unreadNotificationCount;
  final List<KitchenAuditEntry> auditLog;
  final KitchenMetrics metrics;
  final Set<String> selectedOrderIds;
  final bool isTvMode;
  final bool soundEnabled;

  const KitchenState({
    this.orders = const [],
    this.filter = const KitchenFilter(),
    this.slaConfig = const KitchenSLAConfig(),
    this.isLoading = false,
    this.error,
    this.selectedStationFilter,
    this.selectedOrder,
    this.notifications = const [],
    this.unreadNotificationCount = 0,
    this.auditLog = const [],
    this.metrics = const KitchenMetrics(),
    this.selectedOrderIds = const {},
    this.isTvMode = false,
    this.soundEnabled = true,
  });

  KitchenState copyWith({
    List<KitchenOrder>? orders,
    KitchenFilter? filter,
    KitchenSLAConfig? slaConfig,
    bool? isLoading,
    String? error,
    bool clearError = false,
    String? selectedStationFilter,
    bool clearStationFilter = false,
    KitchenOrder? selectedOrder,
    bool clearSelectedOrder = false,
    List<KitchenNotification>? notifications,
    int? unreadNotificationCount,
    List<KitchenAuditEntry>? auditLog,
    KitchenMetrics? metrics,
    Set<String>? selectedOrderIds,
    bool? isTvMode,
    bool? soundEnabled,
  }) {
    return KitchenState(
      orders: orders ?? this.orders,
      filter: filter ?? this.filter,
      slaConfig: slaConfig ?? this.slaConfig,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      selectedStationFilter: clearStationFilter ? null : (selectedStationFilter ?? this.selectedStationFilter),
      selectedOrder: clearSelectedOrder ? null : (selectedOrder ?? this.selectedOrder),
      notifications: notifications ?? this.notifications,
      unreadNotificationCount: unreadNotificationCount ?? this.unreadNotificationCount,
      auditLog: auditLog ?? this.auditLog,
      metrics: metrics ?? this.metrics,
      selectedOrderIds: selectedOrderIds ?? this.selectedOrderIds,
      isTvMode: isTvMode ?? this.isTvMode,
      soundEnabled: soundEnabled ?? this.soundEnabled,
    );
  }

  // ─── Computed Getters ───

  List<KitchenOrder> get filteredOrders => _applyFilterToOrders(orders, filter, selectedStationFilter);

  List<KitchenOrder> get pendingOrders => orders.where((o) => o.status == KitchenOrderStatus.pending).toList();
  List<KitchenOrder> get acceptedOrders => orders.where((o) => o.status == KitchenOrderStatus.accepted).toList();
  List<KitchenOrder> get preparingOrders => orders.where((o) => o.status == KitchenOrderStatus.preparing || o.status == KitchenOrderStatus.cooking).toList();
  List<KitchenOrder> get readyOrders => orders.where((o) => o.status == KitchenOrderStatus.ready).toList();
  List<KitchenOrder> get servedOrders => orders.where((o) => o.status == KitchenOrderStatus.served).toList();
  List<KitchenOrder> get heldOrders => orders.where((o) => o.status == KitchenOrderStatus.held).toList();
  List<KitchenOrder> get rushOrders => orders.where((o) => o.isRush || o.status == KitchenOrderStatus.rush).toList();
  List<KitchenOrder> get delayedOrders => orders.where((o) => o.isDelayed).toList();
  List<KitchenOrder> get activeOrders => orders.where((o) => o.status.isActive).toList();

  int get pendingCount => pendingOrders.length;
  int get preparingCount => preparingOrders.length;
  int get readyCount => readyOrders.length;
  int get rushCount => rushOrders.length;
  int get delayedCount => delayedOrders.length;
  int get activeCount => activeOrders.length;

  List<KitchenOrder> getOrdersByStation(KitchenStationType station) {
    return activeOrders.where((o) =>
      o.items.any((i) => i.station == station)
    ).toList();
  }

  List<KitchenOrder> _applyFilterToOrders(List<KitchenOrder> orders, KitchenFilter filter, String? stationFilter) {
    var result = orders;

    if (stationFilter != null && stationFilter.isNotEmpty) {
      final station = KitchenStationType.fromName(stationFilter);
      result = result.where((o) => o.items.any((i) => i.station == station)).toList();
    }

    if (filter.statuses.isNotEmpty) {
      result = result.where((o) => filter.statuses.contains(o.status)).toList();
    }
    if (filter.stations.isNotEmpty) {
      result = result.where((o) => o.items.any((i) => filter.stations.contains(i.station))).toList();
    }
    if (filter.chefIds.isNotEmpty) {
      result = result.where((o) => filter.chefIds.contains(o.assignedChefId)).toList();
    }
    if (filter.priorities.isNotEmpty) {
      result = result.where((o) => filter.priorities.contains(o.priority)).toList();
    }
    if (filter.channels.isNotEmpty) {
      result = result.where((o) => filter.channels.contains(o.channel)).toList();
    }
    if (filter.searchQuery != null && filter.searchQuery!.isNotEmpty) {
      final q = filter.searchQuery!.toLowerCase();
      result = result.where((o) =>
        o.displayOrderNumber.toLowerCase().contains(q) ||
        (o.tableName?.toLowerCase().contains(q) ?? false) ||
        (o.customerName?.toLowerCase().contains(q) ?? false) ||
        o.items.any((i) => i.name.toLowerCase().contains(q))
      ).toList();
    }
    if (filter.showDelayedOnly) {
      result = result.where((o) => o.isDelayed).toList();
    }
    if (filter.showRushOnly) {
      result = result.where((o) => o.isRush || o.priority.level >= KitchenPriority.urgent.level).toList();
    }

    return result;
  }
}

class KitchenProvider extends ChangeNotifier {
  final ApiClient _api;
  final EventBus _eventBus;
  final SocketService _socketService;
  late final KitchenService _service;

  KitchenState _state = const KitchenState();
  final List<StreamSubscription> _subscriptions = [];
  Timer? _debounceTimer;
  String? _currentBranchId;

  KitchenState get state => _state;
  KitchenService get service => _service;

  KitchenProvider(this._api, this._eventBus, this._socketService) {
    _service = KitchenService(_api);
    _listenToEvents();
    _listenToNotifications();
    _listenToSocketEvents();
  }

  void _listenToEvents() {
    final types = [
      BusEventType.orderCreated,
      BusEventType.orderStatusChanged,
      BusEventType.orderReady,
      BusEventType.orderUpdated,
      BusEventType.itemStatusChanged,
    ];
    for (final type in types) {
      _subscriptions.add(_eventBus.listen(type, (_) => _debouncedLoad()));
    }
  }

  void _listenToNotifications() {
    _subscriptions.add(_service.notificationStream.listen((notification) {
      final notifications = [notification, ..._state.notifications];
      _state = _state.copyWith(
        notifications: notifications,
        unreadNotificationCount: _state.unreadNotificationCount + 1,
      );
      notifyListeners();
    }));
  }

  /// Subscribe to Socket.IO kitchen events for real-time push updates.
  void _listenToSocketEvents() {
    // New order created — add it instantly to the top of the list
    _subscriptions.add(_socketService.onKitchenOrderCreated.listen((data) {
      _handleNewOrder(data);
    }));

    // Order status bumped (PREPARING→READY, etc.) — update in place
    _subscriptions.add(_socketService.onKitchenOrderBumped.listen((data) {
      _handleOrderBumped(data);
    }));

    // Chef assigned — update order in place
    _subscriptions.add(_socketService.onKitchenOrderAssigned.listen((data) {
      _handleChefAssigned(data);
    }));

    // Priority changed — update order in place
    _subscriptions.add(_socketService.onKitchenPriorityChanged.listen((data) {
      _handlePriorityChanged(data);
    }));

    // Item-level status change — update item in place
    _subscriptions.add(_socketService.onKitchenItemStatus.listen((data) {
      _handleItemStatusChanged(data);
    }));
  }

  // ── Incremental State Updates (Real-Time Push) ──

  void _handleNewOrder(Map<String, dynamic> data) {
    final orderId = data['id'] as String?;
    if (orderId == null) return;

    // Avoid duplicates
    if (_state.orders.any((o) => o.id == orderId)) return;

    // Do a quick fetch of the full order for complete data
    _fetchAndAddOrder(orderId);
  }

  Future<void> _fetchAndAddOrder(String orderId) async {
    try {
      final orders = await _service.loadOrders(branchId: _currentBranchId);
      final newOrder = orders.where((o) => o.id == orderId).firstOrNull;
      if (newOrder != null && !_state.orders.any((o) => o.id == orderId)) {
        _state = _state.copyWith(
          orders: [newOrder, ..._state.orders],
          metrics: _service.calculateMetrics([newOrder, ..._state.orders]),
        );
        notifyListeners();
      }
    } catch (_) {
      // Fallback: full reload on error
      _debouncedLoad();
    }
  }

  void _handleOrderBumped(Map<String, dynamic> data) {
    final orderId = data['orderId'] as String?;
    final status = data['status'] as String?;
    if (orderId == null || status == null) return;

    final updatedOrders = _state.orders.map((order) {
      if (order.id != orderId) return order;

      final newStatus = KitchenOrderStatus.fromName(status);
      return order.copyWith(
        status: newStatus,
        items: order.items.map((item) {
          // Update item statuses from the payload if provided
          final items = data['items'] as List<dynamic>?;
          if (items != null) {
            final matchingItem = items.firstWhere(
              (i) => i['id'] == item.id,
              orElse: () => null,
            );
            if (matchingItem != null) {
              return item.copyWith(
                status: KitchenOrderStatus.fromName(matchingItem['status'] ?? 'preparing'),
              );
            }
          }
          return item;
        }).toList(),
      );
    }).toList();

    _state = _state.copyWith(
      orders: updatedOrders,
      metrics: _service.calculateMetrics(updatedOrders),
    );
    notifyListeners();
  }

  void _handleChefAssigned(Map<String, dynamic> data) {
    final orderId = data['orderId'] as String?;
    final chefId = data['chefId'] as String?;
    final chefName = data['chefName'] as String?;
    if (orderId == null) return;

    final updatedOrders = _state.orders.map((order) {
      if (order.id != orderId) return order;
      return order.copyWith(
        assignedChefId: chefId,
        assignedChefName: chefName,
      );
    }).toList();

    _state = _state.copyWith(orders: updatedOrders);
    notifyListeners();
  }

  void _handlePriorityChanged(Map<String, dynamic> data) {
    final orderId = data['orderId'] as String?;
    final priority = data['priority'] as String?;
    if (orderId == null || priority == null) return;

    final newPriority = KitchenPriority.fromName(priority);
    final updatedOrders = _state.orders.map((order) {
      if (order.id != orderId) return order;
      return order.copyWith(priority: newPriority);
    }).toList();

    _state = _state.copyWith(orders: updatedOrders);
    notifyListeners();
  }

  void _handleItemStatusChanged(Map<String, dynamic> data) {
    final orderId = data['orderId'] as String?;
    final itemId = data['itemId'] as String?;
    final status = data['status'] as String?;
    if (orderId == null || itemId == null || status == null) return;

    final newStatus = KitchenOrderStatus.fromName(status);
    final updatedOrders = _state.orders.map((order) {
      if (order.id != orderId) return order;
      return order.copyWith(
        items: order.items.map((item) {
          if (item.id != itemId) return item;
          return item.copyWith(
            status: newStatus,
            startedAt: data['startedAt'] != null
                ? DateTime.tryParse(data['startedAt'])
                : item.startedAt,
            completedAt: data['completedAt'] != null
                ? DateTime.tryParse(data['completedAt'])
                : item.completedAt,
          );
        }).toList(),
      );
    }).toList();

    _state = _state.copyWith(
      orders: updatedOrders,
      metrics: _service.calculateMetrics(updatedOrders),
    );
    notifyListeners();
  }

  /// Debounced full reload — coalesces rapid events into one fetch
  void _debouncedLoad() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      loadOrders();
    });
  }

  // ─── Order Loading ───

  Future<void> loadOrders({String? branchId}) async {
    if (branchId != null) _currentBranchId = branchId;
    _state = _state.copyWith(isLoading: true, clearError: true);
    notifyListeners();

    try {
      final orders = await _service.loadOrders(branchId: branchId ?? _currentBranchId);
      final metrics = _service.calculateMetrics(orders);
      _state = _state.copyWith(orders: orders, isLoading: false, metrics: metrics);
    } catch (e) {
      _state = _state.copyWith(isLoading: false, error: e.toString());
    }
    notifyListeners();
  }

  // ─── Status Updates ───

  Future<void> updateOrderStatus(String orderId, KitchenOrderStatus status, {String? notes}) async {
    await _service.updateOrderStatus(orderId, status, notes: notes);
    await loadOrders();
  }

  Future<void> updateItemStatus(String orderId, String itemId, KitchenOrderStatus status) async {
    await _service.updateItemStatus(orderId, itemId, status);
    await loadOrders();
  }

  Future<void> bumpOrder(String orderId) async {
    await _service.updateOrderStatus(orderId, KitchenOrderStatus.ready);
    await loadOrders();
  }

  Future<void> rushOrder(String orderId) async {
    await _service.rushOrder(orderId);
    await loadOrders();
  }

  Future<void> holdOrder(String orderId) async {
    await _service.holdOrder(orderId);
    await loadOrders();
  }

  Future<void> recallOrder(String orderId) async {
    await _service.recallOrder(orderId);
    await loadOrders();
  }

  // ─── Chef Assignment ───

  Future<void> assignChef(String orderId, String chefId, String chefName) async {
    await _service.assignChef(orderId, chefId, chefName);
    await loadOrders();
  }

  // ─── Course Management ───

  Future<void> fireCourse(String orderId, CourseType course) async {
    await _service.fireCourse(orderId, course);
    await loadOrders();
  }

  Future<void> holdCourse(String orderId, CourseType course) async {
    await _service.holdCourse(orderId, course);
    await loadOrders();
  }

  // ─── Filters ───

  void setStationFilter(String? stationName) {
    _state = _state.copyWith(selectedStationFilter: stationName);
    notifyListeners();
  }

  void setChannelFilter(String? channel) {
    if (channel == null || channel.isEmpty) {
      _state = _state.copyWith(filter: _state.filter.copyWith(channels: []));
    } else {
      final current = _state.filter.channels;
      final updated = current.contains(channel)
          ? current.where((c) => c != channel).toList()
          : [...current, channel];
      _state = _state.copyWith(filter: _state.filter.copyWith(channels: updated));
    }
    notifyListeners();
  }

  void applyFilter(KitchenFilter filter) {
    _state = _state.copyWith(filter: filter);
    notifyListeners();
  }

  void updateFilter(KitchenFilter Function(KitchenFilter) updater) {
    _state = _state.copyWith(filter: updater(_state.filter));
    notifyListeners();
  }

  void clearFilters() {
    _state = _state.copyWith(filter: const KitchenFilter().clearAll(), clearStationFilter: true);
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _state = _state.copyWith(filter: _state.filter.copyWith(searchQuery: query));
    notifyListeners();
  }

  // ─── Selection ───

  void selectOrder(String? orderId) {
    if (orderId == null) {
      _state = _state.copyWith(clearSelectedOrder: true);
      notifyListeners();
      return;
    }
    final order = _state.orders.where((o) => o.id == orderId).firstOrNull;
    if (order != null) {
      _state = _state.copyWith(selectedOrder: order);
      notifyListeners();
    }
  }

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

  void clearSelection() {
    _state = _state.copyWith(selectedOrderIds: {});
    notifyListeners();
  }

  // ─── UI State ───

  void toggleTvMode() {
    _state = _state.copyWith(isTvMode: !_state.isTvMode);
    notifyListeners();
  }

  void toggleSound() {
    _state = _state.copyWith(soundEnabled: !_state.soundEnabled);
    notifyListeners();
  }

  void markNotificationsRead() {
    _state = _state.copyWith(unreadNotificationCount: 0);
    notifyListeners();
  }

  // ─── Bulk Actions ───

  Future<void> bulkUpdateStatus(Set<String> orderIds, KitchenOrderStatus status) async {
    for (final id in orderIds) {
      await _service.updateOrderStatus(id, status);
    }
    _state = _state.copyWith(selectedOrderIds: {});
    await loadOrders();
  }

  // ─── Metrics ───

  void refreshMetrics() {
    final metrics = _service.calculateMetrics(_state.orders);
    _state = _state.copyWith(metrics: metrics);
    notifyListeners();
  }

  // ─── Audit ───

  List<KitchenAuditEntry> get auditLog => _service.auditLog;

  @override
  void dispose() {
    _debounceTimer?.cancel();
    for (final sub in _subscriptions) {
      sub.cancel();
    }
    _service.dispose();
    super.dispose();
  }
}
