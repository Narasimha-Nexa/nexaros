import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import 'report_charts.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen>
    with SingleTickerProviderStateMixin {
  late final ApiClient _api;
  late TabController _tabController;
  bool _isLoading = true;
  String? _error;

  // Report data
  Map<String, dynamic>? _dailySales;
  Map<String, dynamic>? _revenue;
  Map<String, dynamic>? _itemPerformance;
  Map<String, dynamic>? _peakHours;
  Map<String, dynamic>? _staffPerformance;

  DateTimeRange _dateRange = DateTimeRange(
    start: DateTime.now().subtract(const Duration(days: 7)),
    end: DateTime.now(),
  );

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _tabController = TabController(length: 5, vsync: this);
    _loadAllReports();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAllReports() async {
    setState(() => _isLoading = true);
    try {
      final start = DateFormat('yyyy-MM-dd').format(_dateRange.start);
      final end = DateFormat('yyyy-MM-dd').format(_dateRange.end);
      final results = await Future.wait([
        _api.getReport('daily-sales', start, end),
        _api.getReport('revenue', start, end),
        _api.getReport('items', start, end),
        _api.getReport('peak-hours', start, end),
        _api.getReport('staff', start, end),
      ]);
      if (mounted) {
        setState(() {
          _dailySales = results[0];
          _revenue = results[1];
          _itemPerformance = results[2];
          _peakHours = results[3];
          _staffPerformance = results[4] as Map<String, dynamic>?;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
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
      _loadAllReports();
    }
  }

  String get _dateRangeLabel {
    final f = DateFormat('MMM d');
    return '${f.format(_dateRange.start)} - ${f.format(_dateRange.end)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Reports', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          TextButton.icon(
            onPressed: _pickDateRange,
            icon: const Icon(Icons.date_range, size: 18),
            label: Text(_dateRangeLabel, style: GoogleFonts.inter(fontSize: 12)),
          ),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadAllReports),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
          unselectedLabelStyle: GoogleFonts.inter(fontSize: 13),
          tabs: const [
            Tab(text: 'Daily Sales'),
            Tab(text: 'Revenue'),
            Tab(text: 'Items'),
            Tab(text: 'Peak Hours'),
            Tab(text: 'Staff'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(_error!, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(onPressed: _loadAllReports, child: const Text('Retry')),
                ]))
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _DailySalesTab(data: _dailySales),
                    _RevenueTab(data: _revenue),
                    _ItemsTab(data: _itemPerformance),
                    _PeakHoursTab(data: _peakHours != null && _peakHours is List ? _peakHours as List<dynamic> : (_peakHours?['data'] as List<dynamic>? ?? [])),
                    _StaffTab(data: _staffPerformance != null && _staffPerformance is List ? _staffPerformance as List<dynamic> : (_staffPerformance?['data'] as List<dynamic>? ?? [])),
                  ],
                ),
    );
  }
}

class _DailySalesTab extends StatelessWidget {
  final Map<String, dynamic>? data;
  const _DailySalesTab({this.data});

  @override
  Widget build(BuildContext context) {
    final daily = (data?['daily'] as List<dynamic>?) ?? [];
    final totals = data?['totals'] as Map<String, dynamic>?;
    // Aggregate payment breakdown across all days in the range
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
          // Summary cards
          Row(children: [
            _SummaryCard(label: 'Total Orders', value: '${totals?['totalOrders'] ?? 0}', color: Colors.blue),
            const SizedBox(width: 12),
            _SummaryCard(label: 'Total Revenue', value: '₹${(totals?['totalRevenue'] ?? 0).toStringAsFixed(0)}', color: Colors.green),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            _SummaryCard(label: 'Avg Order Value', value: '₹${(totals?['averageOrderValue'] ?? 0).toStringAsFixed(0)}', color: Colors.orange),
          ]),
          const SizedBox(height: 20),
          // Revenue chart
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Revenue Trend', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 16),
                  SizedBox(height: 200, child: RevenueLineChart(data: ChartData.fromDailySales(daily))),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Payment breakdown
          if (paymentBreakdown.isNotEmpty) Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Payment Methods', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  PaymentPieChart(slices: ChartData.fromPaymentBreakdown(paymentBreakdown)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RevenueTab extends StatelessWidget {
  final Map<String, dynamic>? data;
  const _RevenueTab({this.data});

  @override
  Widget build(BuildContext context) {
    final byCategory = (data?['byCategory'] as List<dynamic>?) ?? [];
    final byItem = (data?['byItem'] as List<dynamic>?) ?? [];

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
        ],
      ),
    );
  }
}

class _ItemsTab extends StatelessWidget {
  final Map<String, dynamic>? data;
  const _ItemsTab({this.data});

  @override
  Widget build(BuildContext context) {
    final topSelling = (data?['topSelling'] as List<dynamic>?) ?? [];
    final lowPerforming = (data?['lowPerforming'] as List<dynamic>?) ?? [];

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
          Text('Low Performing Items', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Card(child: Padding(
            padding: const EdgeInsets.all(16),
            child: topSelling.isEmpty
                ? const Center(child: Text('No items data'))
                : Column(
                    children: lowPerforming.map((item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Icon(Icons.trending_down, size: 16, color: AppColors.danger),
                          const SizedBox(width: 8),
                          Expanded(child: Text(item['name'] ?? '', style: GoogleFonts.inter(fontSize: 13))),
                          Text('${item['quantity'] ?? 0} sold', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                        ],
                      ),
                    )).toList(),
                  ),
          )),
        ],
      ),
    );
  }
}

class _PeakHoursTab extends StatelessWidget {
  final List<dynamic>? data;
  const _PeakHoursTab({this.data});

  @override
  Widget build(BuildContext context) {
    final hours = data ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Orders by Hour', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(height: 250, child: RevenueLineChart(data: ChartData.fromPeakHours(hours))),
            ),
          ),
          const SizedBox(height: 20),
          Text('Hourly Breakdown', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: hours.map((h) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      SizedBox(width: 50, child: Text(h['hour'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13))),
                      Expanded(
                        child: LinearProgressIndicator(
                          value: (h['orderCount'] as int? ?? 0) / ((hours.first['orderCount'] as int? ?? 1).toDouble()),
                          minHeight: 22,
                          backgroundColor: AppColors.gray100,
                          valueColor: AlwaysStoppedAnimation(AppColors.info),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text('${h['orderCount'] ?? 0} orders', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray600)),
                    ],
                  ),
                )).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StaffTab extends StatelessWidget {
  final List<dynamic>? data;
  const _StaffTab({this.data});

  @override
  Widget build(BuildContext context) {
    final staff = data ?? [];
    if (staff.isEmpty) {
      return Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.people_outline, size: 64, color: AppColors.gray300),
          const SizedBox(height: 12),
          Text('No staff performance data', style: GoogleFonts.inter(color: AppColors.gray500)),
        ]),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: staff.length,
      itemBuilder: (ctx, i) {
        final s = staff[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
              child: Text((s['name'] as String?)?[0] ?? '?', style: GoogleFonts.inter(color: AppColors.primary, fontWeight: FontWeight.w600)),
            ),
            title: Text(s['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            subtitle: Text('${s['role'] ?? 'Staff'} · ${s['orderCount'] ?? 0} orders', style: GoogleFonts.inter(fontSize: 12)),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('₹${(s['totalRevenue'] ?? 0).toStringAsFixed(0)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
                Text('Avg: ₹${(s['avgOrderValue'] ?? 0).toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _SummaryCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
              const SizedBox(height: 4),
              Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
            ],
          ),
        ),
      ),
    );
  }
}
