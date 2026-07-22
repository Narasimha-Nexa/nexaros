import 'package:flutter/material.dart';

// ─── Inventory Item Type ───

enum InventoryItemType {
  rawMaterial('Raw Material', Icons.grass),
  semiFinished('Semi-Finished', Icons.inventory_2),
  finished('Finished Goods', Icons.check_circle),
  packaging('Packaging', Icons.inventory),
  beverage('Beverage', Icons.local_cafe),
  cleaning('Cleaning', Icons.cleaning_services),
  consumable('Consumable', Icons.flash_on),
  nonFood('Non-Food', Icons.category);

  final String label;
  final IconData icon;
  const InventoryItemType(this.label, this.icon);

  static InventoryItemType fromName(String? name) {
    if (name == null) return InventoryItemType.rawMaterial;
    return InventoryItemType.values.asNameMap()[name.toLowerCase()] ?? InventoryItemType.rawMaterial;
  }
}

// ─── Stock Movement Type ───

enum StockMovementType {
  purchase('Purchase', Icons.shopping_cart, Color(0xFF22C55E)),
  sale('Sale', Icons.point_of_sale, Color(0xFF3B82F6)),
  waste('Waste', Icons.delete, Color(0xFFEF4444)),
  adjustment('Adjustment', Icons.tune, Color(0xFFF59E0B)),
  transfer('Transfer', Icons.swap_horiz, Color(0xFF8B5CF6)),
  receive('Receive', Icons.input, Color(0xFF06B6D4)),
  returnStock('Return', Icons.undo, Color(0xFFEC4899)),
  damage('Damage', Icons.broken_image, Color(0xFFDC2626)),
  theft('Theft', Icons.security, Color(0xFF7C3AED)),
  production('Production', Icons.precision_manufacturing, Color(0xFF059669)),
  recipeConsumption('Recipe', Icons.restaurant, Color(0xFFEA580C));

  final String label;
  final IconData icon;
  final Color color;
  const StockMovementType(this.label, this.icon, this.color);

  bool get isAddition => [purchase, receive, returnStock, adjustment, production].contains(this);
  bool get isDeduction => [sale, waste, transfer, damage, theft, recipeConsumption].contains(this);

  static StockMovementType fromName(String? name) {
    if (name == null) return StockMovementType.adjustment;
    return StockMovementType.values.asNameMap()[name.toLowerCase()] ?? StockMovementType.adjustment;
  }
}

// ─── Purchase Status ───

enum PurchaseOrderStatus {
  draft('Draft', Color(0xFF9CA3AF), Icons.edit),
  pending('Pending', Color(0xFFF59E0B), Icons.schedule),
  approved('Approved', Color(0xFF3B82F6), Icons.thumb_up),
  ordered('Ordered', Color(0xFF8B5CF6), Icons.shopping_cart),
  partiallyReceived('Partial', Color(0xFFF97316), Icons.inventory_2),
  received('Received', Color(0xFF22C55E), Icons.check_circle),
  cancelled('Cancelled', Color(0xFFEF4444), Icons.cancel);

  final String label;
  final Color color;
  final IconData icon;
  const PurchaseOrderStatus(this.label, this.color, this.icon);

  bool get isActive => [draft, pending, approved, ordered, partiallyReceived].contains(this);
  bool get canReceive => [ordered, partiallyReceived].contains(this);
  bool get canCancel => [draft, pending, approved].contains(this);

  static PurchaseOrderStatus fromName(String? name) {
    if (name == null) return PurchaseOrderStatus.pending;
    return PurchaseOrderStatus.values.asNameMap()[name.toLowerCase()] ?? PurchaseOrderStatus.pending;
  }
}

// ─── Stock Count Status ───

enum StockCountStatus {
  draft('Draft', Color(0xFF9CA3AF)),
  inProgress('In Progress', Color(0xFF3B82F6)),
  completed('Completed', Color(0xFF22C55E)),
  approved('Approved', Color(0xFF10B981)),
  reconciled('Reconciled', Color(0xFF8B5CF6));

  final String label;
  final Color color;
  const StockCountStatus(this.label, this.color);

