import 'package:flutter/material.dart';

enum OrderStatus {
  draft, pending, confirmed, accepted, preparing, cooking,
  ready, packed, outForDelivery, delivered, completed,
  cancelled, rejected, refunded, archived;

  String get label => name[0].toUpperCase() + name.substring(1).replaceAll(RegExp(r'(?=[A-Z])'), ' ');

  Color get color => switch (this) {
    OrderStatus.draft => Colors.grey,
    OrderStatus.pending => const Color(0xFFF59E0B),
    OrderStatus.confirmed => const Color(0xFF3B82F6),
    OrderStatus.accepted => const Color(0xFF3B82F6),
    OrderStatus.preparing => const Color(0xFFF97316),
    OrderStatus.cooking => const Color(0xFFEA580C),
    OrderStatus.ready => const Color(0xFF22C55E),
    OrderStatus.packed => const Color(0xFF10B981),
    OrderStatus.outForDelivery => const Color(0xFF8B5CF6),
    OrderStatus.delivered => const Color(0xFF06B6D4),
    OrderStatus.completed => const Color(0xFF22C55E),
    OrderStatus.cancelled => const Color(0xFFEF4444),
    OrderStatus.rejected => const Color(0xFFDC2626),
    OrderStatus.refunded => const Color(0xFF6B7280),
    OrderStatus.archived => const Color(0xFF9CA3AF),
  };

  IconData get icon => switch (this) {
    OrderStatus.draft => Icons.edit_note,
    OrderStatus.pending => Icons.schedule,
    OrderStatus.confirmed => Icons.check_circle_outline,
    OrderStatus.accepted => Icons.thumb_up,
    OrderStatus.preparing => Icons.restaurant,
    OrderStatus.cooking => Icons.local_fire_department,
    OrderStatus.ready => Icons.check_circle,
    OrderStatus.packed => Icons.inventory_2,
    OrderStatus.outForDelivery => Icons.delivery_dining,
    OrderStatus.delivered => Icons.home,
    OrderStatus.completed => Icons.task_alt,
    OrderStatus.cancelled => Icons.cancel,
    OrderStatus.rejected => Icons.block,
    OrderStatus.refunded => Icons.replay,
    OrderStatus.archived => Icons.archive,
  };

  bool get isActive => [pending, confirmed, accepted, preparing, cooking, ready, packed, outForDelivery, delivered].contains(this);
  bool get isTerminal => [completed, cancelled, rejected, refunded, archived].contains(this);
  bool get canCancel => [draft, pending, confirmed, accepted, preparing].contains(this);
  bool get canRefund => [completed, delivered].contains(this);
}

enum OrderType {
  dineIn, takeaway, delivery, qrOrder, counter, phone,
  scheduled, preOrder, corporate, catering, driveThrough, aggregator, manual;

  String get label => switch (this) {
    OrderType.dineIn => 'Dine-In',
    OrderType.takeaway => 'Takeaway',
    OrderType.delivery => 'Delivery',
    OrderType.qrOrder => 'QR Order',
    OrderType.counter => 'Counter',
    OrderType.phone => 'Phone',
    OrderType.scheduled => 'Scheduled',
    OrderType.preOrder => 'Pre-Order',
    OrderType.corporate => 'Corporate',
    OrderType.catering => 'Catering',
    OrderType.driveThrough => 'Drive Through',
    OrderType.aggregator => 'Aggregator',
    OrderType.manual => 'Manual',
  };

  IconData get icon => switch (this) {
    OrderType.dineIn => Icons.restaurant,
    OrderType.takeaway => Icons.takeout_dining,
    OrderType.delivery => Icons.delivery_dining,
    OrderType.qrOrder => Icons.qr_code_scanner,
    OrderType.counter => Icons.storefront,
    OrderType.phone => Icons.phone,
    OrderType.scheduled => Icons.calendar_today,
    OrderType.preOrder => Icons.schedule,
    OrderType.corporate => Icons.business,
    OrderType.catering => Icons.celebration,
    OrderType.driveThrough => Icons.directions_car,
    OrderType.aggregator => Icons.shopping_bag,
    OrderType.manual => Icons.edit,
  };
}

