import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../data/dashboard_models.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../shared/widgets/shared_widgets.dart';

class SalesOverviewPanel extends StatelessWidget {
  final List<SalesDataPoint> salesData;
  final List<CategorySales> categorySales;
  final List<PaymentBreakdown> paymentBreakdown;
  final List<SalesChannelData> channelData;
  final List<DailyComparison> comparisons;
  final bool isDesktop;

  const SalesOverviewPanel({
    super.key, required this.salesData, required this.categorySales,
    required this.paymentBreakdown, this.channelData = const [],
    this.comparisons = const [], this.isDesktop = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (comparisons.isNotEmpty) ...[
          _ComparisonRow(comparisons: comparisons),
          const SizedBox(height: AppDimens.base),
        ],
        NxSectionHeader(title: 'Revenue Trend'),
        const SizedBox(height: AppDimens.sm),
        NxCard(
          padding: const EdgeInsets.all(AppDimens.base),
          child: SizedBox(
            height: isDesktop ? 240 : 180,
            child: salesData.isEmpty
                ? Center(child: Text('No data', style: GoogleFonts.inter(color: Theme.of(context).colorScheme.onSurfaceVariant)))
                : _RevenueChart(data: salesData),
          ),
        ),
        const SizedBox(height: AppDimens.base),
        if (isDesktop)
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(child: _buildCategorySection(context)),
            const SizedBox(width: AppDimens.base),
            Expanded(child: _buildPaymentSection(context)),
            if (channelData.isNotEmpty) ...[
              const SizedBox(width: AppDimens.base),
              Expanded(child: _buildChannelSection(context)),
            ],
          ])
        else ...[
          _buildCategorySection(context),
          const SizedBox(height: AppDimens.base),
          _buildPaymentSection(context),
          if (channelData.isNotEmpty) ...[
            const SizedBox(height: AppDimens.base),
            _buildChannelSection(context),
          ],
        ],
      ],
    );
  }

  Widget _buildCategorySection(BuildContext context) {
    if (categorySales.isEmpty) return const SizedBox.shrink();
    return NxCard(
      padding: const EdgeInsets.all(AppDimens.base),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Category Performance', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: AppDimens.sm),
        _CategoryDonut(data: categorySales),
      ]),
    );
  }

  Widget _buildPaymentSection(BuildContext context) {
    if (paymentBreakdown.isEmpty) return const SizedBox.shrink();
    return NxCard(
      padding: const EdgeInsets.all(AppDimens.base),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Payment Methods', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: AppDimens.sm),
        ...paymentBreakdown.take(5).map((p) => _PaymentBar(data: p)),
      ]),
    );
  }

  Widget _buildChannelSection(BuildContext context) {
    return NxCard(
      padding: const EdgeInsets.all(AppDimens.base),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Sales Channels', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: AppDimens.sm),
        ...channelData.map((ch) => _ChannelBar(data: ch)),
      ]),
    );
  }
}

class _ComparisonRow extends StatelessWidget {
  final List<DailyComparison> comparisons;
  const _ComparisonRow({required this.comparisons});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      children: comparisons.take(4).map((c) => Expanded(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 3),
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(AppDimens.radiusSm),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(c.label, style: GoogleFonts.inter(fontSize: 10, color: cs.onSurfaceVariant)),
            const SizedBox(height: 2),
            Text('₹${c.current.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700)),
            Row(children: [
              Icon(c.changePercent >= 0 ? Icons.trending_up : Icons.trending_down, size: 12,
                color: c.changePercent >= 0 ? AppColors.success : AppColors.danger),
              const SizedBox(width: 2),
              Text('${c.changePercent.abs().toStringAsFixed(1)}% vs prev',
                style: GoogleFonts.inter(fontSize: 9, color: c.changePercent >= 0 ? AppColors.success : AppColors.danger)),
            ]),
          ]),
        ),
      )).toList(),
    );
  }
}

class _RevenueChart extends StatelessWidget {
  final List<SalesDataPoint> data;
  const _RevenueChart({required this.data});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final maxY = data.fold<double>(0, (s, d) => d.revenue > s ? d.revenue : s) * 1.2;

