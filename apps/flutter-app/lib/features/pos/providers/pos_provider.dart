import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/services/event_bus.dart';
import '../data/pos_models.dart';
import '../data/pos_service.dart';

class PosState {
  final List<Map<String, dynamic>> categories;
  final List<Map<String, dynamic>> menuItems;
  final Cart cart;
  final List<HeldOrder> heldOrders;
  final List<PaymentEntry> pendingPayments;
  final PaymentBreakdown? billing;
  final PosTaxConfig taxConfig;
  final PosReceiptConfig receiptConfig;
  final bool isLoading;
  final bool isSearching;
  final String? error;
  final String? selectedCategoryId;
  final String? searchQuery;
  final ShiftModel? currentShift;
  final bool isOffline;
  final List<PosAuditEntry> auditLog;
  final List<Map<String, dynamic>> recentOrders;
  final String? orderChannelFilter;

  const PosState({
    this.categories = const [],
    this.menuItems = const [],
    required this.cart,
    this.heldOrders = const [],
    this.pendingPayments = const [],
    this.billing,
    this.taxConfig = const PosTaxConfig(),
    this.receiptConfig = const PosReceiptConfig(restaurantName: '', branchName: ''),
    this.isLoading = false,
    this.isSearching = false,
    this.error,
    this.selectedCategoryId,
    this.searchQuery,
    this.currentShift,
    this.isOffline = false,
    this.auditLog = const [],
    this.recentOrders = const [],
    this.orderChannelFilter,
  });

  List<Map<String, dynamic>> get filteredMenuItems {
    var items = menuItems.where((m) => m['isAvailable'] != false).toList();
    if (selectedCategoryId != null && selectedCategoryId!.isNotEmpty) {
      items = items.where((m) => m['categoryId'] == selectedCategoryId).toList();
    }
    if (searchQuery != null && searchQuery!.isNotEmpty) {
      final q = searchQuery!.toLowerCase();
      items = items.where((m) =>
        (m['name']?.toString().toLowerCase().contains(q) ?? false) ||
        (m['description']?.toString().toLowerCase().contains(q) ?? false)
      ).toList();
    }
    return items;
  }

  List<Map<String, dynamic>> get favoriteItems =>
      menuItems.where((m) => m['isFavorite'] == true).toList();

  List<Map<String, dynamic>> get recentlyOrdered =>
      menuItems.where((m) => m['lastOrderedAt'] != null).toList()
        ..sort((a, b) => (b['lastOrderedAt'] ?? '').toString().compareTo((a['lastOrderedAt'] ?? '').toString()));

  List<Map<String, dynamic>> get vegItems =>
      menuItems.where((m) => m['isVeg'] == true && m['isAvailable'] != false).toList();

  PosState copyWith({
    List<Map<String, dynamic>>? categories,
    List<Map<String, dynamic>>? menuItems,
    Cart? cart,
    List<HeldOrder>? heldOrders,
    List<PaymentEntry>? pendingPayments,
    PaymentBreakdown? billing,
    PosTaxConfig? taxConfig,
    PosReceiptConfig? receiptConfig,
    bool? isLoading,
    bool? isSearching,
    String? error,
    String? selectedCategoryId,
    String? searchQuery,
    ShiftModel? currentShift,
    bool? isOffline,
    List<PosAuditEntry>? auditLog,
    List<Map<String, dynamic>>? recentOrders,
    String? orderChannelFilter,
  }) {
    return PosState(
      categories: categories ?? this.categories,
      menuItems: menuItems ?? this.menuItems,
      cart: cart ?? this.cart,
      heldOrders: heldOrders ?? this.heldOrders,
      pendingPayments: pendingPayments ?? this.pendingPayments,
      billing: billing ?? this.billing,
      taxConfig: taxConfig ?? this.taxConfig,
      receiptConfig: receiptConfig ?? this.receiptConfig,
      isLoading: isLoading ?? this.isLoading,
      isSearching: isSearching ?? this.isSearching,
      error: error,
      selectedCategoryId: selectedCategoryId ?? this.selectedCategoryId,
      searchQuery: searchQuery ?? this.searchQuery,
      currentShift: currentShift ?? this.currentShift,
      isOffline: isOffline ?? this.isOffline,
      auditLog: auditLog ?? this.auditLog,
      recentOrders: recentOrders ?? this.recentOrders,
      orderChannelFilter: orderChannelFilter ?? this.orderChannelFilter,
    );
  }
}

