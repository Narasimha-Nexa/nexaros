import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/finance_models.dart';
import '../data/finance_service.dart';

class BankingScreen extends ConsumerStatefulWidget {
  const BankingScreen({super.key});
  @override
  ConsumerState<BankingScreen> createState() => _BankingScreenState();
}

class _BankingScreenState extends ConsumerState<BankingScreen> {
  List<BankAccount> _accounts = [];
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
      _accounts = await service.getBankAccounts();
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final totalBalance = _accounts.fold(0.0, (sum, a) => sum + a.balance);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Banking & Reconciliation'),
        actions: [IconButton(icon: const Icon(Icons.add), onPressed: _showAddAccountDialog)],
      ),
      body: _isLoading
          ? const NxFullScreenLoader(message: 'Loading bank accounts...')
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  NxStatCard(title: 'Total Balance', value: FinanceStatusHelpers.formatCurrency(totalBalance), icon: Icons.account_balance, color: AppColors.success),
                  const SizedBox(height: 16),
                  Text('Bank Accounts', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  if (_accounts.isEmpty)
                    const NxEmptyState(icon: Icons.account_balance, title: 'No Bank Accounts', subtitle: 'Add your first bank account')
                  else
                    ..._accounts.map((a) => _buildAccountCard(a)),
                ],
              ),
            ),
    );
  }

  Widget _buildAccountCard(BankAccount a) {
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: Icon(a.type == 'cash' ? Icons.money : Icons.account_balance, color: AppColors.primary, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(a.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                  if (a.bankName != null) Text(a.bankName!, style: const TextStyle(fontSize: 12, color: AppColors.gray500)),
                  if (a.accountNumber != null) Text('••••${a.accountNumber!.length > 4 ? a.accountNumber!.substring(a.accountNumber!.length - 4) : a.accountNumber}', style: const TextStyle(fontSize: 12, color: AppColors.gray500)),
                ]),
              ),
              Text(FinanceStatusHelpers.formatCurrency(a.balance), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            ]),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: OutlinedButton.icon(onPressed: () {}, icon: const Icon(Icons.receipt_long, size: 16), label: const Text('Statement', style: TextStyle(fontSize: 12)))),
                const SizedBox(width: 8),
                Expanded(child: OutlinedButton.icon(onPressed: () {}, icon: const Icon(Icons.sync, size: 16), label: const Text('Reconcile', style: TextStyle(fontSize: 12)))),
                const SizedBox(width: 8),
                Expanded(child: OutlinedButton.icon(onPressed: () {}, icon: const Icon(Icons.swap_horiz, size: 16), label: const Text('Transfer', style: TextStyle(fontSize: 12)))),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showAddAccountDialog() {
    final nameCtrl = TextEditingController();
    final bankCtrl = TextEditingController();
    final accCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Bank Account'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Account Name *')),
            const SizedBox(height: 12),
            TextField(controller: bankCtrl, decoration: const InputDecoration(labelText: 'Bank Name')),
            const SizedBox(height: 12),
            TextField(controller: accCtrl, decoration: const InputDecoration(labelText: 'Account Number'), keyboardType: TextInputType.number),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx), child: const Text('Add')),
        ],
      ),
    );
  }
}
