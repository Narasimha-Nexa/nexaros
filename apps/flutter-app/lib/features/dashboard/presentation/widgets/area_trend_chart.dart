import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../data/dashboard_models.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../shared/widgets/shared_widgets.dart';

class RevenueTrendChart extends StatelessWidget {
  final List<SalesDataPoint> salesData;
  final bool isDesktop;
  const RevenueTrendChart({super.key, required this.salesData, this.isDesktop = false});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    if (salesData.isEmpty) {
      return NxCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        NxSectionHeader(title: 'Revenue Trend'),
        const SizedBox(height: AppDimens.xl),
        Center(child: Text('No sales data', style: GoogleFonts.inter(color: cs.onSurfaceVariant))),
      ]));
    }
    final maxRevenue = salesData.fold<double>(0, (max, s) => s.revenue > max ? s.revenue : max);
    return NxCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        NxSectionHeader(title: 'Revenue Trend'),
        const SizedBox(height: AppDimens.sm),
        SizedBox(
          height: isDesktop ? 220 : 160,
          child: LineChart(
            LineChartData(
              gridData: FlGridData(show: true, drawVerticalLine: false,
                horizontalInterval: maxRevenue > 0 ? maxRevenue / 4 : 1,
                getDrawingHorizontalLine: (v) => FlLine(
                  color: cs.outline.withValues(alpha: 0.1), strokeWidth: 1)),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(sideTitles: SideTitles(
                  showTitles: true, reservedSize: 40,
                  getTitlesWidget: (v, _) => Text(_formatCurrency(v),
                    style: GoogleFonts.inter(fontSize: 9, color: cs.onSurfaceVariant)),
                )),
                bottomTitles: AxisTitles(sideTitles: SideTitles(
                  showTitles: true, reservedSize: 20,
                  getTitlesWidget: (v, _) {
                    final idx = v.toInt();
                    if (idx < 0 || idx >= salesData.length) return const SizedBox();
                    final d = salesData[idx].date;
                    return Text('${d.day}/${d.month}', style: GoogleFonts.inter(fontSize: 8, color: cs.onSurfaceVariant));
                  },
                )),
                topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              borderData: FlBorderData(show: false),
              lineBarsData: [
                LineChartBarData(
                  spots: salesData.asMap().entries.map((e) =>
                    FlSpot(e.key.toDouble(), e.value.revenue)).toList(),
                  isCurved: true, preventCurveOverShooting: true,
                  color: AppColors.primary,
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      begin: Alignment.topCenter, end: Alignment.bottomCenter,
                      colors: [
                        AppColors.primary.withValues(alpha: 0.3),
                        AppColors.primary.withValues(alpha: 0.02),
                      ],
                    ),
                  ),
                  dotData: FlDotData(show: salesData.length <= 14,
                    getDotPainter: (spot, _, __, ___) => FlDotCirclePainter(
                      radius: 3, color: AppColors.primary, strokeWidth: 2, strokeColor: Colors.white)),
                ),
              ],
              lineTouchData: LineTouchData(
                touchTooltipData: LineTouchTooltipData(
                  getTooltipItems: (spots) => spots.map((s) {
                    final dp = salesData[s.x.toInt()];
                    return LineTooltipItem(
                      '${_formatCurrency(dp.revenue)}\n${dp.orderCount} orders',
                      GoogleFonts.inter(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500),
                    );
                  }).toList(),
                ),
              ),
            ),
          ),
        ),
      ]),
    );
  }

  String _formatCurrency(double v) {
    if (v >= 100000) return '₹${(v / 100000).toStringAsFixed(1)}L';
    if (v >= 1000) return '₹${(v / 1000).toStringAsFixed(1)}K';
    return '₹${v.toStringAsFixed(0)}';
  }
}

class OrdersTrendChart extends StatelessWidget {
  final List<SalesDataPoint> salesData;
  final bool isDesktop;
  const OrdersTrendChart({super.key, required this.salesData, this.isDesktop = false});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    if (salesData.isEmpty) {
      return NxCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        NxSectionHeader(title: 'Orders Trend'),
        const SizedBox(height: AppDimens.xl),
        Center(child: Text('No data', style: GoogleFonts.inter(color: cs.onSurfaceVariant))),
      ]));
    }
    final maxOrders = salesData.fold<int>(0, (max, s) => s.orderCount > max ? s.orderCount : max);
    return NxCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        NxSectionHeader(title: 'Orders Trend'),
        const SizedBox(height: AppDimens.sm),
        SizedBox(
          height: isDesktop ? 220 : 160,
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              maxY: (maxOrders * 1.2).toDouble(),
              gridData: FlGridData(show: true, drawVerticalLine: false,
                getDrawingHorizontalLine: (v) => FlLine(
                  color: cs.outline.withValues(alpha: 0.1), strokeWidth: 1)),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(sideTitles: SideTitles(
                  showTitles: true, reservedSize: 35,
                  getTitlesWidget: (v, _) => Text(v.toInt().toString(),
                    style: GoogleFonts.inter(fontSize: 9, color: cs.onSurfaceVariant)),
                )),
                bottomTitles: AxisTitles(sideTitles: SideTitles(
                  showTitles: true, reservedSize: 20,
                  getTitlesWidget: (v, _) {
                    final idx = v.toInt();
                    if (idx < 0 || idx >= salesData.length) return const SizedBox();
                    final d = salesData[idx].date;
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
                    final dp = salesData[group.x.toInt()];
                    return BarTooltipItem(
                      '${dp.orderCount} orders\n₹${_formatCurrency(dp.revenue)}',
                      GoogleFonts.inter(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500),
                    );
                  },
                ),
              ),
              barGroups: salesData.asMap().entries.map((e) => BarChartGroupData(
                x: e.key,
                barRods: [BarChartRodData(
                  toY: e.value.orderCount.toDouble(),
                  color: e.value.orderCount == maxOrders ? AppColors.primary : AppColors.primary.withValues(alpha: 0.5),
                  width: isDesktop ? 12 : 8,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(3)),
                )],
              )).toList(),
            ),
          ),
        ),
      ]),
    );
  }

  String _formatCurrency(double v) {
    if (v >= 100000) return '${(v / 100000).toStringAsFixed(1)}L';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
    return v.toStringAsFixed(0);
  }
}
