import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../data/kitchen_models.dart';
import '../providers/kitchen_provider.dart';

class KitchenPerformanceScreen extends ConsumerWidget {
  const KitchenPerformanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final kitchen = ref.watch(kitchenProvider);
    final state = kitchen.state;
    final metrics = state.metrics;
    final cs = Theme.of(context).colorScheme;
    final isWide = MediaQuery.of(context).size.width > 900;

    return Scaffold(
      appBar: AppBar(
        title: Text('Kitchen Performance', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        backgroundColor: cs.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: () {
              kitchen.loadOrders();
              kitchen.refreshMetrics();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // KPI Cards
          _buildKpiRow(context, metrics, isWide),
          const SizedBox(height: 20),

          // Charts row
          if (isWide)
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(flex: 2, child: _buildTicketTimeChart(state)),
              const SizedBox(width: 16),
              Expanded(child: _buildStationUtilization(metrics)),
            ])
          else ...[
            _buildTicketTimeChart(state),
            const SizedBox(height: 16),
            _buildStationUtilization(metrics),
          ],
          const SizedBox(height: 20),

          // Chef productivity
          _buildChefProductivity(metrics),
          const SizedBox(height: 20),

          // SLA Monitor
          _buildSlaMonitor(state),
          const SizedBox(height: 20),

          // Audit Log
          _buildAuditLog(kitchen.auditLog),
        ]),
      ),
    );
  }

  Widget _buildKpiRow(BuildContext context, KitchenMetrics metrics, bool isWide) {
    final kpis = [
      _KpiData('Avg Ticket Time', '${metrics.avgTicketTimeMinutes.toStringAsFixed(1)}m', AppColors.primary, Icons.timer),
      _KpiData('Total Orders', '${metrics.totalOrdersToday}', AppColors.primary, Icons.receipt_long),
      _KpiData('Completed', '${metrics.completedOrders}', AppColors.success, Icons.check_circle),
      _KpiData('Active', '${metrics.activeOrders}', AppColors.warning, Icons.pending),
      _KpiData('Delayed', '${metrics.delayedOrders}', AppColors.danger, Icons.warning_amber),
      _KpiData('On-Time %', '${metrics.onTimePercentage.toStringAsFixed(0)}%', AppColors.success, Icons.speed),
    ];

    return isWide
        ? Row(children: kpis.map((k) => Expanded(child: _KpiCard(k))).toList())
        : Wrap(spacing: 8, runSpacing: 8, children: kpis.map((k) => SizedBox(
            width: MediaQuery.of(context).size.width > 400 ? 170 : 150,
            child: _KpiCard(k),
          )).toList());
  }

  Widget _buildTicketTimeChart(KitchenState state) {
    // Generate sample hourly data from orders
    final hourlyData = <int, int>{};
    for (final order in state.orders) {
      final hour = order.createdAt.hour;
      hourlyData[hour] = (hourlyData[hour] ?? 0) + 1;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Orders by Hour', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(sideTitles: SideTitles(
                    showTitles: true, reservedSize: 30,
                    getTitlesWidget: (v, _) => Text('${v.toInt()}', style: GoogleFonts.inter(fontSize: 10)),
                  )),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (v, _) => Text('${v.toInt()}:00', style: GoogleFonts.inter(fontSize: 9)),
                  )),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                barGroups: List.generate(24, (i) {
                  return BarChartGroupData(x: i, barRods: [
                    BarChartRodData(
                      toY: (hourlyData[i] ?? 0).toDouble(),
                      color: AppColors.primary,
                      width: 8,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                    ),
                  ]);
                }),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _buildStationUtilization(KitchenMetrics metrics) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Station Utilization', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          if (metrics.stationUtilization.isEmpty)
            Padding(
              padding: const EdgeInsets.all(20),
              child: Text('No data', style: GoogleFonts.inter(color: Colors.grey)),
            )
          else
            ...metrics.stationUtilization.entries.map((e) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text(e.key, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                  Text('${e.value.toStringAsFixed(0)}%', style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary)),
                ]),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: e.value / 100,
                    backgroundColor: AppColors.gray100,
                    color: e.value > 80 ? AppColors.danger : e.value > 50 ? AppColors.warning : AppColors.primary,
                    minHeight: 8,
                  ),
                ),
              ]),
            )),
        ]),
      ),
    );
  }

  Widget _buildChefProductivity(KitchenMetrics metrics) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Chef Productivity', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          if (metrics.chefProductivity.isEmpty)
            Padding(
              padding: const EdgeInsets.all(20),
              child: Text('No chef data', style: GoogleFonts.inter(color: Colors.grey)),
            )
          else
            ...() {
              final sorted = metrics.chefProductivity.entries.toList()
                ..sort((a, b) => b.value.compareTo(a.value));
              return sorted.take(10).map((e) => ListTile(
                dense: true,
                leading: CircleAvatar(
                  backgroundColor: AppColors.primary50,
                  child: Text(e.key[0].toUpperCase(), style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppColors.primary)),
                ),
                title: Text(e.key, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                trailing: Text('${e.value} orders', style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary)),
              ));
            }(),
        ]),
      ),
    );
  }

  Widget _buildSlaMonitor(KitchenState state) {
    final sla = state.slaConfig;
    final totalActive = state.activeOrders.length;
    final withinSla = state.activeOrders.where((o) => !o.isDelayed).length;
    final slaPercentage = totalActive > 0 ? withinSla / totalActive * 100 : 100.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Text('SLA Monitor', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: slaPercentage >= 90 ? AppColors.success.withValues(alpha: 0.1) : AppColors.danger.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text('${slaPercentage.toStringAsFixed(0)}%', style: GoogleFonts.inter(
                fontWeight: FontWeight.w700, color: slaPercentage >= 90 ? AppColors.success : AppColors.danger)),
            ),
          ]),
          const SizedBox(height: 12),
          _SlaRow('Pending Max', '${sla.pendingMaxMinutes} min', sla.pendingMaxMinutes),
          _SlaRow('Prep Max', '${sla.preparationMaxMinutes} min', sla.preparationMaxMinutes),
          _SlaRow('Cooking Max', '${sla.cookingMaxMinutes} min', sla.cookingMaxMinutes),
          _SlaRow('Total Max', '${sla.totalMaxMinutes} min', sla.totalMaxMinutes),
        ]),
      ),
    );
  }

  Widget _buildAuditLog(List<KitchenAuditEntry> log) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Activity Log', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          if (log.isEmpty)
            Padding(padding: const EdgeInsets.all(20), child: Text('No activity yet', style: GoogleFonts.inter(color: Colors.grey)))
          else
            ...log.take(20).map((entry) => ListTile(
              dense: true,
              leading: Icon(_auditIcon(entry.action), size: 18, color: AppColors.primary),
              title: Text(entry.action.replaceAll('_', ' '), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
              subtitle: Text(
                '${entry.staffName ?? 'System'} • Order #${entry.orderId.substring(0, min(8, entry.orderId.length))}',
                style: GoogleFonts.inter(fontSize: 11, color: Colors.grey),
              ),
              trailing: Text(_timeAgo(entry.timestamp), style: GoogleFonts.inter(fontSize: 10, color: Colors.grey)),
            )),
        ]),
      ),
    );
  }

  IconData _auditIcon(String action) {
    if (action.contains('STATUS')) return Icons.update;
    if (action.contains('CHEF')) return Icons.person;
    if (action.contains('COURSE')) return Icons.restaurant_menu;
    if (action.contains('RUSH')) return Icons.bolt;
    return Icons.info_outline;
  }

  String _timeAgo(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

class _KpiData {
  final String label;
  final String value;
  final Color color;
  final IconData icon;
  const _KpiData(this.label, this.value, this.color, this.icon);
}

class _KpiCard extends StatelessWidget {
  final _KpiData data;
  const _KpiCard(this.data);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: data.color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(data.icon, color: data.color, size: 20),
          ),
          const SizedBox(height: 10),
          Text(data.value, style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 22, color: data.color)),
          const SizedBox(height: 2),
          Text(data.label, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey)),
        ]),
      ),
    );
  }
}

class _SlaRow extends StatelessWidget {
  final String label;
  final String value;
  final int minutes;
  const _SlaRow(this.label, this.value, this.minutes);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[600])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.primary50,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(value, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary)),
        ),
      ]),
    );
  }
}

int min(int a, int b) => a < b ? a : b;
