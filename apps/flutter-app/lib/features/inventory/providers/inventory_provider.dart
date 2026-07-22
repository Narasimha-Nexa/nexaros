import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/event_bus.dart';
import '../data/inventory_models.dart';
import '../data/inventory_service.dart';

class InventoryState {
  final List<InventoryItem> items;
  final List<InventoryItem> lowStockItems;
  final List<Supplier> suppliers;
  final List<PurchaseOrder> purchaseOrders;
  final List<StockMovement> recentMovements;
  final InventoryDashboardData dashboard;
  final InventoryFilter filter;
  final bool isLoading;
  final String? error;
  final String? selectedWarehouseId;
  final Set<String> selectedItemIds;
  final List<InventoryInsight> insights;
  final List<PurchaseSuggestion> suggestions;
  final int currentPage;
  static const int pageSize = 50;

  const InventoryState({
    this.items = const [],
    this.lowStockItems = const [],
    this.suppliers = const [],
    this.purchaseOrders = const [],
    this.recentMovements = const [],
    this.dashboard = const InventoryDashboardData(),
    this.filter = const InventoryFilter(),
    this.isLoading = false,
    this.error,
    this.selectedWarehouseId,
    this.selectedItemIds = const {},
    this.insights = const [],
    this.suggestions = const [],
    this.currentPage = 1,
  });

