import 'package:flutter/material.dart';

// ─── Kitchen Station (unified) ───

enum KitchenStationType {
  mainKitchen('Main Kitchen', Icons.restaurant),
  grill('Grill', Icons.local_fire_department),
  pizza('Pizza', Icons.local_pizza),
  bakery('Bakery', Icons.cake),
  dessert('Dessert', Icons.icecream),
  bar('Bar', Icons.local_bar),
  beverages('Beverages', Icons.local_cafe),
  salad('Salad', Icons.eco),
  fryStation('Fry Station', Icons.fastfood),
  custom('Custom', Icons.settings);

  final String label;
  final IconData icon;
  const KitchenStationType(this.label, this.icon);

  static KitchenStationType fromName(String? name) {
    if (name == null) return KitchenStationType.mainKitchen;
    return KitchenStationType.values.asNameMap()[name.toLowerCase()] ?? KitchenStationType.mainKitchen;
  }
}

// ─── Kitchen Order Status (configurable workflow) ───

enum KitchenOrderStatus {
  pending('Pending', Color(0xFFF59E0B), Icons.schedule),
  accepted('Accepted', Color(0xFF3B82F6), Icons.thumb_up),
  preparing('Preparing', Color(0xFFF97316), Icons.restaurant),
  cooking('Cooking', Color(0xFFEA580C), Icons.local_fire_department),
  ready('Ready', Color(0xFF22C55E), Icons.check_circle),
  served('Served', Color(0xFF06B6D4), Icons.how_to_reg),
  completed('Completed', Color(0xFF10B981), Icons.task_alt),
  cancelled('Cancelled', Color(0xFFEF4444), Icons.cancel),
  rejected('Rejected', Color(0xFFDC2626), Icons.block),
  held('Held', Color(0xFF8B5CF6), Icons.pause_circle),
  recalled('Recalled', Color(0xFFEC4899), Icons.replay),
  rush('Rush', Color(0xFFFF0000), Icons.bolt);

  final String label;
  final Color color;
  final IconData icon;
  const KitchenOrderStatus(this.label, this.color, this.icon);

  bool get isActive => [pending, accepted, preparing, cooking, ready, held, rush].contains(this);
  bool get isTerminal => [completed, cancelled, rejected].contains(this);
  bool get canStart => [pending, accepted].contains(this);
  bool canTransitionTo(KitchenOrderStatus next) {
    return switch (this) {
      KitchenOrderStatus.pending => [accepted, cancelled, rejected, rush].contains(next),
      KitchenOrderStatus.accepted => [preparing, cancelled, rush].contains(next),
      KitchenOrderStatus.preparing => [cooking, held, cancelled, rush].contains(next),
      KitchenOrderStatus.cooking => [ready, held, recalled, rush].contains(next),
      KitchenOrderStatus.ready => [served, recalled].contains(next),
      KitchenOrderStatus.served => [completed].contains(next),
      KitchenOrderStatus.held => [preparing, cooking, cancelled].contains(next),
      KitchenOrderStatus.rush => [preparing, cooking, ready].contains(next),
      KitchenOrderStatus.recalled => [cooking, preparing].contains(next),
      _ => false,
    };
  }

  static KitchenOrderStatus fromName(String? name) {
    if (name == null) return KitchenOrderStatus.pending;
    return KitchenOrderStatus.values.asNameMap()[name.toLowerCase()] ?? KitchenOrderStatus.pending;
  }
}

// ─── Order Priority ───

enum KitchenPriority {
  low(0, Color(0xFF9CA3AF)),
  normal(1, Color(0xFF3B82F6)),
  high(2, Color(0xFFF59E0B)),
  urgent(3, Color(0xFFEF4444)),
  vip(4, Color(0xFF8B5CF6));

  final int level;
  final Color color;
  const KitchenPriority(this.level, this.color);

  String get label => name[0].toUpperCase() + name.substring(1);

  static KitchenPriority fromName(String? name) {
    if (name == null) return KitchenPriority.normal;
    return KitchenPriority.values.asNameMap()[name.toLowerCase()] ?? KitchenPriority.normal;
  }
}

// ─── Course Type ───

enum CourseType {
  appetizer('Appetizer', 1),
  starter('Starter', 2),
  mainCourse('Main Course', 3),
  side('Side', 4),
  dessert('Dessert', 5),
  beverage('Beverage', 6),
  custom('Custom', 7);

  final String label;
  final int sortOrder;
  const CourseType(this.label, this.sortOrder);

