import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../reports/presentation/report_charts.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class InventoryAnalyticsOverview extends ConsumerStatefulWidget {
  const InventoryAnalyticsOverview({super.key});

  @override
  ConsumerState<InventoryAnalyticsOverview> createState() => _InventoryAnalyticsOverviewState();
}

class _InventoryAnalyticsOverviewState extends ConsumerState<InventoryAnalyticsOverview> {
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
    ref.read(analyticsProvider.notifier).loadInventoryAnalytics(
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
    final data = analytics.inventory;
    final loading = analytics.loading;
    final err = analytics.error;
    final items = (data?['items'] as List<dynamic>?) ?? [];
    final lowStock = (data?['lowStockItems'] as List<dynamic>?) ?? [];
    final totalItems = data?['totalItems'] as int? ?? 0;
    final f = DateFormat('MMM d');
    final dateLabel = '${f.format(_dateRange.start)} - ${f.format(_dateRange.end)}';

    return Scaffold(
      appBar: AppBar(
        title: Text('Inventory Analytics', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.info,
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
                    // Metrics
                    Row(children: [
                      _MetricCard(label: 'Total Items', value: '$totalItems', icon: Icons.inventory_2, color: AppColors.info),
                      const SizedBox(width: 12),
                      _MetricCard(label: 'Low Stock', value: '${lowStock.length}', icon: Icons.warning_amber, color: AppColors.danger),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      _MetricCard(label: 'Consumed', value: '${items.isNotEmpty ? items.fold<int>(0, (s, i) => s + ((i['totalConsumed'] as int? ?? 0))) : 0}', icon: Icons.shopping_cart, color: AppColors.warning),
                      const SizedBox(width: 12),
                      _MetricCard(label: 'Items Tracked', value: '$totalItems', icon: Icons.track_changes, color: AppColors.success),
                    ]),
                    const SizedBox(height: 20),

                    // Top consumed items
                    Text('Top Consumed Items', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Card(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: CategoryBarChart(items: _topConsumed(items)),
                    )),
                    const SizedBox(height: 20),

                    // Low stock alerts
                    Text('Low Stock Alerts', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    if (lowStock.isEmpty)
                      Card(child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Center(child: Column(children: [
                          Icon(Icons.check_circle, size: 40, color: AppColors.success),
                          const SizedBox(height: 8),
                          Text('No low stock items', style: GoogleFonts.inter(color: AppColors.gray500)),
                        ])),
                      ))
                    else
                      ...lowStock.map((item) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: AppColors.danger.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                            child: const Icon(Icons.warning, color: AppColors.danger, size: 20),
                          ),
                          title: Text(item['itemName'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                          subtitle: Text('${item['currentStock'] ?? 0} ${item['unit'] ?? ''} remaining (min: ${item['minimumStock'] ?? 0})', style: GoogleFonts.inter(fontSize: 12)),
                          trailing: Text('${item['totalConsumed'] ?? 0} used', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.warning)),
                        ),
                      )),

                    if (items.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      Text('All Items Consumption', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      Card(child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(children: items.map((item) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(children: [
                            Icon(item['isLow'] == true ? Icons.warning : Icons.check_circle, size: 14, color: item['isLow'] == true ? AppColors.danger : AppColors.success),
                            const SizedBox(width: 8),
                            Expanded(child: Text(item['itemName'] ?? '', style: GoogleFonts.inter(fontSize: 12))),
                            Text('${item['totalConsumed'] ?? 0} ${item['unit'] ?? ''}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
                          ]),
                        )).toList()),
                      )),
                    ],
                  ]),
                ),
    );
  }

  List<BarItem> _topConsumed(List<dynamic> items) {
    final sorted = [...items]..sort((a, b) => ((b['totalConsumed'] as int? ?? 0)).compareTo((a['totalConsumed'] as int? ?? 0)));
    return sorted.take(10).map((i) => BarItem(
      i['itemName'] ?? '',
      (i['totalConsumed'] as int? ?? 0).toDouble(),
      '${i['totalConsumed'] ?? 0} ${i['unit'] ?? ''}',
    )).toList();
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