  static StockCountStatus fromName(String? name) {
    if (name == null) return StockCountStatus.draft;
    return StockCountStatus.values.asNameMap()[name.toLowerCase()] ?? StockCountStatus.draft;
  }
}

// ─── Transfer Status ───

enum TransferStatus {
  draft('Draft', Color(0xFF9CA3AF)),
  pending('Pending', Color(0xFFF59E0B)),
  approved('Approved', Color(0xFF3B82F6)),
  inTransit('In Transit', Color(0xFFF97316)),
  received('Received', Color(0xFF22C55E)),
  cancelled('Cancelled', Color(0xFFEF4444));

  final String label;
  final Color color;
  const TransferStatus(this.label, this.color);

  static TransferStatus fromName(String? name) {
    if (name == null) return TransferStatus.draft;
    return TransferStatus.values.asNameMap()[name.toLowerCase()] ?? TransferStatus.draft;
  }
}

// ─── Waste Reason ───

enum WasteReason {
  spoilage('Spoilage', Icons.bug_report),
  expired('Expired', Icons.event_busy),
  kitchenWaste('Kitchen Waste', Icons.restaurant),
  customerReturn('Customer Return', Icons.person_off),
  damaged('Damaged', Icons.broken_image),
  theft('Theft', Icons.security),
  other('Other', Icons.help_outline);

  final String label;
  final IconData icon;
  const WasteReason(this.label, this.icon);

  static WasteReason fromName(String? name) {
    if (name == null) return WasteReason.other;
    return WasteReason.values.asNameMap()[name.toLowerCase()] ?? WasteReason.other;
  }
}

// ─── Costing Method ───

enum CostingMethod {
  fifo('FIFO'),
  lifo('LIFO'),
  weightedAverage('Weighted Average'),
  specificIdentification('Specific Identification');

  final String label;
  const CostingMethod(this.label);

  static CostingMethod fromName(String? name) {
    if (name == null) return CostingMethod.weightedAverage;
    return CostingMethod.values.asNameMap()[name.toLowerCase()] ?? CostingMethod.weightedAverage;
  }
}

// ─── Inventory Item ───

class InventoryItem {
  final String id;
  final String name;
  final String? description;
  final String unit;
  final String? purchaseUnit;
  final double conversionRate;
  final InventoryItemType type;
  final String? category;
  final String? subcategory;
  final String? brand;
  final String? sku;
  final String? barcode;
  final double currentStock;
  final double minimumStock;
  final double maximumStock;
  final double reorderLevel;
  final double safetyStock;
  final double costPrice;
  final double? averageCost;
  final double? sellingPrice;
  final double reorderQuantity;
  final String? warehouseId;
  final String? shelfLocation;
  final String? binLocation;
  final bool expiryRequired;
  final bool batchTracking;
  final String? supplierId;
  final String? supplierName;
  final String? imageUrl;
  final bool isActive;
  final int version;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final List<StockMovement> recentMovements;

  const InventoryItem({
    required this.id,
    required this.name,
    this.description,
    required this.unit,
    this.purchaseUnit,
    this.conversionRate = 1.0,
    this.type = InventoryItemType.rawMaterial,
    this.category,
    this.subcategory,
    this.brand,
    this.sku,
    this.barcode,
    this.currentStock = 0,
    this.minimumStock = 0,
    this.maximumStock = 0,
    this.reorderLevel = 0,
    this.safetyStock = 0,
    this.costPrice = 0,
    this.averageCost,
    this.sellingPrice,
    this.reorderQuantity = 0,
    this.warehouseId,
    this.shelfLocation,
    this.binLocation,
    this.expiryRequired = false,
    this.batchTracking = false,
    this.supplierId,
    this.supplierName,
    this.imageUrl,
    this.isActive = true,
    this.version = 1,
    this.createdAt,
    this.updatedAt,
    this.recentMovements = const [],
  });