class PosProvider extends ChangeNotifier {
  final EventBus _eventBus;
  final PosService _service;
  PosState _state = PosState(cart: Cart(id: ''));

  PosState get state => _state;
  PosService get service => _service;
  Cart get cart => _state.cart;

  StreamSubscription? _orderSub;
  StreamSubscription? _orderCreatedSub;
  StreamSubscription? _orderCancelledSub;
  StreamSubscription? _orderItemsChangedSub;
  StreamSubscription? _orderCompletedSub;
  StreamSubscription? _tableSub;
  StreamSubscription? _paymentSub;
  StreamSubscription? _billUpdatedSub;
  StreamSubscription? _paymentFailedSub;

  PosProvider(this._eventBus, this._service) {
    _setupRealtimeListeners();
  }

  void _setupRealtimeListeners() {
    _orderSub = _eventBus.on(BusEventType.orderStatusChanged).listen((_) => notifyListeners());
    _orderCreatedSub = _eventBus.on(BusEventType.orderCreated).listen((_) => notifyListeners());
    _orderCancelledSub = _eventBus.on(BusEventType.orderCancelled).listen((_) => notifyListeners());
    _orderItemsChangedSub = _eventBus.on(BusEventType.orderItemsChanged).listen((_) => notifyListeners());
    _orderCompletedSub = _eventBus.on(BusEventType.orderCompleted).listen((_) => notifyListeners());
    _tableSub = _eventBus.on(BusEventType.tableStatusChanged).listen((_) => notifyListeners());
    _paymentSub = _eventBus.on(BusEventType.paymentReceived).listen(_onPaymentReceived);
    _billUpdatedSub = _eventBus.on(BusEventType.diningBillUpdated).listen(_onBillUpdated);
    _paymentFailedSub = _eventBus.on(BusEventType.paymentFailed).listen(_onPaymentFailed);
  }

  /// Another POS device received a payment — update local billing state so
  /// the split payment sheet reflects the correct remaining balance.
  void _onBillUpdated(BusEvent event) {
    final data = event.data;
    final orderId = data['orderId'] as String?;
    final totalPaid = (data['totalPaid'] as num?)?.toDouble();
    final remaining = (data['remaining'] as num?)?.toDouble();

    if (orderId != null && totalPaid != null && remaining != null) {
      // Update billing if we're working on the same order
      if (_state.billing != null && _state.cart.id == orderId) {
        _state = _state.copyWith(
          billing: _state.billing!.copyWith(
            payments: _state.pendingPayments,
          ),
        );
      }
    }
    notifyListeners();
  }

  /// Payment received — auto-trigger receipt print if POS is active.
  void _onPaymentReceived(BusEvent event) {
    notifyListeners();
  }

  void _onPaymentFailed(BusEvent event) {
    notifyListeners();
  }

  // ─── Menu Loading ───

  Future<void> loadMenu() async {
    _state = _state.copyWith(isLoading: true, error: null);
    notifyListeners();

    try {
      final categories = await _service.getCategories();
      final menuItems = await _service.getMenuItems();
      _state = _state.copyWith(
        categories: categories,
        menuItems: menuItems,
        isLoading: false,
      );
    } catch (e) {
      _state = _state.copyWith(isLoading: false, error: e.toString());
    }
    notifyListeners();
  }

  // ─── Order List (Unified Multi-Channel) ───

  Future<void> loadOrders({String? status}) async {
    try {
      final api = _service.api;
      final orders = await api.getOrders(status: status, limit: 50);
      final orderList = orders.cast<Map<String, dynamic>>();
      _state = _state.copyWith(recentOrders: orderList);
      notifyListeners();
    } catch (_) {}
  }

