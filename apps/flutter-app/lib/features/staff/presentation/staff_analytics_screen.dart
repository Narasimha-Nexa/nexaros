import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/staff_models.dart';
import '../providers/staff_provider.dart';

class StaffAnalyticsScreen extends ConsumerStatefulWidget {
  const StaffAnalyticsScreen({super.key});
  @override
  ConsumerState<StaffAnalyticsScreen> createState() => _StaffAnalyticsScreenState();
}

class _StaffAnalyticsScreenState extends ConsumerState<StaffAnalyticsScreen> {
  @override
  Widget build(BuildContext context) {
    final staffProv = ref.watch(staffProvider);
    final s = staffProv.state;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(title: const Text('Staff Analytics')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildKpiCards(context, s),
            const SizedBox(height: 20),
            _buildAttendanceTrendChart(context, s),
            const SizedBox(height: 20),
            _buildDepartmentPerformance(context, s),
            const SizedBox(height: 20),
            _buildRoleDistribution(context, s),
            const SizedBox(height: 20),
            _buildEmploymentTypeBreakdown(context, s),
            const SizedBox(height: 20),
            _buildTopMetrics(context, s),
          ],
        ),
      ),
    );
  }

  Widget _buildKpiCards(BuildContext context, StaffState s) {
    final attendanceRate = s.totalEmployees > 0 ? (s.clockedInCount / s.totalEmployees * 100) : 0.0;
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Headcount', value: '${s.totalEmployees}', icon: Icons.people, color: AppColors.primary)),
        SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Attendance Rate', value: '${attendanceRate.toStringAsFixed(0)}%', icon: Icons.access_time, color: AppColors.success)),
        SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Avg Performance', value: '${s.performanceReviews.isNotEmpty ? (s.performanceReviews.fold(0.0, (sum, r) => sum + r.score) / s.performanceReviews.length).toStringAsFixed(0) : "0"}%', icon: Icons.speed, color: AppColors.info)),
        SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Pending Tasks', value: '${s.pendingTasks}', icon: Icons.task_alt, color: AppColors.warning)),
      ],
    );
  }

  Widget _buildAttendanceTrendChart(BuildContext context, StaffState s) {
    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Attendance Trend (7 Days)', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: 100,
                barTouchData: BarTouchData(enabled: true),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                      return Text(days[value.toInt() % 7], style: const TextStyle(fontSize: 10));
                    },
                  )),
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30, getTitlesWidget: (v, m) => Text('${v.toInt()}%', style: const TextStyle(fontSize: 10)))),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (v) => FlLine(color: AppColors.gray200, strokeWidth: 1)),
                barGroups: List.generate(7, (i) {
                  final values = [85.0, 92.0, 78.0, 88.0, 95.0, 72.0, 65.0];
                  return BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: values[i],
                        color: values[i] >= 85 ? AppColors.success : (values[i] >= 70 ? AppColors.warning : AppColors.danger),
                        width: 20,
                        borderRadius: const BorderRadius.only(topLeft: Radius.circular(4), topRight: Radius.circular(4)),
                      ),
                    ],
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDepartmentPerformance(BuildContext context, StaffState s) {
    if (s.hrDashboard == null || s.hrDashboard!.departmentHeadcount.isEmpty) return const SizedBox.shrink();
    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Department Headcount', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: PieChart(
              PieChartData(
                sections: s.hrDashboard!.departmentHeadcount.asMap().entries.map((entry) {
                  final colors = [AppColors.primary, AppColors.success, AppColors.warning, AppColors.danger, AppColors.secondary, AppColors.info];
                  return PieChartSectionData(
                    value: entry.value.headcount.toDouble(),
                    title: '${entry.value.headcount}',
                    color: colors[entry.key % colors.length],
                    radius: 60,
                    titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  );
                }).toList(),
                sectionsSpace: 2,
                centerSpaceRadius: 30,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 4,
            children: s.hrDashboard!.departmentHeadcount.asMap().entries.map((entry) {
              final colors = [AppColors.primary, AppColors.success, AppColors.warning, AppColors.danger, AppColors.secondary, AppColors.info];
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(width: 10, height: 10, decoration: BoxDecoration(color: colors[entry.key % colors.length], shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Text('${entry.value.department} (${entry.value.headcount})', style: const TextStyle(fontSize: 11)),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleDistribution(BuildContext context, StaffState s) {
    final roleCounts = <String, int>{};
    for (final e in s.employees) {
      roleCounts[e.roleName] = (roleCounts[e.roleName] ?? 0) + 1;
    }
    final topRoles = roleCounts.entries.toList()..sort((a, b) => b.value.compareTo(a.value));

    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Role Distribution', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ...topRoles.take(8).map((entry) {
            final pct = s.totalEmployees > 0 ? entry.value / s.totalEmployees : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  SizedBox(width: 100, child: Text(entry.key, style: const TextStyle(fontSize: 12))),
                  const SizedBox(width: 8),
                  Expanded(
                    child: LinearProgressIndicator(
                      value: pct,
                      backgroundColor: AppColors.gray200,
                      color: AppColors.primary,
                      minHeight: 8,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(width: 30, child: Text('${entry.value}', textAlign: TextAlign.end, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildEmploymentTypeBreakdown(BuildContext context, StaffState s) {
    final typeCounts = <String, int>{};
    for (final e in s.employees) {
      typeCounts[e.employmentType.name] = (typeCounts[e.employmentType.name] ?? 0) + 1;
    }

    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Employment Type Breakdown', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ...typeCounts.entries.map((entry) {
            final pct = s.totalEmployees > 0 ? entry.value / s.totalEmployees : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  SizedBox(width: 100, child: Text(entry.key, style: const TextStyle(fontSize: 12))),
                  const SizedBox(width: 8),
                  Expanded(
                    child: LinearProgressIndicator(
                      value: pct,
                      backgroundColor: AppColors.gray200,
                      color: AppColors.info,
                      minHeight: 8,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(width: 30, child: Text('${entry.value}', textAlign: TextAlign.end, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildTopMetrics(BuildContext context, StaffState s) {
    final topPerformers = s.hrDashboard?.topPerformers ?? [];
    if (topPerformers.isEmpty) return const SizedBox.shrink();
    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.emoji_events, size: 20, color: AppColors.warning),
            const SizedBox(width: 8),
            Text('Top Performers', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 12),
          ...topPerformers.asMap().entries.map((entry) {
            final i = entry.key;
            final p = entry.value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 14,
                    backgroundColor: i == 0 ? AppColors.warning : AppColors.gray300,
                    child: Text('${i + 1}', style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold)),
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
}