  static CourseType fromName(String? name) {
    if (name == null) return CourseType.custom;
    return CourseType.values.asNameMap()[name.toLowerCase()] ?? CourseType.custom;
  }
}

// ─── SLA Configuration ───

class KitchenSLAConfig {
  final int pendingMaxMinutes;
  final int preparationMaxMinutes;
  final int cookingMaxMinutes;
  final int readyMaxMinutes;
  final int totalMaxMinutes;
  final bool enableSoundAlerts;
  final bool enableVisualAlerts;
  final int urgentThresholdMinutes;

  const KitchenSLAConfig({
    this.pendingMaxMinutes = 5,
    this.preparationMaxMinutes = 15,
    this.cookingMaxMinutes = 20,
    this.readyMaxMinutes = 5,
    this.totalMaxMinutes = 30,
    this.enableSoundAlerts = true,
    this.enableVisualAlerts = true,
    this.urgentThresholdMinutes = 20,
  });

  factory KitchenSLAConfig.fromJson(Map<String, dynamic> json) => KitchenSLAConfig(
    pendingMaxMinutes: json['pendingMaxMinutes'] ?? 5,
    preparationMaxMinutes: json['preparationMaxMinutes'] ?? 15,
    cookingMaxMinutes: json['cookingMaxMinutes'] ?? 20,
    readyMaxMinutes: json['readyMaxMinutes'] ?? 5,
    totalMaxMinutes: json['totalMaxMinutes'] ?? 30,
    enableSoundAlerts: json['enableSoundAlerts'] ?? true,
    enableVisualAlerts: json['enableVisualAlerts'] ?? true,
    urgentThresholdMinutes: json['urgentThresholdMinutes'] ?? 20,
  );

  Map<String, dynamic> toJson() => {
    'pendingMaxMinutes': pendingMaxMinutes,
    'preparationMaxMinutes': preparationMaxMinutes,
    'cookingMaxMinutes': cookingMaxMinutes,
    'readyMaxMinutes': readyMaxMinutes,
    'totalMaxMinutes': totalMaxMinutes,
    'enableSoundAlerts': enableSoundAlerts,
    'enableVisualAlerts': enableVisualAlerts,
    'urgentThresholdMinutes': urgentThresholdMinutes,
  };
}

// ─── Kitchen Station Config ───

class KitchenStationConfig {
  final KitchenStationType type;
  final String? displayName;
  final bool isEnabled;
  final int? maxConcurrentOrders;
  final List<String> assignedChefIds;
  final KitchenSLAConfig slaConfig;
  final Color? color;

  const KitchenStationConfig({
    required this.type,
    this.displayName,
    this.isEnabled = true,
    this.maxConcurrentOrders,
    this.assignedChefIds = const [],
    this.slaConfig = const KitchenSLAConfig(),
    this.color,
  });

  String get name => displayName ?? type.label;

  factory KitchenStationConfig.fromJson(Map<String, dynamic> json) => KitchenStationConfig(
    type: KitchenStationType.fromName(json['type']),
    displayName: json['displayName'],
    isEnabled: json['isEnabled'] ?? true,
    maxConcurrentOrders: json['maxConcurrentOrders'],
    assignedChefIds: (json['assignedChefIds'] as List<dynamic>?)?.cast<String>() ?? [],
    slaConfig: json['slaConfig'] != null ? KitchenSLAConfig.fromJson(json['slaConfig']) : const KitchenSLAConfig(),
  );
}

// ─── Chef Model ───

class ChefModel {
  final String id;
  final String name;
  final String? avatar;
  final KitchenStationType? primaryStation;
  final bool isAvailable;
  final int currentOrders;
  final int completedToday;
  final Duration avgCompletionTime;
  final List<KitchenStationType> assignedStations;
  final DateTime? lastActiveAt;

  const ChefModel({
    required this.id,
    required this.name,
    this.avatar,
    this.primaryStation,
    this.isAvailable = true,
    this.currentOrders = 0,
    this.completedToday = 0,
    this.avgCompletionTime = const Duration(minutes: 15),
    this.assignedStations = const [],
    this.lastActiveAt,
  });

  factory ChefModel.fromJson(Map<String, dynamic> json) => ChefModel(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    avatar: json['avatar'],
    primaryStation: json['primaryStation'] != null ? KitchenStationType.fromName(json['primaryStation']) : null,
    isAvailable: json['isAvailable'] ?? true,
    currentOrders: json['currentOrders'] ?? 0,
    completedToday: json['completedToday'] ?? 0,
    avgCompletionTime: Duration(minutes: json['avgCompletionTimeMinutes'] ?? 15),
    assignedStations: (json['assignedStations'] as List<dynamic>?)
        ?.map((s) => KitchenStationType.fromName(s as String))
        .toList() ?? [],
    lastActiveAt: json['lastActiveAt'] != null ? DateTime.tryParse(json['lastActiveAt']) : null,
  );