  factory InventoryItem.fromJson(Map<String, dynamic> json) => InventoryItem(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    description: json['description'],
    unit: json['unit'] ?? 'pcs',
    purchaseUnit: json['purchaseUnit'],
    conversionRate: (json['conversionRate'] as num?)?.toDouble() ?? 1.0,
    type: InventoryItemType.fromName(json['type'] ?? json['category']),
    category: json['category'],
    subcategory: json['subcategory'],
    brand: json['brand'],
    sku: json['sku'],
    barcode: json['barcode'],
    currentStock: (json['currentStock'] as num?)?.toDouble() ?? 0,
    minimumStock: (json['minimumStock'] as num?)?.toDouble() ?? 0,
    maximumStock: (json['maximumStock'] as num?)?.toDouble() ?? 0,
    reorderLevel: (json['reorderLevel'] as num?)?.toDouble() ?? 0,
    safetyStock: (json['safetyStock'] as num?)?.toDouble() ?? 0,
    costPrice: (json['costPrice'] as num?)?.toDouble() ?? 0,
    averageCost: (json['averageCost'] as num?)?.toDouble(),
    sellingPrice: (json['sellingPrice'] as num?)?.toDouble(),
    reorderQuantity: (json['reorderQuantity'] as num?)?.toDouble() ?? 0,
    warehouseId: json['warehouseId'],
    shelfLocation: json['shelfLocation'],
    binLocation: json['binLocation'],
    expiryRequired: json['expiryRequired'] ?? false,
    batchTracking: json['batchTracking'] ?? false,
    supplierId: json['supplierId'],
    supplierName: json['supplier']?['name'],
    imageUrl: json['imageUrl'],
    isActive: json['isActive'] ?? true,
    version: json['version'] ?? 1,
    createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt']) : null,
    recentMovements: (json['stockMovements'] as List<dynamic>?)
        ?.map((m) => StockMovement.fromJson(m as Map<String, dynamic>))
        .toList() ?? [],
  );

  double get stockValue => currentStock * costPrice;
  double get stockPercentage => maximumStock > 0 ? (currentStock / maximumStock * 100).clamp(0, 100) : 0;
  bool get isLowStock => currentStock <= minimumStock;
  bool get isOutOfStock => currentStock <= 0;
  bool get isOverstock => maximumStock > 0 && currentStock > maximumStock;
  bool get needsReorder => currentStock <= reorderLevel && reorderLevel > 0;
  double get deficit => minimumStock > currentStock ? minimumStock - currentStock : 0;

  StockLevel get stockLevel {
    if (isOutOfStock) return StockLevel.outOfStock;
    if (isLowStock) return StockLevel.low;
    if (needsReorder) return StockLevel.reorder;
    if (isOverstock) return StockLevel.overstock;
    return StockLevel.healthy;
  }

  InventoryItem copyWith({
    String? name,
    String? description,
    String? unit,
    String? purchaseUnit,
    double? conversionRate,
    InventoryItemType? type,
    String? category,
    double? currentStock,
    double? minimumStock,
    double? maximumStock,
    double? reorderLevel,
    double? safetyStock,
    double? costPrice,
    double? reorderQuantity,
    String? warehouseId,
    String? shelfLocation,
    String? binLocation,
    bool? expiryRequired,
    bool? batchTracking,
    String? supplierId,
    bool? isActive,
  }) {
    return InventoryItem(
      id: id,
      name: name ?? this.name,
      description: description ?? this.description,
      unit: unit ?? this.unit,
      purchaseUnit: purchaseUnit ?? this.purchaseUnit,
      conversionRate: conversionRate ?? this.conversionRate,
      type: type ?? this.type,
      category: category ?? this.category,
      subcategory: subcategory,
      brand: brand,
      sku: sku,
      barcode: barcode,
      currentStock: currentStock ?? this.currentStock,
      minimumStock: minimumStock ?? this.minimumStock,
      maximumStock: maximumStock ?? this.maximumStock,
      reorderLevel: reorderLevel ?? this.reorderLevel,
      safetyStock: safetyStock ?? this.safetyStock,
      costPrice: costPrice ?? this.costPrice,
      averageCost: averageCost,
      sellingPrice: sellingPrice,
      reorderQuantity: reorderQuantity ?? this.reorderQuantity,
      warehouseId: warehouseId ?? this.warehouseId,
      shelfLocation: shelfLocation ?? this.shelfLocation,
      binLocation: binLocation ?? this.binLocation,
      expiryRequired: expiryRequired ?? this.expiryRequired,
      batchTracking: batchTracking ?? this.batchTracking,
      supplierId: supplierId ?? this.supplierId,
      supplierName: supplierName,
      imageUrl: imageUrl,
      isActive: isActive ?? this.isActive,
      version: version + 1,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
      recentMovements: recentMovements,
    );
  }
}

