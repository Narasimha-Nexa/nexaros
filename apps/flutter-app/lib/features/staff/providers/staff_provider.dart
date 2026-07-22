import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../../core/services/event_bus.dart';
import '../data/staff_service.dart';
import '../data/staff_models.dart';

class StaffState {
  final List<Employee> employees;
  final List<AttendanceRecord> attendance;
  final List<Shift> shifts;
  final List<ShiftAssignment> schedule;
  final List<LeaveRequest> leaveRequests;
  final List<LeaveBalance> leaveBalances;
  final List<PayrollRecord> payrollRecords;
  final List<PerformanceReview> performanceReviews;
  final List<StaffTask> tasks;
  final List<TrainingCourse> trainingCourses;
  final List<TrainingEnrollment> trainingEnrollments;
  final List<Announcement> announcements;
  final List<Map<String, dynamic>> roles;
  final HrDashboardData? hrDashboard;
  final StaffFilter filter;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentPage;
  final int totalCount;

  const StaffState({
    this.employees = const [],
    this.attendance = const [],
    this.shifts = const [],
    this.schedule = const [],
    this.leaveRequests = const [],
    this.leaveBalances = const [],
    this.payrollRecords = const [],
    this.performanceReviews = const [],
    this.tasks = const [],
    this.trainingCourses = const [],
    this.trainingEnrollments = const [],
    this.announcements = const [],
    this.roles = const [],
    this.hrDashboard,
    this.filter = const StaffFilter(),
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentPage = 1,
    this.totalCount = 0,
  });

  List<Employee> get filteredEmployees {
    var list = List<Employee>.from(employees);
    if (filter.search != null && filter.search!.isNotEmpty) {
      final q = filter.search!.toLowerCase();
      list = list.where((e) =>
        e.fullName.toLowerCase().contains(q) ||
        e.employeeId.toLowerCase().contains(q) ||
        e.phone.contains(q) ||
        e.email.toLowerCase().contains(q) ||
        e.roleName.toLowerCase().contains(q)
      ).toList();
    }
    if (filter.branchId != null) list = list.where((e) => e.branchId == filter.branchId).toList();
    if (filter.departmentId != null) list = list.where((e) => e.departmentId == filter.departmentId).toList();
    if (filter.roleId != null) list = list.where((e) => e.roleId == filter.roleId).toList();
    if (filter.status != null) list = list.where((e) => e.status == filter.status).toList();
    if (filter.employmentType != null) list = list.where((e) => e.employmentType == filter.employmentType).toList();
    return list;
  }

  int get totalEmployees => employees.length;
  int get activeEmployees => employees.where((e) => e.status == EmployeeStatus.active).length;
  int get onLeaveCount => attendance.where((a) => a.status == AttendanceStatus.onLeave).length;
  int get clockedInCount => attendance.where((a) => a.isClockedIn).length;
  int get pendingLeaves => leaveRequests.where((l) => l.status == LeaveStatus.pending).length;
  int get pendingTasks => tasks.where((t) => t.status == TaskStatus.pending).length;
  int get overdueTasks => tasks.where((t) => t.isOverdue).length;

  StaffState copyWith({
    List<Employee>? employees,
    List<AttendanceRecord>? attendance,
    List<Shift>? shifts,
    List<ShiftAssignment>? schedule,
    List<LeaveRequest>? leaveRequests,
    List<LeaveBalance>? leaveBalances,
    List<PayrollRecord>? payrollRecords,
    List<PerformanceReview>? performanceReviews,
    List<StaffTask>? tasks,
    List<TrainingCourse>? trainingCourses,
    List<TrainingEnrollment>? trainingEnrollments,
    List<Announcement>? announcements,
    List<Map<String, dynamic>>? roles,
    HrDashboardData? hrDashboard,
    StaffFilter? filter,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    int? currentPage,
    int? totalCount,
  }) => StaffState(
    employees: employees ?? this.employees,
    attendance: attendance ?? this.attendance,
    shifts: shifts ?? this.shifts,
    schedule: schedule ?? this.schedule,
    leaveRequests: leaveRequests ?? this.leaveRequests,
    leaveBalances: leaveBalances ?? this.leaveBalances,
    payrollRecords: payrollRecords ?? this.payrollRecords,
    performanceReviews: performanceReviews ?? this.performanceReviews,
    tasks: tasks ?? this.tasks,
    trainingCourses: trainingCourses ?? this.trainingCourses,
    trainingEnrollments: trainingEnrollments ?? this.trainingEnrollments,
    announcements: announcements ?? this.announcements,
    roles: roles ?? this.roles,
    hrDashboard: hrDashboard ?? this.hrDashboard,
    filter: filter ?? this.filter,
    isLoading: isLoading ?? this.isLoading,
    isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    error: error,
    currentPage: currentPage ?? this.currentPage,
    totalCount: totalCount ?? this.totalCount,
  );
}

