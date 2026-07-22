import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/finance_models.dart';
import '../data/finance_service.dart';

class PurchaseBillsScreen extends ConsumerStatefulWidget {
  const PurchaseBillsScreen({super.key});
  @override
  ConsumerState<PurchaseBillsScreen> createState() => _PurchaseBillsScreenState();
}

class _PurchaseBillsScreenState extends ConsumerState<PurchaseBillsScreen> {
  List<PurchaseBill> _bills = [];
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
      _bills = await service.getPurchaseBills();
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final totalAmount = _bills.fold(0.0, (sum, b) => sum + b.total);
    final totalPaid = _bills.fold(0.0, (sum, b) => sum + b.amountPaid);
    final totalDue = totalAmount - totalPaid;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(title: const Text('Purchase Bills'), actions: [IconButton(icon: const Icon(Icons.add), onPressed: _showCreateBillDialog)]),
      body: _isLoading
          ? const NxFullScreenLoader(message: 'Loading purchase bills...')
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(spacing: 12, runSpacing: 12, children: [
                    SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Total Bills', value: FinanceStatusHelpers.formatCurrency(totalAmount), icon: Icons.receipt_long, color: AppColors.primary)),
                    SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Paid', value: FinanceStatusHelpers.formatCurrency(totalPaid), icon: Icons.check_circle, color: AppColors.success)),
                    SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Outstanding', value: FinanceStatusHelpers.formatCurrency(totalDue), icon: Icons.pending, color: AppColors.warning)),
                    SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Total Bills', value: '${_bills.length}', icon: Icons.receipt, color: AppColors.info)),
                  ]),
                  const SizedBox(height: 20),
                  if (_bills.isEmpty)
                    const NxEmptyState(icon: Icons.receipt_long, title: 'No Purchase Bills', subtitle: 'Create your first purchase bill')
                  else
                    ..._bills.map((b) => _buildBillCard(b)),
                ],
              ),
            ),
    );
  }

  Widget _buildBillCard(PurchaseBill b) {
    final isOverdue = b.dueDate != null && DateTime.now().isAfter(b.dueDate!) && b.amountDue > 0;
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Text(b.billNumber, style: const TextStyle(fontWeight: FontWeight.bold)),
              const Spacer(),
              if (isOverdue) Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: AppColors.danger.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                child: const Text('Overdue', style: TextStyle(fontSize: 10, color: AppColors.danger, fontWeight: FontWeight.w600)),
              ) else if (b.amountDue <= 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                  child: const Text('Paid', style: TextStyle(fontSize: 10, color: AppColors.success, fontWeight: FontWeight.w600)),
                ),
            ]),
            const SizedBox(height: 4),
            if (b.supplierName != null) Text(b.supplierName!, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
            Text(DateFormat('MMM d, yyyy').format(b.billDate), style: const TextStyle(fontSize: 11, color: AppColors.gray500)),
            const SizedBox(height: 8),
            Row(children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Total', style: TextStyle(fontSize: 10, color: AppColors.gray500)),
                Text(FinanceStatusHelpers.formatCurrency(b.total), style: const TextStyle(fontWeight: FontWeight.bold)),
              ]),
              const SizedBox(width: 16),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Paid', style: TextStyle(fontSize: 10, color: AppColors.gray500)),
                Text(FinanceStatusHelpers.formatCurrency(b.amountPaid), style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.success)),
              ]),
              const SizedBox(width: 16),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Due', style: TextStyle(fontSize: 10, color: AppColors.gray500)),
                Text(FinanceStatusHelpers.formatCurrency(b.amountDue), style: TextStyle(fontWeight: FontWeight.bold, color: b.amountDue > 0 ? AppColors.danger : AppColors.gray600)),
              ]),
            ]),
          ],
        ),
      ),
    );
  }

  void _showCreateBillDialog() {
    final supplierCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create Purchase Bill'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: supplierCtrl, decoration: const InputDecoration(labelText: 'Supplier Name *')),
            const SizedBox(height: 12),
            TextField(controller: amountCtrl, decoration: const InputDecoration(labelText: 'Amount *'), keyboardType: TextInputType.number),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx), child: const Text('Create')),
        ],
      ),
    );
  }
}
