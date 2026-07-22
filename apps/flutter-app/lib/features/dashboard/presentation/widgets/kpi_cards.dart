import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../data/dashboard_models.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../shared/widgets/shared_widgets.dart';

class KpiCards extends StatelessWidget {
  final List<DashboardKpi> kpis;
  final bool isDesktop;
  final bool isTablet;
  final String? categoryFilter;

  const KpiCards({super.key, required this.kpis, this.isDesktop = false, this.isTablet = false, this.categoryFilter});

  @override
  Widget build(BuildContext context) {
    final filtered = categoryFilter != null ? kpis.where((k) => k.category == categoryFilter).toList() : kpis;

    return LayoutBuilder(builder: (context, constraints) {
      final width = constraints.maxWidth;
      int cols;
      if (width > 1200) {
        cols = 6;
      } else if (width > 900) {
        cols = 4;
      } else if (width > 600) {
        cols = 3;
      } else {
        cols = 2;
      }

      return GridView.builder(
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: cols,
          childAspectRatio: isDesktop ? 2.2 : isTablet ? 1.8 : 1.5,
          mainAxisSpacing: AppDimens.sm,
          crossAxisSpacing: AppDimens.sm,
        ),
        itemCount: filtered.length,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemBuilder: (context, index) => _KpiCard(kpi: filtered[index], isDesktop: isDesktop),
      );
    });
  }
}

class _KpiCard extends StatelessWidget {
  final DashboardKpi kpi;
  final bool isDesktop;
  const _KpiCard({required this.kpi, this.isDesktop = false});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isLarge = kpi.size == WidgetSize.large || kpi.size == WidgetSize.full;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDimens.cardRadius),
        side: BorderSide(color: cs.outline.withValues(alpha: 0.1)),
      ),
      child: Padding(
        padding: EdgeInsets.all(isLarge ? 14 : 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: isLarge ? 36 : 30,
                  height: isLarge ? 36 : 30,
                  decoration: BoxDecoration(
                    color: kpi.color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppDimens.radiusSm),
                  ),
                  child: Icon(kpi.icon, size: isLarge ? 20 : 16, color: kpi.color),
                ),
                const Spacer(),
                if (kpi.changePercent != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: kpi.isPositiveTrend ? AppColors.success50 : AppColors.danger50,
                      borderRadius: BorderRadius.circular(AppDimens.radiusXs),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(kpi.isPositiveTrend ? Icons.trending_up : Icons.trending_down,
                        size: 10, color: kpi.isPositiveTrend ? AppColors.success : AppColors.danger),
                      const SizedBox(width: 2),
                      Text('${kpi.changePercent!.toStringAsFixed(1)}%',
                        style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w600,
                          color: kpi.isPositiveTrend ? AppColors.success : AppColors.danger)),
                    ]),
                  ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(kpi.value, style: GoogleFonts.inter(
                  fontSize: isLarge ? 22 : 18,
                  fontWeight: FontWeight.w700, color: cs.onSurface), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(kpi.label, style: GoogleFonts.inter(
                  fontSize: isLarge ? 12 : 10,
                  fontWeight: FontWeight.w500, color: cs.onSurfaceVariant), maxLines: 1, overflow: TextOverflow.ellipsis),
                if (kpi.subtitle != null && isLarge)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(kpi.subtitle!, style: GoogleFonts.inter(
                      fontSize: 10, color: cs.onSurfaceVariant.withValues(alpha: 0.7)),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
              ],
            ),
            if (kpi.sparklineData != null && kpi.sparklineData!.length >= 3 && isDesktop)
              SizedBox(
                height: 28,
                child: LineChart(
                  LineChartData(
                    gridData: const FlGridData(show: false),
                    titlesData: const FlTitlesData(show: false),
                    borderData: FlBorderData(show: false),
                    lineTouchData: const LineTouchData(enabled: false),
                    minY: _minY(kpi.sparklineData!),
                    maxY: _maxY(kpi.sparklineData!),
                    lineBarsData: [
                      LineChartBarData(
                        spots: kpi.sparklineData!.asMap().entries
                            .map((e) => FlSpot(e.key.toDouble(), e.value))
                            .toList(),
                        isCurved: true,
                        preventCurveOverShooting: true,
                        color: kpi.isPositiveTrend ? AppColors.success : AppColors.danger,
                        barWidth: 1.5,
                        isStrokeCapRound: true,
                        dotData: const FlDotData(show: false),
                        belowBarData: BarAreaData(
                          show: true,
                          gradient: LinearGradient(
                            begin: Alignment.topCenter, end: Alignment.bottomCenter,
                            colors: [
                              (kpi.isPositiveTrend ? AppColors.success : AppColors.danger).withValues(alpha: 0.2),
                              (kpi.isPositiveTrend ? AppColors.success : AppColors.danger).withValues(alpha: 0.0),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  static double _minY(List<double> data) {
    final min = data.reduce((a, b) => a < b ? a : b);
    return min * 0.85;
  }

  static double _maxY(List<double> data) {
    final max = data.reduce((a, b) => a > b ? a : b);
    return max * 1.15;
  }
}

class KpiCardsSkeleton extends StatelessWidget {
  final bool isDesktop;
  const KpiCardsSkeleton({super.key, this.isDesktop = false});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: isDesktop ? 6 : 3,
      childAspectRatio: isDesktop ? 2.0 : 1.4,
      mainAxisSpacing: AppDimens.sm, crossAxisSpacing: AppDimens.sm,
      shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      children: List.generate(12, (_) => const NxSkeleton.card()),
    );
  }
}