enum OrderChannel {
  dineIn, qr, app, swiggy, zomato, whatsapp, instagram, facebook, ondc;

  String get label => name[0].toUpperCase() + name.substring(1);

  Color get color => switch (this) {
    OrderChannel.dineIn => const Color(0xFF3B82F6),
    OrderChannel.qr => const Color(0xFF8B5CF6),
    OrderChannel.app => const Color(0xFF06B6D4),
    OrderChannel.swiggy => const Color(0xFFFC8019),
    OrderChannel.zomato => const Color(0xFFE23744),
    OrderChannel.whatsapp => const Color(0xFF25D366),
    OrderChannel.instagram => const Color(0xFFE4405F),
    OrderChannel.facebook => const Color(0xFF1877F2),
    OrderChannel.ondc => const Color(0xFF0D47A1),
  };
}

enum OrderItemStatus {
  pending, preparing, ready, served, cancelled;

  String get label => name[0].toUpperCase() + name.substring(1);

  Color get color => switch (this) {
    OrderItemStatus.pending => const Color(0xFFF59E0B),
    OrderItemStatus.preparing => const Color(0xFFF97316),
    OrderItemStatus.ready => const Color(0xFF22C55E),
    OrderItemStatus.served => const Color(0xFF06B6D4),
    OrderItemStatus.cancelled => const Color(0xFFEF4444),
  };
}

enum PaymentMethod {
  cash, card, upi, wallet, giftCard, split, partial;

  String get label => name[0].toUpperCase() + name.substring(1);

  IconData get icon => switch (this) {
    PaymentMethod.cash => Icons.payments,
    PaymentMethod.card => Icons.credit_card,
    PaymentMethod.upi => Icons.qr_code,
    PaymentMethod.wallet => Icons.account_balance_wallet,
    PaymentMethod.giftCard => Icons.card_giftcard,
    PaymentMethod.split => Icons.call_split,
    PaymentMethod.partial => Icons.payments_outlined,
  };
}

enum PaymentStatus {
  unpaid, partial, paid, refunded, failed;

  String get label => name[0].toUpperCase() + name.substring(1);

  Color get color => switch (this) {
    PaymentStatus.unpaid => const Color(0xFFEF4444),
    PaymentStatus.partial => const Color(0xFFF59E0B),
    PaymentStatus.paid => const Color(0xFF22C55E),
    PaymentStatus.refunded => const Color(0xFF6B7280),
    PaymentStatus.failed => const Color(0xFFDC2626),
  };
}

enum KitchenStation {
  kitchen, bar, bakery, dessert, beverage, custom;

  String get label => name[0].toUpperCase() + name.substring(1);

  IconData get icon => switch (this) {
    KitchenStation.kitchen => Icons.restaurant,
    KitchenStation.bar => Icons.local_bar,
    KitchenStation.bakery => Icons.bakery_dining,
    KitchenStation.dessert => Icons.icecream,
    KitchenStation.beverage => Icons.local_cafe,
    KitchenStation.custom => Icons.settings,
  };
}

enum SortOrder {
  newest, oldest, priority, prepTime, orderValue, customerName, table, status;

  String get label => switch (this) {
    SortOrder.newest => 'Newest First',
    SortOrder.oldest => 'Oldest First',
    SortOrder.priority => 'Priority',
    SortOrder.prepTime => 'Prep Time',
    SortOrder.orderValue => 'Order Value',
    SortOrder.customerName => 'Customer Name',
    SortOrder.table => 'Table',
    SortOrder.status => 'Status',
  };
}

enum BulkActionType {
  accept, reject, assign, cancel, print, archive, export, updateStatus, notifyCustomer;