  void setOrderChannelFilter(String? channel) {
    _state = _state.copyWith(orderChannelFilter: channel);
    notifyListeners();
  }

  List<Map<String, dynamic>> get filteredOrders {
    var orders = _state.recentOrders;
    if (_state.orderChannelFilter != null && _state.orderChannelFilter!.isNotEmpty) {
      orders = orders.where((o) => o['channel'] == _state.orderChannelFilter).toList();
    }
    return orders;
  }

  // ─── Category & Search ───

  void selectCategory(String? categoryId) {
    _state = _state.copyWith(selectedCategoryId: categoryId);
    notifyListeners();
  }

  void searchMenu(String? query) {
    _state = _state.copyWith(searchQuery: query, isSearching: query != null && query.isNotEmpty);
    notifyListeners();
  }

  // ─── Cart Operations ───

  void addToCart(Map<String, dynamic> menuItem, {
    int quantity = 1,
    List<CartItemModifier> modifiers = const [],
    List<CartItemModifier> addOns = const [],
    String? notes,
    String? course,
  }) {
    final item = _service.createCartItem(
      menuItem: menuItem, quantity: quantity,
      modifiers: modifiers, addOns: addOns, notes: notes, course: course,
    );
    _state.cart.addItem(item);
    _recalculateBilling();
    notifyListeners();
  }

  void removeFromCart(String itemId) {
    _state.cart.removeItem(itemId);
    _recalculateBilling();
    notifyListeners();
  }

  void updateCartQuantity(String itemId, int quantity) {
    _state.cart.updateQuantity(itemId, quantity);
    _recalculateBilling();
    notifyListeners();
  }

  void voidCartItem(String itemId) {
    _state.cart.voidItem(itemId);
    _recalculateBilling();
    _addAudit('VOID_ITEM', 'cart_item', itemId);
    notifyListeners();
  }

  void clearCart() {
    _state.cart.clear();
    _state = _state.copyWith(billing: null, pendingPayments: []);
    notifyListeners();
  }

  void updateItemNotes(String itemId, String? notes) {
    final idx = _state.cart.items.indexWhere((i) => i.id == itemId);
    if (idx >= 0) {
      _state.cart.items[idx].notes = notes;
      notifyListeners();
    }
  }

  // ─── Cart Metadata ───

  void setOrderType(String type) {
    _state.cart.orderType = type;
    _recalculateBilling();
    notifyListeners();
  }

  void setTable(String? tableId, String? tableNumber) {
    _state.cart.tableId = tableId;
    _state.cart.tableNumber = tableNumber;
    notifyListeners();
  }

  void setCustomer(String? id, String? name, String? phone) {
    _state.cart.customerId = id;
    _state.cart.customerName = name;
    _state.cart.customerPhone = phone;
    notifyListeners();
  }

  void setGuestCount(int? count) {
    _state.cart.guestCount = count;
    notifyListeners();
  }

  void setCartNotes(String? notes) {
    _state.cart.notes = notes;
    notifyListeners();
  }

  // ─── Hold / Recall ───

  void holdOrder({String? reason}) {
    if (_state.cart.isEmpty) return;
    final held = HeldOrder(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      cart: Cart.fromJson(_state.cart.toJson()),
      heldAt: DateTime.now(),
      reason: reason,
    );
    _state = _state.copyWith(
      heldOrders: [..._state.heldOrders, held],
    );
    clearCart();
    _addAudit('HOLD_ORDER', 'order', held.id);
    notifyListeners();
  }

