import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../data/finance_models.dart';
import '../data/finance_service.dart';

class FinanceDashboardScreen extends ConsumerStatefulWidget {
  const FinanceDashboardScreen({super.key});

  @override
  ConsumerState<FinanceDashboardScreen> createState() => _FinanceDashboardScreenState();
}

class _FinanceDashboardScreenState extends ConsumerState<FinanceDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(financeProvider.notifier).loadDashboardData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final finance = ref.watch(financeProvider);
    final overview = finance.overview;
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      appBar: AppBar(
        title: Text('Finance Dashboard', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(financeProvider.notifier).loadDashboardData(),
          ),
        ],
      ),
      body: finance.overviewLoading
          ? const Center(child: CircularProgressIndicator())
          : overview == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.account_balance_wallet, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      Text('Could not load finance data', style: GoogleFonts.inter(color: AppColors.gray500)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () => ref.read(financeProvider.notifier).loadOverview(),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => ref.read(financeProvider.notifier).loadDashboardData(),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSummaryRow(overview, isMobile),
                        const SizedBox(height: 20),
                        _buildSectionTitle('Revenue vs Expenses'),
                        const SizedBox(height: 12),
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: SizedBox(height: 200, child: _buildMiniChart(overview)),
                          ),
                        ),
                        const SizedBox(height: 20),
                        _buildSectionTitle('Quick Actions'),
                        const SizedBox(height: 12),
                        _buildQuickActions(isMobile),
                        const SizedBox(height: 20),
                        _buildSectionTitle('Recent Invoices'),
                        const SizedBox(height: 12),
                        _buildRecentInvoices(context),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildSummaryRow(FinanceOverview overview, bool isMobile) {
    return GridView.count(
      crossAxisCount: isMobile ? 2 : 4,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: isMobile ? 1.3 : 1.6,
      children: [
        _financeCard(
          'Total Income',
          '₹${overview.monthlyRevenue.toStringAsFixed(0)}',
          Icons.trending_up,
          AppColors.success,
          Colors.green.shade50,
        ),
        _financeCard(
          'Total Expenses',
          '₹${overview.operatingExpenses.toStringAsFixed(0)}',
          Icons.trending_down,
          AppColors.danger,
          Colors.red.shade50,
        ),
        _financeCard(
          'Net Profit',
          '₹${overview.netProfit.toStringAsFixed(0)}',
          Icons.account_balance_wallet,
          overview.netProfit >= 0 ? AppColors.primary : AppColors.danger,
          AppColors.primary50,
        ),
        _financeCard(
          'Margin',
          '${overview.profitMargin.toStringAsFixed(1)}%',
          Icons.pie_chart,
          AppColors.info,
          AppColors.primary50,
        ),
      ],
    );
  }

  Widget _financeCard(String title, String value, IconData icon, Color color, Color bgColor) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
        boxShadow: [
          BoxShadow(color: color.withValues(alpha: 0.06), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(value, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.gray800)),
          Text(title, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
        ],
      ),
    );
  }

  Widget _buildMiniChart(FinanceOverview overview) {
    final income = overview.monthlyRevenue;
    final expenses = overview.operatingExpenses;
    final profit = overview.netProfit;
    final maxVal = [income, expenses, profit].fold<double>(0, (m, v) => v > m ? v : m);
    final ceiling = maxVal > 0 ? maxVal * 1.2 : 100.0;

    return Column(
      children: [
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _buildBar('Income', income, ceiling, AppColors.success),
              const SizedBox(width: 12),
              _buildBar('Expenses', expenses, ceiling, AppColors.danger),
              const SizedBox(width: 12),
              _buildBar('Profit', profit, ceiling, profit >= 0 ? AppColors.primary : AppColors.danger),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: ['Income', 'Expenses', 'Profit'].map((label) {
            return SizedBox(
              width: 80,
              child: Text(label, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildBar(String label, double value, double maxVal, Color color) {
    final fraction = maxVal > 0 ? (value / maxVal).clamp(0.0, 1.0) : 0.0;
    return Expanded(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Text('₹${value.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
          const SizedBox(height: 4),
          Container(
            width: double.infinity,
            height: fraction * 150,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.7),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.gray800));
  }

  Widget _buildQuickActions(bool isMobile) {
    final actions = [
      _ActionItem('Income', Icons.add_circle_outline, AppColors.success, '/shell/finance/income'),
      _ActionItem('Expenses', Icons.remove_circle_outline, AppColors.danger, '/shell/finance/expenses'),
      _ActionItem('Transactions', Icons.receipt_long, AppColors.primary, '/shell/finance/transactions'),
      _ActionItem('Invoices', Icons.description, AppColors.info, '/shell/finance/invoices'),
      _ActionItem('Tax & GST', Icons.account_balance, AppColors.warning, '/shell/finance/tax'),
      _ActionItem('Reports', Icons.bar_chart, AppColors.secondary, '/shell/finance/reports'),
    ];

    return GridView.count(
      crossAxisCount: isMobile ? 2 : 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.5,
      children: actions.map((a) {
        return Card(
          child: InkWell(
            onTap: () => context.push(a.route),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: a.color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                    child: Icon(a.icon, color: a.color, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Text(a.label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildRecentInvoices(BuildContext context) {
    final finance = ref.watch(financeProvider);
    return Card(
      child: Column(
        children: [
          ...finance.invoices.take(5).map((inv) {
            return ListTile(
              dense: true,
              leading: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: AppColors.primary50, borderRadius: BorderRadius.circular(6)),
                child: const Icon(Icons.description, size: 16, color: AppColors.primary),
              ),
              title: Text(
                inv.invoiceNumber.isNotEmpty ? inv.invoiceNumber : 'INV-${inv.id.length > 6 ? inv.id.substring(0, 6) : inv.id}',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
              ),
              subtitle: inv.orderNumber != null
                  ? Text('Order #${inv.orderNumber}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500))
                  : null,
              trailing: Text(
                '₹${inv.total.toStringAsFixed(0)}',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
              ),
              onTap: () => context.push('/shell/finance/invoices'),
            );
          }),
          if (finance.invoices.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Icon(Icons.receipt_long, size: 40, color: AppColors.gray300),
                  const SizedBox(height: 8),
                  Text('No invoices yet', style: GoogleFonts.inter(color: AppColors.gray400)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _ActionItem {
  final String label;
  final IconData icon;
  final Color color;
  final String route;
  const _ActionItem(this.label, this.icon, this.color, this.route);
}
