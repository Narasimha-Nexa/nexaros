import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/finance_models.dart';
import '../data/finance_service.dart';

class ForecastingScreen extends ConsumerStatefulWidget {
  const ForecastingScreen({super.key});
  @override
  ConsumerState<ForecastingScreen> createState() => _ForecastingScreenState();
}

class _ForecastingScreenState extends ConsumerState<ForecastingScreen> {
  List<FinancialForecast> _forecasts = [];
  bool _isLoading = true;
  int _selectedTab = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final service = FinanceService(ref.read(apiClientProvider));
      _forecasts = await service.getForecasts();
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(title: const Text('Financial Forecasting')),
      body: _isLoading
          ? const NxFullScreenLoader(message: 'Loading forecasts...')
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildForecastTypeSelector(),
                  const SizedBox(height: 16),
                  _buildForecastChart(),
                  const SizedBox(height: 20),
                  Text('Forecast Details', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ..._buildForecastCards(),
                ],
              ),
            ),
    );
  }

  Widget _buildForecastTypeSelector() {
    final types = ['Revenue', 'Expense', 'Profit', 'Cash Flow'];
    return Row(
      children: types.asMap().entries.map((entry) => Expanded(
        child: GestureDetector(
          onTap: () => setState(() => _selectedTab = entry.key),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 4),
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: _selectedTab == entry.key ? AppColors.primary : AppColors.gray100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(entry.value, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _selectedTab == entry.key ? Colors.white : AppColors.gray600)),
          ),
        ),
      )).toList(),
    );
  }

  Widget _buildForecastChart() {
    return NxCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('12-Month Forecast', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (v) => FlLine(color: AppColors.gray200, strokeWidth: 1)),
                  titlesData: FlTitlesData(
                    bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, m) {
                      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return Text(months[v.toInt() % 12], style: const TextStyle(fontSize: 10));
                    })),
                    leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40, getTitlesWidget: (v, m) => Text('${(v / 1000).toStringAsFixed(0)}K', style: const TextStyle(fontSize: 10)))),
                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: List.generate(12, (i) => FlSpot(i.toDouble(), (80000 + i * 5000 + (i % 3) * 10000).toDouble())),
                      isCurved: true,
                      color: AppColors.primary,
                      barWidth: 3,
                      belowBarData: BarAreaData(show: true, color: AppColors.primary.withValues(alpha: 0.1)),
                      dotData: FlDotData(show: false),
                    ),
                    LineChartBarData(
                      spots: List.generate(12, (i) => FlSpot(i.toDouble(), (85000 + i * 4500 + (i % 2) * 8000).toDouble())),
                      isCurved: true,
                      color: AppColors.success,
                      barWidth: 2,
                      dotData: FlDotData(show: false),
                      isStrokeCapRound: true,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(children: [
              Container(width: 12, height: 3, color: AppColors.primary),
              const SizedBox(width: 4),
              const Text('Predicted', style: TextStyle(fontSize: 10, color: AppColors.gray500)),
              const SizedBox(width: 16),
              Container(width: 12, height: 3, color: AppColors.success),
              const SizedBox(width: 4),
              const Text('Actual', style: TextStyle(fontSize: 10, color: AppColors.gray500)),
            ]),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildForecastCards() {
    final items = [
      _ForecastData('Revenue Forecast', 'Next quarter revenue predicted at ₹12.5L based on current trends', '₹12.5L', AppColors.success),
      _ForecastData('Expense Forecast', 'Operating expenses expected to increase 8% due to seasonal demand', '₹8.2L', AppColors.warning),
      _ForecastData('Profit Forecast', 'Net profit margin projected at 18.5% for next quarter', '₹2.3L', AppColors.primary),
      _ForecastData('Cash Flow', 'Positive cash flow of ₹3.8L expected, sufficient for operations', '₹3.8L', AppColors.info),
      _ForecastData('Labor Cost', 'Staff costs projected to rise 5% with 2 new hires planned', '₹3.1L', AppColors.secondary),
    ];

    return items.map((item) => NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: item.color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(Icons.auto_graph, color: item.color),
        ),
        title: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(item.description, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
        trailing: Text(item.value, style: TextStyle(fontWeight: FontWeight.bold, color: item.color)),
      ),
    )).toList();
  }
}

class _ForecastData {
  final String title, description, value;
  final Color color;
  const _ForecastData(this.title, this.description, this.value, this.color);
}
