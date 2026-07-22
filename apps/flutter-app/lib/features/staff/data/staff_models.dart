import 'package:flutter/material.dart';

// ── Enums ──────────────────────────────────────────────────────────────────

enum EmployeeStatus { active, inactive, onLeave, terminated, suspended, probation }

enum Gender { male, female, other, preferNotToSay }

enum EmploymentType { fullTime, partTime, contract, intern, probationer }

enum AttendanceStatus { present, absent, late, halfDay, onLeave, holiday, weekend }

enum ClockAction { clockIn, clockOut, breakStart, breakEnd }

enum LeaveType { annual, sick, casual, maternity, paternity, emergency, compensatory, unpaid }

enum LeaveStatus { pending, approved, rejected, cancelled }

enum ShiftType { regular, rotational, split, night, weekend, holiday, overtime }

enum PayrollStatus { draft, pending, processing, processed, paid, cancelled }

enum PerformanceRating { outstanding, exceeds, meets, needsImprovement, unsatisfactory }

enum TaskStatus { pending, inProgress, completed, overdue, cancelled }

enum TaskPriority { low, medium, high, urgent }

enum TrainingStatus { notStarted, inProgress, completed, expired }

enum AnnouncementPriority { low, normal, high, urgent }

enum EmploymentAction { hire, promotion, transfer, demotion, resignation, termination, rejoin }

// ── Employee ───────────────────────────────────────────────────────────────

