import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/staff_models.dart';

class AttendanceManagementScreen extends ConsumerStatefulWidget {
  const AttendanceManagementScreen({super.key});
  @override
  ConsumerState<AttendanceManagementScreen> createState() => _AttendanceManagementScreenState();
}

class _AttendanceManagementScreenState extends ConsumerState<AttendanceManagementScreen> {
  String _filter = 'all';
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final branchId = ref.read(appStateProvider).branchId ?? '';
      if (branchId.isNotEmpty) ref.read(staffProvider).loadAttendance(branchId: branchId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final staffProv = ref.watch(staffProvider);
    final attendance = staffProv.state.attendance;
    final employees = staffProv.state.employees;

    final filtered = attendance.where((a) {
      if (_filter == 'clocked-in') return a.isClockedIn;
      if (_filter == 'clocked-out') return a.clockIn != null && a.clockOut != null;
      if (_filter == 'absent') return a.status == AttendanceStatus.absent;
      if (_filter == 'late') return a.status == AttendanceStatus.late;
      return true;
    }).toList();

    final clockedIn = attendance.where((a) => a.isClockedIn).length;
    final onBreak = attendance.where((a) => a.onBreak).length;
    final total = employees.length;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Attendance Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: () async {
              final picked = await showDatePicker(context: context, initialDate: _selectedDate, firstDate: DateTime(2024), lastDate: DateTime.now());
              if (picked != null) setState(() => _selectedDate = picked);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSummaryHeader(context, clockedIn, onBreak, total),
          _buildFilterChips(),
          Expanded(
            child: staffProv.state.isLoading
                ? const NxFullScreenLoader(message: 'Loading attendance...')
                : filtered.isEmpty
                    ? const NxEmptyState(icon: Icons.access_time, title: 'No Records', subtitle: 'No attendance records for this date')
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        itemBuilder: (context, i) => _buildAttendanceCard(context, filtered[i]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryHeader(BuildContext context, int clockedIn, int onBreak, int total) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: AppColors.primary.withOpacity(0.05),
      child: Row(
        children: [
          _stat('Clocked In', '$clockedIn', AppColors.success),
          _stat('On Break', '$onBreak', AppColors.warning),
          _stat('Total', '$total', AppColors.primary),
        ],
      ),
    );
  }

  Widget _stat(String label, String value, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    final filters = [
      ('all', 'All'),
      ('clocked-in', 'Clocked In'),
      ('clocked-out', 'Clocked Out'),
      ('absent', 'Absent'),
      ('late', 'Late'),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: filters.map((f) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: FilterChip(
            label: Text(f.$2, style: TextStyle(fontSize: 12, color: _filter == f.$1 ? Colors.white : AppColors.gray700)),
            selected: _filter == f.$1,
            onSelected: (_) => setState(() => _filter = f.$1),
            selectedColor: AppColors.primary,
            backgroundColor: AppColors.gray100,
            checkmarkColor: Colors.white,
          ),
        )).toList(),
      ),
    );
  }

  Widget _buildAttendanceCard(BuildContext context, AttendanceRecord a) {
    final isClockedIn = a.isClockedIn;
    final duration = a.workDuration;

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            NxAvatar(name: a.employeeName, size: 44),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Text(a.employeeName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: isClockedIn ? AppColors.success.withOpacity(0.1) : AppColors.gray200,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isClockedIn ? 'Clocked In' : (a.clockOut != null ? 'Clocked Out' : 'Not Started'),
                        style: TextStyle(fontSize: 10, color: isClockedIn ? AppColors.success : AppColors.gray600, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 4),
                  Row(children: [
                    const Icon(Icons.login, size: 14, color: AppColors.gray500),
                    const SizedBox(width: 4),
                    Text(a.clockIn != null ? DateFormat('HH:mm').format(a.clockIn!) : '--:--', style: const TextStyle(fontSize: 12)),
                    const SizedBox(width: 12),
                    const Icon(Icons.logout, size: 14, color: AppColors.gray500),
                    const SizedBox(width: 4),
                    Text(a.clockOut != null ? DateFormat('HH:mm').format(a.clockOut!) : '--:--', style: const TextStyle(fontSize: 12)),
                    if (duration != null) ...[
                      const SizedBox(width: 12),
                      const Icon(Icons.timer, size: 14, color: AppColors.gray500),
                      const SizedBox(width: 4),
                      Text('${duration.inHours}h ${duration.inMinutes % 60}m', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    ],
                  ]),
                ],
              ),
            ),
            Column(
              children: [
                if (!isClockedIn && a.clockIn == null)
                  ElevatedButton(
                    onPressed: () => ref.read(staffProvider).clockIn(a.employeeId),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.success, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6)),
                    child: const Text('Clock In', style: TextStyle(fontSize: 11)),
                  )
                else if (isClockedIn)
                  ElevatedButton(
                    onPressed: () => ref.read(staffProvider).clockOut(a.employeeId),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6)),
                    child: const Text('Clock Out', style: TextStyle(fontSize: 11)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
