/// Typed Inventory model mapping to backend Inventory entity.
class InventoryItemModel {
  final String id;
  final String name;
  final String? description;
  final String unit;
  final double currentStock;
  final double minimumStock;
  final double? maximumStock;
  final double? costPerUnit;
  final String? category;
  final String? supplierId;
  final String? branchId;
  final bool isLowStock;
  final DateTime? lastRestocked;
  final DateTime? createdAt;

  const InventoryItemModel({
    required this.id,
    required this.name,
    this.description,
    required this.unit,
    required this.currentStock,
    required this.minimumStock,
    this.maximumStock,
    this.costPerUnit,
    this.category,
    this.supplierId,
    this.branchId,
    this.isLowStock = false,
    this.lastRestocked,
    this.createdAt,
  });

  factory InventoryItemModel.fromJson(Map<String, dynamic> json) {
    return InventoryItemModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      unit: json['unit']?.toString() ?? 'kg',
      currentStock: double.tryParse(json['currentStock']?.toString() ?? '0') ?? 0,
      minimumStock: double.tryParse(json['minimumStock']?.toString() ?? '0') ?? 0,
      maximumStock: json['maximumStock'] != null ? double.tryParse(json['maximumStock'].toString()) : null,
      costPerUnit: json['costPerUnit'] != null ? double.tryParse(json['costPerUnit'].toString()) : null,
      category: json['category']?.toString(),
      supplierId: json['supplierId']?.toString(),
      branchId: json['branchId']?.toString(),
      isLowStock: json['isLowStock'] ?? (double.tryParse(json['currentStock']?.toString() ?? '0') ?? 0) <
          (double.tryParse(json['minimumStock']?.toString() ?? '0') ?? 0),
      lastRestocked: json['lastRestocked'] != null ? DateTime.tryParse(json['lastRestocked'].toString()) : null,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  double get stockPercentage {
    if (maximumStock == null || maximumStock == 0) return 1;
    return (currentStock / maximumStock!).clamp(0.0, 1.0);
  }
}