  void recallOrder(String heldOrderId) {
    final idx = _state.heldOrders.indexWhere((h) => h.id == heldOrderId);
    if (idx < 0) return;
    final held = _state.heldOrders[idx];
    _state.cart.clear();
    // Restore items from held order
    for (final item in held.cart.items) {
      _state.cart.addItem(item);
    }
    _state.cart.orderType = held.cart.orderType;
    _state.cart.tableId = held.cart.tableId;
    _state.cart.tableNumber = held.cart.tableNumber;
    _state.cart.customerId = held.cart.customerId;
    _state.cart.customerName = held.cart.customerName;
    _state.cart.customerPhone = held.cart.customerPhone;
    _state.cart.guestCount = held.cart.guestCount;
    _state = _state.copyWith(
      heldOrders: _state.heldOrders.where((h) => h.id != heldOrderId).toList(),
    );
    _recalculateBilling();
    _addAudit('RECALL_ORDER', 'order', heldOrderId);
    notifyListeners();
  }

  void discardHeldOrder(String heldOrderId) {
    _state = _state.copyWith(
      heldOrders: _state.heldOrders.where((h) => h.id != heldOrderId).toList(),
    );
    notifyListeners();
  }

  // ─── Billing ───

  void _recalculateBilling() {
    if (_state.cart.isEmpty) {
      _state = _state.copyWith(billing: null);
      return;
    }
    final billing = _service.calculateBill(
      cart: _state.cart,
      taxConfig: _state.taxConfig,
      tipAmount: _state.billing?.tipAmount ?? 0,
      existingPayments: _state.pendingPayments,
    );
    _state = _state.copyWith(billing: billing);
  }

  void applyDiscount(double amount, {String? code}) {
    _recalculateBilling();
    if (_state.billing == null) return;
    _state = _state.copyWith(
      billing: _state.billing!.copyWith(discountAmount: amount, discountCode: code),
    );
    _addAudit('APPLY_DISCOUNT', 'cart', _state.cart.id, newValue: {'amount': amount, 'code': code});
    notifyListeners();
  }

  void removeDiscount() {
    _recalculateBilling();
    notifyListeners();
  }

  void setTip(double amount) {
    _recalculateBilling();
    if (_state.billing == null) return;
    _state = _state.copyWith(
      billing: _state.billing!.copyWith(tipAmount: amount),
    );
    notifyListeners();
  }

  // ─── Payment ───

  void addPayment(PosPaymentMethod method, double amount, {String? reference}) {
    final entry = PaymentEntry(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      method: method, amount: amount, reference: reference,
    );
    final payments = [..._state.pendingPayments, entry];
    _recalculateBillingWithPayments(payments);
    _addAudit('ADD_PAYMENT', 'payment', entry.id, newValue: {'method': method.name, 'amount': amount});
    notifyListeners();
  }

  void removePayment(String paymentId) {
    final payments = _state.pendingPayments.where((p) => p.id != paymentId).toList();
    _recalculateBillingWithPayments(payments);
    notifyListeners();
  }

  void clearPayments() {
    _recalculateBillingWithPayments([]);
    notifyListeners();
  }

  void _recalculateBillingWithPayments(List<PaymentEntry> payments) {
    if (_state.cart.isEmpty) return;
    final billing = _service.calculateBill(
      cart: _state.cart,
      taxConfig: _state.taxConfig,
      tipAmount: _state.billing?.tipAmount ?? 0,
      existingPayments: payments,
    );
    _state = _state.copyWith(billing: billing, pendingPayments: payments);
  }

  // ─── Place Order ───

