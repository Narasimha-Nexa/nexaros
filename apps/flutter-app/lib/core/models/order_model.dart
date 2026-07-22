/// Typed Order model mapping to backend Order entity.
class OrderModel {
  final String id;
  final String orderNumber;
  final String status;
  final String type;
  final double totalAmount;
  final double? discount;
  final double? tax;
  final double? grandTotal;
  final String? notes;
  final String? customerId;
  final String? tableId;
  final String? branchId;
  final String? createdBy;
  final Map<String, dynamic>? table;
  final Map<String, dynamic>? customer;
  final List<OrderItemModel> items;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const OrderModel({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.type,
    required this.totalAmount,
    this.discount,
    this.tax,
    this.grandTotal,
    this.notes,
    this.customerId,
    this.tableId,
    this.branchId,
    this.createdBy,
    this.table,
    this.customer,
    this.items = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber']?.toString() ?? '',
      status: json['status']?.toString() ?? 'PENDING',
      type: json['type']?.toString() ?? 'DINE_IN',
      totalAmount: double.tryParse(json['totalAmount']?.toString() ?? '0') ?? 0,
      discount: json['discount'] != null ? double.tryParse(json['discount'].toString()) : null,
      tax: json['tax'] != null ? double.tryParse(json['tax'].toString()) : null,
      grandTotal: json['grandTotal'] != null ? double.tryParse(json['grandTotal'].toString()) : null,
      notes: json['notes']?.toString(),
      customerId: json['customerId']?.toString(),
      tableId: json['tableId']?.toString(),
      branchId: json['branchId']?.toString(),
      createdBy: json['createdBy']?.toString(),
      table: json['table'] as Map<String, dynamic>?,
      customer: json['customer'] as Map<String, dynamic>?,
      items: (json['items'] as List<dynamic>?)
              ?.map((i) => OrderItemModel.fromJson(i as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'].toString()) : null,
    );
  }

  String get displayTable => table != null ? 'T${table!['number']}' : '';

  String get displayItems =>
      items.map((i) => '${i.quantity}x ${i.name}').join(', ');

  String get formattedTime {
    if (createdAt == null) return '';
    return '${createdAt!.hour.toString().padLeft(2, '0')}:${createdAt!.minute.toString().padLeft(2, '0')}';
  }
}

class OrderItemModel {
  final String? id;
  final String? name;
  final int quantity;
  final double price;
  final double? total;
  final String? notes;
  final String? status;
  final Map<String, dynamic>? menuItem;

  const OrderItemModel({
    this.id,
    this.name,
    required this.quantity,
    required this.price,
    this.total,
    this.notes,
    this.status,
    this.menuItem,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      id: json['id']?.toString(),
      name: json['name']?.toString() ?? json['menuItem']?['name']?.toString() ?? '',
      quantity: json['quantity'] is int ? json['quantity'] : int.tryParse(json['quantity']?.toString() ?? '1') ?? 1,
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0,
      total: json['total'] != null ? double.tryParse(json['total'].toString()) : null,
      notes: json['notes']?.toString(),
      status: json['status']?.toString(),
      menuItem: json['menuItem'] as Map<String, dynamic>?,
    );
  }
}
