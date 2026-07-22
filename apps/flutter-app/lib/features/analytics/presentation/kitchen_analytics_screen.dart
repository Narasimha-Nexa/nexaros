import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../reports/presentation/report_charts.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class KitchenAnalyticsScreen extends ConsumerStatefulWidget {
  const KitchenAnalyticsScreen({super.key});

  @override
  ConsumerState<KitchenAnalyticsScreen> createState() => _KitchenAnalyticsScreenState();
}

class _KitchenAnalyticsScreenState extends ConsumerState<KitchenAnalyticsScreen> {
  DateTimeRange _dateRange = DateTimeRange(
    start: DateTime.now().subtract(const Duration(days: 7)),
    end: DateTime.now(),
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  void _loadData() {
    final f = DateFormat('yyyy-MM-dd');
    ref.read(analyticsProvider.notifier).loadKitchenAnalytics(
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
    final d = analytics.kitchen;
    final loading = analytics.loading;
    final err = analytics.error;
    final statusBk = d?['statusBreakdown'] as Map<String, dynamic>? ?? {};
    final itemBk = d?['itemStatusBreakdown'] as Map<String, dynamic>? ?? {};
    final f = DateFormat('MMM d');
    final dateLabel = '${f.format(_dateRange.start)} - ${f.format(_dateRange.end)}';

    return Scaffold(
      appBar: AppBar(
        title: Text('Kitchen Analytics', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.orderPreparing,
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
                      _MetricCard(label: 'Total Orders', value: '${d?['totalOrders'] ?? 0}', icon: Icons.receipt_long, color: AppColors.primary),
                      const SizedBox(width: 12),
                      _MetricCard(label: 'Avg Prep Time', value: '${d?['avgPrepTime'] ?? 0} min', icon: Icons.timer, color: AppColors.warning),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      _MetricCard(label: 'Total Revenue', value: '₹${(d?['totalRevenue'] ?? 0).toStringAsFixed(0)}', icon: Icons.currency_rupee, color: AppColors.success),
                      const SizedBox(width: 12),
                      _MetricCard(label: 'Avg Order', value: '₹${(d?['avgOrderValue'] ?? 0).toStringAsFixed(0)}', icon: Icons.analytics, color: AppColors.info),
                    ]),
                    const SizedBox(height: 20),

                    // Order status breakdown
                    Text('Order Status', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Card(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: PaymentPieChart(slices: [
                        PieSlice('Pending', (statusBk['pending'] as int? ?? 0).toDouble(), AppColors.warning),
                        PieSlice('Preparing', (statusBk['preparing'] as int? ?? 0).toDouble(), AppColors.orderPreparing),
                        PieSlice('Ready', (statusBk['ready'] as int? ?? 0).toDouble(), Colors.green),
                        PieSlice('Served', (statusBk['served'] as int? ?? 0).toDouble(), AppColors.info),
                        PieSlice('Completed', (statusBk['completed'] as int? ?? 0).toDouble(), AppColors.success),
                      ]),
                    )),
                    const SizedBox(height: 20),

                    // Item status breakdown
                    Text('Kitchen Items Status', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Card(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: PaymentPieChart(slices: [
                        PieSlice('Pending', (itemBk['pending'] as int? ?? 0).toDouble(), AppColors.warning),
                        PieSlice('Preparing', (itemBk['preparing'] as int? ?? 0).toDouble(), AppColors.orderPreparing),
                        PieSlice('Ready', (itemBk['ready'] as int? ?? 0).toDouble(), Colors.green),
                        PieSlice('Cancelled', (itemBk['cancelled'] as int? ?? 0).toDouble(), AppColors.danger),
                      ]),
                    )),
                    const SizedBox(height: 20),

                    // Prep time metrics
                    Text('Preparation Metrics', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Card(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(children: [
                        _statRow('Average Prep Time', '${d?['avgPrepTime'] ?? 0} min', Icons.timer, AppColors.warning),
                        const Divider(height: 16),
                        _statRow('Total Prep Time', '${d?['totalPrepTime'] ?? 0} min', Icons.access_time, AppColors.info),
                        const Divider(height: 16),
                        _statRow('Orders Tracked', '${d?['prepCount'] ?? 0}', Icons.receipt_long, AppColors.primary),
                        const Divider(height: 16),
                        _statRow('Total Orders', '${d?['totalOrders'] ?? 0}', Icons.shopping_bag, AppColors.success),
                      ]),
                    )),

                    if ((statusBk['pending'] as int? ?? 0) > 0) ...[
                      const SizedBox(height: 20),
                      Card(
                        color: AppColors.warning.withValues(alpha: 0.08),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(children: [
                            const Icon(Icons.info_outline, color: AppColors.warning, size: 20),
                            const SizedBox(width: 12),
                            Expanded(child: Text('${statusBk['pending']} orders pending in kitchen. Average prep time: ${d?['avgPrepTime'] ?? 0} min.',
                              style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray700))),
                          ]),
                        ),
                      ),
                    ],
                  ]),
                ),
    );
  }

  Widget _statRow(String label, String value, IconData icon, Color color) {
    return Row(children: [
      Icon(icon, size: 18, color: color),
      const SizedBox(width: 10),
      Expanded(child: Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray700))),
      Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
    ]);
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