  Future<PlaceOrderResult?> placeOrder({String? staffId, String? shiftId}) async {
    if (_state.billing == null || _state.cart.isEmpty) return null;

    final validation = _service.validateCart(_state.cart);
    if (validation != null) {
      _state = _state.copyWith(error: validation);
      notifyListeners();
      return null;
    }

    try {
      final result = await _service.placeOrder(
        cart: _state.cart,
        billing: _state.billing!,
        staffId: staffId,
        shiftId: shiftId,
      );

      // Print KOT
      if (!result.isOffline) {
        final kotBytes = _service.generateKot(
          restaurantName: _state.receiptConfig.restaurantName,
          orderNumber: result.orderNumber,
          items: _state.cart.activeItems,
          tableName: _state.cart.tableNumber,
          notes: _state.cart.notes,
        );
        await _service.printKot(kotBytes);
      }

      _addAudit('PLACE_ORDER', 'order', result.orderId, newValue: {
        'orderNumber': result.orderNumber, 'total': _state.billing!.totalAmount,
      });

      clearCart();
      return result;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  // ─── Shift Management ───

  Future<void> openShift(String staffId, String staffName, double openingBalance) async {
    final shift = await _service.openShift(
      staffId: staffId, staffName: staffName, openingBalance: openingBalance,
    );
    _state = _state.copyWith(currentShift: shift);
    _addAudit('OPEN_SHIFT', 'shift', shift.id);
    notifyListeners();
  }

  void closeShift(double actualCash, {String? notes}) {
    if (_state.currentShift == null) return;
    final closed = _service.closeShift(
      shift: _state.currentShift!,
      actualCash: actualCash,
      totalTransactions: _state.currentShift!.totalTransactions,
      totalSales: _state.currentShift!.totalSales,
      notes: notes,
    );
    _state = _state.copyWith(currentShift: closed);
    _addAudit('CLOSE_SHIFT', 'shift', closed.id);
    notifyListeners();
  }

  // ─── Refund ───

  Future<RefundResult> processRefund({
    required String orderId,
    required double amount,
    required String reason,
    RefundReason reasonType = RefundReason.customerRequest,
    List<String> itemIds = const [],
  }) async {
    final result = await _service.processRefund(
      orderId: orderId, amount: amount, reason: reason,
      reasonType: reasonType, itemIds: itemIds,
    );
    _addAudit('PROCESS_REFUND', 'order', orderId, newValue: {'amount': amount, 'reason': reason});
    notifyListeners();
    return result;
  }

  // ─── Receipt ───

  Future<void> printReceipt({
    required int orderNumber,
    required List<CartItem> items,
    required PaymentBreakdown billing,
    String? tableName,
  }) async {
    final bytes = _service.generateReceipt(
      restaurantName: _state.receiptConfig.restaurantName,
      branchName: _state.receiptConfig.branchName,
      orderNumber: orderNumber,
      items: items,
      billing: billing,
      config: _state.receiptConfig,
      tableName: tableName,
      orderType: _state.cart.orderType,
    );
    await _service.printReceipt(bytes);
    await _service.openCashDrawer();
  }

  // ─── Config ───

  void updateTaxConfig(PosTaxConfig config) {
    _state = _state.copyWith(taxConfig: config);
    _recalculateBilling();
    notifyListeners();
  }

  void updateReceiptConfig(PosReceiptConfig config) {
    _state = _state.copyWith(receiptConfig: config);
    notifyListeners();
  }

  // ─── AI Suggestions ───

  List<PosUpsellSuggestion> getUpsellSuggestions() {
    return _service.getUpsellSuggestions(
      currentItems: _state.cart.activeItems,
      allMenuItems: _state.menuItems,
    );
  }

  // ─── Audit ───

  void _addAudit(String action, String entityType, String entityId, {Map<String, dynamic>? oldValue, Map<String, dynamic>? newValue}) {
    _state = _state.copyWith(
      auditLog: [..._state.auditLog, PosAuditEntry(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        action: action, entityType: entityType, entityId: entityId,
        oldValue: oldValue, newValue: newValue,
        staffId: '', staffName: 'Current User',
        timestamp: DateTime.now(),
      )],
    );
  }

  // ─── Error Clearing ───

  void clearError() {
    _state = _state.copyWith(error: null);
    notifyListeners();
  }

  @override
  void dispose() {
    _orderSub?.cancel();
    _orderCreatedSub?.cancel();
    _orderCancelledSub?.cancel();
    _orderItemsChangedSub?.cancel();
    _orderCompletedSub?.cancel();
    _tableSub?.cancel();
    _paymentSub?.cancel();
    _billUpdatedSub?.cancel();
    _paymentFailedSub?.cancel();
    super.dispose();
  }
}
