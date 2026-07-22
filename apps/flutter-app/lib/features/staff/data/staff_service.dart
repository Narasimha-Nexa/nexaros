import '../../../core/network/api_client.dart';
import 'staff_models.dart';

/// Paginated employee result.
class PaginatedEmployees {
  final List<Employee> items;
  final int total;
  const PaginatedEmployees({required this.items, required this.total});
}

class StaffService {
  final ApiClient _api;
  StaffService(this._api);

  // ── Employee CRUD ──────────────────────────────────────────────────────

  Future<PaginatedEmployees> getEmployees({
    required String branchId,
    int page = 1,
    int limit = 50,
    String? search,
    String? departmentId,
    String? roleId,
    String? status,
  }) async {
    final response = await _api.getStaff(branchId: branchId, page: page, limit: limit);
    final staffList = List<Map<String, dynamic>>.from(response['staff'] ?? []);
    final total = response['total'] as int? ?? staffList.length;
    return PaginatedEmployees(
      items: staffList.map((json) => Employee.fromJson(json)).toList(),
      total: total,
    );
  }

  Future<Employee> getEmployee(String id) async {
    final data = await _api.get('/staff/$id');
    return Employee.fromJson(data);
  }

  Future<Employee> createEmployee(String branchId, Map<String, dynamic> data) async {
    final result = await _api.createStaff(branchId, data);
    return Employee.fromJson(result);
  }

  Future<Employee> updateEmployee(String id, Map<String, dynamic> data) async {
    final result = await _api.updateStaff(id, data);
    return Employee.fromJson(result);
  }

  Future<void> deleteEmployee(String id) async {
    await _api.deleteStaff(id);
  }

  // ── Attendance ─────────────────────────────────────────────────────────

  Future<List<AttendanceRecord>> getTodayAttendance({required String branchId}) async {
    final data = await _api.getTodayAttendance(branchId: branchId);
    return data.map((json) => AttendanceRecord.fromJson(json)).toList();
  }

  Future<List<AttendanceRecord>> getAttendanceReport(String employeeId, String from, String to) async {
    final data = await _api.getAttendanceReport(employeeId, from, to);
    return data.map((json) => AttendanceRecord.fromJson(json)).toList();
  }

  Future<AttendanceRecord> clockIn(String employeeId) async {
    final data = await _api.clockIn(employeeId);
    return AttendanceRecord.fromJson(data);
  }

  Future<AttendanceRecord> clockOut(String employeeId) async {
    final data = await _api.clockOut(employeeId);
    return AttendanceRecord.fromJson(data);
  }

  Future<void> recordBreakStart(String attendanceId) async {
    await _api.post('/attendance/$attendanceId/break-start', {});
  }

  Future<void> recordBreakEnd(String attendanceId) async {
    await _api.post('/attendance/$attendanceId/break-end', {});
  }

  Future<void> updateAttendance(String attendanceId, Map<String, dynamic> data) async {
    await _api.put('/attendance/$attendanceId', data);
  }

  // ── Shifts ─────────────────────────────────────────────────────────────

  Future<List<Shift>> getShifts({required String branchId}) async {
    final data = await _api.getShifts(branchId: branchId);
    return data.map((json) => Shift.fromJson(json)).toList();
  }

  Future<Shift> createShift(String branchId, Map<String, dynamic> data) async {
    final result = await _api.createShift(branchId, data);
    return Shift.fromJson(result);
  }

  Future<void> deleteShift(String id) async {
    await _api.deleteShift(id);
  }

  Future<List<ShiftAssignment>> getSchedule(String branchId, String date) async {
    final data = await _api.getSchedule(branchId, date);
    return data.map((json) => ShiftAssignment.fromJson(json)).toList();
  }

  Future<ShiftAssignment> assignShift(String staffId, String shiftId, String date) async {
    final data = await _api.assignShift(staffId, shiftId, date);
    return ShiftAssignment.fromJson(data);
  }

  Future<void> swapShift(String assignmentId, String newShiftId) async {
    await _api.post('/schedule/swap', {'assignmentId': assignmentId, 'newShiftId': newShiftId});
  }

  Future<void> cancelShiftAssignment(String assignmentId) async {
    await _api.delete('/schedule/$assignmentId');
  }

  // ── Leave ──────────────────────────────────────────────────────────────

  Future<List<LeaveRequest>> getLeaveRequests({String? employeeId, String? status, String? branchId}) async {
    final params = <String, String>{};
    if (employeeId != null) params['employeeId'] = employeeId;
    if (status != null) params['status'] = status;
    if (branchId != null) params['branchId'] = branchId;
    final data = await _api.get('/leave', queryParameters: params);
    return (data as List<dynamic>).map((json) => LeaveRequest.fromJson(json)).toList();
  }

  Future<LeaveRequest> createLeaveRequest(Map<String, dynamic> data) async {
    final result = await _api.post('/leave', data);
    return LeaveRequest.fromJson(result);
  }

  Future<LeaveRequest> approveLeave(String id, {String? approvedBy}) async {
    final result = await _api.put('/leave/$id/approve', {'approvedBy': approvedBy});
    return LeaveRequest.fromJson(result);
  }

  Future<LeaveRequest> rejectLeave(String id, {String? reason}) async {
    final result = await _api.put('/leave/$id/reject', {'reason': reason});
    return LeaveRequest.fromJson(result);
  }

  Future<void> cancelLeave(String id) async {
    await _api.put('/leave/$id/cancel', {});
  }

  Future<List<LeaveBalance>> getLeaveBalance(String employeeId) async {
    final data = await _api.get('/leave/balance/$employeeId');
    return (data as List<dynamic>).map((json) => LeaveBalance.fromJson(json)).toList();
  }

  // ── Payroll ────────────────────────────────────────────────────────────