  double get workloadScore => currentOrders / (avgCompletionTime.inMinutes > 0 ? avgCompletionTime.inMinutes : 15);
}

// ─── Kitchen Order Item (extended for KDS) ───

class KitchenOrderItem {
  final String? id;
  final String name;
  final int quantity;
  final double unitPrice;
  final String? notes;
  final KitchenOrderStatus status;
  final KitchenStationType? station;
  final String? chefId;
  final String? chefName;
  final CourseType course;
  final bool isVeg;
  final List<String> allergens;
  final List<String> modifiers;
  final List<String> addOns;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final int version;

  const KitchenOrderItem({
    this.id,
    required this.name,
    this.quantity = 1,
    this.unitPrice = 0,
    this.notes,
    this.status = KitchenOrderStatus.pending,
    this.station,
    this.chefId,
    this.chefName,
    this.course = CourseType.mainCourse,
    this.isVeg = false,
    this.allergens = const [],
    this.modifiers = const [],
    this.addOns = const [],
    this.startedAt,
    this.completedAt,
    this.version = 1,
  });

  factory KitchenOrderItem.fromJson(Map<String, dynamic> json) => KitchenOrderItem(
    id: json['id'],
    name: json['name'] ?? '',
    quantity: json['quantity'] ?? 1,
    unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0,
    notes: json['notes'],
    status: KitchenOrderStatus.fromName(json['status']),
    station: json['kitchenStation'] != null ? KitchenStationType.fromName(json['kitchenStation']) : null,
    chefId: json['chefId'],
    chefName: json['chefName'],
    course: CourseType.fromName(json['course']),
    isVeg: json['isVeg'] ?? false,
    allergens: (json['allergens'] as List<dynamic>?)?.cast<String>() ?? [],
    modifiers: (json['modifiers'] as List<dynamic>?)?.map((m) => m['name'] as String? ?? m.toString()).toList() ?? [],
    addOns: (json['addOns'] as List<dynamic>?)?.map((a) => a['name'] as String? ?? a.toString()).toList() ?? [],
    startedAt: json['startedAt'] != null ? DateTime.tryParse(json['startedAt']) : null,
    completedAt: json['completedAt'] != null ? DateTime.tryParse(json['completedAt']) : null,
    version: json['version'] ?? 1,
  );

  KitchenOrderItem copyWith({
    KitchenOrderStatus? status,
    KitchenStationType? station,
    String? chefId,
    String? chefName,
    CourseType? course,
    DateTime? startedAt,
    DateTime? completedAt,
  }) {
    return KitchenOrderItem(
      id: id, name: name, quantity: quantity, unitPrice: unitPrice,
      notes: notes, status: status ?? this.status, station: station ?? this.station,
      chefId: chefId ?? this.chefId, chefName: chefName ?? this.chefName,
      course: course ?? this.course, isVeg: isVeg, allergens: allergens,
      modifiers: modifiers, addOns: addOns,
      startedAt: startedAt ?? this.startedAt,
      completedAt: completedAt ?? this.completedAt,
      version: version + 1,
    );
  }

  Duration get elapsed => startedAt != null
      ? DateTime.now().difference(startedAt!)
      : Duration.zero;
}

// ─── Kitchen Order (KDS ticket) ───

class KitchenOrder {
  final String id;
  final int orderNumber;
  final KitchenOrderStatus status;
  final String orderType;
  final String channel;
  final String? tableName;
  final int? tableNumber;
  final String? customerName;
  final String? guestNotes;
  final String? allergenWarning;
  final KitchenPriority priority;
  final List<KitchenOrderItem> items;
  final String? assignedChefId;
  final String? assignedChefName;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Duration? targetCompletionTime;
  final bool isRush;
  final bool isVip;
  final int courseCount;
  final int firedCourseIndex;
  final List<String> firedCourses;
  final List<String> heldCourses;
  final double totalAmount;
  final String? orderSource;
  final Map<String, dynamic>? metadata;

