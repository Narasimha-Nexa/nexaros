import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';

/// Line chart for revenue trends
class RevenueLineChart extends StatelessWidget {
  final List<ChartPoint> data;
  final Color lineColor;

  const RevenueLineChart({
    super.key,
    required this.data,
    this.lineColor = AppColors.primary,
  });

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return const Center(child: Text('No data available', style: TextStyle(color: Colors.grey)));
    }

    final maxY = data.fold<double>(0, (max, p) => p.y > max ? p.y : max);
    final ceiling = maxY > 0 ? (maxY * 1.2).ceilToDouble() : 100.0;

    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: ceiling / 4,
          getDrawingHorizontalLine: (value) => FlLine(color: AppColors.gray200, strokeWidth: 1),
        ),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 50,
              getTitlesWidget: (value, meta) => Text(
                '₹${value.toInt()}',
                style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500),
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: data.length <= 7,
              reservedSize: 30,
              getTitlesWidget: (value, meta) {
                final idx = value.toInt();
                if (idx < 0 || idx >= data.length) return const SizedBox();
                return Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(data[idx].x, style: GoogleFonts.inter(fontSize: 9, color: AppColors.gray500)),
                );
              },
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        minY: 0,
        maxY: ceiling,
        lineBarsData: [
          LineChartBarData(
            spots: List.generate(data.length, (i) => FlSpot(i.toDouble(), data[i].y)),
            isCurved: true,
            color: lineColor,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: FlDotData(show: data.length <= 14),
            belowBarData: BarAreaData(
              show: true,
              color: lineColor.withValues(alpha: 0.1),
            ),
          ),
        ],
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (touchedSpots) => touchedSpots.map((spot) {
              final idx = spot.spotIndex;
              return LineTooltipItem(
                '${idx < data.length ? data[idx].x : ''}\n₹${spot.y.toStringAsFixed(0)}',
                GoogleFonts.interTextTheme().bodySmall!.copyWith(color: Colors.white),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}

/// Horizontal bar chart for category/item comparison
class CategoryBarChart extends StatelessWidget {
  final List<BarItem> items;
  final Color barColor;

  const CategoryBarChart({
    super.key,
    required this.items,
    this.barColor = AppColors.primary,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Center(child: Text('No data available', style: TextStyle(color: Colors.grey)));
    }

    final maxVal = items.fold<double>(0, (max, item) => item.value > max ? item.value : max);
    final sorted = [...items]..sort((a, b) => b.value.compareTo(a.value));
    final topItems = sorted.take(10).toList();

    return Column(
      children: List.generate(topItems.length, (i) {
        final item = topItems[i];
        final fraction = maxVal > 0 ? item.value / maxVal : 0.0;
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Row(
            children: [
              SizedBox(
                width: 100,
                child: Text(item.label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray700), overflow: TextOverflow.ellipsis),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: fraction,
                    minHeight: 20,
                    backgroundColor: AppColors.gray100,
                    valueColor: AlwaysStoppedAnimation(barColor),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 60,
                child: Text(
                  item.formattedValue,
                  textAlign: TextAlign.right,
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.gray700),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}

/// Pie chart for payment method breakdown
class PaymentPieChart extends StatelessWidget {
  final List<PieSlice> slices;

  const PaymentPieChart({super.key, required this.slices});

  @override
  Widget build(BuildContext context) {
    if (slices.isEmpty) {
      return const Center(child: Text('No payments', style: TextStyle(color: Colors.grey)));
    }

    final total = slices.fold<double>(0, (sum, s) => sum + s.value);

    return Row(
      children: [
        Expanded(
          flex: 3,
          child: SizedBox(
            height: 180,
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 40,
                sections: slices.map((s) => PieChartSectionData(
                  color: s.color,
                  value: s.value,
                  title: total > 0 ? '${(s.value / total * 100).toStringAsFixed(0)}%' : '0%',
                  radius: 50,
                  titleStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white),
                )).toList(),
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          flex: 2,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: slices.map((s) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                children: [
                  Container(width: 10, height: 10, decoration: BoxDecoration(color: s.color, shape: BoxShape.circle)),
                  const SizedBox(width: 6),
                  Text(s.label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray600)),
                ],
              ),
            )).toList(),
          ),
        ),
      ],
    );
  }
}

/// Data point for line charts
class ChartPoint {
  final String x;
  final double y;
  ChartPoint(this.x, this.y);
}

/// Data item for bar charts
class BarItem {
  final String label;
  final double value;
  final String formattedValue;
  BarItem(this.label, this.value, this.formattedValue);
}

/// Data slice for pie charts
class PieSlice {
  final String label;
  final double value;
  final Color color;
  PieSlice(this.label, this.value, this.color);
}

// Factory helpers
class ChartData {
  static List<ChartPoint> fromDailySales(List<dynamic> daily) {
    return daily.map((d) => ChartPoint(
      (d['date'] as String).substring(5), // MM-DD
      double.tryParse(d['totalRevenue']?.toString() ?? '0') ?? 0,
    )).toList();
  }

  static List<BarItem> fromCategoryRevenue(List<dynamic> categories) {
    return categories.map((c) => BarItem(
      c['categoryName'] ?? '',
      double.tryParse(c['totalRevenue']?.toString() ?? '0') ?? 0,
      '₹${(double.tryParse(c['totalRevenue']?.toString() ?? '0') ?? 0).toStringAsFixed(0)}',
    )).toList();
  }

  static List<BarItem> fromItemPerformance(List<dynamic> items) {
    return items.map((i) => BarItem(
      i['name'] ?? '',
      double.tryParse(i['quantity']?.toString() ?? '0') ?? 0,
      '${i['quantity'] ?? 0} sold',
    )).toList();
  }

  static List<PieSlice> fromPaymentBreakdown(Map<String, dynamic>? breakdown) {
    if (breakdown == null) return [];
    const colors = [AppColors.primary, AppColors.success, AppColors.warning, AppColors.danger, AppColors.info, AppColors.secondary];
    final entries = breakdown.entries.toList();
    return entries.asMap().entries.map((e) => PieSlice(
      e.value.key,
      double.tryParse(e.value.value?.toString() ?? '0') ?? 0,
      colors[e.key % colors.length],
    )).toList();
  }

  static List<ChartPoint> fromPeakHours(List<dynamic> hours) {
    return hours.map((h) => ChartPoint(
      h['hour'] ?? '',
      double.tryParse(h['orderCount']?.toString() ?? '0') ?? 0,
    )).toList();
  }
}