  InventoryState copyWith({
    List<InventoryItem>? items,
    List<InventoryItem>? lowStockItems,
    List<Supplier>? suppliers,
    List<PurchaseOrder>? purchaseOrders,
    List<StockMovement>? recentMovements,
    InventoryDashboardData? dashboard,
    InventoryFilter? filter,
    bool? isLoading,
    String? error,
    bool clearError = false,
    String? selectedWarehouseId,
    bool clearWarehouse = false,
    Set<String>? selectedItemIds,
    List<InventoryInsight>? insights,
    List<PurchaseSuggestion>? suggestions,
    int? currentPage,
  }) {
    return InventoryState(
      items: items ?? this.items,
      lowStockItems: lowStockItems ?? this.lowStockItems,
      suppliers: suppliers ?? this.suppliers,
      purchaseOrders: purchaseOrders ?? this.purchaseOrders,
      recentMovements: recentMovements ?? this.recentMovements,
      dashboard: dashboard ?? this.dashboard,
      filter: filter ?? this.filter,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      selectedWarehouseId: clearWarehouse ? null : (selectedWarehouseId ?? this.selectedWarehouseId),
      selectedItemIds: selectedItemIds ?? this.selectedItemIds,
      insights: insights ?? this.insights,
      suggestions: suggestions ?? this.suggestions,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  // ─── Computed Getters ───

  List<InventoryItem> get filteredItems => _applyFilter(items, filter);

  /// Client-side paginated items from the filtered list.
  List<InventoryItem> get paginatedItems {
    final filtered = filteredItems;
    final end = (currentPage * pageSize).clamp(0, filtered.length);
    return filtered.sublist(0, end);
  }

  bool get hasMoreItems => paginatedItems.length < filteredItems.length;
  int get totalPages => (filteredItems.length / pageSize).ceil().clamp(1, 999);

  void loadNextPage() {
    if (hasMoreItems) {
      // Trigger is handled by the provider
    }
  }

  int get totalItems => items.length;
  int get lowStockCount => items.where((i) => i.isLowStock && !i.isOutOfStock).length;
  int get criticalStockCount => items.where((i) => i.isOutOfStock).length;
  int get overstockCount => items.where((i) => i.isOverstock).length;
  double get totalValue => items.fold<double>(0, (sum, i) => sum + i.stockValue);
  int get pendingPOCount => purchaseOrders.where((p) => p.status.isActive).length;

  List<InventoryItem> get itemsByCategory {
    final map = <String, List<InventoryItem>>{};
    for (final item in items) {
      final cat = item.category ?? 'Uncategorized';
      map.putIfAbsent(cat, () => []).add(item);
    }
    return items;
  }

  Map<String, double> get categoryValues {
    final map = <String, double>{};
    for (final item in items) {
      final cat = item.category ?? 'Uncategorized';
      map[cat] = (map[cat] ?? 0) + item.stockValue;
    }
    return map;
  }

  List<InventoryItem> _applyFilter(List<InventoryItem> items, InventoryFilter filter) {
    var result = items;

    if (filter.searchQuery != null && filter.searchQuery!.isNotEmpty) {
      final q = filter.searchQuery!.toLowerCase();
      result = result.where((i) =>
        i.name.toLowerCase().contains(q) ||
        (i.sku?.toLowerCase().contains(q) ?? false) ||
        (i.barcode?.toLowerCase().contains(q) ?? false) ||
        (i.category?.toLowerCase().contains(q) ?? false)
      ).toList();
    }

    if (filter.type != null) {
      result = result.where((i) => i.type == filter.type).toList();
    }

    if (filter.stockLevel != null) {
      result = result.where((i) => i.stockLevel == filter.stockLevel).toList();
    }

    if (filter.category != null && filter.category!.isNotEmpty) {
      result = result.where((i) => i.category == filter.category).toList();
    }

    if (filter.showLowStockOnly) {
      result = result.where((i) => i.isLowStock && !i.isOutOfStock).toList();
    }

    if (filter.showOutOfStockOnly) {
      result = result.where((i) => i.isOutOfStock).toList();
    }

    return result;
  }
}

class InventoryProvider extends ChangeNotifier {
  final ApiClient _api;
  late final InventoryService _service;

  InventoryState _state = const InventoryState();
  final List<StreamSubscription> _subscriptions = [];

  InventoryState get state => _state;
  InventoryService get service => _service;

  InventoryProvider(this._api, EventBus eventBus) {
    _service = InventoryService(_api);
    _listenToEvents(eventBus);
  }

  void _listenToEvents(EventBus eventBus) {
    _subscriptions.add(eventBus.listen(BusEventType.inventoryUpdated, (_) => loadItems()));
    _subscriptions.add(eventBus.listen(BusEventType.stockLow, (_) => loadLowStock()));
  }

  // ─── Loading ───

  Future<void> loadAll({String? branchId}) async {
    _state = _state.copyWith(isLoading: true, clearError: true);
    notifyListeners();

    try {
      final results = await Future.wait([
        _service.loadItems(branchId: branchId),
        _service.loadLowStock(branchId: branchId),
        _service.loadSuppliers(),
        _service.loadPurchaseOrders(branchId: branchId),
      ]);

      final items = results[0] as List<InventoryItem>;
      final lowStock = results[1] as List<InventoryItem>;
      final suppliers = results[2] as List<Supplier>;
      final po = results[3] as List<PurchaseOrder>;

      final dashboard = InventoryDashboardData.fromItems(items, po);
      final insights = _service.generateInsights(items, po);
      final suggestions = _service.generatePurchaseSuggestions(items);

      final movements = <StockMovement>[];
      for (final item in items) {
        movements.addAll(item.recentMovements);
      }
      movements.sort((a, b) => b.createdAt.compareTo(a.createdAt));

      _state = _state.copyWith(
        items: items,
        lowStockItems: lowStock,
        suppliers: suppliers,
        purchaseOrders: po,
        recentMovements: movements.take(50).toList(),
        dashboard: dashboard,
        insights: insights,
        suggestions: suggestions,
        isLoading: false,
      );
    } catch (e) {
      _state = _state.copyWith(isLoading: false, error: e.toString());
    }
    notifyListeners();
  }

  Future<void> loadItems({String? branchId}) async {
    try {
      final items = await _service.loadItems(branchId: branchId);
      final dashboard = InventoryDashboardData.fromItems(items, _state.purchaseOrders);
      final suggestions = _service.generatePurchaseSuggestions(items);
      _state = _state.copyWith(items: items, dashboard: dashboard, suggestions: suggestions, currentPage: 1);
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  /// Load next page of items (client-side pagination).
  void loadMoreItems() {
    if (_state.hasMoreItems) {
      _state = _state.copyWith(currentPage: _state.currentPage + 1);
      notifyListeners();
    }
  }

  Future<void> loadLowStock({String? branchId}) async {
    try {
      final lowStock = await _service.loadLowStock(branchId: branchId);
      _state = _state.copyWith(lowStockItems: lowStock);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> loadSuppliers({String? tenantId}) async {
    try {
      final suppliers = await _service.loadSuppliers(tenantId: tenantId);
      _state = _state.copyWith(suppliers: suppliers);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> loadPurchaseOrders({String? branchId}) async {
    try {
      final po = await _service.loadPurchaseOrders(branchId: branchId);
      _state = _state.copyWith(purchaseOrders: po);
      notifyListeners();
    } catch (_) {}
  }

  // ─── Items CRUD ───

  Future<bool> createItem(Map<String, dynamic> data) async {
    final item = await _service.createItem(data);
    if (item != null) {
      await loadItems();
      return true;
    }
    return false;
  }

  Future<bool> updateItem(String id, Map<String, dynamic> data) async {
    final item = await _service.updateItem(id, data);
    if (item != null) {
      await loadItems();
      return true;
    }
    return false;
  }

  Future<bool> deleteItem(String id) async {
    final success = await _service.deleteItem(id);
    if (success) {
      await loadItems();
      return true;
    }
    return false;
  }

  // ─── Stock Operations ───

  Future<bool> adjustStock(String itemId, StockMovementType type, double quantity, {String? notes, double? unitCost}) async {
    final success = await _service.adjustStock(itemId, type, quantity, notes: notes, unitCost: unitCost);
    if (success) {
      await loadItems();
      await loadLowStock();
      return true;
    }
    return false;
  }

  Future<bool> receiveStock(String itemId, double quantity, {String? notes, double? unitCost}) async {
    return adjustStock(itemId, StockMovementType.receive, quantity, notes: notes, unitCost: unitCost);
  }

  Future<bool> wasteStock(String itemId, double quantity, {String? notes}) async {
    return adjustStock(itemId, StockMovementType.waste, quantity, notes: notes);
  }

  // ─── Supplier CRUD ───

  Future<bool> createSupplier(Map<String, dynamic> data) async {
    final supplier = await _service.createSupplier(data);
    if (supplier != null) {
      await loadSuppliers();
      return true;
    }
    return false;
  }

  Future<bool> updateSupplier(String id, Map<String, dynamic> data) async {
    final supplier = await _service.updateSupplier(id, data);
    if (supplier != null) {
      await loadSuppliers();
      return true;
    }
    return false;
  }

  // ─── Purchase Orders ───

  Future<bool> createPurchaseOrder(Map<String, dynamic> data) async {
    final po = await _service.createPurchaseOrder(data);
    if (po != null) {
      await loadPurchaseOrders();
      return true;
    }
    return false;
  }

  Future<bool> updatePurchaseStatus(String id, PurchaseOrderStatus status) async {
    final success = await _service.updatePurchaseStatus(id, status);
    if (success) {
      await loadPurchaseOrders();
      return true;
    }
    return false;
  }

  // ─── Filters ───

  void setFilter(InventoryFilter filter) {
    _state = _state.copyWith(filter: filter);
    notifyListeners();
  }

  void updateFilter(InventoryFilter Function(InventoryFilter) updater) {
    _state = _state.copyWith(filter: updater(_state.filter));
    notifyListeners();
  }

  void clearFilters() {
    _state = _state.copyWith(filter: const InventoryFilter().clearAll());
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _state = _state.copyWith(filter: _state.filter.copyWith(searchQuery: query));
    notifyListeners();
  }

  void setWarehouseFilter(String? warehouseId) {
    _state = _state.copyWith(selectedWarehouseId: warehouseId);
    notifyListeners();
  }

  // ─── Selection ───

  void toggleItemSelection(String itemId) {
    final selected = Set<String>.from(_state.selectedItemIds);
    if (selected.contains(itemId)) {
      selected.remove(itemId);
    } else {
      selected.add(itemId);
    }
    _state = _state.copyWith(selectedItemIds: selected);
    notifyListeners();
  }

  void clearSelection() {
    _state = _state.copyWith(selectedItemIds: {});
    notifyListeners();
  }

  // ─── Audit ───

  List<Map<String, dynamic>> get auditLog => _service.auditLog;

  // ─── Cleanup ───

  @override
  void dispose() {
    for (final sub in _subscriptions) {
      sub.cancel();
    }
    super.dispose();
  }
}