  const KitchenOrder({
    required this.id,
    required this.orderNumber,
    this.status = KitchenOrderStatus.pending,
    this.orderType = 'dineIn',
    this.channel = 'dineIn',
    this.tableName,
    this.tableNumber,
    this.customerName,
    this.guestNotes,
    this.allergenWarning,
    this.priority = KitchenPriority.normal,
    this.items = const [],
    this.assignedChefId,
    this.assignedChefName,
    required this.createdAt,
    required this.updatedAt,
    this.targetCompletionTime,
    this.isRush = false,
    this.isVip = false,
    this.courseCount = 1,
    this.firedCourseIndex = 0,
    this.firedCourses = const [],
    this.heldCourses = const [],
    this.totalAmount = 0,
    this.orderSource,
    this.metadata,
  });

  factory KitchenOrder.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>?)
        ?.map((i) => KitchenOrderItem.fromJson(i as Map<String, dynamic>))
        .toList() ?? [];

    return KitchenOrder(
      id: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? 0,
      status: KitchenOrderStatus.fromName(json['status']),
      orderType: json['orderType'] ?? json['type'] ?? 'dineIn',
      channel: json['channel'] ?? 'dineIn',
      tableName: json['tableName'] ?? json['table']?['name'],
      tableNumber: json['tableNumber'] ?? json['table']?['number'],
      customerName: json['customerName'] ?? json['customer']?['name'],
      guestNotes: json['guestNotes'] ?? json['notes'],
      allergenWarning: json['allergenWarning'],
      priority: KitchenPriority.values.asNameMap()[json['priority']?.toLowerCase()] ?? KitchenPriority.normal,
      items: items,
      assignedChefId: json['assignedChefId'],
      assignedChefName: json['assignedChefName'],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
      targetCompletionTime: json['targetCompletionMinutes'] != null
          ? Duration(minutes: json['targetCompletionMinutes'])
          : null,
      isRush: json['isRush'] ?? false,
      isVip: json['isVip'] ?? false,
      courseCount: json['courseCount'] ?? 1,
      firedCourseIndex: json['firedCourseIndex'] ?? 0,
      firedCourses: (json['firedCourses'] as List<dynamic>?)?.cast<String>() ?? [],
      heldCourses: (json['heldCourses'] as List<dynamic>?)?.cast<String>() ?? [],
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
      orderSource: json['orderSource'],
      metadata: json['metadata'],
    );
  }

  Duration get age => DateTime.now().difference(createdAt);
  String get ageDisplay {
    final mins = age.inMinutes;
    if (mins < 60) return '${mins}m';
    return '${age.inHours}h ${mins % 60}m';
  }

  bool get isDelayed {
    if (targetCompletionTime != null) {
      return age > targetCompletionTime!;
    }
    return age.inMinutes > 30;
  }

  bool get isUrgent => isRush || priority.level >= KitchenPriority.urgent.level;

  String get displayTable => tableNumber != null ? 'T$tableNumber' : (tableName ?? '');

  String get displayOrderNumber => '#${orderNumber.toString().padLeft(4, '0')}';

  List<KitchenOrderItem> get itemsByStatus => items.where((i) => i.status.isActive).toList();

  List<KitchenOrderItem> get pendingItems => items.where((i) => i.status == KitchenOrderStatus.pending).toList();

  List<KitchenOrderItem> get readyItems => items.where((i) => i.status == KitchenOrderStatus.ready).toList();

  double get completionPercentage {
    if (items.isEmpty) return 0;
    final completed = items.where((i) => i.status.isTerminal || i.status == KitchenOrderStatus.ready || i.status == KitchenOrderStatus.served).length;
    return completed / items.length;
  }

  KitchenOrder copyWith({
    KitchenOrderStatus? status,
    KitchenPriority? priority,
    List<KitchenOrderItem>? items,
    String? assignedChefId,
    String? assignedChefName,
    bool? isRush,
    int? firedCourseIndex,
    List<String>? firedCourses,
    List<String>? heldCourses,
  }) {
    return KitchenOrder(
      id: id, orderNumber: orderNumber,
      status: status ?? this.status,
      orderType: orderType, channel: channel,
      tableName: tableName, tableNumber: tableNumber,
      customerName: customerName, guestNotes: guestNotes,
      allergenWarning: allergenWarning,
      priority: priority ?? this.priority,
      items: items ?? this.items,
      assignedChefId: assignedChefId ?? this.assignedChefId,
      assignedChefName: assignedChefName ?? this.assignedChefName,
      createdAt: createdAt, updatedAt: DateTime.now(),
      targetCompletionTime: targetCompletionTime,
      isRush: isRush ?? this.isRush,
      isVip: isVip,
      courseCount: courseCount,
      firedCourseIndex: firedCourseIndex ?? this.firedCourseIndex,
      firedCourses: firedCourses ?? this.firedCourses,
      heldCourses: heldCourses ?? this.heldCourses,
      totalAmount: totalAmount,
      orderSource: orderSource,
      metadata: metadata,
    );
  }
}

