import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../data/finance_models.dart';

class FinanceReportsScreen extends ConsumerStatefulWidget {
  const FinanceReportsScreen({super.key});

  @override
  ConsumerState<FinanceReportsScreen> createState() => _FinanceReportsScreenState();
}

class _FinanceReportsScreenState extends ConsumerState<FinanceReportsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  DateTimeRange? _dateRange;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadReport());
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) _loadReport();
  }

  Future<void> _loadReport() async {
    final start = _dateRange != null ? DateFormat('yyyy-MM-dd').format(_dateRange!.start) : null;
    final end = _dateRange != null ? DateFormat('yyyy-MM-dd').format(_dateRange!.end) : null;
    final reports = ['profit-loss', 'income', 'expense-breakdown'];
    await ref.read(financeProvider.notifier).loadFinancialReport(reports[_tabController.index], startDate: start, endDate: end);
  }

  @override
  Widget build(BuildContext context) {
    final finance = ref.watch(financeProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Financial Reports', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.secondary, foregroundColor: Colors.white,
        actions: [
          InkWell(
            onTap: () async {
              final picked = await showDateRangePicker(context: context, firstDate: DateTime(2020), lastDate: DateTime.now(), initialDateRange: _dateRange);
              if (picked != null) { setState(() => _dateRange = picked); _loadReport(); }
            },
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 8), padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.date_range, size: 16, color: Colors.white), const SizedBox(width: 4),
                Text(_dateRange != null ? '${DateFormat('dd/MM').format(_dateRange!.start)}-${DateFormat('dd/MM').format(_dateRange!.end)}' : 'Period',
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w500)),
              ]),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.file_download, size: 20), tooltip: 'Export',
            onPressed: () { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Export feature coming soon'), backgroundColor: AppColors.info)); },
          ),
        ],
        bottom: TabBar(
          controller: _tabController, isScrollable: true,
          labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
          unselectedLabelStyle: GoogleFonts.inter(fontSize: 13),
          indicatorColor: Colors.white, labelColor: Colors.white, unselectedLabelColor: Colors.white70,
          tabs: const [Tab(text: 'P&L Statement'), Tab(text: 'Income Analysis'), Tab(text: 'Expense Breakdown')],
        ),
      ),
      body: finance.reportLoading
          ? const Center(child: CircularProgressIndicator())
          : finance.financialReport == null
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.bar_chart, size: 64, color: AppColors.gray300),
                  const SizedBox(height: 12), Text('No report data available', style: GoogleFonts.inter(color: AppColors.gray500)),
                  const SizedBox(height: 12),
                  ElevatedButton(onPressed: _loadReport, child: const Text('Refresh')),
                ]))
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _ProfitLossTab(report: finance.financialReport!),
                    _IncomeAnalysisTab(report: finance.financialReport!),
                    _ExpenseBreakdownTab(report: finance.financialReport!),
                  ],
                ),
    );
  }
}

class _ProfitLossTab extends StatelessWidget {
  final FinancialReport report;
  const _ProfitLossTab({required this.report});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Profit & Loss Summary', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                _pnlRow('Total Revenue', '₹${report.totalIncome.toStringAsFixed(2)}', AppColors.success, Icons.trending_up),
                const Divider(),
                _pnlRow('Total Expenses', '-₹${report.totalExpenses.toStringAsFixed(2)}', AppColors.danger, Icons.trending_down),
                const Divider(thickness: 2),
                _pnlRow('Net Profit', '₹${report.netProfit.toStringAsFixed(2)}', report.netProfit >= 0 ? AppColors.success : AppColors.danger, Icons.account_balance_wallet),
                const Divider(),
                _pnlRow('Profit Margin', '${report.profitMargin.toStringAsFixed(1)}%', AppColors.info, Icons.pie_chart),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _pnlRow(String label, String value, Color color, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(children: [
        Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)), child: Icon(icon, size: 16, color: color)),
        const SizedBox(width: 12),
        Expanded(child: Text(label, style: GoogleFonts.inter(fontSize: 14, color: AppColors.gray600))),
        Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
      ]),
    );
  }
}

class _IncomeAnalysisTab extends StatelessWidget {
  final FinancialReport report;
  const _IncomeAnalysisTab({required this.report});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Income Analysis', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Key Metrics', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  _metricCard('Total Income', '₹${report.totalIncome.toStringAsFixed(2)}', Icons.trending_up, AppColors.success),
                  const SizedBox(height: 8),
                  _metricCard('Avg Daily', report.totalIncome > 0 ? '₹${(report.totalIncome / 30).toStringAsFixed(2)}' : '₹0', Icons.calendar_today, AppColors.primary),
                  const SizedBox(height: 8),
                  _metricCard('Categories', '${report.incomeBreakdown.length}', Icons.category, AppColors.info),
                ],
              ),
            ),
          ),
          if (report.incomeBreakdown.isNotEmpty) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Income Breakdown', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    ...report.incomeBreakdown.map((item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(children: [
                        Expanded(child: Text(item.category, style: GoogleFonts.inter(fontSize: 13))),
                        Text('₹${item.amount.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                      ]),
                    )),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _metricCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(8)),
      child: Row(children: [
        Icon(icon, size: 20, color: color), const SizedBox(width: 12),
        Expanded(child: Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray600))),
        Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
      ]),
    );
  }
}

class _ExpenseBreakdownTab extends StatelessWidget {
  final FinancialReport report;
  const _ExpenseBreakdownTab({required this.report});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Expense Breakdown', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Expense Categories', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  if (report.expenseBreakdown.isNotEmpty)
                    ...report.expenseBreakdown.map((item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(children: [
                        Expanded(child: Text(item.category, style: GoogleFonts.inter(fontSize: 13))),
                        Text('₹${item.amount.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.danger)),
                      ]),
                    ))
                  else
                    Center(child: Padding(padding: const EdgeInsets.all(20), child: Text('No expense data available', style: GoogleFonts.inter(color: AppColors.gray400)))),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Total Expenses', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15)),
                Text('₹${report.totalExpenses.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.danger)),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
