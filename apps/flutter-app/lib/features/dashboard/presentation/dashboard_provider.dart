import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/models/user_role.dart';
import '../../../core/services/event_bus.dart';
import '../data/dashboard_models.dart';
import '../data/dashboard_service.dart';
import '../data/dashboard_cache_service.dart';
import 'widgets/widget_visibility_service.dart';

class DashboardProvider extends ChangeNotifier {
  final DashboardService _service;
  final EventBus? _eventBus;
  DashboardFilter _filter;
  DashboardData _data;
  List<DashboardWidgetConfig> _widgetConfigs;
  bool _autoRefresh = true;
  Timer? _refreshTimer;
  final List<StreamSubscription<BusEvent>> _socketSubscriptions = [];
  DashboardCacheService? _cache;
  bool _initialized = false;

  DashboardProvider(
    this._service, {
    DashboardFilter? filter,
    EventBus? eventBus,
    DashboardCacheService? cache,
  })  : _filter = filter ?? const DashboardFilter(),
        _data = const DashboardData(),
        _widgetConfigs = _defaultWidgetConfigs(),
        _eventBus = eventBus,
        _cache = cache;

  DashboardData get data => _data;
  DashboardFilter get filter => _filter;
  List<DashboardWidgetConfig> get widgetConfigs => _widgetConfigs;
  bool get isLoading => _data.isLoading;
  String? get error => _data.error;
  bool get autoRefresh => _autoRefresh;

  void setCache(DashboardCacheService cache) => _cache = cache;

  /// Initialize: load cached data, then fetch fresh, then subscribe to socket.
  Future<void> init({UserRole? role, List<Permission> permissions = const []}) async {
    if (_initialized) return;
    _initialized = true;

    if (role != null) {
      applyRoleFiltering(role, permissions: permissions);
    }

    final cached = _cache?.getCachedData(_filter);
    if (cached != null) {
      _data = cached;
      notifyListeners();
    }

    await load();

    _setupAutoRefresh();
    _subscribeToSocketEvents();
  }

  Future<void> load() async {
    _data = _data.copyWith(isLoading: true, error: null);
    notifyListeners();
    try {
      _data = await _service.loadDashboard(_filter);
      _data = _data.copyWith(isLoading: false);
      _cache?.cacheData(_filter, _data);
    } catch (e) {
      final cached = _cache?.getCachedData(_filter);
      if (cached != null) {
        _data = cached.copyWith(isLoading: false);
      } else {
        _data = DashboardData(isLoading: false, error: e.toString());
      }
    }
    notifyListeners();
  }

  Future<void> refresh() async => load();