    return LineChart(LineChartData(
      gridData: FlGridData(show: true, drawVerticalLine: false, horizontalInterval: maxY / 4,
        getDrawingHorizontalLine: (v) => FlLine(color: cs.outline.withValues(alpha: 0.1), strokeWidth: 1)),
      titlesData: FlTitlesData(
        show: true, topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 38, interval: maxY / 4,
          getTitlesWidget: (v, m) => Text('₹${(v / 1000).toStringAsFixed(0)}k',
            style: GoogleFonts.inter(fontSize: 9, color: cs.onSurfaceVariant)))),
        bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 22,
          interval: data.length > 14 ? (data.length / 7).ceilToDouble() : 1,
          getTitlesWidget: (v, m) {
            final i = v.toInt();
            if (i < 0 || i >= data.length) return const SizedBox();
            return Padding(padding: const EdgeInsets.only(top: 4),
              child: Text('${data[i].date.day}/${data[i].date.month}',
                style: GoogleFonts.inter(fontSize: 8, color: cs.onSurfaceVariant)));
          })),
      ),
      borderData: FlBorderData(show: false),
      lineBarsData: [LineChartBarData(
        spots: List.generate(data.length, (i) => FlSpot(i.toDouble(), data[i].revenue)),
        isCurved: true, color: AppColors.primary, barWidth: 2.5, isStrokeCapRound: true,
        dotData: FlDotData(show: data.length <= 14, getDotPainter: (s, __, ___, ____) =>
          FlDotCirclePainter(radius: 3, color: AppColors.primary, strokeColor: Colors.white, strokeWidth: 2)),
        belowBarData: BarAreaData(show: true, color: AppColors.primary.withValues(alpha: 0.08)),
      )],
      lineTouchData: LineTouchData(touchTooltipData: LineTouchTooltipData(
        getTooltipItems: (spots) => spots.map((s) {
          final i = s.x.toInt();
          final p = i >= 0 && i < data.length ? data[i] : null;
          return LineTooltipItem('₹${s.y.toStringAsFixed(0)}\n${p != null ? '${p.orderCount} orders' : ''}',
            GoogleFonts.inter(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w600));
        }).toList(),
      )),
    ));
  }
}

class _CategoryDonut extends StatelessWidget {
  final List<CategorySales> data;
  const _CategoryDonut({required this.data});

  static const _c = [Color(0xFF3B82F6), Color(0xFF10B981), Color(0xFFF59E0B), Color(0xFFEF4444),
    Color(0xFF8B5CF6), Color(0xFFEC4899), Color(0xFF06B6D4), Color(0xFF84CC16)];

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Expanded(flex: 2, child: SizedBox(height: 140, child: PieChart(PieChartData(
        sectionsSpace: 2, centerSpaceRadius: 35,
        sections: List.generate(data.length, (i) => PieChartSectionData(
          value: data[i].percentage, color: _c[i % _c.length], radius: 35,
          title: '${data[i].percentage.toStringAsFixed(0)}%',
          titleStyle: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w600, color: Colors.white))))))),
      const SizedBox(width: AppDimens.sm),
      Expanded(flex: 3, child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: data.take(6).map((cat) {
          final ci = data.indexOf(cat) % _c.length;
          return Padding(padding: const EdgeInsets.symmetric(vertical: 2), child: Row(children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: _c[ci], shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Expanded(child: Text(cat.category, style: GoogleFonts.inter(fontSize: 11), overflow: TextOverflow.ellipsis)),
            Text('₹${cat.revenue.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
          ]));
        }).toList()))]);
  }
}

class _PaymentBar extends StatelessWidget {
  final PaymentBreakdown data;
  const _PaymentBar({required this.data});

  static const _colors = [Color(0xFF3B82F6), Color(0xFF10B981), Color(0xFFF59E0B), Color(0xFF8B5CF6), Color(0xFFEC4899)];
  static const _icons = [Icons.credit_card, Icons.account_balance_wallet, Icons.money, Icons.phone_android, Icons.qr_code];

  @override
  Widget build(BuildContext context) {
    final i = data.method.hashCode.abs() % _colors.length;
    return Padding(padding: const EdgeInsets.symmetric(vertical: 3), child: Row(children: [
      Icon(_icons[i], size: 14, color: _colors[i]), const SizedBox(width: 6),
      Expanded(child: Text(data.method, style: GoogleFonts.inter(fontSize: 12))),
      SizedBox(width: 100, child: LinearProgressIndicator(
        value: data.percentage / 100, backgroundColor: _colors[i].withValues(alpha: 0.12),
        color: _colors[i], minHeight: 5, borderRadius: BorderRadius.circular(2))),
      const SizedBox(width: 6),
      SizedBox(width: 45, child: Text('₹${data.amount.toStringAsFixed(0)}',
        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600), textAlign: TextAlign.end)),
    ]));
  }
}