  String get label => switch (this) {
    BulkActionType.accept => 'Accept',
    BulkActionType.reject => 'Reject',
    BulkActionType.assign => 'Assign',
    BulkActionType.cancel => 'Cancel',
    BulkActionType.print => 'Print',
    BulkActionType.archive => 'Archive',
    BulkActionType.export => 'Export',
    BulkActionType.updateStatus => 'Update Status',
    BulkActionType.notifyCustomer => 'Notify Customer',
  };

  IconData get icon => switch (this) {
    BulkActionType.accept => Icons.check_circle,
    BulkActionType.reject => Icons.cancel,
    BulkActionType.assign => Icons.person_add,
    BulkActionType.cancel => Icons.block,
    BulkActionType.print => Icons.print,
    BulkActionType.archive => Icons.archive,
    BulkActionType.export => Icons.file_download,
    BulkActionType.updateStatus => Icons.update,
    BulkActionType.notifyCustomer => Icons.notifications,
  };
}

enum KitchenFireAction { fire, hold, recall, rush }

class OrderItemAddOn {
  final String? id;
  final String name;
  final double price;
  const OrderItemAddOn({this.id, required this.name, required this.price});

  factory OrderItemAddOn.fromJson(Map<String, dynamic> json) => OrderItemAddOn(
    id: json['id'] as String?, name: json['name'] as String? ?? '',
    price: (json['price'] as num?)?.toDouble() ?? 0,
  );
}

class OrderStatusHistory {
  final String? id;
  final OrderStatus status;
  final String? notes;
  final String? createdBy;
  final DateTime timestamp;

  const OrderStatusHistory({
    this.id, required this.status, this.notes, this.createdBy, required this.timestamp,
  });

  factory OrderStatusHistory.fromJson(Map<String, dynamic> json) => OrderStatusHistory(
    id: json['id'] as String?,
    status: OrderStatus.values.asNameMap()[json['status']?.toLowerCase()] ?? OrderStatus.pending,
    notes: json['notes'] as String?,
    createdBy: json['createdBy'] as String? ?? json['userName'] as String?,
    timestamp: DateTime.tryParse(json['createdAt'] ?? json['timestamp'] ?? '') ?? DateTime.now(),
  );
}

class OrderItemModel {
  final String? id;
  final String? menuItemId;
  final String name;
  final int quantity;
  final double unitPrice;
  final double? totalPrice;
  final String? notes;
  final OrderItemStatus status;
  final Map<String, dynamic>? menuItem;
  final List<OrderItemAddOn> addOns;
  final int version;
  final String? kitchenStation;
  final bool isVeg;

  const OrderItemModel({
    this.id, this.menuItemId, required this.name, required this.quantity,
    required this.unitPrice, this.totalPrice, this.notes,
    this.status = OrderItemStatus.pending, this.menuItem,
    this.addOns = const [], this.version = 1, this.kitchenStation, this.isVeg = false,
  });

  double get computedTotal => totalPrice ?? (unitPrice * quantity) + addOns.fold<double>(0, (s, a) => s + a.price);

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    final mi = json['menuItem'] as Map<String, dynamic>?;
    return OrderItemModel(
      id: json['id'] as String?,
      menuItemId: json['menuItemId'] as String?,
      name: json['name'] as String? ?? mi?['name'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? (mi?['price'] as num?)?.toDouble() ?? 0,
      totalPrice: (json['totalPrice'] as num?)?.toDouble(),
      notes: json['notes'] as String?,
      status: OrderItemStatus.values.asNameMap()[json['status']?.toLowerCase()] ?? OrderItemStatus.pending,
      menuItem: mi,
      addOns: (json['addOns'] as List<dynamic>?)
          ?.map((a) => OrderItemAddOn.fromJson(a as Map<String, dynamic>))
          .toList() ?? [],
      version: json['version'] as int? ?? 1,
      kitchenStation: json['kitchenStation'] as String?,
      isVeg: json['isVeg'] as bool? ?? mi?['isVeg'] as bool? ?? false,
    );
  }
}

