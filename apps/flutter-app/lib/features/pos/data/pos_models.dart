import 'package:flutter/material.dart';

// ─── Cart Models ───

class CartItemModifier {
  final String id;
  final String name;
  final double price;
  final bool isSelected;

  const CartItemModifier({
    required this.id,
    required this.name,
    required this.price,
    this.isSelected = true,
  });

  CartItemModifier copyWith({bool? isSelected}) {
    return CartItemModifier(
      id: id, name: name, price: price,
      isSelected: isSelected ?? this.isSelected,
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'price': price};
  factory CartItemModifier.fromJson(Map<String, dynamic> j) => CartItemModifier(
    id: j['id'] ?? '', name: j['name'] ?? '', price: (j['price'] ?? 0).toDouble(),
  );
}

class CartItem {
  final String id;
  final String menuItemId;
  final String name;
  final String? image;
  final bool isVeg;
  int quantity;
  double unitPrice;
  final List<CartItemModifier> modifiers;
  final List<CartItemModifier> addOns;
  String? notes;
  String? course; // e.g., 'STARTER', 'MAIN', 'DESSERT'
  bool isVoided;

  CartItem({
    required this.id,
    required this.menuItemId,
    required this.name,
    this.image,
    this.isVeg = false,
    this.quantity = 1,
    required this.unitPrice,
    this.modifiers = const [],
    this.addOns = const [],
    this.notes,
    this.course,
    this.isVoided = false,
  });

  double get modifierTotal => modifiers.where((m) => m.isSelected).fold(0.0, (s, m) => s + m.price);
  double get addOnTotal => addOns.where((a) => a.isSelected).fold(0.0, (s, a) => s + a.price);
  double get itemTotal => (unitPrice + modifierTotal + addOnTotal) * quantity;
  double get lineTotal => (unitPrice + modifierTotal + addOnTotal) * quantity;

  CartItem copyWith({int? quantity, String? notes, bool? isVoided, List<CartItemModifier>? modifiers, List<CartItemModifier>? addOns}) {
    return CartItem(
      id: id, menuItemId: menuItemId, name: name, image: image, isVeg: isVeg,
      quantity: quantity ?? this.quantity, unitPrice: unitPrice,
      modifiers: modifiers ?? this.modifiers, addOns: addOns ?? this.addOns,
      notes: notes ?? this.notes, course: course, isVoided: isVoided ?? this.isVoided,
    );
  }

  Map<String, dynamic> toOrderItemJson() => {
    'menuItemId': menuItemId, 'name': name, 'quantity': quantity,
    'unitPrice': unitPrice, 'notes': notes, 'isVeg': isVeg,
    'modifiers': modifiers.map((m) => m.toJson()).toList(),
    'addOns': addOns.map((a) => a.toJson()).toList(),
    if (course != null) 'course': course,
  };

  Map<String, dynamic> toJson() => {
    'id': id, 'menuItemId': menuItemId, 'name': name, 'image': image,
    'isVeg': isVeg, 'quantity': quantity, 'unitPrice': unitPrice,
    'modifiers': modifiers.map((m) => m.toJson()).toList(),
    'addOns': addOns.map((a) => a.toJson()).toList(),
    'notes': notes, 'course': course, 'isVoided': isVoided,
  };

  factory CartItem.fromJson(Map<String, dynamic> j) => CartItem(
    id: j['id'] ?? '', menuItemId: j['menuItemId'] ?? '', name: j['name'] ?? '',
    image: j['image'], isVeg: j['isVeg'] ?? false, quantity: j['quantity'] ?? 1,
    unitPrice: (j['unitPrice'] ?? 0).toDouble(),
    modifiers: (j['modifiers'] as List<dynamic>? ?? []).map((m) => CartItemModifier.fromJson(m)).toList(),
    addOns: (j['addOns'] as List<dynamic>? ?? []).map((a) => CartItemModifier.fromJson(a)).toList(),
    notes: j['notes'], course: j['course'], isVoided: j['isVoided'] ?? false,
  );
}

class Cart {
  final String id;
  final String? orderId; // Linked server order ID
  String? customerId;
  String? customerName;
  String? customerPhone;
  String? tableId;
  String? tableNumber;
  int? guestCount;
  String orderType; // DINE_IN, TAKEAWAY, DELIVERY, etc.
  String? channel;
  String? notes;
  final List<CartItem> _items;
  DateTime createdAt;
  DateTime updatedAt;

