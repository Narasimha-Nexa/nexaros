import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../reports/presentation/report_charts.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class SalesAnalyticsScreen extends ConsumerStatefulWidget {
  const SalesAnalyticsScreen({super.key});

  @override
  ConsumerState<SalesAnalyticsScreen> createState() => _SalesAnalyticsScreenState();
}

class _SalesAnalyticsScreenState extends ConsumerState<SalesAnalyticsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  DateTimeRange _dateRange = DateTimeRange(
    start: DateTime.now().subtract(const Duration(days: 7)),
    end: DateTime.now(),
  );

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadData() {
    final f = DateFormat('yyyy-MM-dd');
    ref.read(analyticsProvider.notifier).loadSalesAnalytics(
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
    final loading = analytics.loading;
    final err = analytics.error;
    final f = DateFormat('MMM d');
    final dateLabel = '${f.format(_dateRange.start)} - ${f.format(_dateRange.end)}';

    return Scaffold(
      appBar: AppBar(
        title: Text('Sales Analytics', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Overview'), Tab(text: 'Revenue'), Tab(text: 'Items'), Tab(text: 'Peak Hours'),
          ],
        ),
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
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _OverviewTab(sales: analytics.sales, items: analytics.items, peakHours: analytics.peakHours),
                    _RevenueTab(sales: analytics.sales, revenue: analytics.revenue),
                    _ItemsTab(items: analytics.items),
                    _PeakHoursTab(data: analytics.peakHours),
                  ],
                ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  final Map<String, dynamic>? sales, items, peakHours;
  const _OverviewTab({this.sales, this.items, this.peakHours});

  @override
  Widget build(BuildContext context) {
    final totals = sales?['totals'] as Map<String, dynamic>?;
    final daily = (sales?['daily'] as List<dynamic>?) ?? [];

    // Compute payment breakdown from daily data
    final paymentBreakdown = daily.fold<Map<String, double>>(
      {}, (acc, d) {
        final dayMethods = d['paymentBreakdown'] as Map<String, dynamic>? ?? {};
        for (final entry in dayMethods.entries) {
          acc[entry.key] = (acc[entry.key] ?? 0) + (double.tryParse(entry.value.toString()) ?? 0);
        }
        return acc;
      },
    );

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            _MetricCard(label: 'Total Orders', value: '${totals?['totalOrders'] ?? 0}', icon: Icons.receipt_long, color: Colors.blue),
            const SizedBox(width: 12),
            _MetricCard(label: 'Total Revenue', value: '₹${(totals?['totalRevenue'] ?? 0).toStringAsFixed(0)}', icon: Icons.currency_rupee, color: Colors.green),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            _MetricCard(label: 'Avg Order Value', value: '₹${(totals?['averageOrderValue'] ?? 0).toStringAsFixed(0)}', icon: Icons.analytics, color: Colors.orange),
            const SizedBox(width: 12),
            _MetricCard(label: 'Days', value: '${daily.length}', icon: Icons.calendar_today, color: AppColors.info),
          ]),
          const SizedBox(height: 20),
          // Revenue trend
          Card(child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Revenue Trend', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 16),
              SizedBox(height: 200, child: RevenueLineChart(data: ChartData.fromDailySales(daily))),
            ]),
          )),
          const SizedBox(height: 12),
          // Payment breakdown
          if (paymentBreakdown.isNotEmpty) Card(child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Payment Methods', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              PaymentPieChart(slices: ChartData.fromPaymentBreakdown(paymentBreakdown)),
            ]),
          )),
        ],
      ),
    );
  }
}

class _RevenueTab extends StatelessWidget {
  final Map<String, dynamic>? sales, revenue;
  const _RevenueTab({this.sales, this.revenue});

  @override
  Widget build(BuildContext context) {
    final byCategory = (revenue?['byCategory'] as List<dynamic>?) ?? [];
    final byItem = (revenue?['byItem'] as List<dynamic>?) ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Revenue by Category', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Card(child: Padding(
            padding: const EdgeInsets.all(16),
            child: CategoryBarChart(items: ChartData.fromCategoryRevenue(byCategory)),
          )),
          const SizedBox(height: 20),
          Text('Revenue by Item', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Card(child: Padding(
            padding: const EdgeInsets.all(16),
            child: CategoryBarChart(items: ChartData.fromCategoryRevenue(byItem)),
          )),
          const SizedBox(height: 12),
          // Revenue trend small
          if (sales != null)
            Card(child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Daily Trend', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                SizedBox(height: 180, child: RevenueLineChart(
                  data: ChartData.fromDailySales((sales?['daily'] as List<dynamic>?) ?? []),
                  lineColor: AppColors.success,
                )),
              ]),
            )),
        ],
      ),
    );
  }
}

class _ItemsTab extends StatelessWidget {
  final Map<String, dynamic>? items;
  const _ItemsTab({this.items});

  @override
  Widget build(BuildContext context) {
    final topSelling = (items?['topSelling'] as List<dynamic>?) ?? [];
    final lowPerforming = (items?['lowPerforming'] as List<dynamic>?) ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Top Selling Items', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Card(child: Padding(
            padding: const EdgeInsets.all(16),
            child: CategoryBarChart(items: ChartData.fromItemPerformance(topSelling)),
          )),
          const SizedBox(height: 20),
          Text('Low Performing', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Card(child: Padding(
            padding: const EdgeInsets.all(16),
            child: lowPerforming.isEmpty
                ? const Center(child: Text('No data'))
                : Column(children: lowPerforming.map((item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(children: [
                      Icon(Icons.trending_down, size: 16, color: AppColors.danger),
                      const SizedBox(width: 8),
                      Expanded(child: Text(item['name'] ?? '', style: GoogleFonts.inter(fontSize: 13))),
                      Text('${item['quantity'] ?? 0} sold', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    ]),
                  )).toList()),
          )),
        ],
      ),
    );
  }
}

class _PeakHoursTab extends StatelessWidget {
  final dynamic data;
  const _PeakHoursTab({this.data});

  @override
  Widget build(BuildContext context) {
    final hours = (data != null ? (data is List ? data : (data['data'] as List<dynamic>? ?? [])) : <dynamic>[]);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Orders by Hour', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Card(child: Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(height: 250, child: RevenueLineChart(data: ChartData.fromPeakHours(hours))),
          )),
          const SizedBox(height: 20),
          Text('Hourly Breakdown', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Card(child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(children: hours.map((h) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(children: [
                SizedBox(width: 50, child: Text(h['hour'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13))),
                Expanded(child: LinearProgressIndicator(
                  value: (h['orderCount'] as int? ?? 0) / ((hours.isNotEmpty ? (hours.first['orderCount'] as int? ?? 1) : 1).toDouble()),
                  minHeight: 22, backgroundColor: AppColors.gray100, valueColor: AlwaysStoppedAnimation(AppColors.info),
                )),
                const SizedBox(width: 12),
                Text('${h['orderCount'] ?? 0} orders', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray600)),
              ]),
            )).toList()),
          )),
        ],
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