class OrderModel {
  final String id;
  final String? localId;
  final int orderNumber;
  final String status;
  final OrderType type;
  final OrderChannel channel;
  final String? orderSource;
  final String? channelOrderId;
  final String? channelStatus;
  final double totalAmount;
  final double subtotal;
  final double taxAmount;
  final double discountAmount;
  final double? grandTotal;
  final String? notes;
  final String? customerName;
  final String? customerPhone;
  final int? guestCount;
  final String? customerId;
  final String? tableId;
  final String? branchId;
  final String? staffId;
  final String? createdBy;
  final Map<String, dynamic>? table;
  final Map<String, dynamic>? customer;
  final Map<String, dynamic>? staff;
  final List<OrderItemModel> items;
  final List<OrderStatusHistory> statusHistory;
  final PaymentStatus paymentStatus;
  final List<Map<String, dynamic>> payments;
  final bool kotPrinted;
  final bool synced;
  final bool needsManualReview;
  final int version;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;

  const OrderModel({
    required this.id, this.localId, required this.orderNumber,
    this.status = 'PENDING', this.type = OrderType.dineIn,
    this.channel = OrderChannel.dineIn, this.orderSource,
    this.channelOrderId, this.channelStatus,
    required this.totalAmount, this.subtotal = 0, this.taxAmount = 0,
    this.discountAmount = 0, this.grandTotal, this.notes,
    this.customerName, this.customerPhone, this.guestCount,
    this.customerId, this.tableId, this.branchId, this.staffId,
    this.createdBy, this.table, this.customer, this.staff,
    this.items = const [], this.statusHistory = const [],
    this.paymentStatus = PaymentStatus.unpaid, this.payments = const [],
    this.kotPrinted = false, this.synced = true, this.needsManualReview = false,
    this.version = 1, required this.createdAt, required this.updatedAt, this.deletedAt,
  });

  OrderStatus get parsedStatus => OrderStatus.values.asNameMap()[status.toLowerCase()] ?? OrderStatus.pending;

  String get displayTable {
    if (table == null) return '';
    final num = table!['number'] ?? table!['tableNumber'];
    return num != null ? 'T$num' : '';
  }

  String get displayItems => items.map((i) => '${i.quantity}x ${i.name}').join(', ');

  String get displayTime {
    final h = createdAt.hour.toString().padLeft(2, '0');
    final m = createdAt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  String get orderNumberDisplay => '#${orderNumber.toString().padLeft(4, '0')}';

  Duration get age => DateTime.now().difference(createdAt);

  String get ageDisplay {
    final mins = age.inMinutes;
    if (mins < 60) return '${mins}m ago';
    return '${age.inHours}h ${mins % 60}m ago';
  }

  bool get canModify => [OrderStatus.pending, OrderStatus.confirmed, OrderStatus.accepted].contains(parsedStatus);
  bool get canCancel => parsedStatus.canCancel;
  bool get canRefund => parsedStatus.canRefund;
  bool get isPaid => paymentStatus == PaymentStatus.paid;

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>?)
        ?.map((i) => OrderItemModel.fromJson(i as Map<String, dynamic>))
        .toList() ?? [];
    final history = (json['statusHistory'] as List<dynamic>?)
        ?.map((h) => OrderStatusHistory.fromJson(h as Map<String, dynamic>))
        .toList() ?? [];
    final payments = (json['payments'] as List<dynamic>?)
        ?.map((p) => p as Map<String, dynamic>)
        .toList() ?? [];