  Cart({
    required this.id,
    this.orderId,
    this.customerId,
    this.customerName,
    this.customerPhone,
    this.tableId,
    this.tableNumber,
    this.guestCount,
    this.orderType = 'DINE_IN',
    this.channel,
    this.notes,
    List<CartItem> items = const [],
    DateTime? createdAt,
    DateTime? updatedAt,
  }) : _items = List.from(items),
       createdAt = createdAt ?? DateTime.now(),
       updatedAt = updatedAt ?? DateTime.now();

  List<CartItem> get items => List.unmodifiable(_items);
  List<CartItem> get activeItems => _items.where((i) => !i.isVoided).toList();
  bool get isEmpty => _items.isEmpty || activeItems.isEmpty;
  int get itemCount => activeItems.fold(0, (s, i) => s + i.quantity);

  double get subtotal => activeItems.fold(0.0, (s, i) => s + i.lineTotal);
  double getModifierTotal() => activeItems.fold(0.0, (s, i) => s + i.modifierTotal * i.quantity);
  double getAddOnTotal() => activeItems.fold(0.0, (s, i) => s + i.addOnTotal * i.quantity);

  void addItem(CartItem item) {
    final existing = _items.indexWhere((i) =>
      i.menuItemId == item.menuItemId &&
      i.modifiers.length == item.modifiers.length &&
      i.modifiers.every((m) => item.modifiers.any((om) => om.id == m.id && om.isSelected == m.isSelected)) &&
      i.notes == item.notes &&
      !i.isVoided);
    if (existing >= 0) {
      _items[existing].quantity += item.quantity;
    } else {
      _items.add(item);
    }
    updatedAt = DateTime.now();
  }

  void removeItem(String itemId) {
    _items.removeWhere((i) => i.id == itemId);
    updatedAt = DateTime.now();
  }

  void updateQuantity(String itemId, int quantity) {
    final idx = _items.indexWhere((i) => i.id == itemId);
    if (idx >= 0) {
      if (quantity <= 0) {
        _items.removeAt(idx);
      } else {
        _items[idx].quantity = quantity;
      }
      updatedAt = DateTime.now();
    }
  }

  void voidItem(String itemId) {
    final idx = _items.indexWhere((i) => i.id == itemId);
    if (idx >= 0) {
      _items[idx].isVoided = true;
      updatedAt = DateTime.now();
    }
  }

  void clear() {
    _items.clear();
    updatedAt = DateTime.now();
  }

  Map<String, dynamic> toJson() => {
    'id': id, 'orderId': orderId, 'customerId': customerId,
    'customerName': customerName, 'customerPhone': customerPhone,
    'tableId': tableId, 'tableNumber': tableNumber, 'guestCount': guestCount,
    'orderType': orderType, 'channel': channel, 'notes': notes,
    'items': _items.map((i) => i.toJson()).toList(),
    'createdAt': createdAt.toIso8601String(), 'updatedAt': updatedAt.toIso8601String(),
  };

  factory Cart.fromJson(Map<String, dynamic> j) => Cart(
    id: j['id'] ?? '', orderId: j['orderId'], customerId: j['customerId'],
    customerName: j['customerName'], customerPhone: j['customerPhone'],
    tableId: j['tableId'], tableNumber: j['tableNumber'], guestCount: j['guestCount'],
    orderType: j['orderType'] ?? 'DINE_IN', channel: j['channel'], notes: j['notes'],
    items: (j['items'] as List<dynamic>? ?? []).map((i) => CartItem.fromJson(i)).toList(),
    createdAt: j['createdAt'] != null ? DateTime.parse(j['createdAt']) : null,
    updatedAt: j['updatedAt'] != null ? DateTime.parse(j['updatedAt']) : null,
  );
}

// ─── Held Orders ───

class HeldOrder {
  final String id;
  final Cart cart;
  final String? staffName;
  final DateTime heldAt;
  final String? reason;