  void _setupAutoRefresh() {
    _refreshTimer?.cancel();
    if (_autoRefresh) {
      _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        if (_autoRefresh) load();
      });
    }
  }

  void _subscribeToSocketEvents() {
    for (final sub in _socketSubscriptions) {
      sub.cancel();
    }
    _socketSubscriptions.clear();
    final eventBus = _eventBus;
    if (eventBus == null) return;

    _socketSubscriptions.add(eventBus.on(BusEventType.orderCreated).listen((_) => _onRealtimeEvent('order')));
    _socketSubscriptions.add(eventBus.on(BusEventType.orderStatusChanged).listen((_) => _onRealtimeEvent('order')));
    _socketSubscriptions.add(eventBus.on(BusEventType.orderReady).listen((_) => _onRealtimeEvent('order')));
    _socketSubscriptions.add(eventBus.on(BusEventType.tableStatusChanged).listen((_) => _onRealtimeEvent('table')));
    _socketSubscriptions.add(eventBus.on(BusEventType.paymentReceived).listen((_) => _onRealtimeEvent('payment')));
    _socketSubscriptions.add(eventBus.on(BusEventType.paymentRefunded).listen((_) => _onRealtimeEvent('payment')));
    _socketSubscriptions.add(eventBus.on(BusEventType.itemStatusChanged).listen((_) => _onRealtimeEvent('kitchen')));
    _socketSubscriptions.add(eventBus.on(BusEventType.inventoryUpdated).listen((_) => _onRealtimeEvent('inventory')));
    _socketSubscriptions.add(eventBus.on(BusEventType.stockLow).listen((_) => _onRealtimeEvent('inventory')));
    _socketSubscriptions.add(eventBus.on(BusEventType.notification).listen((_) => _onRealtimeEvent('notification')));
    _socketSubscriptions.add(eventBus.on(BusEventType.staffUpdated).listen((_) => _onRealtimeEvent('staff')));
    _socketSubscriptions.add(eventBus.on(BusEventType.deliveryStatusChanged).listen((_) => _onRealtimeEvent('delivery')));
    _socketSubscriptions.add(eventBus.on(BusEventType.dashboardRefresh).listen((_) => _onDashboardRefresh()));
  }

  void _onDashboardRefresh() {
    _refreshTimer?.cancel();
    load();
    _setupAutoRefresh();
  }

  void _onRealtimeEvent(String category) {
    _data = _data.copyWith(
      realtimeState: _data.realtimeState.copyWith(
        orderStatus: category == 'order' ? ConnectionStatus.connected : _data.realtimeState.orderStatus,
        kitchenStatus: category == 'kitchen' ? ConnectionStatus.connected : _data.realtimeState.kitchenStatus,
        paymentStatus: category == 'payment' ? ConnectionStatus.connected : _data.realtimeState.paymentStatus,
        reservationStatus: _data.realtimeState.reservationStatus,
        inventoryStatus: category == 'inventory' ? ConnectionStatus.connected : _data.realtimeState.inventoryStatus,
        notificationStatus: category == 'notification' ? ConnectionStatus.connected : _data.realtimeState.notificationStatus,
      ),
    );
    notifyListeners();
    Future.delayed(const Duration(seconds: 2), () {
      if (!_disposed) {
        _data = _data.copyWith(realtimeState: _data.realtimeState.copyWith(
          orderStatus: _data.realtimeState.orderStatus == ConnectionStatus.connected &&
              category == 'order' ? ConnectionStatus.connected : _data.realtimeState.orderStatus,
        ));
        notifyListeners();
      }
    });
    if (['order', 'payment', 'kitchen'].contains(category)) {
      load();
    }
  }

  bool _disposed = false;

  // ─── Filter Methods ──────────────────────────────────

  void setTimeRange(DashboardTimeRange range) {
    _filter = _filter.copyWith(timeRange: range);
    _cache?.invalidate(_filter);
    load();
  }

  void setCustomDateRange(DateTime start, DateTime end) {
    _filter = _filter.copyWith(timeRange: DashboardTimeRange.custom, customStart: start, customEnd: end);
    _cache?.invalidate(_filter);
    load();
  }

  void setBranch(String? branchId) {
    _filter = _filter.copyWith(branchId: branchId);
    _cache?.invalidate(_filter);
    load();
  }

  void setView(DashboardView view) {
    _filter = _filter.copyWith(view: view);
    notifyListeners();
  }

  void setOrderType(OrderType type) {
    _filter = _filter.copyWith(orderType: type);
    load();
  }

  void setSalesChannel(SalesChannel channel) {
    _filter = _filter.copyWith(salesChannel: channel);
    load();
  }

  void setPaymentMethod(String? method) {
    _filter = _filter.copyWith(paymentMethod: method);
    load();
  }

  void setCategory(String? category) {
    _filter = _filter.copyWith(category: category);
    load();
  }

  void toggleAutoRefresh() {
    _autoRefresh = !_autoRefresh;
    _setupAutoRefresh();
    notifyListeners();
  }

  // ─── Widget Config Management ──────────────────────

  void toggleWidgetVisibility(String widgetId) {
    _widgetConfigs = _widgetConfigs.map((c) =>
      c.id == widgetId ? c.copyWith(isVisible: !c.isVisible) : c).toList();
    _saveWidgetConfigs();
    notifyListeners();
  }

  void toggleWidgetCollapse(String widgetId) {
    _widgetConfigs = _widgetConfigs.map((c) =>
      c.id == widgetId ? c.copyWith(isCollapsed: !c.isCollapsed) : c).toList();
    _saveWidgetConfigs();
    notifyListeners();
  }

  void markAllNotificationsRead() {
    _data = _data.copyWith(
      notifications: _data.notifications.map((n) =>
        DashboardNotification(id: n.id, title: n.title, message: n.message,
          severity: n.severity, category: n.category, timestamp: n.timestamp,
          isRead: true, actionRoute: n.actionRoute)).toList(),
    );
    notifyListeners();
  }

  void setWidgetSize(String widgetId, WidgetSize size) {
    _widgetConfigs = _widgetConfigs.map((c) =>
      c.id == widgetId ? c.copyWith(size: size) : c).toList();
    _saveWidgetConfigs();
    notifyListeners();
  }

  void reorderWidgets(int oldIndex, int newIndex) {
    if (oldIndex < newIndex) newIndex--;
    final item = _widgetConfigs.removeAt(oldIndex);
    _widgetConfigs.insert(newIndex, item);
    _widgetConfigs = _widgetConfigs.asMap().entries.map((e) =>
      e.value.copyWith(order: e.key)).toList();
    _saveWidgetConfigs();
    notifyListeners();
  }

  bool isWidgetVisible(String widgetId) {
    final config = _widgetConfigs.where((c) => c.id == widgetId);
    return config.isEmpty || config.first.isVisible;
  }

  bool isWidgetCollapsed(String widgetId) {
    final config = _widgetConfigs.where((c) => c.id == widgetId);
    return config.isNotEmpty && config.first.isCollapsed;
  }

  // ─── Role-Based Filtering ──────────────────────────

  void applyRoleFiltering(UserRole role, {List<Permission> permissions = const []}) {
    _widgetConfigs = WidgetVisibilityService.filterByRole(_widgetConfigs, role);
    _saveWidgetConfigs();
    notifyListeners();
  }

  // ─── Widget Config Persistence ─────────────────────

  Future<void> _saveWidgetConfigs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final configs = _widgetConfigs.map((c) => {
        'id': c.id, 'widgetType': c.widgetType,
        'size': c.size.name, 'order': c.order,
        'isVisible': c.isVisible, 'isCollapsed': c.isCollapsed,
      }).toList();
      await prefs.setString('dashboard_widget_configs', configs.toString());
    } catch (_) {}
  }

  static List<DashboardWidgetConfig> _defaultWidgetConfigs() {
    const ids = [
      'header', 'kpi_cards', 'filter_bar', 'sales_overview', 'live_operations',
      'ai_insights', 'top_selling', 'activity_timeline', 'customer_panel',
      'staff_panel', 'inventory_panel', 'finance_panel', 'menu_analytics',
      'peak_hours_heatmap', 'order_breakdown', 'notifications_panel',
    ];
    return List.generate(ids.length, (i) => DashboardWidgetConfig(
      id: ids[i], widgetType: ids[i], order: i, size: WidgetSize.medium));
  }

  @override
  void dispose() {
    _disposed = true;
    _refreshTimer?.cancel();
    for (final sub in _socketSubscriptions) {
      sub.cancel();
    }
    _socketSubscriptions.clear();
    super.dispose();
  }
}
