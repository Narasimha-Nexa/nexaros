import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../reports/presentation/report_charts.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class CustomerAnalyticsScreen extends ConsumerStatefulWidget {
  const CustomerAnalyticsScreen({super.key});

  @override
  ConsumerState<CustomerAnalyticsScreen> createState() => _CustomerAnalyticsScreenState();
}

class _CustomerAnalyticsScreenState extends ConsumerState<CustomerAnalyticsScreen> {
  DateTimeRange _dateRange = DateTimeRange(
    start: DateTime.now().subtract(const Duration(days: 30)),
    end: DateTime.now(),
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  void _loadData() {
    final f = DateFormat('yyyy-MM-dd');
    ref.read(analyticsProvider.notifier).loadCustomerAnalytics(
      startDate: f.format(_dateRange.start),
      endDate: f.format(_dateRange.end),
    );
  }

  Future<void> _pickDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
      initialDateRange: _dateRange,
    );
    if (picked != null) {
      setState(() => _dateRange = picked);
      _loadData();
    }
  }

  @override
  Widget build(BuildContext context) {
    final analytics = ref.watch(analyticsProvider);
    final data = analytics.customers;
    final loading = analytics.loading;
    final err = analytics.error;
    final f = DateFormat('MMM d');
    final dateLabel = '${f.format(_dateRange.start)} - ${f.format(_dateRange.end)}';

    return Scaffold(
      appBar: AppBar(
        title: Text('Customer Analytics', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.secondary,
        foregroundColor: Colors.white,
        actions: [
          TextButton.icon(
            onPressed: _pickDateRange,
            icon: const Icon(Icons.date_range, size: 16),
            label: Text(dateLabel, style: GoogleFonts.inter(fontSize: 11)),
            style: TextButton.styleFrom(foregroundColor: Colors.white),
          ),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
      ),
      body: loading
          ? const Center(child: NxFullScreenLoader())
          : err != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 12), Text(err, textAlign: TextAlign.center),
                  ElevatedButton(onPressed: _loadData, child: const Text('Retry')),
                ]))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    // Summary metrics
                    Row(children: [
                      _MetricCard(label: 'Total Customers', value: '${data?['totalCustomers'] ?? 0}', icon: Icons.people, color: AppColors.primary),
                      const SizedBox(width: 12),
                      _MetricCard(label: 'New', value: '${data?['newCustomers'] ?? 0}', icon: Icons.person_add, color: AppColors.success),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      _MetricCard(label: 'Repeat', value: '${data?['repeatCustomers'] ?? 0}', icon: Icons.repeat, color: AppColors.info),
                      const SizedBox(width: 12),
                      _MetricCard(label: 'Retention', value: '${data?['retentionRate'] ?? 0}%', icon: Icons.trending_up, color: AppColors.warning),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      _MetricCard(label: 'Avg Order/Customer', value: '₹${data?['avgOrderValuePerCustomer'] ?? 0}', icon: Icons.analytics, color: Colors.orange),
                      const SizedBox(width: 12),
                      _MetricCard(label: 'Total Revenue', value: '₹${(data?['totalRevenue'] ?? 0).toStringAsFixed(0)}', icon: Icons.currency_rupee, color: Colors.green),
                    ]),
                    const SizedBox(height: 20),

                    // Acquisition chart
                    Card(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Customer Acquisition', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 16),
                        SizedBox(height: 200, child: _buildAcquisitionChart(data)),
                      ]),
                    )),
                    const SizedBox(height: 12),

                    // Segment breakdown
                    Card(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Customer Segments', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 16),
                        _buildSegmentChart(data),
                      ]),
                    )),

                    if (data?['acquisitionByMonth'] != null) ...[
                      const SizedBox(height: 12),
                      Card(child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('Monthly Acquisition', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 12),
                          ...((data!['acquisitionByMonth'] as List<dynamic>?) ?? []).map<Widget>((m) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(children: [
                              SizedBox(width: 80, child: Text(m['month']?.toString() ?? '', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500))),
                              Expanded(child: LinearProgressIndicator(
                                value: (m['count'] as int? ?? 0) / 50.0,
                                minHeight: 18, backgroundColor: AppColors.gray100,
                                valueColor: AlwaysStoppedAnimation(AppColors.primary),
                              )),
                              const SizedBox(width: 8),
                              Text('${m['count'] ?? 0}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                            ]),
                          )),
                        ]),
                      )),
                    ],
                  ]),
                ),
    );
  }

  Widget _buildAcquisitionChart(Map<String, dynamic>? data) {
    final months = (data?['acquisitionByMonth'] as List<dynamic>?) ?? [];
    if (months.isEmpty) return const Center(child: Text('No acquisition data', style: TextStyle(color: Colors.grey)));

    return LineChart(LineChartData(
      gridData: FlGridData(show: true, drawVerticalLine: false, horizontalInterval: 1,
        getDrawingHorizontalLine: (v) => FlLine(color: AppColors.gray200, strokeWidth: 1)),
      titlesData: FlTitlesData(
        leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30,
          getTitlesWidget: (v, m) => Text('${v.toInt()}', style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)))),
        bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30,
          getTitlesWidget: (v, m) {
            final i = v.toInt();
            if (i < 0 || i >= months.length) return const SizedBox();
            final label = (months[i]['month'] as String?) ?? '';
            return Padding(padding: const EdgeInsets.only(top: 4),
              child: Text(label.length >= 7 ? label.substring(5) : label, style: GoogleFonts.inter(fontSize: 9, color: AppColors.gray500)));
          })),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      ),
      borderData: FlBorderData(show: false), minY: 0,
      lineBarsData: [
        LineChartBarData(
          spots: List.generate(months.length, (i) => FlSpot(i.toDouble(), (months[i]['count'] as int? ?? 0).toDouble())),
          isCurved: true, color: AppColors.primary, barWidth: 3, isStrokeCapRound: true,
          dotData: FlDotData(show: months.length <= 12),
          belowBarData: BarAreaData(show: true, color: AppColors.primary.withValues(alpha: 0.1)),
        ),
      ],
      lineTouchData: LineTouchData(touchTooltipData: LineTouchTooltipData(
        getTooltipItems: (spots) => spots.map((s) {
          final i = s.spotIndex;
          return LineTooltipItem(
            '${i < months.length ? months[i]['month'] : ''}\n${s.y.toInt()} customers',
            GoogleFonts.interTextTheme().bodySmall!.copyWith(color: Colors.white));
        }).toList(),
      )),
    ));
  }

  Widget _buildSegmentChart(Map<String, dynamic>? data) {
    final segments = data?['segments'] as Map<String, dynamic>?;
    if (segments == null) return const Center(child: Text('No segment data'));

    final items = [
      PieSlice('High Value (₹5k+)', (segments['high'] as int? ?? 0).toDouble(), AppColors.success),
      PieSlice('Medium (₹1k-5k)', (segments['medium'] as int? ?? 0).toDouble(), AppColors.info),
      PieSlice('Low (<₹1k)', (segments['low'] as int? ?? 0).toDouble(), AppColors.warning),
      PieSlice('New (No orders)', (segments['new'] as int? ?? 0).toDouble(), AppColors.gray400),
    ];
    return PaymentPieChart(slices: items);
  }
}

class _MetricCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _MetricCard({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(child: Card(child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, color: color, size: 18),
          const Spacer(),
          Text(value, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
        ]),
        const SizedBox(height: 4),
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
      ]),
    )));
  }
}
