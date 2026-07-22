/// Typed Staff model mapping to backend User/Staff entity.
class StaffModel {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String role;
  final String? branchId;
  final bool isActive;
  final DateTime? joinedAt;
  final DateTime? createdAt;

  const StaffModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    required this.role,
    this.branchId,
    this.isActive = true,
    this.joinedAt,
    this.createdAt,
  });

  factory StaffModel.fromJson(Map<String, dynamic> json) {
    return StaffModel(
      id: json['id']?.toString() ?? '',
      firstName: json['firstName']?.toString() ?? '',
      lastName: json['lastName']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      role: json['role']?.toString() ?? 'WAITER',
      branchId: json['branchId']?.toString(),
      isActive: json['isActive'] ?? true,
      joinedAt: json['joinedAt'] != null ? DateTime.tryParse(json['joinedAt'].toString()) : null,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  String get fullName => '$firstName $lastName'.trim();
  String get initials {
    final f = firstName.isNotEmpty ? firstName[0] : '';
    final l = lastName.isNotEmpty ? lastName[0] : '';
    return '$f$l'.toUpperCase();
  }
}

/// Typed Attendance record.
class AttendanceModel {
  final String id;
  final String staffId;
  final DateTime? clockIn;
  final DateTime? clockOut;
  final double? hoursWorked;
  final String? status;
  final DateTime? date;

  const AttendanceModel({
    required this.id,
    required this.staffId,
    this.clockIn,
    this.clockOut,
    this.hoursWorked,
    this.status,
    this.date,
  });

  factory AttendanceModel.fromJson(Map<String, dynamic> json) {
    return AttendanceModel(
      id: json['id']?.toString() ?? '',
      staffId: json['staffId']?.toString() ?? json['userId']?.toString() ?? '',
      clockIn: json['clockIn'] != null ? DateTime.tryParse(json['clockIn'].toString()) : null,
      clockOut: json['clockOut'] != null ? DateTime.tryParse(json['clockOut'].toString()) : null,
      hoursWorked: json['hoursWorked'] != null ? double.tryParse(json['hoursWorked'].toString()) : null,
      status: json['status']?.toString(),
      date: json['date'] != null ? DateTime.tryParse(json['date'].toString()) : null,
    );
  }
}
