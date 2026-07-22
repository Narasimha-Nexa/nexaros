import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/finance_models.dart';
import '../data/finance_service.dart';

class BudgetingScreen extends ConsumerStatefulWidget {
  const BudgetingScreen({super.key});
  @override
  ConsumerState<BudgetingScreen> createState() => _BudgetingScreenState();
}

class _BudgetingScreenState extends ConsumerState<BudgetingScreen> {
  List<Budget> _budgets = [];
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
      _budgets = await service.getBudgets();
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final totalAllocated = _budgets.fold(0.0, (sum, b) => sum + b.allocated);
    final totalSpent = _budgets.fold(0.0, (sum, b) => sum + b.spent);
    final exceeded = _budgets.where((b) => b.isExceeded).length;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(title: const Text('Budgeting'), actions: [IconButton(icon: const Icon(Icons.add), onPressed: _showCreateBudgetDialog)]),
      body: _isLoading
          ? const NxFullScreenLoader(message: 'Loading budgets...')
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(spacing: 12, runSpacing: 12, children: [
                    SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Total Budget', value: FinanceStatusHelpers.formatCurrency(totalAllocated), icon: Icons.account_balance_wallet, color: AppColors.primary)),
                    SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Total Spent', value: FinanceStatusHelpers.formatCurrency(totalSpent), icon: Icons.shopping_cart, color: AppColors.warning)),
                    SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Utilization', value: totalAllocated > 0 ? '${(totalSpent / totalAllocated * 100).toStringAsFixed(0)}%' : '0%', icon: Icons.pie_chart, color: AppColors.info)),
                    SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Exceeded', value: '$exceeded', icon: Icons.warning, color: AppColors.danger)),
                  ]),
                  const SizedBox(height: 20),
                  if (_budgets.isEmpty)
                    const NxEmptyState(icon: Icons.account_balance_wallet, title: 'No Budgets', subtitle: 'Create budgets to track spending')
                  else
                    ..._budgets.map((b) => _buildBudgetCard(b)),
                ],
              ),
            ),
    );
  }

  Widget _buildBudgetCard(Budget b) {
    final statusColor = FinanceStatusHelpers.budgetStatusColor(b.status);
    final utilization = b.utilizationPercent;
    final progressColor = b.isExceeded ? AppColors.danger : (utilization > 80 ? AppColors.warning : AppColors.success);

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Text(b.name, style: const TextStyle(fontWeight: FontWeight.w600)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                child: Text(FinanceStatusHelpers.budgetStatusLabel(b.status), style: TextStyle(fontSize: 10, color: statusColor, fontWeight: FontWeight.w600)),
              ),
            ]),
            const SizedBox(height: 4),
            Text(b.period, style: const TextStyle(fontSize: 12, color: AppColors.gray500)),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Allocated', style: TextStyle(fontSize: 10, color: AppColors.gray500)),
                Text(FinanceStatusHelpers.formatCurrency(b.allocated), style: const TextStyle(fontWeight: FontWeight.bold)),
              ])),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Spent', style: TextStyle(fontSize: 10, color: AppColors.gray500)),
                Text(FinanceStatusHelpers.formatCurrency(b.spent), style: TextStyle(fontWeight: FontWeight.bold, color: progressColor)),
              ])),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Remaining', style: TextStyle(fontSize: 10, color: AppColors.gray500)),
                Text(FinanceStatusHelpers.formatCurrency(b.remaining), style: TextStyle(fontWeight: FontWeight.bold, color: b.remaining >= 0 ? AppColors.success : AppColors.danger)),
              ])),
            ]),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: (utilization / 100).clamp(0.0, 1.0),
              backgroundColor: AppColors.gray200,
              color: progressColor,
              minHeight: 8,
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 4),
            Text('${utilization.toStringAsFixed(0)}% utilized', style: TextStyle(fontSize: 11, color: progressColor, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  void _showCreateBudgetDialog() {
    final nameCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    String period = '2026-Q3';
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Create Budget'),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Budget Name *')),
              const SizedBox(height: 12),
              TextField(controller: amountCtrl, decoration: const InputDecoration(labelText: 'Allocated Amount *'), keyboardType: TextInputType.number),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: period,
                decoration: const InputDecoration(labelText: 'Period'),
                items: ['2026-Q3', '2026-Q4', '2027-Q1'].map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                onChanged: (v) => setDialogState(() => period = v!),
              ),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(onPressed: () => Navigator.pop(ctx), child: const Text('Create')),
          ],
        ),
      ),
    );
  }
}