  HeldOrder({
    required this.id,
    required this.cart,
    this.staffName,
    required this.heldAt,
    this.reason,
  });
}

// ─── Payment Models ───

enum PosPaymentMethod {
  cash('Cash', Icons.money, Color(0xFF4CAF50)),
  creditCard('Credit Card', Icons.credit_card, Color(0xFF2196F3)),
  debitCard('Debit Card', Icons.credit_card, Color(0xFF9C27B0)),
  upi('UPI', Icons.qr_code, Color(0xFFFF9800)),
  googlePay('Google Pay', Icons.payment, Color(0xFF4285F4)),
  phonePe('PhonePe', Icons.phone_android, Color(0xFF5F259F)),
  paytm('Paytm', Icons.account_balance_wallet, Color(0xFF00BAF2)),
  wallet('Wallet', Icons.account_balance_wallet, Color(0xFF795548)),
  giftCard('Gift Card', Icons.card_giftcard, Color(0xFFE91E63)),
  voucher('Voucher', Icons.receipt, Color(0xFF009688)),
  loyaltyPoints('Loyalty Points', Icons.stars, Color(0xFFFFC107)),
  split('Split Payment', Icons.call_split, Color(0xFF607D8B)),
  partial('Partial Payment', Icons.percent, Color(0xFF78909C));

  final String label;
  final IconData icon;
  final Color color;
  const PosPaymentMethod(this.label, this.icon, this.color);
}

class PaymentEntry {
  final String id;
  final PosPaymentMethod method;
  final double amount;
  final String? reference;
  final DateTime createdAt;

  PaymentEntry({
    required this.id,
    required this.method,
    required this.amount,
    this.reference,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'id': id, 'method': method.name, 'amount': amount, 'reference': reference,
    'createdAt': createdAt.toIso8601String(),
  };
}

class PaymentBreakdown {
  final double subtotal;
  final double taxAmount;
  final double cgstAmount;
  final double sgstAmount;
  final double serviceCharge;
  final double discountAmount;
  final String? discountCode;
  final double roundOff;
  final double totalAmount;
  final double tipAmount;
  final List<PaymentEntry> payments;
  final double amountPaid;
  final double amountDue;
  final double changeAmount;

  const PaymentBreakdown({
    required this.subtotal,
    required this.taxAmount,
    this.cgstAmount = 0,
    this.sgstAmount = 0,
    this.serviceCharge = 0,
    this.discountAmount = 0,
    this.discountCode,
    this.roundOff = 0,
    required this.totalAmount,
    this.tipAmount = 0,
    this.payments = const [],
    this.amountPaid = 0,
    this.amountDue = 0,
    this.changeAmount = 0,
  });

  bool get isFullyPaid => amountDue <= 0;
  bool get hasTip => tipAmount > 0;

  PaymentBreakdown copyWith({
    double? taxAmount, double? cgstAmount, double? sgstAmount,
    double? serviceCharge, double? discountAmount, String? discountCode,
    double? roundOff, double? tipAmount, List<PaymentEntry>? payments,
  }) {
    final newDiscount = discountAmount ?? this.discountAmount;
    final newTip = tipAmount ?? this.tipAmount;
    final newServiceCharge = serviceCharge ?? this.serviceCharge;
    final newTax = taxAmount ?? this.taxAmount;
    final newTotal = subtotal - newDiscount + newTax + newServiceCharge + newTip + (roundOff ?? this.roundOff);
    final newPaid = (payments ?? this.payments).fold(0.0, (s, p) => s + p.amount);
    return PaymentBreakdown(
      subtotal: subtotal, taxAmount: newTax,
      cgstAmount: cgstAmount ?? this.cgstAmount,
      sgstAmount: sgstAmount ?? this.sgstAmount,
      serviceCharge: newServiceCharge, discountAmount: newDiscount,
      discountCode: discountCode ?? this.discountCode,
      roundOff: roundOff ?? this.roundOff, totalAmount: newTotal,
      tipAmount: newTip, payments: payments ?? this.payments,
      amountPaid: newPaid, amountDue: newTotal - newPaid,
      changeAmount: newPaid > newTotal ? newPaid - newTotal : 0,
    );
  }
}

// ─── Shift Models ───

enum ShiftStatus { open, closed }

class ShiftModel {
  final String id;
  final String staffId;
  final String staffName;
  final ShiftStatus status;
  final double openingBalance;
  double? closingBalance;
  final double cashIn;
  final double cashOut;
  double? actualCash;
  int totalTransactions;
  double totalSales;
  DateTime openedAt;
  DateTime? closedAt;
  final String? notes;

