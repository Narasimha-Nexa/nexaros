/// Typed Table model mapping to backend Table entity.
class TableModel {
  final String id;
  final int number;
  final int capacity;
  final String status;
  final String? section;
  final double? posX;
  final double? posY;
  final String? branchId;
  final String? currentOrderId;
  final Map<String, dynamic>? currentOrder;
  final DateTime? occupiedAt;
  final DateTime? createdAt;

  const TableModel({
    required this.id,
    required this.number,
    required this.capacity,
    required this.status,
    this.section,
    this.posX,
    this.posY,
    this.branchId,
    this.currentOrderId,
    this.currentOrder,
    this.occupiedAt,
    this.createdAt,
  });

  factory TableModel.fromJson(Map<String, dynamic> json) {
    return TableModel(
      id: json['id']?.toString() ?? '',
      number: json['number'] is int ? json['number'] : int.tryParse(json['number']?.toString() ?? '0') ?? 0,
      capacity: json['capacity'] is int ? json['capacity'] : int.tryParse(json['capacity']?.toString() ?? '4') ?? 4,
      status: json['status']?.toString() ?? 'FREE',
      section: json['section']?.toString(),
      posX: json['posX'] != null ? double.tryParse(json['posX'].toString()) : null,
      posY: json['posY'] != null ? double.tryParse(json['posY'].toString()) : null,
      branchId: json['branchId']?.toString(),
      currentOrderId: json['currentOrderId']?.toString(),
      currentOrder: json['currentOrder'] as Map<String, dynamic>?,
      occupiedAt: json['occupiedAt'] != null ? DateTime.tryParse(json['occupiedAt'].toString()) : null,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  bool get isFree => status == 'FREE';
  bool get isOccupied => status == 'OCCUPIED';
  bool get isReserved => status == 'RESERVED';
  bool get isCleaning => status == 'CLEANING';
}