  Future<List<PayrollRecord>> getPayroll({String? branchId, String? period, String? status}) async {
    final params = <String, String>{};
    if (branchId != null) params['branchId'] = branchId;
    if (period != null) params['period'] = period;
    if (status != null) params['status'] = status;
    final data = await _api.get('/payroll', queryParameters: params);
    return (data as List<dynamic>).map((json) => PayrollRecord.fromJson(json)).toList();
  }

  Future<PayrollRecord> generatePayroll(String branchId, String period) async {
    final result = await _api.post('/payroll/generate', {'branchId': branchId, 'period': period});
    return PayrollRecord.fromJson(result);
  }

  Future<PayrollRecord> approvePayroll(String id) async {
    final result = await _api.put('/payroll/$id/approve', {});
    return PayrollRecord.fromJson(result);
  }

  Future<PayrollRecord> processPayroll(String id) async {
    final result = await _api.put('/payroll/$id/process', {});
    return PayrollRecord.fromJson(result);
  }

  Future<PayrollRecord> markPayrollPaid(String id, String method) async {
    final result = await _api.put('/payroll/$id/pay', {'paymentMethod': method});
    return PayrollRecord.fromJson(result);
  }

  // ── Performance ────────────────────────────────────────────────────────

  Future<List<PerformanceReview>> getPerformanceReviews({String? employeeId, String? period}) async {
    final params = <String, String>{};
    if (employeeId != null) params['employeeId'] = employeeId;
    if (period != null) params['period'] = period;
    final data = await _api.get('/performance', queryParameters: params);
    return (data as List<dynamic>).map((json) => PerformanceReview.fromJson(json)).toList();
  }

  Future<PerformanceReview> createPerformanceReview(Map<String, dynamic> data) async {
    final result = await _api.post('/performance', data);
    return PerformanceReview.fromJson(result);
  }

  // ── Tasks ──────────────────────────────────────────────────────────────

  Future<List<StaffTask>> getTasks({String? branchId, String? assignedTo, String? status}) async {
    final params = <String, String>{};
    if (branchId != null) params['branchId'] = branchId;
    if (assignedTo != null) params['assignedTo'] = assignedTo;
    if (status != null) params['status'] = status;
    final data = await _api.get('/staff-tasks', queryParameters: params);
    return (data as List<dynamic>).map((json) => StaffTask.fromJson(json)).toList();
  }

  Future<StaffTask> createTask(Map<String, dynamic> data) async {
    final result = await _api.post('/staff-tasks', data);
    return StaffTask.fromJson(result);
  }

  Future<StaffTask> updateTask(String id, Map<String, dynamic> data) async {
    final result = await _api.put('/staff-tasks/$id', data);
    return StaffTask.fromJson(result);
  }

  Future<void> deleteTask(String id) async {
    await _api.delete('/staff-tasks/$id');
  }

  // ── Training ───────────────────────────────────────────────────────────

  Future<List<TrainingCourse>> getTrainingCourses({String? category}) async {
    final params = <String, String>{};
    if (category != null) params['category'] = category;
    final data = await _api.get('/training/courses', queryParameters: params);
    return (data as List<dynamic>).map((json) => TrainingCourse.fromJson(json)).toList();
  }

  Future<TrainingCourse> createTrainingCourse(Map<String, dynamic> data) async {
    final result = await _api.post('/training/courses', data);
    return TrainingCourse.fromJson(result);
  }

  Future<List<TrainingEnrollment>> getTrainingEnrollments({String? employeeId}) async {
    final params = <String, String>{};
    if (employeeId != null) params['employeeId'] = employeeId;
    final data = await _api.get('/training/enrollments', queryParameters: params);
    return (data as List<dynamic>).map((json) => TrainingEnrollment.fromJson(json)).toList();
  }

  Future<void> enrollInCourse(String courseId, String employeeId) async {
    await _api.post('/training/enroll', {'courseId': courseId, 'employeeId': employeeId});
  }

  Future<void> updateTrainingProgress(String enrollmentId, double progress, {int? score}) async {
    await _api.put('/training/enrollments/$enrollmentId', {'progress': progress, 'score': score});
  }

  // ── Announcements ──────────────────────────────────────────────────────

  Future<List<Announcement>> getAnnouncements({String? branchId}) async {
    final params = <String, String>{};
    if (branchId != null) params['branchId'] = branchId;
    final data = await _api.get('/announcements', queryParameters: params);
    return (data as List<dynamic>).map((json) => Announcement.fromJson(json)).toList();
  }

  Future<Announcement> createAnnouncement(Map<String, dynamic> data) async {
    final result = await _api.post('/announcements', data);
    return Announcement.fromJson(result);
  }

  // ── HR Dashboard ───────────────────────────────────────────────────────

  Future<HrDashboardData> getHrDashboard({String? branchId}) async {
    final params = <String, String>{};
    if (branchId != null) params['branchId'] = branchId;
    final data = await _api.get('/hr/dashboard', queryParameters: params);
    return HrDashboardData.fromJson(data);
  }

  Future<Map<String, dynamic>> getStaffAnalytics({String? branchId, String? startDate, String? endDate}) async {
    return await _api.getStaffAnalytics(branchId: branchId, startDate: startDate, endDate: endDate);
  }

  // ── Employment History ─────────────────────────────────────────────────

  Future<List<EmploymentHistory>> getEmploymentHistory(String employeeId) async {
    final data = await _api.get('/staff/$employeeId/history');
    return (data as List<dynamic>).map((json) => EmploymentHistory.fromJson(json)).toList();
  }

  // ── Roles ──────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getRoles() async {
    final data = await _api.getRoles();
    return data.map((json) => Map<String, dynamic>.from(json)).toList();
  }
}