  ShiftModel({
    required this.id,
    required this.staffId,
    required this.staffName,
    required this.status,
    required this.openingBalance,
    this.closingBalance,
    this.cashIn = 0,
    this.cashOut = 0,
    this.actualCash,
    this.totalTransactions = 0,
    this.totalSales = 0,
    required this.openedAt,
    this.closedAt,
    this.notes,
  });

  double get expectedCash => openingBalance + cashIn - cashOut + totalSales;
  double get cashVariance => (actualCash ?? 0) - expectedCash;
  Duration get duration => (closedAt ?? DateTime.now()).difference(openedAt);

  Map<String, dynamic> toJson() => {
    'id': id, 'staffId': staffId, 'staffName': staffName,
    'status': status.name, 'openingBalance': openingBalance,
    'closingBalance': closingBalance, 'cashIn': cashIn, 'cashOut': cashOut,
    'actualCash': actualCash, 'totalTransactions': totalTransactions,
    'totalSales': totalSales, 'openedAt': openedAt.toIso8601String(),
    'closedAt': closedAt?.toIso8601String(), 'notes': notes,
  };
}

class CashMovement {
  final String id;
  final String shiftId;
  final String type; // 'CASH_IN', 'CASH_OUT'
  final double amount;
  final String reason;
  final String staffName;
  final DateTime createdAt;

  CashMovement({
    required this.id,
    required this.shiftId,
    required this.type,
    required this.amount,
    required this.reason,
    required this.staffName,
    required this.createdAt,
  });
}

// ─── Refund Models ───

enum RefundStatus { pending, approved, rejected, completed }
enum RefundReason {
  customerRequest('Customer Request'),
  wrongOrder('Wrong Order'),
  foodQuality('Food Quality'),
  duplicateOrder('Duplicate Order'),
  itemUnavailable('Item Unavailable'),
  systemError('System Error'),
  other('Other');

  final String label;
  const RefundReason(this.label);
}

class RefundRequest {
  final String id;
  final String orderId;
  final String? orderNumber;
  final double amount;
  final String reason;
  final RefundReason reasonType;
  final List<String> itemIds;
  final bool isFullRefund;
  final RefundStatus status;
  final String requestedBy;
  final String? approvedBy;
  final DateTime createdAt;
  final DateTime? processedAt;
  final String? notes;

  RefundRequest({
    required this.id,
    required this.orderId,
    this.orderNumber,
    required this.amount,
    required this.reason,
    required this.reasonType,
    this.itemIds = const [],
    this.isFullRefund = false,
    this.status = RefundStatus.pending,
    required this.requestedBy,
    this.approvedBy,
    required this.createdAt,
    this.processedAt,
    this.notes,
  });
}

// ─── POS Config ───

class PosTaxConfig {
  final double gstRate;
  final bool splitGst; // CGST + SGST
  final double serviceChargeRate;
  final bool enableServiceCharge;
  final bool enableRoundOff;

  const PosTaxConfig({
    this.gstRate = 5.0,
    this.splitGst = true,
    this.serviceChargeRate = 0,
    this.enableServiceCharge = false,
    this.enableRoundOff = true,
  });
}

class PosReceiptConfig {
  final String restaurantName;
  final String branchName;
  final String? gstNumber;
  final String? address;
  final String? phone;
  final String? footerMessage;
  final bool showItemDetails;
  final bool showTaxBreakdown;
  final bool showPaymentMethod;
  final bool showQrCode;

