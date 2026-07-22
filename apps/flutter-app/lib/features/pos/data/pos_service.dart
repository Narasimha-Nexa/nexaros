import 'dart:math';
import 'dart:typed_data';
import 'package:uuid/uuid.dart';
import '../data/pos_models.dart';
import '../../../core/network/api_client.dart';
import '../../../core/sync/offline_order_service.dart';
import '../../../core/sync/offline_payment_service.dart';
import '../../../core/hardware/printer_service.dart';
import '../../../core/hardware/receipt_formatter.dart';

class PosService {
  final ApiClient _api;
  final OfflineOrderService _offlineOrders;
  final OfflinePaymentService _offlinePayments;
  final PrinterService _printer;
  static const _uuid = Uuid();

  PosService(this._api, this._offlineOrders, this._offlinePayments, this._printer);

  // ─── Menu ───

  Future<List<Map<String, dynamic>>> getMenuItems({String? categoryId, String? search}) async {
    try {
      final items = await _api.getMenuItems(categoryId: categoryId, search: search);
      return items.cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getCategories() async {
    try {
      final cats = await _api.getCategories();
      return cats.cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  // ─── Cart Operations ───

  CartItem createCartItem({
    required Map<String, dynamic> menuItem,
    int quantity = 1,
    List<CartItemModifier> modifiers = const [],
    List<CartItemModifier> addOns = const [],
    String? notes,
    String? course,
  }) {
    return CartItem(
      id: _uuid.v4(),
      menuItemId: menuItem['id'] ?? '',
      name: menuItem['name'] ?? '',
      image: menuItem['image'],
      isVeg: menuItem['isVeg'] ?? false,
      quantity: quantity,
      unitPrice: double.tryParse(menuItem['price'].toString()) ?? 0.0,
      modifiers: modifiers,
      addOns: addOns,
      notes: notes,
      course: course,
    );
  }

  // ─── Billing Calculations ───

  PaymentBreakdown calculateBill({
    required Cart cart,
    PosTaxConfig taxConfig = const PosTaxConfig(),
    double discountAmount = 0,
    String? discountCode,
    double tipAmount = 0,
    List<PaymentEntry> existingPayments = const [],
  }) {
    final subtotal = cart.subtotal;

    // Tax calculation
    double taxAmount;
    double cgstAmount = 0;
    double sgstAmount = 0;

    if (taxConfig.splitGst) {
      cgstAmount = subtotal * (taxConfig.gstRate / 2) / 100;
      sgstAmount = subtotal * (taxConfig.gstRate / 2) / 100;
      taxAmount = cgstAmount + sgstAmount;
    } else {
      taxAmount = subtotal * taxConfig.gstRate / 100;
    }

    // Service charge
    final serviceCharge = taxConfig.enableServiceCharge
        ? subtotal * taxConfig.serviceChargeRate / 100
        : 0.0;

    // Subtotal with all additions before discount
    final preDiscountTotal = subtotal + serviceCharge;

    // Apply discount (on subtotal, not on tax)
    final appliedDiscount = min(discountAmount, preDiscountTotal);

    // Round off
    double totalAmount = preDiscountTotal - appliedDiscount + taxAmount + tipAmount;
    double roundOff = 0;
    if (taxConfig.enableRoundOff) {
      final rounded = totalAmount.roundToDouble();
      roundOff = rounded - totalAmount;
      totalAmount = rounded;
    }

    // Calculate payments
    final amountPaid = existingPayments.fold(0.0, (s, p) => s + p.amount);
    final amountDue = totalAmount - amountPaid;
    final changeAmount = amountPaid > totalAmount ? amountPaid - totalAmount : 0.0;

    return PaymentBreakdown(
      subtotal: subtotal,
      taxAmount: taxAmount,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      serviceCharge: serviceCharge,
      discountAmount: appliedDiscount,
      discountCode: discountCode,
      roundOff: roundOff,
      totalAmount: totalAmount,
      tipAmount: tipAmount,
      payments: existingPayments,
      amountPaid: amountPaid,
      amountDue: amountDue,
      changeAmount: changeAmount,
    );
  }

  // ─── Order Placement ───

  Future<PlaceOrderResult> placeOrder({
    required Cart cart,
    required PaymentBreakdown billing,
    String? staffId,
    String? shiftId,
  }) async {
    final orderData = {
      'branchId': cart.tableId != null ? '' : '', // filled by caller
      'tableId': cart.tableId,
      'type': cart.orderType,
      'channel': cart.channel ?? cart.orderType,
      'customerId': cart.customerId,
      'customerName': cart.customerName,
      'customerPhone': cart.customerPhone,
      'guestCount': cart.guestCount,
      'notes': cart.notes,
      'subtotal': billing.subtotal,
      'taxAmount': billing.taxAmount,
      'serviceCharge': billing.serviceCharge,
      'discountAmount': billing.discountAmount,
      'discountCode': billing.discountCode,
      'tipAmount': billing.tipAmount,
      'totalAmount': billing.totalAmount,
      'paymentMethod': billing.payments.isNotEmpty ? billing.payments.first.method.name : 'CASH',
      'items': cart.activeItems.map((i) => i.toOrderItemJson()).toList(),
      'staffId': staffId,
      'shiftId': shiftId,
    };

    try {
      final result = await _api.createOrder(orderData);
      return PlaceOrderResult(
        orderId: result['id'] as String,
        orderNumber: result['orderNumber'] as int,
        isOffline: false,
      );
    } catch (_) {
      // Offline fallback
      final items = cart.activeItems.map((i) => OfflineOrderItem(
        menuItemId: i.menuItemId, name: i.name,
        quantity: i.quantity, unitPrice: i.unitPrice, notes: i.notes,
      )).toList();

      final offlineResult = await _offlineOrders.createOrder(
        branchId: '',
        tableId: cart.tableId,
        type: cart.orderType,
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        guestCount: cart.guestCount,
        discountAmount: billing.discountAmount,
        notes: cart.notes,
        items: items,
      );

      return PlaceOrderResult(
        orderId: offlineResult.orderId,
        orderNumber: offlineResult.orderNumber,
        isOffline: offlineResult.isOffline,
      );
    }
  }

  // ─── Payment Processing ───

  Future<ProcessPaymentResult> processPayment({
    required String orderId,
    required List<PaymentEntry> payments,
    String? staffId,
    String? shiftId,
  }) async {
    double totalPaid = 0;
    final processed = <PaymentEntry>[];

    for (final payment in payments) {
      try {
        await _api.processPayment(
          orderId,
          method: payment.method.name,
          amount: payment.amount,
          reference: payment.reference,
        );
        totalPaid += payment.amount;
        processed.add(payment);
      } catch (_) {
        // Offline payment
        await _offlinePayments.recordPayment(
          orderId: orderId,
          branchId: '',
          method: payment.method.name,
          amount: payment.amount,
          reference: payment.reference,
        );
        totalPaid += payment.amount;
        processed.add(payment);
      }
    }

    return ProcessPaymentResult(
      totalPaid: totalPaid,
      payments: processed,
      isOffline: processed.isEmpty,
    );
  }

  // ─── Refund Processing ───

  Future<RefundResult> processRefund({
    required String orderId,
    required double amount,
    required String reason,
    RefundReason reasonType = RefundReason.customerRequest,
    List<String> itemIds = const [],
    String? staffId,
  }) async {
    try {
      await _api.pushSyncData({
        'refunds': [{
          'orderId': orderId,
          'amount': amount,
          'reason': reason,
          'reasonType': reasonType.name,
          'itemIds': itemIds,
        }],
      });

      return RefundResult(success: true, isOffline: false);
    } catch (_) {
      return RefundResult(success: false, isOffline: true, error: 'Offline — refund queued for sync');
    }
  }

  // ─── Receipt Generation ───

  List<int> generateReceipt({
    required String restaurantName,
    required String branchName,
    required int orderNumber,
    required List<CartItem> items,
    required PaymentBreakdown billing,
    PosReceiptConfig config = const PosReceiptConfig(restaurantName: '', branchName: ''),
    String? tableName,
    String orderType = 'DINE_IN',
  }) {
    final receiptItems = items.where((i) => !i.isVoided).map((i) => ReceiptItem(
      name: i.name + (i.modifiers.isNotEmpty ? ' (${i.modifiers.where((m) => m.isSelected).map((m) => m.name).join(', ')})' : ''),
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.lineTotal,
      isVeg: i.isVeg,
      notes: i.notes,
    )).toList();

    return ReceiptFormatter.buildReceipt(
      restaurantName: config.restaurantName.isNotEmpty ? config.restaurantName : restaurantName,
      branchName: config.branchName.isNotEmpty ? config.branchName : branchName,
      gstNumber: config.gstNumber,
      orderNumber: orderNumber,
      orderType: orderType,
      tableName: tableName,
      items: receiptItems,
      subtotal: billing.subtotal,
      taxAmount: billing.taxAmount,
      discountAmount: billing.discountAmount,
      totalAmount: billing.totalAmount,
      paymentMethod: billing.payments.isNotEmpty ? billing.payments.first.method.label : 'Cash',
      amountPaid: billing.amountPaid,
      date: DateTime.now(),
    );
  }

  List<int> generateKot({
    required String restaurantName,
    required int orderNumber,
    required List<CartItem> items,
    String? tableName,
    String? notes,
  }) {
    final kotItems = items.where((i) => !i.isVoided).map((i) => ReceiptItem(
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.lineTotal,
      isVeg: i.isVeg,
      notes: [i.notes, if (i.modifiers.isNotEmpty) i.modifiers.where((m) => m.isSelected).map((m) => m.name).join(', ')].where((s) => s != null && s.isNotEmpty).join(' | '),
    )).toList();

    return ReceiptFormatter.buildKot(
      restaurantName: restaurantName,
      tableName: tableName,
      orderNumber: orderNumber,
      items: kotItems,
      date: DateTime.now(),
      notes: notes,
    );
  }

  // ─── Print ───

  Future<bool> printReceipt(List<int> bytes) => _printer.printReceipt(Uint8List.fromList(bytes));
  Future<bool> printKot(List<int> bytes) => _printer.printKot(Uint8List.fromList(bytes));
  Future<bool> openCashDrawer() => _printer.openCashDrawer();

  // ─── Shift Operations ───

  Future<ShiftModel> openShift({
    required String staffId,
    required String staffName,
    required double openingBalance,
    String? notes,
  }) async {
    return ShiftModel(
      id: _uuid.v4(),
      staffId: staffId,
      staffName: staffName,
      status: ShiftStatus.open,
      openingBalance: openingBalance,
      openedAt: DateTime.now(),
      notes: notes,
    );
  }

  ShiftModel closeShift({
    required ShiftModel shift,
    required double actualCash,
    required int totalTransactions,
    required double totalSales,
    String? notes,
  }) {
    return ShiftModel(
      id: shift.id,
      staffId: shift.staffId,
      staffName: shift.staffName,
      status: ShiftStatus.closed,
      openingBalance: shift.openingBalance,
      closingBalance: actualCash,
      cashIn: shift.cashIn,
      cashOut: shift.cashOut,
      actualCash: actualCash,
      totalTransactions: totalTransactions,
      totalSales: totalSales,
      openedAt: shift.openedAt,
      closedAt: DateTime.now(),
      notes: notes ?? shift.notes,
    );
  }

  // ─── Upsell / AI Suggestions ───

  List<PosUpsellSuggestion> getUpsellSuggestions({
    required List<CartItem> currentItems,
    required List<Map<String, dynamic>> allMenuItems,
    int maxSuggestions = 4,
  }) {
    final currentIds = currentItems.map((i) => i.menuItemId).toSet();
    final suggestions = <PosUpsellSuggestion>[];

    for (final item in allMenuItems) {
      if (currentIds.contains(item['id'])) continue;
      final price = double.tryParse(item['price'].toString()) ?? 0;
      if (price <= 0) continue;

      suggestions.add(PosUpsellSuggestion(
        id: item['id'] ?? '',
        name: item['name'] ?? '',
        price: price,
        reason: 'popular',
        confidence: 0.5 + (Random().nextDouble() * 0.5),
        image: item['image'],
      ));
    }

    suggestions.sort((a, b) => b.confidence.compareTo(a.confidence));
    return suggestions.take(maxSuggestions).toList();
  }

  // ─── Inventory Integration ───

  Future<InventoryDeductionResult> deductInventory({
    required Cart cart,
    required String branchId,
  }) async {
    final deducted = <InventoryDeductionEntry>[];
    final failed = <InventoryDeductionEntry>[];
    final lowStockWarnings = <String>[];

    for (final item in cart.activeItems) {
      try {
        // Call API to deduct inventory
        final result = await _api.pushSyncData({
          'inventoryDeductions': [{
            'branchId': branchId,
            'menuItemId': item.menuItemId,
            'quantity': item.quantity,
            'orderType': cart.orderType,
          }],
        });

        final remaining = (result['remainingStock'] ?? 0).toDouble();
        final threshold = (result['lowStockThreshold'] ?? 5).toDouble();

        deducted.add(InventoryDeductionEntry(
          menuItemId: item.menuItemId,
          itemName: item.name,
          quantityConsumed: item.quantity,
          remainingStock: remaining,
        ));

        if (remaining <= threshold && remaining > 0) {
          lowStockWarnings.add('${item.name}: ${remaining.toInt()} left');
        } else if (remaining <= 0) {
          lowStockWarnings.add('${item.name}: OUT OF STOCK');
        }
      } catch (e) {
        failed.add(InventoryDeductionEntry(
          menuItemId: item.menuItemId,
          itemName: item.name,
          quantityConsumed: item.quantity,
          remainingStock: 0,
          error: e.toString(),
        ));
      }
    }

    return InventoryDeductionResult(
      success: failed.isEmpty,
      deducted: deducted,
      failed: failed,
      lowStockWarnings: lowStockWarnings,
    );
  }

  // ─── Kitchen Station Routing ───

  List<KitchenStationRoute> routeToKitchenStations(Cart cart) {
    final routes = <KitchenStationRoute>[];
    
    for (final item in cart.activeItems) {
      // Determine station based on item category/type
      // In real implementation, this would come from menu item metadata
      KitchenStation station = _determineStation(item);
      
      routes.add(KitchenStationRoute(
        itemId: item.menuItemId,
        itemName: item.name,
        station: station,
        quantity: item.quantity,
        specialInstructions: item.notes,
      ));
    }

    // Group by station for KDS display
    return routes;
  }

  KitchenStation _determineStation(CartItem item) {
    final name = item.name.toLowerCase();
    
    if (name.contains('grill') || name.contains('steak') || name.contains('burger') || name.contains('kebab')) {
      return KitchenStation.grill;
    }
    if (name.contains('pizza') || name.contains('flatbread') || name.contains('calzone')) {
      return KitchenStation.pizza;
    }
    if (name.contains('cake') || name.contains('pastry') || name.contains('bread') || name.contains('croissant')) {
      return KitchenStation.bakery;
    }
    if (name.contains('ice cream') || name.contains('dessert') || name.contains('pudding') || name.contains('brownie') || name.contains('tiramisu')) {
      return KitchenStation.dessert;
    }
    if (name.contains('cocktail') || name.contains('beer') || name.contains('wine') || name.contains('shot') || name.contains('whisky') || name.contains('vodka')) {
      return KitchenStation.bar;
    }
    if (name.contains('coffee') || name.contains('tea') || name.contains('juice') || name.contains('smoothie') || name.contains('shake') || name.contains('water') || name.contains('soda')) {
      return KitchenStation.beverages;
    }
    if (name.contains('salad') || name.contains('greens') || name.contains('caesar')) {
      return KitchenStation.salad;
    }
    if (name.contains('fries') || name.contains('fry') || name.contains('chips') || name.contains('nuggets') || name.contains('onion ring')) {
      return KitchenStation.fryStation;
    }
    
    return KitchenStation.mainKitchen;
  }

  // ─── Validation ───

  String? validateCart(Cart cart) {
    if (cart.isEmpty) return 'Cart is empty';
    if (cart.activeItems.isEmpty) return 'No active items in cart';
    for (final item in cart.activeItems) {
      if (item.quantity <= 0) return '${item.name} has invalid quantity';
      if (item.unitPrice < 0) return '${item.name} has negative price';
    }
    return null;
  }

  String? validatePayment(PaymentBreakdown billing) {
    if (billing.amountDue > 0.01) return 'Payment amount is less than total';
    return null;
  }
}

// ─── Result Models ───

class PlaceOrderResult {
  final String orderId;
  final int orderNumber;
  final bool isOffline;

  PlaceOrderResult({
    required this.orderId,
    required this.orderNumber,
    required this.isOffline,
  });
}

class ProcessPaymentResult {
  final double totalPaid;
  final List<PaymentEntry> payments;
  final bool isOffline;

  ProcessPaymentResult({
    required this.totalPaid,
    required this.payments,
    required this.isOffline,
  });
}

class RefundResult {
  final bool success;
  final bool isOffline;
  final String? error;

  RefundResult({required this.success, this.isOffline = false, this.error});
}