enum StockLevel {
  outOfStock('Out of Stock', Color(0xFFEF4444)),
  low('Low Stock', Color(0xFFF59E0B)),
  reorder('Reorder', Color(0xFFF97316)),
  healthy('Healthy', Color(0xFF22C55E)),
  overstock('Overstock', Color(0xFF3B82F6));

  final String label;
  final Color color;
  const StockLevel(this.label, this.color);
}

// ─── Stock Movement ───

class StockMovement {
  final String id;
  final String inventoryItemId;
  final String? itemName;
  final StockMovementType type;
  final double quantity;
  final double? unitCost;
  final double? totalCost;
  final String? referenceId;
  final String? referenceType;
  final String? notes;
  final String? batchNumber;
  final String? warehouseId;
  final String? createdBy;
  final DateTime createdAt;

  const StockMovement({
    required this.id,
    required this.inventoryItemId,
    this.itemName,
    required this.type,
    required this.quantity,
    this.unitCost,
    this.totalCost,
    this.referenceId,
    this.referenceType,
    this.notes,
    this.batchNumber,
    this.warehouseId,
    this.createdBy,
    required this.createdAt,
  });

  factory StockMovement.fromJson(Map<String, dynamic> json) => StockMovement(
    id: json['id'] ?? '',
    inventoryItemId: json['inventoryItemId'] ?? json['inventoryItem']?['id'] ?? '',
    itemName: json['inventoryItem']?['name'] ?? json['itemName'],
    type: StockMovementType.fromName(json['type']),
    quantity: (json['quantity'] as num?)?.toDouble() ?? 0,
    unitCost: (json['unitCost'] as num?)?.toDouble(),
    totalCost: (json['totalCost'] as num?)?.toDouble(),
    referenceId: json['referenceId'],
    referenceType: json['referenceType'],
    notes: json['notes'],
    batchNumber: json['batchNumber'],
    warehouseId: json['warehouseId'],
    createdBy: json['createdBy'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );

  bool get isAddition => type.isAddition;
  bool get isDeduction => type.isDeduction;
}

// ─── Supplier ───

class Supplier {
  final String id;
  final String name;
  final String? phone;
  final String? email;
  final String? address;
  final String? gstNumber;
  final String? contactPerson;
  final double? leadTimeDays;
  final double? rating;
  final double? outstandingBalance;
  final int purchaseCount;
  final bool isActive;
  final int version;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Supplier({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.address,
    this.gstNumber,
    this.contactPerson,
    this.leadTimeDays,
    this.rating,
    this.outstandingBalance,
    this.purchaseCount = 0,
    this.isActive = true,
    this.version = 1,
    this.createdAt,
    this.updatedAt,
  });

  factory Supplier.fromJson(Map<String, dynamic> json) => Supplier(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    phone: json['phone'],
    email: json['email'],
    address: json['address'],
    gstNumber: json['gstNumber'],
    contactPerson: json['contactPerson'],
    leadTimeDays: (json['leadTimeDays'] as num?)?.toDouble(),
    rating: (json['rating'] as num?)?.toDouble(),
    outstandingBalance: (json['outstandingBalance'] as num?)?.toDouble(),
    purchaseCount: json['_count']?['purchases'] ?? json['purchaseCount'] ?? 0,
    isActive: json['isActive'] ?? true,
    version: json['version'] ?? 1,
    createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt']) : null,
  );