  const PosReceiptConfig({
    required this.restaurantName,
    required this.branchName,
    this.gstNumber,
    this.address,
    this.phone,
    this.footerMessage,
    this.showItemDetails = true,
    this.showTaxBreakdown = true,
    this.showPaymentMethod = true,
    this.showQrCode = false,
  });
}

class PosDiscountConfig {
  final bool enablePercentage;
  final bool enableFixed;
  final bool enableCoupon;
  final List<int> percentagePresets;
  final double maxDiscountPercent;
  final double maxDiscountAmount;

  const PosDiscountConfig({
    this.enablePercentage = true,
    this.enableFixed = true,
    this.enableCoupon = true,
    this.percentagePresets = const [5, 10, 15, 20, 25, 50],
    this.maxDiscountPercent = 50,
    this.maxDiscountAmount = 10000,
  });
}

// ─── AI Recommendation Models ───

class PosUpsellSuggestion {
  final String id;
  final String name;
  final double price;
  final String reason; // 'frequently_bought', 'complementary', 'popular', 'trending'
  final double confidence;
  final String? image;

  const PosUpsellSuggestion({
    required this.id,
    required this.name,
    required this.price,
    required this.reason,
    required this.confidence,
    this.image,
  });
}

// ─── Audit Log ───

class PosAuditEntry {
  final String id;
  final String action;
  final String entityType;
  final String entityId;
  final Map<String, dynamic>? oldValue;
  final Map<String, dynamic>? newValue;
  final String staffId;
  final String staffName;
  final DateTime timestamp;

  PosAuditEntry({
    required this.id,
    required this.action,
    required this.entityType,
    required this.entityId,
    this.oldValue,
    this.newValue,
    required this.staffId,
    required this.staffName,
    required this.timestamp,
  });
}

// ─── Inventory Deduction Models ───

class InventoryDeductionEntry {
  final String menuItemId;
  final String itemName;
  final int quantityConsumed;
  final double remainingStock;
  final String? error;

  InventoryDeductionEntry({
    required this.menuItemId,
    required this.itemName,
    required this.quantityConsumed,
    required this.remainingStock,
    this.error,
  });
}

class InventoryDeductionResult {
  final bool success;
  final List<InventoryDeductionEntry> deducted;
  final List<InventoryDeductionEntry> failed;
  final List<String> lowStockWarnings;

  InventoryDeductionResult({
    required this.success,
    required this.deducted,
    required this.failed,
    required this.lowStockWarnings,
  });
}

// ─── Kitchen Station Routing ───

enum KitchenStation {
  mainKitchen('Main Kitchen', Icons.restaurant),
  grill('Grill', Icons.local_fire_department),
  pizza('Pizza', Icons.local_pizza),
  bakery('Bakery', Icons.cake),
  dessert('Dessert', Icons.icecream),
  bar('Bar', Icons.local_bar),
  beverages('Beverages', Icons.local_cafe),
  salad('Salad', Icons.eco),
  fryStation('Fry Station', Icons.fastfood);

  final String label;
  final IconData icon;
  const KitchenStation(this.label, this.icon);
}

class KitchenStationRoute {
  final String itemId;
  final String itemName;
  final KitchenStation station;
  final int quantity;
  final String? specialInstructions;

  KitchenStationRoute({
    required this.itemId,
    required this.itemName,
    required this.station,
    required this.quantity,
    this.specialInstructions,
  });

  Map<String, dynamic> toJson() => {
    'itemId': itemId,
    'itemName': itemName,
    'station': station.name,
    'quantity': quantity,
    'specialInstructions': specialInstructions,
  };
}

class KitchenTicket {
  final String orderId;
  final int orderNumber;
  final String tableName;
  final String orderType;
  final DateTime createdAt;
  final List<KitchenStationRoute> routes;
  final String? specialInstructions;

  KitchenTicket({
    required this.orderId,
    required this.orderNumber,
    required this.tableName,
    required this.orderType,
    required this.createdAt,
    required this.routes,
    this.specialInstructions,
  });

  List<KitchenStationRoute> getRoutesForStation(KitchenStation station) {
    return routes.where((r) => r.station == station).toList();
  }
}