// ─── Kitchen Filter ───

class KitchenFilter {
  final List<KitchenOrderStatus> statuses;
  final List<KitchenStationType> stations;
  final List<String> chefIds;
  final List<KitchenPriority> priorities;
  final List<String> orderTypes;
  final String? searchQuery;
  final bool showDelayedOnly;
  final bool showRushOnly;

  const KitchenFilter({
    this.statuses = const [],
    this.stations = const [],
    this.chefIds = const [],
    this.priorities = const [],
    this.orderTypes = const [],
    this.searchQuery,
    this.showDelayedOnly = false,
    this.showRushOnly = false,
  });

  bool get hasActiveFilters =>
      statuses.isNotEmpty || stations.isNotEmpty || chefIds.isNotEmpty ||
      priorities.isNotEmpty || orderTypes.isNotEmpty ||
      (searchQuery != null && searchQuery!.isNotEmpty) ||
      showDelayedOnly || showRushOnly;

  KitchenFilter copyWith({
    List<KitchenOrderStatus>? statuses,
    List<KitchenStationType>? stations,
    List<String>? chefIds,
    List<KitchenPriority>? priorities,
    List<String>? orderTypes,
    String? searchQuery,
    bool? showDelayedOnly,
    bool? showRushOnly,
    bool clearSearch = false,
  }) {
    return KitchenFilter(
      statuses: statuses ?? this.statuses,
      stations: stations ?? this.stations,
      chefIds: chefIds ?? this.chefIds,
      priorities: priorities ?? this.priorities,
      orderTypes: orderTypes ?? this.orderTypes,
      searchQuery: clearSearch ? null : (searchQuery ?? this.searchQuery),
      showDelayedOnly: showDelayedOnly ?? this.showDelayedOnly,
      showRushOnly: showRushOnly ?? this.showRushOnly,
    );
  }

  KitchenFilter clearAll() => const KitchenFilter();
}

// ─── Kitchen Audit Entry ───

class KitchenAuditEntry {
  final String id;
  final String orderId;
  final String action;
  final String? fromStatus;
  final String? toStatus;
  final String? staffId;
  final String? staffName;
  final String? notes;
  final DateTime timestamp;

  const KitchenAuditEntry({
    required this.id,
    required this.orderId,
    required this.action,
    this.fromStatus,
    this.toStatus,
    this.staffId,
    this.staffName,
    this.notes,
    required this.timestamp,
  });

  factory KitchenAuditEntry.fromJson(Map<String, dynamic> json) => KitchenAuditEntry(
    id: json['id'] ?? '',
    orderId: json['orderId'] ?? '',
    action: json['action'] ?? '',
    fromStatus: json['fromStatus'],
    toStatus: json['toStatus'],
    staffId: json['staffId'],
    staffName: json['staffName'],
    notes: json['notes'],
    timestamp: DateTime.tryParse(json['timestamp'] ?? json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ─── Kitchen Metrics ───

class KitchenMetrics {
  final double avgTicketTimeMinutes;
  final int totalOrdersToday;
  final int completedOrders;
  final int delayedOrders;
  final int activeOrders;
  final int avgItemsPerOrder;
  final Map<String, double> stationUtilization;
  final Map<String, int> chefProductivity;
  final List<TopSellingItem> topItems;

  const KitchenMetrics({
    this.avgTicketTimeMinutes = 0,
    this.totalOrdersToday = 0,
    this.completedOrders = 0,
    this.delayedOrders = 0,
    this.activeOrders = 0,
    this.avgItemsPerOrder = 0,
    this.stationUtilization = const {},
    this.chefProductivity = const {},
    this.topItems = const [],
  });

  double get onTimePercentage =>
      totalOrdersToday > 0 ? (totalOrdersToday - delayedOrders) / totalOrdersToday * 100 : 100;
}

class TopSellingItem {
  final String name;
  final int quantity;
  final double revenue;
  const TopSellingItem({required this.name, required this.quantity, required this.revenue});
}

// ─── Kitchen Notification ───

enum KitchenNotificationType {
  newOrder, orderReady, orderDelayed, orderRush,
  lowStock, chefAssigned, statusChange, courseFired,
}

class KitchenNotification {
  final String id;
  final KitchenNotificationType type;
  final String title;
  final String message;
  final String? orderId;
  final DateTime createdAt;
  final bool isRead;

  const KitchenNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.orderId,
    required this.createdAt,
    this.isRead = false,
  });
}
