import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/finance_models.dart';
import '../data/finance_service.dart';

class FinancialAnalyticsScreen extends ConsumerStatefulWidget {
  const FinancialAnalyticsScreen({super.key});
  @override
  ConsumerState<FinancialAnalyticsScreen> createState() => _FinancialAnalyticsScreenState();
}

class _FinancialAnalyticsScreenState extends ConsumerState<FinancialAnalyticsScreen> {
  FinanceOverview? _overview;
  FinancialReport? _report;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final service = FinanceService(ref.read(apiClientProvider));
      final results = await Future.wait([service.getOverview(), service.getFinancialReport('profit-loss')]);
      _overview = results[0] as FinanceOverview;
      _report = results[1] as FinancialReport;
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(title: const Text('Financial Analytics')),
      body: _isLoading
          ? const NxFullScreenLoader(message: 'Loading analytics...')
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildKpiCards(),
                  const SizedBox(height: 20),
                  _buildRevenueExpenseChart(),
                  const SizedBox(height: 20),
                  _buildPaymentMethodBreakdown(),
                  const SizedBox(height: 20),
                  _buildCostAnalysis(),
                  const SizedBox(height: 20),
                  _buildProfitabilityMetrics(),
                ],
              ),
            ),
    );
  }

  Widget _buildKpiCards() {
    if (_overview == null) return const SizedBox.shrink();
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Monthly Revenue', value: FinanceStatusHelpers.formatCurrency(_overview!.monthlyRevenue), icon: Icons.trending_up, color: AppColors.success)),
        SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Net Profit', value: FinanceStatusHelpers.formatCurrency(_overview!.netProfit), icon: Icons.account_balance, color: AppColors.primary)),
        SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Profit Margin', value: '${_overview!.profitMargin.toStringAsFixed(1)}%', icon: Icons.speed, color: AppColors.info)),
        SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Cash Flow', value: FinanceStatusHelpers.formatCurrency(_overview!.cashFlow), icon: Icons.swap_horiz, color: AppColors.secondary)),
      ],
    );
  }

  Widget _buildRevenueExpenseChart() {
    return NxCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Revenue vs Expenses (6 Months)', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: 150000,
                  barTouchData: BarTouchData(enabled: true),
                  titlesData: FlTitlesData(
                    bottomTitles: AxisTitles(sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (v, m) {
                        final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                        return Text(months[v.toInt() % 6], style: const TextStyle(fontSize: 10));
                      },
                    )),
                    leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40, getTitlesWidget: (v, m) => Text('${(v / 1000).toStringAsFixed(0)}K', style: const TextStyle(fontSize: 10)))),
                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (v) => FlLine(color: AppColors.gray200, strokeWidth: 1)),
                  barGroups: List.generate(6, (i) {
                    final revenue = [95000, 102000, 98000, 110000, 105000, 115000][i].toDouble();
                    final expense = [72000, 78000, 75000, 82000, 80000, 85000][i].toDouble();
                    return BarChartGroupData(
                      x: i,
                      barRods: [
                        BarChartRodData(toY: revenue, color: AppColors.success, width: 12, borderRadius: const BorderRadius.only(topLeft: Radius.circular(3), topRight: Radius.circular(3))),
                        BarChartRodData(toY: expense, color: AppColors.danger, width: 12, borderRadius: const BorderRadius.only(topLeft: Radius.circular(3), topRight: Radius.circular(3))),
                      ],
                    );
                  }),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(children: [
              Container(width: 12, height: 12, decoration: BoxDecoration(color: AppColors.success, borderRadius: BorderRadius.circular(2))),
              const SizedBox(width: 4),
              const Text('Revenue', style: TextStyle(fontSize: 11, color: AppColors.gray500)),
              const SizedBox(width: 16),
              Container(width: 12, height: 12, decoration: BoxDecoration(color: AppColors.danger, borderRadius: BorderRadius.circular(2))),
              const SizedBox(width: 4),
              const Text('Expenses', style: TextStyle(fontSize: 11, color: AppColors.gray500)),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodBreakdown() {
    if (_report == null || _report!.paymentMethodBreakdown.isEmpty) return const SizedBox.shrink();
    final methods = _report!.paymentMethodBreakdown;
    final total = methods.values.fold(0.0, (sum, v) => sum + v);

    return NxCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Payment Method Analysis', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            SizedBox(
              height: 180,
              child: PieChart(
                PieChartData(
                  sections: methods.entries.toList().asMap().entries.map((entry) {
                    final colors = [AppColors.primary, AppColors.success, AppColors.warning, AppColors.info, AppColors.secondary, AppColors.danger];
                    final pct = total > 0 ? entry.value.value / total * 100 : 0.0;
                    return PieChartSectionData(
                      value: entry.value.value,
                      title: '${pct.toStringAsFixed(0)}%',
                      color: colors[entry.key % colors.length],
                      radius: 60,
                      titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                    );
                  }).toList(),
                  sectionsSpace: 2,
                  centerSpaceRadius: 30,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 16,
              runSpacing: 4,
              children: methods.entries.toList().asMap().entries.map((entry) {
                final colors = [AppColors.primary, AppColors.success, AppColors.warning, AppColors.info, AppColors.secondary, AppColors.danger];
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(width: 10, height: 10, decoration: BoxDecoration(color: colors[entry.key % colors.length], shape: BoxShape.circle)),
                    const SizedBox(width: 4),
                    Text('${entry.value.key}: ${FinanceStatusHelpers.formatCurrency(entry.value.value)}', style: const TextStyle(fontSize: 11)),
                  ],
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCostAnalysis() {
    if (_overview == null) return const SizedBox.shrink();
    final items = [
      ('Food Cost', _overview!.foodCost, _overview!.foodCostPercent, AppColors.warning),
      ('Labor Cost', _overview!.laborCost, _overview!.laborCostPercent, AppColors.info),
      ('Operating Expenses', _overview!.operatingExpenses, _overview!.monthlyRevenue > 0 ? (_overview!.operatingExpenses / _overview!.monthlyRevenue * 100) : 0, AppColors.secondary),
    ];

    return NxCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Cost Analysis', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...items.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Text(item.$1, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                    const Spacer(),
                    Text('${FinanceStatusHelpers.formatCurrency(item.$2)} (${item.$3.toStringAsFixed(1)}%)', style: TextStyle(fontSize: 12, color: item.$4, fontWeight: FontWeight.w600)),
                  ]),
                  const SizedBox(height: 4),
                  LinearProgressIndicator(
                    value: (item.$3 / 50).clamp(0.0, 1.0),
                    backgroundColor: AppColors.gray200,
                    color: item.$4,
                    minHeight: 8,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildProfitabilityMetrics() {
    if (_overview == null) return const SizedBox.shrink();
    return NxCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Profitability Metrics', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _metricRow('Gross Profit', FinanceStatusHelpers.formatCurrency(_overview!.grossProfit), AppColors.success),
            _metricRow('Operating Profit', FinanceStatusHelpers.formatCurrency(_overview!.operatingProfit), AppColors.primary),
            _metricRow('Net Profit', FinanceStatusHelpers.formatCurrency(_overview!.netProfit), AppColors.info),
            _metricRow('Profit Margin', '${_overview!.profitMargin.toStringAsFixed(1)}%', _overview!.profitMargin > 15 ? AppColors.success : AppColors.warning),
            _metricRow('Business Health Score', '${_overview!.businessHealthScore.toStringAsFixed(0)}/100', _overview!.businessHealthScore > 70 ? AppColors.success : AppColors.warning),
          ],
        ),
      ),
    );
  }

  Widget _metricRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(children: [
        Text(label, style: const TextStyle(fontSize: 13)),
        const Spacer(),
        Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
      ]),
    );
  }
}