class Employee {
  final String id;
  final String employeeId;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String? avatar;
  final Gender gender;
  final DateTime? dateOfBirth;
  final DateTime? dateOfJoining;
  final DateTime? dateOfLeaving;
  final String branchId;
  final String branchName;
  final String departmentId;
  final String departmentName;
  final String? teamId;
  final String? teamName;
  final String roleId;
  final String roleName;
  final String? managerId;
  final String? managerName;
  final EmploymentType employmentType;
  final EmployeeStatus status;
  final double? hourlyRate;
  final double? dailyRate;
  final double? monthlySalary;
  final String? address;
  final String? city;
  final String? state;
  final String? pinCode;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? emergencyContactRelation;
  final String? aadharNumber;
  final String? panNumber;
  final String? bankName;
  final String? bankAccountNumber;
  final String? ifscCode;
  final int experienceYears;
  final double? performanceScore;
  final int totalOrders;
  final int attendanceDays;
  final int? probationEndDays;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Employee({
    required this.id,
    required this.employeeId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    this.avatar,
    this.gender = Gender.male,
    this.dateOfBirth,
    this.dateOfJoining,
    this.dateOfLeaving,
    required this.branchId,
    this.branchName = '',
    required this.departmentId,
    this.departmentName = '',
    this.teamId,
    this.teamName,
    required this.roleId,
    this.roleName = '',
    this.managerId,
    this.managerName,
    this.employmentType = EmploymentType.fullTime,
    this.status = EmployeeStatus.active,
    this.hourlyRate,
    this.dailyRate,
    this.monthlySalary,
    this.address,
    this.city,
    this.state,
    this.pinCode,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.emergencyContactRelation,
    this.aadharNumber,
    this.panNumber,
    this.bankName,
    this.bankAccountNumber,
    this.ifscCode,
    this.experienceYears = 0,
    this.performanceScore,
    this.totalOrders = 0,
    this.attendanceDays = 0,
    this.probationEndDays,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  String get fullName => '$firstName $lastName';
  String get initials => '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();

  factory Employee.fromJson(Map<String, dynamic> json) => Employee(
    id: json['id'] ?? '',
    employeeId: json['employeeId'] ?? json['employee_id'] ?? '',
    firstName: json['firstName'] ?? json['first_name'] ?? '',
    lastName: json['lastName'] ?? json['last_name'] ?? '',
    email: json['email'] ?? '',
    phone: json['phone'] ?? '',
    avatar: json['avatar'],
    gender: Gender.values.firstWhere((g) => g.name == json['gender'], orElse: () => Gender.male),
    dateOfBirth: json['dateOfBirth'] != null ? DateTime.tryParse(json['dateOfBirth']) : null,
    dateOfJoining: json['dateOfJoining'] != null ? DateTime.tryParse(json['dateOfJoining']) : null,
    dateOfLeaving: json['dateOfLeaving'] != null ? DateTime.tryParse(json['dateOfLeaving']) : null,
    branchId: json['branchId'] ?? '',
    branchName: json['branchName'] ?? '',
    departmentId: json['departmentId'] ?? '',
    departmentName: json['departmentName'] ?? '',
    teamId: json['teamId'],
    teamName: json['teamName'],
    roleId: json['roleId'] ?? '',
    roleName: json['roleName'] ?? '',
    managerId: json['managerId'],
    managerName: json['managerName'],
    employmentType: EmploymentType.values.firstWhere((e) => e.name == json['employmentType'], orElse: () => EmploymentType.fullTime),
    status: EmployeeStatus.values.firstWhere((s) => s.name == json['status'], orElse: () => EmployeeStatus.active),
    hourlyRate: (json['hourlyRate'] ?? json['hourly_rate'])?.toDouble(),
    dailyRate: (json['dailyRate'] ?? json['daily_rate'])?.toDouble(),
    monthlySalary: (json['monthlySalary'] ?? json['monthly_salary'])?.toDouble(),
    address: json['address'],
    city: json['city'],
    state: json['state'],
    pinCode: json['pinCode'] ?? json['pin_code'],
    emergencyContactName: json['emergencyContactName'] ?? json['emergency_contact_name'],
    emergencyContactPhone: json['emergencyContactPhone'] ?? json['emergency_contact_phone'],
    emergencyContactRelation: json['emergencyContactRelation'] ?? json['emergency_contact_relation'],
    aadharNumber: json['aadharNumber'] ?? json['aadhar_number'],
    panNumber: json['panNumber'] ?? json['pan_number'],
    bankName: json['bankName'] ?? json['bank_name'],
    bankAccountNumber: json['bankAccountNumber'] ?? json['bank_account_number'],
    ifscCode: json['ifscCode'] ?? json['ifsc_code'],
    experienceYears: json['experienceYears'] ?? json['experience_years'] ?? 0,
    performanceScore: (json['performanceScore'] ?? json['performance_score'])?.toDouble(),
    totalOrders: json['totalOrders'] ?? json['total_orders'] ?? 0,
    attendanceDays: json['attendanceDays'] ?? json['attendance_days'] ?? 0,
    probationEndDays: json['probationEndDays'] ?? json['probation_end_days'],
    metadata: json['metadata'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'employeeId': employeeId,
    'firstName': firstName,
    'lastName': lastName,
    'email': email,
    'phone': phone,
    'avatar': avatar,
    'gender': gender.name,
    'dateOfBirth': dateOfBirth?.toIso8601String(),
    'dateOfJoining': dateOfJoining?.toIso8601String(),
    'dateOfLeaving': dateOfLeaving?.toIso8601String(),
    'branchId': branchId,
    'branchName': branchName,
    'departmentId': departmentId,
    'departmentName': departmentName,
    'teamId': teamId,
    'teamName': teamName,
    'roleId': roleId,
    'roleName': roleName,
    'managerId': managerId,
    'managerName': managerName,
    'employmentType': employmentType.name,
    'status': status.name,
    'hourlyRate': hourlyRate,
    'dailyRate': dailyRate,
    'monthlySalary': monthlySalary,
    'address': address,
    'city': city,
    'state': state,
    'pinCode': pinCode,
    'emergencyContactName': emergencyContactName,
    'emergencyContactPhone': emergencyContactPhone,
    'emergencyContactRelation': emergencyContactRelation,
    'aadharNumber': aadharNumber,
    'panNumber': panNumber,
    'bankName': bankName,
    'bankAccountNumber': bankAccountNumber,
    'ifscCode': ifscCode,
    'experienceYears': experienceYears,
    'performanceScore': performanceScore,
    'totalOrders': totalOrders,
    'attendanceDays': attendanceDays,
    'metadata': metadata,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

// ── Attendance Record ──────────────────────────────────────────────────────

class AttendanceRecord {
  final String id;
  final String employeeId;
  final String employeeName;
  final String? branchId;
  final DateTime date;
  final DateTime? clockIn;
  final DateTime? clockOut;
  final DateTime? breakStart;
  final DateTime? breakEnd;
  final AttendanceStatus status;
  final double? hoursWorked;
  final double? overtimeHours;
  final String? notes;
  final String? approvedBy;
  final bool isManual;
  final double? latitude;
  final double? longitude;
  final DateTime createdAt;

  const AttendanceRecord({
    required this.id,
    required this.employeeId,
    this.employeeName = '',
    this.branchId,
    required this.date,
    this.clockIn,
    this.clockOut,
    this.breakStart,
    this.breakEnd,
    this.status = AttendanceStatus.present,
    this.hoursWorked,
    this.overtimeHours,
    this.notes,
    this.approvedBy,
    this.isManual = false,
    this.latitude,
    this.longitude,
    required this.createdAt,
  });

  bool get isClockedIn => clockIn != null && clockOut == null;
  bool get onBreak => breakStart != null && breakEnd == null;

  Duration? get workDuration {
    if (clockIn == null) return null;
    final end = clockOut ?? DateTime.now();
    final breakDuration = (breakStart != null && breakEnd != null)
        ? breakEnd!.difference(breakStart!)
        : Duration.zero;
    return end.difference(clockIn!) - breakDuration;
  }

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) => AttendanceRecord(
    id: json['id'] ?? '',
    employeeId: json['employeeId'] ?? json['employee_id'] ?? '',
    employeeName: json['employeeName'] ?? json['employee_name'] ?? '',
    branchId: json['branchId'],
    date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
    clockIn: json['clockIn'] != null ? DateTime.tryParse(json['clockIn']) : null,
    clockOut: json['clockOut'] != null ? DateTime.tryParse(json['clockOut']) : null,
    breakStart: json['breakStart'] != null ? DateTime.tryParse(json['breakStart']) : null,
    breakEnd: json['breakEnd'] != null ? DateTime.tryParse(json['breakEnd']) : null,
    status: AttendanceStatus.values.firstWhere((s) => s.name == json['status'], orElse: () => AttendanceStatus.present),
    hoursWorked: json['hoursWorked']?.toDouble(),
    overtimeHours: json['overtimeHours']?.toDouble(),
    notes: json['notes'],
    approvedBy: json['approvedBy'],
    isManual: json['isManual'] ?? false,
    latitude: json['latitude']?.toDouble(),
    longitude: json['longitude']?.toDouble(),
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── Shift ──────────────────────────────────────────────────────────────────

class Shift {
  final String id;
  final String name;
  final String branchId;
  final TimeOfDay startTime;
  final TimeOfDay endTime;
  final ShiftType type;
  final bool isRotational;
  final int maxStaff;
  final int assignedStaff;
  final List<String> days; // mon, tue, wed, etc.
  final double? overtimeRate;
  final bool isActive;
  final DateTime createdAt;

  const Shift({
    required this.id,
    required this.name,
    required this.branchId,
    required this.startTime,
    required this.endTime,
    this.type = ShiftType.regular,
    this.isRotational = false,
    this.maxStaff = 0,
    this.assignedStaff = 0,
    this.days = const [],
    this.overtimeRate,
    this.isActive = true,
    required this.createdAt,
  });

  Duration get duration {
    final startMinutes = startTime.hour * 60 + startTime.minute;
    final endMinutes = endTime.hour * 60 + endTime.minute;
    if (endMinutes > startMinutes) {
      return Duration(minutes: endMinutes - startMinutes);
    }
    return Duration(minutes: (24 * 60 - startMinutes) + endMinutes);
  }

  String get timeRange =>
      '${startTime.hour.toString().padLeft(2, '0')}:${startTime.minute.toString().padLeft(2, '0')} - '
      '${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')}';

  factory Shift.fromJson(Map<String, dynamic> json) {
    final startParts = (json['startTime'] ?? '09:00').split(':');
    final endParts = (json['endTime'] ?? '17:00').split(':');
    return Shift(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      branchId: json['branchId'] ?? '',
      startTime: TimeOfDay(hour: int.tryParse(startParts[0]) ?? 9, minute: int.tryParse(startParts.length > 1 ? startParts[1] : '0') ?? 0),
      endTime: TimeOfDay(hour: int.tryParse(endParts[0]) ?? 17, minute: int.tryParse(endParts.length > 1 ? endParts[1] : '0') ?? 0),
      type: ShiftType.values.firstWhere((t) => t.name == json['type'], orElse: () => ShiftType.regular),
      isRotational: json['isRotational'] ?? false,
      maxStaff: json['maxStaff'] ?? 0,
      assignedStaff: json['assignedStaff'] ?? 0,
      days: List<String>.from(json['days'] ?? []),
      overtimeRate: json['overtimeRate']?.toDouble(),
      isActive: json['isActive'] ?? true,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

// ── Shift Assignment ───────────────────────────────────────────────────────

class ShiftAssignment {
  final String id;
  final String employeeId;
  final String employeeName;
  final String shiftId;
  final String shiftName;
  final DateTime date;
  final String? branchId;
  final ShiftType type;
  final bool isSwap;
  final String? swapFromId;
  final String status; // assigned, confirmed, swapped, cancelled
  final DateTime createdAt;

  const ShiftAssignment({
    required this.id,
    required this.employeeId,
    this.employeeName = '',
    required this.shiftId,
    this.shiftName = '',
    required this.date,
    this.branchId,
    this.type = ShiftType.regular,
    this.isSwap = false,
    this.swapFromId,
    this.status = 'assigned',
    required this.createdAt,
  });

  factory ShiftAssignment.fromJson(Map<String, dynamic> json) => ShiftAssignment(
    id: json['id'] ?? '',
    employeeId: json['employeeId'] ?? '',
    employeeName: json['employeeName'] ?? '',
    shiftId: json['shiftId'] ?? '',
    shiftName: json['shiftName'] ?? '',
    date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
    branchId: json['branchId'],
    type: ShiftType.values.firstWhere((t) => t.name == json['type'], orElse: () => ShiftType.regular),
    isSwap: json['isSwap'] ?? false,
    swapFromId: json['swapFromId'],
    status: json['status'] ?? 'assigned',
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── Leave Request ──────────────────────────────────────────────────────────

class LeaveRequest {
  final String id;
  final String employeeId;
  final String employeeName;
  final String? employeeAvatar;
  final LeaveType type;
  final DateTime startDate;
  final DateTime endDate;
  final int days;
  final String? reason;
  final LeaveStatus status;
  final String? approvedBy;
  final String? approvedByName;
  final DateTime? approvedAt;
  final String? rejectionReason;
  final DateTime createdAt;

  const LeaveRequest({
    required this.id,
    required this.employeeId,
    this.employeeName = '',
    this.employeeAvatar,
    required this.type,
    required this.startDate,
    required this.endDate,
    this.days = 1,
    this.reason,
    this.status = LeaveStatus.pending,
    this.approvedBy,
    this.approvedByName,
    this.approvedAt,
    this.rejectionReason,
    required this.createdAt,
  });

  bool get isPending => status == LeaveStatus.pending;
  bool get isApproved => status == LeaveStatus.approved;

  factory LeaveRequest.fromJson(Map<String, dynamic> json) => LeaveRequest(
    id: json['id'] ?? '',
    employeeId: json['employeeId'] ?? '',
    employeeName: json['employeeName'] ?? '',
    employeeAvatar: json['employeeAvatar'],
    type: LeaveType.values.firstWhere((t) => t.name == json['type'], orElse: () => LeaveType.annual),
    startDate: DateTime.tryParse(json['startDate'] ?? '') ?? DateTime.now(),
    endDate: DateTime.tryParse(json['endDate'] ?? '') ?? DateTime.now(),
    days: json['days'] ?? 1,
    reason: json['reason'],
    status: LeaveStatus.values.firstWhere((s) => s.name == json['status'], orElse: () => LeaveStatus.pending),
    approvedBy: json['approvedBy'],
    approvedByName: json['approvedByName'],
    approvedAt: json['approvedAt'] != null ? DateTime.tryParse(json['approvedAt']) : null,
    rejectionReason: json['rejectionReason'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── Leave Balance ──────────────────────────────────────────────────────────

class LeaveBalance {
  final String employeeId;
  final LeaveType type;
  final int total;
  final int used;
  final int pending;
  final int remaining;

  const LeaveBalance({
    required this.employeeId,
    required this.type,
    required this.total,
    this.used = 0,
    this.pending = 0,
    required this.remaining,
  });

  double get usagePercent => total > 0 ? used / total : 0;

  factory LeaveBalance.fromJson(Map<String, dynamic> json) => LeaveBalance(
    employeeId: json['employeeId'] ?? '',
    type: LeaveType.values.firstWhere((t) => t.name == json['type'], orElse: () => LeaveType.annual),
    total: json['total'] ?? 0,
    used: json['used'] ?? 0,
    pending: json['pending'] ?? 0,
    remaining: json['remaining'] ?? 0,
  );
}

// ── Payroll ────────────────────────────────────────────────────────────────

class PayrollRecord {
  final String id;
  final String employeeId;
  final String employeeName;
  final String? employeeAvatar;
  final String period; // "2026-07"
  final PayrollStatus status;
  final double basicSalary;
  final double allowances;
  final double bonuses;
  final double commissions;
  final double tips;
  final double overtimePay;
  final double grossPay;
  final double deductions;
  final double taxDeduction;
  final double loanDeduction;
  final double advanceDeduction;
  final double otherDeductions;
  final double netPay;
  final double? amountPaid;
  final DateTime? paidAt;
  final String? paymentMethod;
  final String? notes;
  final DateTime createdAt;

  const PayrollRecord({
    required this.id,
    required this.employeeId,
    this.employeeName = '',
    this.employeeAvatar,
    required this.period,
    this.status = PayrollStatus.draft,
    this.basicSalary = 0,
    this.allowances = 0,
    this.bonuses = 0,
    this.commissions = 0,
    this.tips = 0,
    this.overtimePay = 0,
    this.grossPay = 0,
    this.deductions = 0,
    this.taxDeduction = 0,
    this.loanDeduction = 0,
    this.advanceDeduction = 0,
    this.otherDeductions = 0,
    this.netPay = 0,
    this.amountPaid,
    this.paidAt,
    this.paymentMethod,
    this.notes,
    required this.createdAt,
  });

  factory PayrollRecord.fromJson(Map<String, dynamic> json) => PayrollRecord(
    id: json['id'] ?? '',
    employeeId: json['employeeId'] ?? '',
    employeeName: json['employeeName'] ?? '',
    employeeAvatar: json['employeeAvatar'],
    period: json['period'] ?? '',
    status: PayrollStatus.values.firstWhere((s) => s.name == json['status'], orElse: () => PayrollStatus.draft),
    basicSalary: (json['basicSalary'] ?? 0).toDouble(),
    allowances: (json['allowances'] ?? 0).toDouble(),
    bonuses: (json['bonuses'] ?? 0).toDouble(),
    commissions: (json['commissions'] ?? 0).toDouble(),
    tips: (json['tips'] ?? 0).toDouble(),
    overtimePay: (json['overtimePay'] ?? 0).toDouble(),
    grossPay: (json['grossPay'] ?? 0).toDouble(),
    deductions: (json['deductions'] ?? 0).toDouble(),
    taxDeduction: (json['taxDeduction'] ?? 0).toDouble(),
    loanDeduction: (json['loanDeduction'] ?? 0).toDouble(),
    advanceDeduction: (json['advanceDeduction'] ?? 0).toDouble(),
    otherDeductions: (json['otherDeductions'] ?? 0).toDouble(),
    netPay: (json['netPay'] ?? 0).toDouble(),
    amountPaid: json['amountPaid']?.toDouble(),
    paidAt: json['paidAt'] != null ? DateTime.tryParse(json['paidAt']) : null,
    paymentMethod: json['paymentMethod'],
    notes: json['notes'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── Performance Review ─────────────────────────────────────────────────────

class PerformanceReview {
  final String id;
  final String employeeId;
  final String employeeName;
  final String? reviewerId;
  final String? reviewerName;
  final String period;
  final PerformanceRating rating;
  final double score; // 0-100
  final String? feedback;
  final String? strengths;
  final String? improvements;
  final String? goals;
  final List<PerformanceKpi> kpis;
  final DateTime createdAt;

  const PerformanceReview({
    required this.id,
    required this.employeeId,
    this.employeeName = '',
    this.reviewerId,
    this.reviewerName,
    required this.period,
    this.rating = PerformanceRating.meets,
    this.score = 0,
    this.feedback,
    this.strengths,
    this.improvements,
    this.goals,
    this.kpis = const [],
    required this.createdAt,
  });

  factory PerformanceReview.fromJson(Map<String, dynamic> json) => PerformanceReview(
    id: json['id'] ?? '',
    employeeId: json['employeeId'] ?? '',
    employeeName: json['employeeName'] ?? '',
    reviewerId: json['reviewerId'],
    reviewerName: json['reviewerName'],
    period: json['period'] ?? '',
    rating: PerformanceRating.values.firstWhere((r) => r.name == json['rating'], orElse: () => PerformanceRating.meets),
    score: (json['score'] ?? 0).toDouble(),
    feedback: json['feedback'],
    strengths: json['strengths'],
    improvements: json['improvements'],
    goals: json['goals'],
    kpis: (json['kpis'] as List<dynamic>?)?.map((k) => PerformanceKpi.fromJson(k)).toList() ?? [],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

class PerformanceKpi {
  final String name;
  final double target;
  final double actual;
  final String unit;

  const PerformanceKpi({
    required this.name,
    this.target = 0,
    this.actual = 0,
    this.unit = '',
  });

  double get achievement => target > 0 ? (actual / target * 100).clamp(0, 100) : 0;

  factory PerformanceKpi.fromJson(Map<String, dynamic> json) => PerformanceKpi(
    name: json['name'] ?? '',
    target: (json['target'] ?? 0).toDouble(),
    actual: (json['actual'] ?? 0).toDouble(),
    unit: json['unit'] ?? '',
  );
}

// ── Task ───────────────────────────────────────────────────────────────────

class StaffTask {
  final String id;
  final String title;
  final String? description;
  final String? assignedTo;
  final String? assignedToName;
  final String? assignedBy;
  final String? assignedByName;
  final String branchId;
  final String? departmentId;
  final TaskStatus status;
  final TaskPriority priority;
  final DateTime? dueDate;
  final DateTime? completedAt;
  final bool isRecurring;
  final String? recurringPattern; // daily, weekly, monthly
  final List<String> checklist;
  final Map<String, bool> checklistStatus;
  final DateTime createdAt;

  const StaffTask({
    required this.id,
    required this.title,
    this.description,
    this.assignedTo,
    this.assignedToName,
    this.assignedBy,
    this.assignedByName,
    required this.branchId,
    this.departmentId,
    this.status = TaskStatus.pending,
    this.priority = TaskPriority.medium,
    this.dueDate,
    this.completedAt,
    this.isRecurring = false,
    this.recurringPattern,
    this.checklist = const [],
    this.checklistStatus = const {},
    required this.createdAt,
  });

  bool get isOverdue => dueDate != null && DateTime.now().isAfter(dueDate!) && status != TaskStatus.completed;
  int get completedChecklistItems => checklistStatus.values.where((v) => v).length;

  factory StaffTask.fromJson(Map<String, dynamic> json) => StaffTask(
    id: json['id'] ?? '',
    title: json['title'] ?? '',
    description: json['description'],
    assignedTo: json['assignedTo'],
    assignedToName: json['assignedToName'],
    assignedBy: json['assignedBy'],
    assignedByName: json['assignedByName'],
    branchId: json['branchId'] ?? '',
    departmentId: json['departmentId'],
    status: TaskStatus.values.firstWhere((s) => s.name == json['status'], orElse: () => TaskStatus.pending),
    priority: TaskPriority.values.firstWhere((p) => p.name == json['priority'], orElse: () => TaskPriority.medium),
    dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate']) : null,
    completedAt: json['completedAt'] != null ? DateTime.tryParse(json['completedAt']) : null,
    isRecurring: json['isRecurring'] ?? false,
    recurringPattern: json['recurringPattern'],
    checklist: List<String>.from(json['checklist'] ?? []),
    checklistStatus: Map<String, bool>.from(json['checklistStatus'] ?? {}),
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── Training ───────────────────────────────────────────────────────────────

class TrainingCourse {
  final String id;
  final String title;
  final String? description;
  final String? category;
  final String? thumbnailUrl;
  final String? videoUrl;
  final List<String> documents;
  final int durationMinutes;
  final bool isMandatory;
  final List<String> assignedDepartments;
  final int enrolledCount;
  final int completedCount;
  final DateTime createdAt;

  const TrainingCourse({
    required this.id,
    required this.title,
    this.description,
    this.category,
    this.thumbnailUrl,
    this.videoUrl,
    this.documents = const [],
    this.durationMinutes = 0,
    this.isMandatory = false,
    this.assignedDepartments = const [],
    this.enrolledCount = 0,
    this.completedCount = 0,
    required this.createdAt,
  });

  String get durationLabel {
    if (durationMinutes < 60) return '${durationMinutes}m';
    return '${durationMinutes ~/ 60}h ${durationMinutes % 60}m';
  }

  factory TrainingCourse.fromJson(Map<String, dynamic> json) => TrainingCourse(
    id: json['id'] ?? '',
    title: json['title'] ?? '',
    description: json['description'],
    category: json['category'],
    thumbnailUrl: json['thumbnailUrl'],
    videoUrl: json['videoUrl'],
    documents: List<String>.from(json['documents'] ?? []),
    durationMinutes: json['durationMinutes'] ?? 0,
    isMandatory: json['isMandatory'] ?? false,
    assignedDepartments: List<String>.from(json['assignedDepartments'] ?? []),
    enrolledCount: json['enrolledCount'] ?? 0,
    completedCount: json['completedCount'] ?? 0,
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

class TrainingEnrollment {
  final String id;
  final String courseId;
  final String courseName;
  final String employeeId;
  final String employeeName;
  final TrainingStatus status;
  final double progress; // 0-100
  final DateTime? enrolledAt;
  final DateTime? completedAt;
  final DateTime? expiresAt;
  final int? score;

  const TrainingEnrollment({
    required this.id,
    required this.courseId,
    this.courseName = '',
    required this.employeeId,
    this.employeeName = '',
    this.status = TrainingStatus.notStarted,
    this.progress = 0,
    this.enrolledAt,
    this.completedAt,
    this.expiresAt,
    this.score,
  });

  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);

  factory TrainingEnrollment.fromJson(Map<String, dynamic> json) => TrainingEnrollment(
    id: json['id'] ?? '',
    courseId: json['courseId'] ?? '',
    courseName: json['courseName'] ?? '',
    employeeId: json['employeeId'] ?? '',
    employeeName: json['employeeName'] ?? '',
    status: TrainingStatus.values.firstWhere((s) => s.name == json['status'], orElse: () => TrainingStatus.notStarted),
    progress: (json['progress'] ?? 0).toDouble(),
    enrolledAt: json['enrolledAt'] != null ? DateTime.tryParse(json['enrolledAt']) : null,
    completedAt: json['completedAt'] != null ? DateTime.tryParse(json['completedAt']) : null,
    expiresAt: json['expiresAt'] != null ? DateTime.tryParse(json['expiresAt']) : null,
    score: json['score'],
  );
}

// ── Announcement ───────────────────────────────────────────────────────────

class Announcement {
  final String id;
  final String title;
  final String content;
  final String? authorId;
  final String? authorName;
  final AnnouncementPriority priority;
  final List<String> targetBranches;
  final List<String> targetDepartments;
  final bool isBroadcast;
  final DateTime? expiresAt;
  final int readCount;
  final DateTime createdAt;

  const Announcement({
    required this.id,
    required this.title,
    required this.content,
    this.authorId,
    this.authorName,
    this.priority = AnnouncementPriority.normal,
    this.targetBranches = const [],
    this.targetDepartments = const [],
    this.isBroadcast = false,
    this.expiresAt,
    this.readCount = 0,
    required this.createdAt,
  });

  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);

  factory Announcement.fromJson(Map<String, dynamic> json) => Announcement(
    id: json['id'] ?? '',
    title: json['title'] ?? '',
    content: json['content'] ?? '',
    authorId: json['authorId'],
    authorName: json['authorName'],
    priority: AnnouncementPriority.values.firstWhere((p) => p.name == json['priority'], orElse: () => AnnouncementPriority.normal),
    targetBranches: List<String>.from(json['targetBranches'] ?? []),
    targetDepartments: List<String>.from(json['targetDepartments'] ?? []),
    isBroadcast: json['isBroadcast'] ?? false,
    expiresAt: json['expiresAt'] != null ? DateTime.tryParse(json['expiresAt']) : null,
    readCount: json['readCount'] ?? 0,
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── HR Dashboard Data ──────────────────────────────────────────────────────

class HrDashboardData {
  final int totalEmployees;
  final int activeEmployees;
  final int newJoiners;
  final int onLeave;
  final int clockedIn;
  final int clockedOut;
  final int lateArrivals;
  final int absentEmployees;
  final double overtimeHours;
  final double attendanceRate;
  final double turnoverRate;
  final double averagePerformance;
  final double payrollPending;
  final double payrollProcessed;
  final List<DepartmentHeadcount> departmentHeadcount;
  final List<TopPerformer> topPerformers;

  const HrDashboardData({
    this.totalEmployees = 0,
    this.activeEmployees = 0,
    this.newJoiners = 0,
    this.onLeave = 0,
    this.clockedIn = 0,
    this.clockedOut = 0,
    this.lateArrivals = 0,
    this.absentEmployees = 0,
    this.overtimeHours = 0,
    this.attendanceRate = 0,
    this.turnoverRate = 0,
    this.averagePerformance = 0,
    this.payrollPending = 0,
    this.payrollProcessed = 0,
    this.departmentHeadcount = const [],
    this.topPerformers = const [],
  });

  factory HrDashboardData.fromJson(Map<String, dynamic> json) => HrDashboardData(
    totalEmployees: json['totalEmployees'] ?? 0,
    activeEmployees: json['activeEmployees'] ?? 0,
    newJoiners: json['newJoiners'] ?? 0,
    onLeave: json['onLeave'] ?? 0,
    clockedIn: json['clockedIn'] ?? 0,
    clockedOut: json['clockedOut'] ?? 0,
    lateArrivals: json['lateArrivals'] ?? 0,
    absentEmployees: json['absentEmployees'] ?? 0,
    overtimeHours: (json['overtimeHours'] ?? 0).toDouble(),
    attendanceRate: (json['attendanceRate'] ?? 0).toDouble(),
    turnoverRate: (json['turnoverRate'] ?? 0).toDouble(),
    averagePerformance: (json['averagePerformance'] ?? 0).toDouble(),
    payrollPending: (json['payrollPending'] ?? 0).toDouble(),
    payrollProcessed: (json['payrollProcessed'] ?? 0).toDouble(),
    departmentHeadcount: (json['departmentHeadcount'] as List<dynamic>?)?.map((d) => DepartmentHeadcount.fromJson(d)).toList() ?? [],
    topPerformers: (json['topPerformers'] as List<dynamic>?)?.map((t) => TopPerformer.fromJson(t)).toList() ?? [],
  );
}

class DepartmentHeadcount {
  final String department;
  final int headcount;
  final double utilization;

  const DepartmentHeadcount({this.department = '', this.headcount = 0, this.utilization = 0});

  factory DepartmentHeadcount.fromJson(Map<String, dynamic> json) => DepartmentHeadcount(
    department: json['department'] ?? '',
    headcount: json['headcount'] ?? 0,
    utilization: (json['utilization'] ?? 0).toDouble(),
  );
}

class TopPerformer {
  final String employeeId;
  final String name;
  final String? avatar;
  final double score;
  final String department;

  const TopPerformer({this.employeeId = '', this.name = '', this.avatar, this.score = 0, this.department = ''});

  factory TopPerformer.fromJson(Map<String, dynamic> json) => TopPerformer(
    employeeId: json['employeeId'] ?? '',
    name: json['name'] ?? '',
    avatar: json['avatar'],
    score: (json['score'] ?? 0).toDouble(),
    department: json['department'] ?? '',
  );
}

// ── Staff Filter ───────────────────────────────────────────────────────────

class StaffFilter {
  final String? search;
  final String? branchId;
  final String? departmentId;
  final String? roleId;
  final EmployeeStatus? status;
  final EmploymentType? employmentType;
  final String? managerId;

  const StaffFilter({
    this.search,
    this.branchId,
    this.departmentId,
    this.roleId,
    this.status,
    this.employmentType,
    this.managerId,
  });

  bool get hasActiveFilters =>
      search != null && search!.isNotEmpty ||
      branchId != null ||
      departmentId != null ||
      roleId != null ||
      status != null ||
      employmentType != null ||
      managerId != null;

  StaffFilter copyWith({
    String? search,
    String? branchId,
    String? departmentId,
    String? roleId,
    EmployeeStatus? status,
    EmploymentType? employmentType,
    String? managerId,
    bool clearSearch = false,
    bool clearBranch = false,
    bool clearDepartment = false,
    bool clearRole = false,
    bool clearStatus = false,
    bool clearEmploymentType = false,
    bool clearManager = false,
  }) => StaffFilter(
    search: clearSearch ? null : (search ?? this.search),
    branchId: clearBranch ? null : (branchId ?? this.branchId),
    departmentId: clearDepartment ? null : (departmentId ?? this.departmentId),
    roleId: clearRole ? null : (roleId ?? this.roleId),
    status: clearStatus ? null : (status ?? this.status),
    employmentType: clearEmploymentType ? null : (employmentType ?? this.employmentType),
    managerId: clearManager ? null : (managerId ?? this.managerId),
  );

  void clearAll() {}
}

// ── Employment History ─────────────────────────────────────────────────────

class EmploymentHistory {
  final String id;
  final String employeeId;
  final EmploymentAction action;
  final String? previousRole;
  final String? newRole;
  final String? previousBranch;
  final String? newBranch;
  final double? previousSalary;
  final double? newSalary;
  final String? reason;
  final String? approvedBy;
  final DateTime effectiveDate;
  final DateTime createdAt;

  const EmploymentHistory({
    required this.id,
    required this.employeeId,
    required this.action,
    this.previousRole,
    this.newRole,
    this.previousBranch,
    this.newBranch,
    this.previousSalary,
    this.newSalary,
    this.reason,
    this.approvedBy,
    required this.effectiveDate,
    required this.createdAt,
  });

  factory EmploymentHistory.fromJson(Map<String, dynamic> json) => EmploymentHistory(
    id: json['id'] ?? '',
    employeeId: json['employeeId'] ?? '',
    action: EmploymentAction.values.firstWhere((a) => a.name == json['action'], orElse: () => EmploymentAction.hire),
    previousRole: json['previousRole'],
    newRole: json['newRole'],
    previousBranch: json['previousBranch'],
    newBranch: json['newBranch'],
    previousSalary: json['previousSalary']?.toDouble(),
    newSalary: json['newSalary']?.toDouble(),
    reason: json['reason'],
    approvedBy: json['approvedBy'],
    effectiveDate: DateTime.tryParse(json['effectiveDate'] ?? '') ?? DateTime.now(),
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── Status Helpers ─────────────────────────────────────────────────────────

class StatusHelpers {
  static Color attendanceColor(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.present: return const Color(0xFF22C55E);
      case AttendanceStatus.absent: return const Color(0xFFEF4444);
      case AttendanceStatus.late: return const Color(0xFFF59E0B);
      case AttendanceStatus.halfDay: return const Color(0xFF3B82F6);
      case AttendanceStatus.onLeave: return const Color(0xFF8B5CF6);
      case AttendanceStatus.holiday: return const Color(0xFF6B7280);
      case AttendanceStatus.weekend: return const Color(0xFF9CA3AF);
    }
  }

  static Color leaveStatusColor(LeaveStatus status) {
    switch (status) {
      case LeaveStatus.pending: return const Color(0xFFF59E0B);
      case LeaveStatus.approved: return const Color(0xFF22C55E);
      case LeaveStatus.rejected: return const Color(0xFFEF4444);
      case LeaveStatus.cancelled: return const Color(0xFF9CA3AF);
    }
  }

  static Color taskStatusColor(TaskStatus status) {
    switch (status) {
      case TaskStatus.pending: return const Color(0xFFF59E0B);
      case TaskStatus.inProgress: return const Color(0xFF3B82F6);
      case TaskStatus.completed: return const Color(0xFF22C55E);
      case TaskStatus.overdue: return const Color(0xFFEF4444);
      case TaskStatus.cancelled: return const Color(0xFF9CA3AF);
    }
  }

  static Color payrollStatusColor(PayrollStatus status) {
    switch (status) {
      case PayrollStatus.draft: return const Color(0xFF9CA3AF);
      case PayrollStatus.pending: return const Color(0xFFF59E0B);
      case PayrollStatus.processing: return const Color(0xFF3B82F6);
      case PayrollStatus.processed: return const Color(0xFF8B5CF6);
      case PayrollStatus.paid: return const Color(0xFF22C55E);
      case PayrollStatus.cancelled: return const Color(0xFFEF4444);
    }
  }

  static Color performanceColor(PerformanceRating rating) {
    switch (rating) {
      case PerformanceRating.outstanding: return const Color(0xFF22C55E);
      case PerformanceRating.exceeds: return const Color(0xFF3B82F6);
      case PerformanceRating.meets: return const Color(0xFF8B5CF6);
      case PerformanceRating.needsImprovement: return const Color(0xFFF59E0B);
      case PerformanceRating.unsatisfactory: return const Color(0xFFEF4444);
    }
  }

  static String attendanceLabel(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.present: return 'Present';
      case AttendanceStatus.absent: return 'Absent';
      case AttendanceStatus.late: return 'Late';
      case AttendanceStatus.halfDay: return 'Half Day';
      case AttendanceStatus.onLeave: return 'On Leave';
      case AttendanceStatus.holiday: return 'Holiday';
      case AttendanceStatus.weekend: return 'Weekend';
    }
  }

  static String leaveStatusLabel(LeaveStatus status) {
    switch (status) {
      case LeaveStatus.pending: return 'Pending';
      case LeaveStatus.approved: return 'Approved';
      case LeaveStatus.rejected: return 'Rejected';
      case LeaveStatus.cancelled: return 'Cancelled';
    }
  }

  static String taskStatusLabel(TaskStatus status) {
    switch (status) {
      case TaskStatus.pending: return 'Pending';
      case TaskStatus.inProgress: return 'In Progress';
      case TaskStatus.completed: return 'Completed';
      case TaskStatus.overdue: return 'Overdue';
      case TaskStatus.cancelled: return 'Cancelled';
    }
  }

  static String payrollStatusLabel(PayrollStatus status) {
    switch (status) {
      case PayrollStatus.draft: return 'Draft';
      case PayrollStatus.pending: return 'Pending';
      case PayrollStatus.processing: return 'Processing';
      case PayrollStatus.processed: return 'Processed';
      case PayrollStatus.paid: return 'Paid';
      case PayrollStatus.cancelled: return 'Cancelled';
    }
  }

  static String performanceLabel(PerformanceRating rating) {
    switch (rating) {
      case PerformanceRating.outstanding: return 'Outstanding';
      case PerformanceRating.exceeds: return 'Exceeds Expectations';
      case PerformanceRating.meets: return 'Meets Expectations';
      case PerformanceRating.needsImprovement: return 'Needs Improvement';
      case PerformanceRating.unsatisfactory: return 'Unsatisfactory';
    }
  }

  static String leaveTypeLabel(LeaveType type) {
    switch (type) {
      case LeaveType.annual: return 'Annual Leave';
      case LeaveType.sick: return 'Sick Leave';
      case LeaveType.casual: return 'Casual Leave';
      case LeaveType.maternity: return 'Maternity Leave';
      case LeaveType.paternity: return 'Paternity Leave';
      case LeaveType.emergency: return 'Emergency Leave';
      case LeaveType.compensatory: return 'Compensatory Leave';
      case LeaveType.unpaid: return 'Unpaid Leave';
    }
  }

  static String employeeStatusLabel(EmployeeStatus status) {
    switch (status) {
      case EmployeeStatus.active: return 'Active';
      case EmployeeStatus.inactive: return 'Inactive';
      case EmployeeStatus.onLeave: return 'On Leave';
      case EmployeeStatus.terminated: return 'Terminated';
      case EmployeeStatus.suspended: return 'Suspended';
      case EmployeeStatus.probation: return 'Probation';
    }
  }

  static Color employeeStatusColor(EmployeeStatus status) {
    switch (status) {
      case EmployeeStatus.active: return const Color(0xFF22C55E);
      case EmployeeStatus.inactive: return const Color(0xFF9CA3AF);
      case EmployeeStatus.onLeave: return const Color(0xFF8B5CF6);
      case EmployeeStatus.terminated: return const Color(0xFFEF4444);
      case EmployeeStatus.suspended: return const Color(0xFFF59E0B);
      case EmployeeStatus.probation: return const Color(0xFF3B82F6);
    }
  }
}