class StaffProvider extends ChangeNotifier {
  final StaffService _service;
  final EventBus _eventBus;
  StaffState _state = const StaffState();
  StreamSubscription<BusEvent>? _staffSub;
  StreamSubscription<BusEvent>? _attendanceSub;
  StreamSubscription<BusEvent>? _shiftSub;
  StreamSubscription<BusEvent>? _leaveSub;
  StreamSubscription<BusEvent>? _taskSub;
  StreamSubscription<BusEvent>? _payrollSub;

  StaffProvider(this._service, this._eventBus) {
    _listenToEvents();
  }

  StaffState get state => _state;

  void _listenToEvents() {
    _staffSub = _eventBus.on(BusEventType.staffUpdated).listen((_) {
      if (_currentBranchId != null) loadEmployees(_currentBranchId!);
    });
    _attendanceSub = _eventBus.on(BusEventType.attendanceRecorded).listen((_) {
      if (_currentBranchId != null) loadAttendance(branchId: _currentBranchId!);
    });
    _shiftSub = _eventBus.on(BusEventType.shiftAssigned).listen((_) {
      if (_currentBranchId != null) loadShifts(_currentBranchId!);
    });
  }

  String? _currentBranchId;

  // ── Load All ───────────────────────────────────────────────────────────

  Future<void> loadAll(String branchId) async {
    _currentBranchId = branchId;
    _state = _state.copyWith(isLoading: true, error: null);
    notifyListeners();
    try {
      final results = await Future.wait([
        _service.getEmployees(branchId: branchId),
        _service.getTodayAttendance(branchId: branchId),
        _service.getShifts(branchId: branchId),
        _service.getSchedule(branchId, DateTime.now().toIso8601String().substring(0, 10)),
        _service.getLeaveRequests(branchId: branchId),
        _service.getPayroll(branchId: branchId),
        _service.getPerformanceReviews(),
        _service.getTasks(branchId: branchId),
        _service.getTrainingCourses(),
        _service.getAnnouncements(branchId: branchId),
        _service.getRoles(),
      ]);
      _state = _state.copyWith(
        employees: results[0] as List<Employee>,
        attendance: results[1] as List<AttendanceRecord>,
        shifts: results[2] as List<Shift>,
        schedule: results[3] as List<ShiftAssignment>,
        leaveRequests: results[4] as List<LeaveRequest>,
        payrollRecords: results[5] as List<PayrollRecord>,
        performanceReviews: results[6] as List<PerformanceReview>,
        tasks: results[7] as List<StaffTask>,
        trainingCourses: results[8] as List<TrainingCourse>,
        announcements: results[9] as List<Announcement>,
        roles: results[10] as List<Map<String, dynamic>>,
        isLoading: false,
      );
    } catch (e) {
      _state = _state.copyWith(isLoading: false, error: e.toString());
    }
    notifyListeners();
  }

  // ── Employee Operations ────────────────────────────────────────────────