    return OrderModel(
      id: json['id'] as String? ?? '',
      localId: json['localId'] as String?,
      orderNumber: json['orderNumber'] as int? ?? 0,
      status: json['status'] as String? ?? 'PENDING',
      type: OrderType.values.asNameMap()[json['type']?.toLowerCase()] ?? OrderType.dineIn,
      channel: OrderChannel.values.asNameMap()[json['channel']?.toLowerCase()] ?? OrderChannel.dineIn,
      orderSource: json['orderSource'] as String?,
      channelOrderId: json['channelOrderId'] as String?,
      channelStatus: json['channelStatus'] as String?,
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? (json['grandTotal'] as num?)?.toDouble() ?? 0,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
      taxAmount: (json['taxAmount'] as num?)?.toDouble() ?? (json['tax'] as num?)?.toDouble() ?? 0,
      discountAmount: (json['discountAmount'] as num?)?.toDouble() ?? (json['discount'] as num?)?.toDouble() ?? 0,
      grandTotal: (json['grandTotal'] as num?)?.toDouble(),
      notes: json['notes'] as String?,
      customerName: json['customerName'] as String? ?? json['customer']?['name'] as String?,
      customerPhone: json['customerPhone'] as String? ?? json['customer']?['phone'] as String?,
      guestCount: json['guestCount'] as int?,
      customerId: json['customerId'] as String?,
      tableId: json['tableId'] as String?,
      branchId: json['branchId'] as String?,
      staffId: json['staffId'] as String?,
      createdBy: json['createdBy'] as String?,
      table: json['table'] as Map<String, dynamic>?,
      customer: json['customer'] as Map<String, dynamic>?,
      staff: json['staff'] as Map<String, dynamic>?,
      items: items,
      statusHistory: history,
      paymentStatus: PaymentStatus.values.asNameMap()[json['paymentStatus']?.toLowerCase()] ?? PaymentStatus.unpaid,
      payments: payments,
      kotPrinted: json['kotPrinted'] as bool? ?? false,
      synced: json['synced'] as bool? ?? true,
      needsManualReview: json['needsManualReview'] as bool? ?? false,
      version: json['version'] as int? ?? 1,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
      deletedAt: DateTime.tryParse(json['deletedAt'] ?? ''),
    );
  }

  OrderModel copyWith({
    String? status, double? totalAmount, double? discountAmount,
    String? notes, String? tableId, PaymentStatus? paymentStatus,
    List<OrderItemModel>? items, bool? kotPrinted, int? version,
    List<OrderStatusHistory>? statusHistory, List<Map<String, dynamic>>? payments,
  }) => OrderModel(
    id: id, localId: localId, orderNumber: orderNumber,
    status: status ?? this.status, type: type, channel: channel,
    orderSource: orderSource, channelOrderId: channelOrderId, channelStatus: channelStatus,
    totalAmount: totalAmount ?? this.totalAmount, subtotal: subtotal,
    taxAmount: taxAmount, discountAmount: discountAmount ?? this.discountAmount,
    grandTotal: grandTotal, notes: notes ?? this.notes,
    customerName: customerName, customerPhone: customerPhone, guestCount: guestCount,
    customerId: customerId, tableId: tableId ?? this.tableId, branchId: branchId,
    staffId: staffId, createdBy: createdBy, table: table, customer: customer, staff: staff,
    items: items ?? this.items,
    statusHistory: statusHistory ?? this.statusHistory,
    paymentStatus: paymentStatus ?? this.paymentStatus,
    payments: payments ?? this.payments,
    kotPrinted: kotPrinted ?? this.kotPrinted,
    synced: synced, needsManualReview: needsManualReview,
    version: version ?? this.version,
    createdAt: createdAt, updatedAt: DateTime.now(), deletedAt: deletedAt,
  );
}

class OrderFilter {
  final List<OrderStatus> statuses;
  final List<OrderType> types;
  final List<OrderChannel> channels;
  final String? branchId;
  final String? tableId;
  final String? staffId;
  final String? customerId;
  final PaymentStatus? paymentStatus;
  final KitchenStation? kitchenStation;
  final DateTimeRange? dateRange;
  final String? searchQuery;
  final SortOrder sortOrder;
  final double? minAmount;
  final double? maxAmount;