  Supplier copyWith({
    String? name,
    String? phone,
    String? email,
    String? address,
    String? gstNumber,
    String? contactPerson,
    double? leadTimeDays,
    double? rating,
    bool? isActive,
  }) {
    return Supplier(
      id: id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      gstNumber: gstNumber ?? this.gstNumber,
      contactPerson: contactPerson ?? this.contactPerson,
      leadTimeDays: leadTimeDays ?? this.leadTimeDays,
      rating: rating ?? this.rating,
      outstandingBalance: outstandingBalance,
      purchaseCount: purchaseCount,
      isActive: isActive ?? this.isActive,
      version: version + 1,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}

// ─── Purchase Order ───

class PurchaseOrder {
  final String id;
  final String? supplierId;
  final String? supplierName;
  final PurchaseOrderStatus status;
  final double totalAmount;
  final String? notes;
  final DateTime? expectedDate;
  final DateTime? receivedDate;
  final int version;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<PurchaseOrderItem> items;

  const PurchaseOrder({
    required this.id,
    this.supplierId,
    this.supplierName,
    this.status = PurchaseOrderStatus.pending,
    this.totalAmount = 0,
    this.notes,
    this.expectedDate,
    this.receivedDate,
    this.version = 1,
    required this.createdAt,
    required this.updatedAt,
    this.items = const [],
  });

  factory PurchaseOrder.fromJson(Map<String, dynamic> json) => PurchaseOrder(
    id: json['id'] ?? '',
    supplierId: json['supplierId'] ?? json['supplier']?['id'],
    supplierName: json['supplier']?['name'],
    status: PurchaseOrderStatus.fromName(json['status']),
    totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
    notes: json['notes'],
    expectedDate: json['expectedDate'] != null ? DateTime.tryParse(json['expectedDate']) : null,
    receivedDate: json['receivedDate'] != null ? DateTime.tryParse(json['receivedDate']) : null,
    version: json['version'] ?? 1,
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
    items: (json['items'] as List<dynamic>?)
        ?.map((i) => PurchaseOrderItem.fromJson(i as Map<String, dynamic>))
        .toList() ?? [],
  );

  double get receivedPercentage => items.isNotEmpty
      ? items.where((i) => i.isReceived).length / items.length * 100
      : 0;
  int get itemCount => items.length;
  bool get canReceive => status.canReceive;
}

class PurchaseOrderItem {
  final String id;
  final String? inventoryItemId;
  final String? itemName;
  final double quantity;
  final double unitPrice;
  final double totalCost;
  final double receivedQuantity;
  final bool isReceived;

  const PurchaseOrderItem({
    required this.id,
    this.inventoryItemId,
    this.itemName,
    required this.quantity,
    required this.unitPrice,
    this.totalCost = 0,
    this.receivedQuantity = 0,
    this.isReceived = false,
  });

  factory PurchaseOrderItem.fromJson(Map<String, dynamic> json) => PurchaseOrderItem(
    id: json['id'] ?? '',
    inventoryItemId: json['inventoryItemId'] ?? json['inventoryItem']?['id'],
    itemName: json['inventoryItem']?['name'] ?? json['itemName'],
    quantity: (json['quantity'] as num?)?.toDouble() ?? 0,
    unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0,
    totalCost: (json['totalCost'] as num?)?.toDouble() ?? 0,
    receivedQuantity: (json['receivedQuantity'] as num?)?.toDouble() ?? 0,
    isReceived: json['isReceived'] ?? false,
  );
}

// ─── Warehouse ───

class Warehouse {
  final String id;
  final String name;
  final String? type;
  final String? address;
  final bool isDefault;
  final bool isActive;
  final int itemCount;
  final double totalValue;

  const Warehouse({
    required this.id,
    required this.name,
    this.type,
    this.address,
    this.isDefault = false,
    this.isActive = true,
    this.itemCount = 0,
    this.totalValue = 0,
  });

  factory Warehouse.fromJson(Map<String, dynamic> json) => Warehouse(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    type: json['type'],
    address: json['address'],
    isDefault: json['isDefault'] ?? false,
    isActive: json['isActive'] ?? true,
    itemCount: json['itemCount'] ?? 0,
    totalValue: (json['totalValue'] as num?)?.toDouble() ?? 0,
  );

  IconData get icon {
    return switch (type?.toLowerCase()) {
      'kitchen' => Icons.restaurant,
      'cold' => Icons.ac_unit,
      'freezer' => Icons.ac_unit,
      'dry' => Icons.warehouse,
      'central' => Icons.domain,
      _ => Icons.store,
    };
  }
}

// ─── Recipe ───

class Recipe {
  final String id;
  final String name;
  final String? description;
  final String? menuItemId;
  final String? menuItemName;
  final double yieldQuantity;
  final String yieldUnit;
  final double preparationCost;
  final double totalCost;
  final int version;
  final bool isActive;
  final DateTime createdAt;
  final List<RecipeIngredient> ingredients;

  const Recipe({
    required this.id,
    required this.name,
    this.description,
    this.menuItemId,
    this.menuItemName,
    this.yieldQuantity = 1,
    this.yieldUnit = 'serving',
    this.preparationCost = 0,
    this.totalCost = 0,
    this.version = 1,
    this.isActive = true,
    required this.createdAt,
    this.ingredients = const [],
  });

  factory Recipe.fromJson(Map<String, dynamic> json) => Recipe(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    description: json['description'],
    menuItemId: json['menuItemId'],
    menuItemName: json['menuItem']?['name'],
    yieldQuantity: (json['yieldQuantity'] as num?)?.toDouble() ?? 1,
    yieldUnit: json['yieldUnit'] ?? 'serving',
    preparationCost: (json['preparationCost'] as num?)?.toDouble() ?? 0,
    totalCost: (json['totalCost'] as num?)?.toDouble() ?? 0,
    version: json['version'] ?? 1,
    isActive: json['isActive'] ?? true,
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    ingredients: (json['ingredients'] as List<dynamic>?)
        ?.map((i) => RecipeIngredient.fromJson(i as Map<String, dynamic>))
        .toList() ?? [],
  );

  double get costPerServing => yieldQuantity > 0 ? totalCost / yieldQuantity : 0;
}

class RecipeIngredient {
  final String id;
  final String? inventoryItemId;
  final String? itemName;
  final double quantity;
  final String unit;
  final double unitCost;
  final double totalCost;
  final bool isOptional;

  const RecipeIngredient({
    required this.id,
    this.inventoryItemId,
    this.itemName,
    required this.quantity,
    required this.unit,
    this.unitCost = 0,
    this.totalCost = 0,
    this.isOptional = false,
  });

  factory RecipeIngredient.fromJson(Map<String, dynamic> json) => RecipeIngredient(
    id: json['id'] ?? '',
    inventoryItemId: json['inventoryItemId'] ?? json['inventoryItem']?['id'],
    itemName: json['inventoryItem']?['name'] ?? json['itemName'],
    quantity: (json['quantity'] as num?)?.toDouble() ?? 0,
    unit: json['unit'] ?? 'pcs',
    unitCost: (json['unitCost'] as num?)?.toDouble() ?? 0,
    totalCost: (json['totalCost'] as num?)?.toDouble() ?? 0,
    isOptional: json['isOptional'] ?? false,
  );
}

// ─── Stock Count ───

class StockCount {
  final String id;
  final String name;
  final StockCountStatus status;
  final String? warehouseId;
  final String? warehouseName;
  final int itemCount;
  final int varianceCount;
  final DateTime createdAt;
  final DateTime? completedAt;
  final List<StockCountItem> items;

  const StockCount({
    required this.id,
    required this.name,
    this.status = StockCountStatus.draft,
    this.warehouseId,
    this.warehouseName,
    this.itemCount = 0,
    this.varianceCount = 0,
    required this.createdAt,
    this.completedAt,
    this.items = const [],
  });

  factory StockCount.fromJson(Map<String, dynamic> json) => StockCount(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    status: StockCountStatus.fromName(json['status']),
    warehouseId: json['warehouseId'],
    warehouseName: json['warehouse']?['name'],
    itemCount: json['itemCount'] ?? 0,
    varianceCount: json['varianceCount'] ?? 0,
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    completedAt: json['completedAt'] != null ? DateTime.tryParse(json['completedAt']) : null,
    items: (json['items'] as List<dynamic>?)
        ?.map((i) => StockCountItem.fromJson(i as Map<String, dynamic>))
        .toList() ?? [],
  );
}

class StockCountItem {
  final String id;
  final String? inventoryItemId;
  final String? itemName;
  final double systemQuantity;
  final double? countedQuantity;
  final double? variance;
  final String? notes;

  const StockCountItem({
    required this.id,
    this.inventoryItemId,
    this.itemName,
    this.systemQuantity = 0,
    this.countedQuantity,
    this.variance,
    this.notes,
  });

  factory StockCountItem.fromJson(Map<String, dynamic> json) => StockCountItem(
    id: json['id'] ?? '',
    inventoryItemId: json['inventoryItemId'] ?? json['inventoryItem']?['id'],
    itemName: json['inventoryItem']?['name'] ?? json['itemName'],
    systemQuantity: (json['systemQuantity'] as num?)?.toDouble() ?? 0,
    countedQuantity: (json['countedQuantity'] as num?)?.toDouble(),
    variance: (json['variance'] as num?)?.toDouble(),
    notes: json['notes'],
  );

  bool get isCounted => countedQuantity != null;
  bool get hasVariance => variance != null && variance != 0;
}

// ─── Transfer ───

class StockTransfer {
  final String id;
  final String? fromWarehouseId;
  final String? fromWarehouseName;
  final String? toWarehouseId;
  final String? toWarehouseName;
  final TransferStatus status;
  final String? notes;
  final DateTime createdAt;
  final DateTime? completedAt;
  final List<StockTransferItem> items;

  const StockTransfer({
    required this.id,
    this.fromWarehouseId,
    this.fromWarehouseName,
    this.toWarehouseId,
    this.toWarehouseName,
    this.status = TransferStatus.draft,
    this.notes,
    required this.createdAt,
    this.completedAt,
    this.items = const [],
  });

  factory StockTransfer.fromJson(Map<String, dynamic> json) => StockTransfer(
    id: json['id'] ?? '',
    fromWarehouseId: json['fromWarehouseId'],
    fromWarehouseName: json['fromWarehouse']?['name'],
    toWarehouseId: json['toWarehouseId'],
    toWarehouseName: json['toWarehouse']?['name'],
    status: TransferStatus.fromName(json['status']),
    notes: json['notes'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    completedAt: json['completedAt'] != null ? DateTime.tryParse(json['completedAt']) : null,
    items: (json['items'] as List<dynamic>?)
        ?.map((i) => StockTransferItem.fromJson(i as Map<String, dynamic>))
        .toList() ?? [],
  );
}

class StockTransferItem {
  final String id;
  final String? inventoryItemId;
  final String? itemName;
  final double quantity;
  final double? receivedQuantity;

  const StockTransferItem({
    required this.id,
    this.inventoryItemId,
    this.itemName,
    required this.quantity,
    this.receivedQuantity,
  });

  factory StockTransferItem.fromJson(Map<String, dynamic> json) => StockTransferItem(
    id: json['id'] ?? '',
    inventoryItemId: json['inventoryItemId'] ?? json['inventoryItem']?['id'],
    itemName: json['inventoryItem']?['name'] ?? json['itemName'],
    quantity: (json['quantity'] as num?)?.toDouble() ?? 0,
    receivedQuantity: (json['receivedQuantity'] as num?)?.toDouble(),
  );
}

// ─── Inventory Dashboard Data ───

class InventoryDashboardData {
  final double totalValue;
  final int totalItems;
  final int lowStockCount;
  final int criticalStockCount;
  final int outOfStockCount;
  final int expiringSoonCount;
  final int expiredCount;
  final double todayConsumption;
  final double todayPurchases;
  final double todayWaste;
  final int pendingPurchaseOrders;
  final int pendingTransfers;
  final double healthScore;
  final List<TopConsumingItem> topConsuming;
  final List<TopConsumingItem> slowMoving;

  const InventoryDashboardData({
    this.totalValue = 0,
    this.totalItems = 0,
    this.lowStockCount = 0,
    this.criticalStockCount = 0,
    this.outOfStockCount = 0,
    this.expiringSoonCount = 0,
    this.expiredCount = 0,
    this.todayConsumption = 0,
    this.todayPurchases = 0,
    this.todayWaste = 0,
    this.pendingPurchaseOrders = 0,
    this.pendingTransfers = 0,
    this.healthScore = 100,
    this.topConsuming = const [],
    this.slowMoving = const [],
  });

  factory InventoryDashboardData.fromItems(List<InventoryItem> items, List<PurchaseOrder> po) {
    final totalValue = items.fold<double>(0, (sum, i) => sum + i.stockValue);
    final lowStock = items.where((i) => i.isLowStock && !i.isOutOfStock).length;
    final critical = items.where((i) => i.isOutOfStock).length;
    final pending = po.where((p) => p.status.isActive).length;

    final health = items.isEmpty ? 100.0 : ((items.length - lowStock - critical) / items.length * 100);

    return InventoryDashboardData(
      totalValue: totalValue,
      totalItems: items.length,
      lowStockCount: lowStock,
      criticalStockCount: critical,
      outOfStockCount: items.where((i) => i.isOutOfStock).length,
      pendingPurchaseOrders: pending,
      healthScore: health.clamp(0, 100),
    );
  }
}

class TopConsumingItem {
  final String name;
  final double quantity;
  final double cost;
  const TopConsumingItem({required this.name, required this.quantity, required this.cost});
}

// ─── Inventory Filter ───

class InventoryFilter {
  final String? searchQuery;
  final InventoryItemType? type;
  final StockLevel? stockLevel;
  final String? category;
  final String? supplierId;
  final String? warehouseId;
  final bool showLowStockOnly;
  final bool showOutOfStockOnly;
  final bool showExpiringOnly;

  const InventoryFilter({
    this.searchQuery,
    this.type,
    this.stockLevel,
    this.category,
    this.supplierId,
    this.warehouseId,
    this.showLowStockOnly = false,
    this.showOutOfStockOnly = false,
    this.showExpiringOnly = false,
  });

  bool get hasActiveFilters =>
      searchQuery != null && searchQuery!.isNotEmpty ||
      type != null || stockLevel != null || category != null ||
      supplierId != null || warehouseId != null ||
      showLowStockOnly || showOutOfStockOnly || showExpiringOnly;

  InventoryFilter copyWith({
    String? searchQuery,
    InventoryItemType? type,
    StockLevel? stockLevel,
    String? category,
    String? supplierId,
    String? warehouseId,
    bool? showLowStockOnly,
    bool? showOutOfStockOnly,
    bool? showExpiringOnly,
    bool clearSearch = false,
    bool clearType = false,
    bool clearStockLevel = false,
  }) {
    return InventoryFilter(
      searchQuery: clearSearch ? null : (searchQuery ?? this.searchQuery),
      type: clearType ? null : (type ?? this.type),
      stockLevel: clearStockLevel ? null : (stockLevel ?? this.stockLevel),
      category: category ?? this.category,
      supplierId: supplierId ?? this.supplierId,
      warehouseId: warehouseId ?? this.warehouseId,
      showLowStockOnly: showLowStockOnly ?? this.showLowStockOnly,
      showOutOfStockOnly: showOutOfStockOnly ?? this.showOutOfStockOnly,
      showExpiringOnly: showExpiringOnly ?? this.showExpiringOnly,
    );
  }

  InventoryFilter clearAll() => const InventoryFilter();
}

// ─── AI Inventory Insights ───

class InventoryInsight {
  final String title;
  final String description;
  final String type;
  final String? action;
  final String? itemId;

  const InventoryInsight({
    required this.title,
    required this.description,
    required this.type,
    this.action,
    this.itemId,
  });
}

class PurchaseSuggestion {
  final String itemId;
  final String itemName;
  final double currentStock;
  final double reorderLevel;
  final double suggestedQuantity;
  final double estimatedCost;
  final String? supplierName;
  final String urgency;

  const PurchaseSuggestion({
    required this.itemId,
    required this.itemName,
    required this.currentStock,
    required this.reorderLevel,
    required this.suggestedQuantity,
    required this.estimatedCost,
    this.supplierName,
    required this.urgency,
  });
}