class _ChannelBar extends StatelessWidget {
  final SalesChannelData data;
  const _ChannelBar({required this.data});

  @override
  Widget build(BuildContext context) {
    return Padding(padding: const EdgeInsets.symmetric(vertical: 3), child: Row(children: [
      Icon(_channelIcon(data.channel), size: 14, color: AppColors.primary),
      const SizedBox(width: 6),
      Expanded(child: Text(data.channel, style: GoogleFonts.inter(fontSize: 12))),
      Text('${data.orderCount} orders', style: GoogleFonts.inter(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant)),
      const SizedBox(width: 8),
      SizedBox(width: 50, child: Text('₹${data.revenue.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600), textAlign: TextAlign.end)),
    ]));
  }

  IconData _channelIcon(String ch) {
    switch (ch.toLowerCase()) {
      case 'online': return Icons.language;
      case 'aggregator': return Icons.delivery_dining;
      default: return Icons.point_of_sale;
    }
  }
}

class TopSellingPanel extends StatelessWidget {
  final List<TopSellingItem> items;
  const TopSellingPanel({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    final maxQty = items.fold<int>(0, (s, i) => i.quantity > s ? i.quantity : s);

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      NxSectionHeader(title: 'Top Selling Items'),
      const SizedBox(height: AppDimens.sm),
      NxCard(
        padding: const EdgeInsets.all(AppDimens.base),
        child: Column(children: List.generate(items.take(8).length, (i) {
          final item = items[i];
          final progress = maxQty > 0 ? item.quantity / maxQty : 0.0;
          return Padding(padding: const EdgeInsets.symmetric(vertical: 5), child: Row(children: [
            Container(width: 24, height: 24, decoration: BoxDecoration(
              color: i < 3 ? AppColors.warning50 : Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(AppDimens.radiusXs)),
              child: Center(child: Text('${i + 1}', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700,
                color: i < 3 ? AppColors.warning : Theme.of(context).colorScheme.onSurfaceVariant)))),
            const SizedBox(width: 8),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item.name, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis),
              const SizedBox(height: 3),
              LinearProgressIndicator(value: progress, backgroundColor: AppColors.primary.withValues(alpha: 0.08),
                color: AppColors.primary, minHeight: 3, borderRadius: BorderRadius.circular(2)),
            ])),
            const SizedBox(width: 8),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('₹${item.revenue.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
              Text('${item.quantity} sold', style: GoogleFonts.inter(fontSize: 9, color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ]),
          ]));
        })),
      ),
    ]);
  }
}

class PeakHoursHeatmap extends StatelessWidget {
  final List<HourlySales> hourlySales;
  final bool isDesktop;

  const PeakHoursHeatmap({super.key, required this.hourlySales, this.isDesktop = false});

  @override
  Widget build(BuildContext context) {
    if (hourlySales.isEmpty) return const SizedBox.shrink();
    final maxRev = hourlySales.fold<double>(0, (s, h) => h.revenue > s ? h.revenue : s);

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      NxSectionHeader(title: 'Peak Hours'),
      const SizedBox(height: AppDimens.sm),
      NxCard(
        padding: const EdgeInsets.all(AppDimens.base),
        child: SizedBox(
          height: 120,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: hourlySales.map((h) {
              final height = maxRev > 0 ? (h.revenue / maxRev) : 0.0;
              final color = h.isPeak ? AppColors.danger : AppColors.primary;
              return Expanded(child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
                if (h.isPeak)
                  Text('₹${h.revenue.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w600, color: color)),
                const SizedBox(height: 2),
                Container(
                  height: (height * 80).clamp(4.0, 80.0),
                  margin: const EdgeInsets.symmetric(horizontal: 1),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: h.isPeak ? 0.8 : 0.4),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(height: 4),
                Text('${h.hour}h', style: GoogleFonts.inter(fontSize: 7, color: Theme.of(context).colorScheme.onSurfaceVariant)),
              ]));
            }).toList(),
          ),
        ),
      ),
    ]);
  }
}
