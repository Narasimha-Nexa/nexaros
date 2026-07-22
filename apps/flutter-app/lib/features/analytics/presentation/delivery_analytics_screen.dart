import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../reports/presentation/report_charts.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class DeliveryAnalyticsScreen extends ConsumerStatefulWidget {
  const DeliveryAnalyticsScreen({super.key});

  @override
  ConsumerState<DeliveryAnalyticsScreen> createState() => _DeliveryAnalyticsScreenState();
}

class _DeliveryAnalyticsScreenState extends ConsumerState<DeliveryAnalyticsScreen> {
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
    ref.read(analyticsProvider.notifier).loadDeliveryAnalytics(
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
    final d = analytics.delivery;
    final loading = analytics.loading;
    final err = analytics.error;
    final partnerPerf = (d?['partnerPerformance'] as List<dynamic>?) ?? [];
    final statusBk = d?['statusBreakdown'] as Map<String, dynamic>? ?? {};
    final f = DateFormat('MMM d');
    final dateLabel = '${f.format(_dateRange.start)} - ${f.format(_dateRange.end)}';

    return Scaffold(
      appBar: AppBar(
        title: Text('Delivery Analytics', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.teal.shade600,
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
                      _MetricCard(label: 'Total Deliveries', value: '${d?['totalDeliveries'] ?? 0}', icon: Icons.local_shipping, color: Colors.teal),
                      const SizedBox(width: 12),
                      _MetricCard(label: 'Delivered', value: '${d?['totalDelivered'] ?? 0}', icon: Icons.check_circle, color: AppColors.success),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      _MetricCard(label: 'Avg Delivery Time', value: '${d?['avgDeliveryTime'] ?? 0} min', icon: Icons.timer, color: AppColors.warning),
                      const SizedBox(width: 12),
                      _MetricCard(label: 'Active Partners', value: '${d?['activePartners'] ?? 0}', icon: Icons.people, color: AppColors.info),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      _MetricCard(label: 'Total Revenue', value: '₹${(d?['totalRevenue'] ?? 0).toStringAsFixed(0)}', icon: Icons.currency_rupee, color: AppColors.success),
                      const SizedBox(width: 12),
                      _MetricCard(label: 'Zone Coverage', value: '${d?['zoneCoverage'] ?? 0}', icon: Icons.map, color: AppColors.secondary),
                    ]),
                    const SizedBox(height: 20),

                    // Status breakdown pie chart
                    Text('Delivery Status Breakdown', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Card(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: PaymentPieChart(slices: [
                        PieSlice('Pending', (statusBk['pending'] as int? ?? 0).toDouble(), AppColors.warning),
                        PieSlice('Assigned', (statusBk['assigned'] as int? ?? 0).toDouble(), AppColors.info),
                        PieSlice('Dispatched', (statusBk['dispatched'] as int? ?? 0).toDouble(), AppColors.primary),
                        PieSlice('In Transit', (statusBk['inTransit'] as int? ?? 0).toDouble(), AppColors.secondary),
                        PieSlice('Delivered', (statusBk['delivered'] as int? ?? 0).toDouble(), AppColors.success),
                        PieSlice('Failed', (statusBk['failed'] as int? ?? 0).toDouble(), AppColors.danger),
                      ]),
                    )),
                    const SizedBox(height: 20),

                    // Partner performance
                    Text('Partner Performance', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    if (partnerPerf.isEmpty)
                      Card(child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Center(child: Text('No partner data', style: GoogleFonts.inter(color: AppColors.gray500))),
                      ))
                    else
                      ...partnerPerf.map((p) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: Colors.teal.shade100,
                            child: Text((p['name'] as String?)?[0] ?? '?', style: GoogleFonts.inter(color: Colors.teal.shade700, fontWeight: FontWeight.w600)),
                          ),
                          title: Text(p['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                          subtitle: Text('${p['deliveries'] ?? 0} deliveries · ${p['vehicleType'] ?? '-'}', style: GoogleFonts.inter(fontSize: 11)),
                          trailing: Text('₹${(p['totalRevenue'] ?? 0).toStringAsFixed(0)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppColors.success)),
                        ),
                      )),
                    const SizedBox(height: 20),

                    // Revenue card
                    Card(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(children: [
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('Delivery Revenue', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 4),
                          Text('₹${(d?['totalRevenue'] ?? 0).toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.success)),
                        ])),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.teal.shade50, borderRadius: BorderRadius.circular(12)),
                          child: Icon(Icons.local_shipping, color: Colors.teal.shade600, size: 32),
                        ),
                      ]),
                    )),
                  ]),
                ),
    );
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
