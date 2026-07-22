import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../data/dashboard_models.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../shared/widgets/shared_widgets.dart';

class CustomerGrowthChart extends StatelessWidget {
  final CustomerStats stats;
  final bool isDesktop;
  const CustomerGrowthChart({super.key, required this.stats, this.isDesktop = false});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final data = stats.growthData;
    if (data.isEmpty) {
      return NxCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        NxSectionHeader(title: 'Customer Growth'),
        const SizedBox(height: AppDimens.xl),
        Center(child: Text('No growth data', style: GoogleFonts.inter(color: cs.onSurfaceVariant))),
      ]));
    }
    final maxVal = data.fold<int>(0, (m, d) {
      final total = d.newCustomers + d.returningCustomers;
      return total > m ? total : m;
    });
    return NxCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          NxSectionHeader(title: 'Customer Growth'),
          const Spacer(),
          _LegendDot(color: AppColors.primary, label: 'New'),
          const SizedBox(width: 12),
          _LegendDot(color: AppColors.success, label: 'Returning'),
        ]),
        const SizedBox(height: AppDimens.sm),
        SizedBox(
          height: isDesktop ? 200 : 150,
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              maxY: (maxVal * 1.3).toDouble(),
              gridData: FlGridData(show: true, drawVerticalLine: false,
                getDrawingHorizontalLine: (v) => FlLine(
                  color: cs.outline.withValues(alpha: 0.1), strokeWidth: 1)),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(sideTitles: SideTitles(
                  showTitles: true, reservedSize: 30,
                  getTitlesWidget: (v, _) => Text(v.toInt().toString(),
                    style: GoogleFonts.inter(fontSize: 9, color: cs.onSurfaceVariant)),
                )),
                bottomTitles: AxisTitles(sideTitles: SideTitles(
                  showTitles: true, reservedSize: 20,
                  getTitlesWidget: (v, _) {
                    final idx = v.toInt();
                    if (idx < 0 || idx >= data.length) return const SizedBox();
                    final d = data[idx].date;
                    return Text('${d.day}/${d.month}', style: GoogleFonts.inter(fontSize: 8, color: cs.onSurfaceVariant));
                  },
                )),
                topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              borderData: FlBorderData(show: false),
              barTouchData: BarTouchData(
                touchTooltipData: BarTouchTooltipData(
                  getTooltipItem: (group, groupIdx, rod, rodIdx) {
                    final dp = data[group.x.toInt()];
                    return BarTooltipItem(
                      'New: ${dp.newCustomers}\nReturning: ${dp.returningCustomers}',
                      GoogleFonts.inter(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500),
                    );
                  },
                ),
              ),
              barGroups: data.asMap().entries.map((e) => BarChartGroupData(
                x: e.key,
                barRods: [
                  BarChartRodData(
                    toY: e.value.newCustomers.toDouble(),
                    color: AppColors.primary, width: isDesktop ? 8 : 5,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(2)),
                  ),
                  BarChartRodData(
                    toY: e.value.returningCustomers.toDouble(),
                    color: AppColors.success, width: isDesktop ? 8 : 5,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(2)),
                  ),
                ],
              )).toList(),
            ),
          ),
        ),
        const SizedBox(height: AppDimens.sm),
        Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
          _StatBadge(label: 'Retention', value: '${stats.retentionRate.toStringAsFixed(0)}%', color: AppColors.success),
          _StatBadge(label: 'Avg Spend', value: '₹${stats.averageSpend.toStringAsFixed(0)}', color: AppColors.primary),
          _StatBadge(label: 'Feedback', value: '${stats.feedbackScore.toStringAsFixed(1)}/5', color: AppColors.warning),
        ]),
      ]),
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
      const SizedBox(width: 4),
      Text(label, style: GoogleFonts.inter(fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant)),
    ]);
  }
}

class _StatBadge extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatBadge({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(mainAxisSize: MainAxisSize.min, children: [
      Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
      Text(label, style: GoogleFonts.inter(fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant)),
    ]);
  }
}