  Future<void> loadEmployees(String branchId, {int page = 1}) async {
    _currentBranchId = branchId;
    try {
      final result = await _service.getEmployees(branchId: branchId, page: page);
      final newEmployees = result.items;
      final total = result.total;
      final isFirstPage = page == 1;
      _state = _state.copyWith(
        employees: isFirstPage ? newEmployees : [..._state.employees, ...newEmployees],
        currentPage: page,
        totalCount: total,
        isLoadingMore: false,
      );
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString(), isLoadingMore: false);
      notifyListeners();
    }
  }

  bool get hasMoreEmployees => _state.employees.length < _state.totalCount;

  Future<void> loadMoreEmployees(String branchId) async {
    if (!hasMoreEmployees || _state.isLoadingMore) return;
    _state = _state.copyWith(isLoadingMore: true);
    notifyListeners();
    await loadEmployees(branchId, page: _state.currentPage + 1);
  }

  Future<Employee?> createEmployee(String branchId, Map<String, dynamic> data) async {
    try {
      final employee = await _service.createEmployee(branchId, data);
      _state = _state.copyWith(employees: [..._state.employees, employee]);
      notifyListeners();
      return employee;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  Future<bool> updateEmployee(String id, Map<String, dynamic> data) async {
    try {
      final updated = await _service.updateEmployee(id, data);
      final list = _state.employees.map((e) => e.id == id ? updated : e).toList();
      _state = _state.copyWith(employees: list);
      notifyListeners();
      return true;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteEmployee(String id) async {
    try {
      await _service.deleteEmployee(id);
      _state = _state.copyWith(employees: _state.employees.where((e) => e.id != id).toList());
      notifyListeners();
      return true;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return false;
    }
  }

  // ── Attendance Operations ──────────────────────────────────────────────

  Future<void> loadAttendance({required String branchId}) async {
    try {
      final attendance = await _service.getTodayAttendance(branchId: branchId);
      _state = _state.copyWith(attendance: attendance);
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  Future<AttendanceRecord?> clockIn(String employeeId) async {
    try {
      final record = await _service.clockIn(employeeId);
      final list = [..._state.attendance, record];
      _state = _state.copyWith(attendance: list);
      notifyListeners();
      return record;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  Future<AttendanceRecord?> clockOut(String employeeId) async {
    try {
      final record = await _service.clockOut(employeeId);
      final list = _state.attendance.map((a) => a.employeeId == employeeId ? record : a).toList();
      _state = _state.copyWith(attendance: list);
      notifyListeners();
      return record;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  Future<List<AttendanceRecord>> getAttendanceReport(String employeeId, String from, String to) async {
    try {
      return await _service.getAttendanceReport(employeeId, from, to);
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return [];
    }
  }

  // ── Shift Operations ───────────────────────────────────────────────────

  Future<void> loadShifts(String branchId) async {
    try {
      final shifts = await _service.getShifts(branchId: branchId);
      _state = _state.copyWith(shifts: shifts);
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  Future<void> loadSchedule(String branchId, String date) async {
    try {
      final schedule = await _service.getSchedule(branchId, date);
      _state = _state.copyWith(schedule: schedule);
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  Future<Shift?> createShift(String branchId, Map<String, dynamic> data) async {
    try {
      final shift = await _service.createShift(branchId, data);
      _state = _state.copyWith(shifts: [..._state.shifts, shift]);
      notifyListeners();
      return shift;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  Future<ShiftAssignment?> assignShift(String staffId, String shiftId, String date) async {
    try {
      final assignment = await _service.assignShift(staffId, shiftId, date);
      _state = _state.copyWith(schedule: [..._state.schedule, assignment]);
      notifyListeners();
      return assignment;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  // ── Leave Operations ───────────────────────────────────────────────────

  Future<void> loadLeaveRequests({String? branchId, String? status}) async {
    try {
      final leaves = await _service.getLeaveRequests(branchId: branchId, status: status);
      _state = _state.copyWith(leaveRequests: leaves);
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  Future<LeaveRequest?> createLeaveRequest(Map<String, dynamic> data) async {
    try {
      final leave = await _service.createLeaveRequest(data);
      _state = _state.copyWith(leaveRequests: [..._state.leaveRequests, leave]);
      notifyListeners();
      return leave;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  Future<bool> approveLeave(String id) async {
    try {
      final approved = await _service.approveLeave(id);
      final list = _state.leaveRequests.map((l) => l.id == id ? approved : l).toList();
      _state = _state.copyWith(leaveRequests: list);
      notifyListeners();
      return true;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return false;
    }
  }

  Future<bool> rejectLeave(String id, {String? reason}) async {
    try {
      final rejected = await _service.rejectLeave(id, reason: reason);
      final list = _state.leaveRequests.map((l) => l.id == id ? rejected : l).toList();
      _state = _state.copyWith(leaveRequests: list);
      notifyListeners();
      return true;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return false;
    }
  }

  // ── Payroll Operations ─────────────────────────────────────────────────

  Future<void> loadPayroll({String? branchId, String? period, String? status}) async {
    try {
      final payroll = await _service.getPayroll(branchId: branchId, period: period, status: status);
      _state = _state.copyWith(payrollRecords: payroll);
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  Future<PayrollRecord?> generatePayroll(String branchId, String period) async {
    try {
      final record = await _service.generatePayroll(branchId, period);
      _state = _state.copyWith(payrollRecords: [..._state.payrollRecords, record]);
      notifyListeners();
      return record;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  Future<bool> approvePayroll(String id) async {
    try {
      final approved = await _service.approvePayroll(id);
      final list = _state.payrollRecords.map((p) => p.id == id ? approved : p).toList();
      _state = _state.copyWith(payrollRecords: list);
      notifyListeners();
      return true;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return false;
    }
  }

  // ── Performance Operations ─────────────────────────────────────────────

  Future<void> loadPerformanceReviews({String? employeeId}) async {
    try {
      final reviews = await _service.getPerformanceReviews(employeeId: employeeId);
      _state = _state.copyWith(performanceReviews: reviews);
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  Future<PerformanceReview?> createPerformanceReview(Map<String, dynamic> data) async {
    try {
      final review = await _service.createPerformanceReview(data);
      _state = _state.copyWith(performanceReviews: [..._state.performanceReviews, review]);
      notifyListeners();
      return review;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  // ── Task Operations ────────────────────────────────────────────────────

  Future<void> loadTasks({String? branchId, String? assignedTo, String? status}) async {
    try {
      final tasks = await _service.getTasks(branchId: branchId, assignedTo: assignedTo, status: status);
      _state = _state.copyWith(tasks: tasks);
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  Future<StaffTask?> createTask(Map<String, dynamic> data) async {
    try {
      final task = await _service.createTask(data);
      _state = _state.copyWith(tasks: [..._state.tasks, task]);
      notifyListeners();
      return task;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return null;
    }
  }

  Future<bool> updateTask(String id, Map<String, dynamic> data) async {
    try {
      final updated = await _service.updateTask(id, data);
      final list = _state.tasks.map((t) => t.id == id ? updated : t).toList();
      _state = _state.copyWith(tasks: list);
      notifyListeners();
      return true;
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return false;
    }
  }

  // ── Training Operations ────────────────────────────────────────────────

  Future<void> loadTrainingCourses() async {
    try {
      final courses = await _service.getTrainingCourses();
      _state = _state.copyWith(trainingCourses: courses);
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  Future<void> loadTrainingEnrollments({String? employeeId}) async {
    try {
      final enrollments = await _service.getTrainingEnrollments(employeeId: employeeId);
      _state = _state.copyWith(trainingEnrollments: enrollments);
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  // ── Announcement Operations ────────────────────────────────────────────

  Future<void> loadAnnouncements({String? branchId}) async {
    try {
      final announcements = await _service.getAnnouncements(branchId: branchId);
      _state = _state.copyWith(announcements: announcements);
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  // ── Filter ─────────────────────────────────────────────────────────────

  void updateFilter(StaffFilter filter) {
    _state = _state.copyWith(filter: filter);
    notifyListeners();
  }

  void clearFilter() {
    _state = _state.copyWith(filter: const StaffFilter());
    notifyListeners();
  }

  // ── HR Dashboard ───────────────────────────────────────────────────────

  Future<void> loadHrDashboard({String? branchId}) async {
    try {
      final dashboard = await _service.getHrDashboard(branchId: branchId);
      _state = _state.copyWith(hrDashboard: dashboard);
      notifyListeners();
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
    }
  }

  // ── Employment History ─────────────────────────────────────────────────

  Future<List<EmploymentHistory>> getEmploymentHistory(String employeeId) async {
    try {
      return await _service.getEmploymentHistory(employeeId);
    } catch (e) {
      _state = _state.copyWith(error: e.toString());
      notifyListeners();
      return [];
    }
  }

  @override
  void dispose() {
    _staffSub?.cancel();
    _attendanceSub?.cancel();
    _shiftSub?.cancel();
    _leaveSub?.cancel();
    _taskSub?.cancel();
    _payrollSub?.cancel();
    super.dispose();
  }
}
