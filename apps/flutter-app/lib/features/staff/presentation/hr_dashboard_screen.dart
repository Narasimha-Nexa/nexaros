import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/staff_models.dart';
import '../providers/staff_provider.dart';

class HrDashboardScreen extends ConsumerStatefulWidget {
  const HrDashboardScreen({super.key});
  @override
  ConsumerState<HrDashboardScreen> createState() => _HrDashboardScreenState();
}

class _HrDashboardScreenState extends ConsumerState<HrDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final branchId = ref.read(appStateProvider).branchId ?? '';
      if (branchId.isNotEmpty) {
        ref.read(staffProvider).loadAll(branchId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final staffProv = ref.watch(staffProvider);
    final s = staffProv.state;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: staffProv.state.isLoading
          ? const NxFullScreenLoader(message: 'Loading HR dashboard...')
          : RefreshIndicator(
              onRefresh: () async {
                final branchId = ref.read(appStateProvider).branchId ?? '';
                if (branchId.isNotEmpty) await staffProv.loadAll(branchId);
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeader(context),
                    const SizedBox(height: 20),
                    _buildKpiRow(context, s),
                    const SizedBox(height: 20),
                    _buildAttendanceOverview(context, s),
                    const SizedBox(height: 20),
                    _buildLeaveOverview(context, s),
                    const SizedBox(height: 20),
                    _buildPayrollSummary(context, s),
                    const SizedBox(height: 20),
                    _buildDepartmentHeadcount(context, s),
                    const SizedBox(height: 20),
                    _buildTopPerformers(context, s),
                    const SizedBox(height: 20),
                    _buildQuickActions(context),
                    const SizedBox(height: 20),
                    _buildRecentTasks(context, s),
                    const SizedBox(height: 20),
                    _buildAnnouncements(context, s),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('HR Dashboard', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('Workforce Management Overview', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.gray600)),
            ],
          ),
        ),
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: () {
            final branchId = ref.read(appStateProvider).branchId ?? '';
            if (branchId.isNotEmpty) ref.read(staffProvider).loadAll(branchId);
          },
        ),
      ],
    );
  }

  Widget _buildKpiRow(BuildContext context, StaffState s) {
    final kpis = [
      _KpiData('Total Staff', '${s.totalEmployees}', Icons.people, AppColors.primary),
      _KpiData('Active', '${s.activeEmployees}', Icons.check_circle, AppColors.success),
      _KpiData('Clocked In', '${s.clockedInCount}', Icons.login, AppColors.info),
      _KpiData('On Leave', '${s.onLeaveCount}', Icons.event_busy, AppColors.warning),
      _KpiData('Pending Leaves', '${s.pendingLeaves}', Icons.pending_actions, AppColors.warning),
      _KpiData('Overdue Tasks', '${s.overdueTasks}', Icons.warning, AppColors.danger),
    ];
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: kpis.map((k) => SizedBox(
        width: ResponsiveLayout.isDesktop(context) ? 160 : (MediaQuery.of(context).size.width - 44) / 2,
        child: NxStatCard(
          title: k.label,
          value: k.value,
          icon: k.icon,
          color: k.color,
        ),
      )).toList(),
    );
  }

  Widget _buildAttendanceOverview(BuildContext context, StaffState s) {
    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.access_time, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              Text('Today\'s Attendance', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildAttendanceStat(context, 'Clocked In', '${s.clockedInCount}', AppColors.success, Icons.login),
              _buildAttendanceStat(context, 'Clocked Out', '${s.totalEmployees - s.clockedInCount - s.onLeaveCount}', AppColors.gray500, Icons.logout),
              _buildAttendanceStat(context, 'On Leave', '${s.onLeaveCount}', AppColors.secondary, Icons.event_busy),
            ],
          ),
          const SizedBox(height: 16),
          if (s.attendance.isNotEmpty) ...[
            Text('Recently Clocked In', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ...s.attendance.where((a) => a.isClockedIn).take(5).map((a) => _buildAttendanceRow(context, a)),
          ],
        ],
      ),
    );
  }

  Widget _buildAttendanceStat(BuildContext context, String label, String value, Color color, IconData icon) {
    return Expanded(
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 8),
          Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: color)),
          Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.gray600)),
        ],
      ),
    );
  }

  Widget _buildAttendanceRow(BuildContext context, AttendanceRecord a) {
    final duration = a.workDuration;
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          NxAvatar(name: a.employeeName, size: 32),
          const SizedBox(width: 10),
          Expanded(
            child: Text(a.employeeName, style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis),
          ),
          Text(
            a.clockIn != null ? '${a.clockIn!.hour.toString().padLeft(2, '0')}:${a.clockIn!.minute.toString().padLeft(2, '0')}' : '--:--',
            style: const TextStyle(fontSize: 12, color: AppColors.gray600),
          ),
          if (duration != null) ...[
            const SizedBox(width: 8),
            Text('${duration.inHours}h ${duration.inMinutes % 60}m', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ],
        ],
      ),
    );
  }

  Widget _buildLeaveOverview(BuildContext context, StaffState s) {
    final pending = s.leaveRequests.where((l) => l.status == LeaveStatus.pending).toList();
    final approved = s.leaveRequests.where((l) => l.status == LeaveStatus.approved).toList();

    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.event_busy, size: 20, color: AppColors.secondary),
              const SizedBox(width: 8),
              Text('Leave Overview', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const Spacer(),
              if (pending.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.warning.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: Text('${pending.length} pending', style: const TextStyle(fontSize: 12, color: AppColors.warning, fontWeight: FontWeight.w600)),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (s.leaveRequests.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('No recent leave requests', style: TextStyle(color: AppColors.gray500)),
            )
          else
            ...s.leaveRequests.take(5).map((l) => _buildLeaveRow(context, l)),
        ],
      ),
    );
  }

  Widget _buildLeaveRow(BuildContext context, LeaveRequest l) {
    final statusColor = StatusHelpers.leaveStatusColor(l.status);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          NxAvatar(name: l.employeeName, size: 32),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l.employeeName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                Text(StatusHelpers.leaveTypeLabel(l.type), style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: Text(StatusHelpers.leaveStatusLabel(l.status), style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _buildPayrollSummary(BuildContext context, StaffState s) {
    final pendingPayroll = s.payrollRecords.where((p) => p.status == PayrollStatus.pending || p.status == PayrollStatus.draft).toList();
    final totalPending = pendingPayroll.fold(0.0, (sum, p) => sum + p.netPay);

    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.payments, size: 20, color: AppColors.success),
              const SizedBox(width: 8),
              Text('Payroll Summary', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildPayrollStat(context, 'Pending', '${pendingPayroll.length} records', AppColors.warning),
              _buildPayrollStat(context, 'Amount', '₹${totalPending.toStringAsFixed(0)}', AppColors.danger),
              _buildPayrollStat(context, 'Processed', '${s.payrollRecords.where((p) => p.status == PayrollStatus.paid).length}', AppColors.success),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPayrollStat(BuildContext context, String label, String value, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: color)),
          Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.gray600)),
        ],
      ),
    );
  }

  Widget _buildDepartmentHeadcount(BuildContext context, StaffState s) {
    if (s.hrDashboard == null || s.hrDashboard!.departmentHeadcount.isEmpty) return const SizedBox.shrink();
    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Department Headcount', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ...s.hrDashboard!.departmentHeadcount.map((d) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Expanded(flex: 3, child: Text(d.department, style: const TextStyle(fontSize: 13))),
                Expanded(
                  flex: 5,
                  child: LinearProgressIndicator(
                    value: d.utilization / 100,
                    backgroundColor: AppColors.gray200,
                    color: AppColors.primary,
                    minHeight: 8,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(flex: 2, child: Text('${d.headcount}', textAlign: TextAlign.end, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildTopPerformers(BuildContext context, StaffState s) {
    if (s.hrDashboard == null || s.hrDashboard!.topPerformers.isEmpty) return const SizedBox.shrink();
    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.emoji_events, size: 20, color: AppColors.warning),
              const SizedBox(width: 8),
              Text('Top Performers', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          ...s.hrDashboard!.topPerformers.asMap().entries.map((entry) {
            final i = entry.key;
            final p = entry.value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Container(
                    width: 24, height: 24,
                    decoration: BoxDecoration(
                      color: i == 0 ? AppColors.warning : (i == 1 ? AppColors.gray400 : AppColors.warning100),
                      shape: BoxShape.circle,
                    ),
                    child: Center(child: Text('${i + 1}', style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold))),
                  ),
                  const SizedBox(width: 10),
                  NxAvatar(name: p.name, size: 32),
                  const SizedBox(width: 10),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(p.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                    Text(p.department, style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
                  ])),
                  Text('${p.score.toStringAsFixed(1)}%', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.success)),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      _ActionData(Icons.person_add, 'Add Employee', AppColors.primary),
      _ActionData(Icons.access_time, 'Attendance', AppColors.info),
      _ActionData(Icons.calendar_month, 'Shifts', AppColors.secondary),
      _ActionData(Icons.event_busy, 'Leave', AppColors.warning),
      _ActionData(Icons.payments, 'Payroll', AppColors.success),
      _ActionData(Icons.assessment, 'Performance', AppColors.warning),
    ];

    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Quick Actions', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: ResponsiveLayout.isDesktop(context) ? 6 : 3,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1,
            ),
            itemCount: actions.length,
            itemBuilder: (context, i) {
              final a = actions[i];
              return InkWell(
                onTap: () {},
                borderRadius: BorderRadius.circular(12),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: a.color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                      child: Icon(a.icon, color: a.color, size: 24),
                    ),
                    const SizedBox(height: 6),
                    Text(a.label, style: const TextStyle(fontSize: 11), textAlign: TextAlign.center),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRecentTasks(BuildContext context, StaffState s) {
    if (s.tasks.isEmpty) return const SizedBox.shrink();
    final recentTasks = s.tasks.take(5).toList();
    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.task_alt, size: 20, color: AppColors.info),
              const SizedBox(width: 8),
              Text('Recent Tasks', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          ...recentTasks.map((t) {
            final statusColor = StatusHelpers.taskStatusColor(t.status);
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Icon(t.status == TaskStatus.completed ? Icons.check_circle : Icons.radio_button_unchecked, color: statusColor, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(t.title, style: TextStyle(fontSize: 13, decoration: t.status == TaskStatus.completed ? TextDecoration.lineThrough : null)),
                        if (t.assignedToName != null) Text('Assigned to: ${t.assignedToName}', style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                    child: Text(StatusHelpers.taskStatusLabel(t.status), style: TextStyle(fontSize: 10, color: statusColor, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildAnnouncements(BuildContext context, StaffState s) {
    if (s.announcements.isEmpty) return const SizedBox.shrink();
    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.campaign, size: 20, color: AppColors.warning),
              const SizedBox(width: 8),
              Text('Announcements', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          ...s.announcements.take(3).map((a) {
            final priorityColor = a.priority == AnnouncementPriority.urgent ? AppColors.danger
                : a.priority == AnnouncementPriority.high ? AppColors.warning
                : AppColors.gray500;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: priorityColor.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border(left: BorderSide(color: priorityColor, width: 3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(a.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                        Text(a.priority.name.toUpperCase(), style: TextStyle(fontSize: 10, color: priorityColor, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(a.content, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _KpiData {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _KpiData(this.label, this.value, this.icon, this.color);
}

class _ActionData {
  final IconData icon;
  final String label;
  final Color color;
  const _ActionData(this.icon, this.label, this.color);
}
