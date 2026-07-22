import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class StaffAnalyticsScreen extends ConsumerStatefulWidget {
  const StaffAnalyticsScreen({super.key});

  @override
  ConsumerState<StaffAnalyticsScreen> createState() => _StaffAnalyticsScreenState();
}

class _StaffAnalyticsScreenState extends ConsumerState<StaffAnalyticsScreen> {
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
    ref.read(analyticsProvider.notifier).loadStaffAnalytics(
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
    final data = analytics.staff;
    final loading = analytics.loading;
    final err = analytics.error;
    final staffList = (data != null ? (data is List ? data : (data['data'] as List<dynamic>? ?? [])) : <dynamic>[]);
    final f = DateFormat('MMM d');
    final dateLabel = '${f.format(_dateRange.start)} - ${f.format(_dateRange.end)}';

    return Scaffold(
      appBar: AppBar(
        title: Text('Staff Analytics', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
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
                      _MetricCard(label: 'Total Staff', value: '${staffList.length}', icon: Icons.people, color: AppColors.primary),
                      const SizedBox(width: 12),
                      _MetricCard(label: 'Total Orders', value: '${staffList.fold<int>(0, (s, i) => s + ((i['orderCount'] as int? ?? 0)))}', icon: Icons.receipt_long, color: AppColors.success),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      _MetricCard(label: 'Total Revenue', value: '₹${staffList.fold<double>(0, (s, i) => s + ((i['totalRevenue'] as num? ?? 0).toDouble())).toStringAsFixed(0)}', icon: Icons.currency_rupee, color: AppColors.warning),
                      const SizedBox(width: 12),
                      _MetricCard(label: 'Avg/Staff', value: '₹${staffList.isNotEmpty ? (staffList.fold<double>(0, (s, i) => s + ((i['totalRevenue'] as num? ?? 0).toDouble())) / staffList.length).toStringAsFixed(0) : '0'}', icon: Icons.analytics, color: AppColors.info),
                    ]),
                    const SizedBox(height: 20),

                    // Staff performance bars
                    Text('Staff Performance', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Card(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(children: staffList.map((s) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(children: [
                          CircleAvatar(
                            radius: 16,
                            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                            child: Text((s['name'] as String?)?[0] ?? '?', style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                          ),
                          const SizedBox(width: 10),
                          Expanded(flex: 2, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(s['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                            Text(s['role'] ?? 'Staff', style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
                          ])),
                          Expanded(flex: 3, child: Column(children: [
                            LinearProgressIndicator(
                              value: ((s['orderCount'] as int? ?? 0) / (staffList.isNotEmpty ? (staffList.first['orderCount'] as int? ?? 1).toDouble() : 1)).clamp(0, 1),
                              minHeight: 16, backgroundColor: AppColors.gray100, valueColor: AlwaysStoppedAnimation(AppColors.primary),
                            ),
                          ])),
                          const SizedBox(width: 8),
                          SizedBox(width: 50, child: Text('${s['orderCount'] ?? 0}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600), textAlign: TextAlign.right)),
                        ]),
                      )).toList()),
                    )),
                    const SizedBox(height: 20),

                    // Revenue by staff
                    Text('Revenue Generated', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Card(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(children: staffList.map((s) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(children: [
                          Expanded(child: Text(s['name'] ?? '', style: GoogleFonts.inter(fontSize: 13))),
                          Text('₹${(s['totalRevenue'] ?? 0).toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.success)),
                          const SizedBox(width: 8),
                          Text('Avg: ₹${(s['avgOrderValue'] ?? 0).toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
                        ]),
                      )).toList()),
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