  const OrderFilter({
    this.statuses = const [], this.types = const [], this.channels = const [],
    this.branchId, this.tableId, this.staffId, this.customerId,
    this.paymentStatus, this.kitchenStation, this.dateRange,
    this.searchQuery, this.sortOrder = SortOrder.newest,
    this.minAmount, this.maxAmount,
  });

  bool get hasActiveFilters =>
    statuses.isNotEmpty || types.isNotEmpty || channels.isNotEmpty ||
    branchId != null || tableId != null || staffId != null ||
    customerId != null || paymentStatus != null || kitchenStation != null ||
    dateRange != null || (searchQuery != null && searchQuery!.isNotEmpty) ||
    minAmount != null || maxAmount != null;

  int get activeCount =>
    (statuses.isNotEmpty ? 1 : 0) + (types.isNotEmpty ? 1 : 0) +
    (channels.isNotEmpty ? 1 : 0) + (branchId != null ? 1 : 0) +
    (tableId != null ? 1 : 0) + (staffId != null ? 1 : 0) +
    (customerId != null ? 1 : 0) + (paymentStatus != null ? 1 : 0) +
    (kitchenStation != null ? 1 : 0) + (dateRange != null ? 1 : 0) +
    (searchQuery != null && searchQuery!.isNotEmpty ? 1 : 0) +
    (minAmount != null ? 1 : 0) + (maxAmount != null ? 1 : 0);

  OrderFilter copyWith({
    List<OrderStatus>? statuses, List<OrderType>? types, List<OrderChannel>? channels,
    String? branchId, String? tableId, String? staffId, String? customerId,
    PaymentStatus? paymentStatus, KitchenStation? kitchenStation,
    DateTimeRange? dateRange, String? searchQuery, SortOrder? sortOrder,
    double? minAmount, double? maxAmount, bool clearBranch = false,
    bool clearTable = false, bool clearStaff = false, bool clearCustomer = false,
    bool clearPayment = false, bool clearKitchen = false, bool clearDateRange = false,
    bool clearSearch = false, bool clearMinAmount = false, bool clearMaxAmount = false,
  }) => OrderFilter(
    statuses: statuses ?? this.statuses,
    types: types ?? this.types,
    channels: channels ?? this.channels,
    branchId: clearBranch ? null : (branchId ?? this.branchId),
    tableId: clearTable ? null : (tableId ?? this.tableId),
    staffId: clearStaff ? null : (staffId ?? this.staffId),
    customerId: clearCustomer ? null : (customerId ?? this.customerId),
    paymentStatus: clearPayment ? null : (paymentStatus ?? this.paymentStatus),
    kitchenStation: clearKitchen ? null : (kitchenStation ?? this.kitchenStation),
    dateRange: clearDateRange ? null : (dateRange ?? this.dateRange),
    searchQuery: clearSearch ? null : (searchQuery ?? this.searchQuery),
    sortOrder: sortOrder ?? this.sortOrder,
    minAmount: clearMinAmount ? null : (minAmount ?? this.minAmount),
    maxAmount: clearMaxAmount ? null : (maxAmount ?? this.maxAmount),
  );

  OrderFilter clearAll() => const OrderFilter();
}

class BulkActionRequest {
  final BulkActionType action;
  final List<String> orderIds;
  final OrderStatus? targetStatus;
  final String? notes;

  const BulkActionRequest({
    required this.action, required this.orderIds,
    this.targetStatus, this.notes,
  });
}

class BulkActionResult {
  final int succeeded;
  final int failed;
  final List<String> failedIds;
  final String? error;

  const BulkActionResult({
    required this.succeeded, required this.failed,
    this.failedIds = const [], this.error,
  });

  bool get allSucceeded => failed == 0;
}

class OrderSearchResult {
  final List<OrderModel> orders;
  final int totalCount;
  final bool hasMore;

  const OrderSearchResult({required this.orders, required this.totalCount, this.hasMore = false});
}
