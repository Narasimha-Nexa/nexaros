import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/finance_models.dart';
import '../data/finance_service.dart';

class AccountingScreen extends ConsumerStatefulWidget {
  const AccountingScreen({super.key});
  @override
  ConsumerState<AccountingScreen> createState() => _AccountingScreenState();
}

class _AccountingScreenState extends ConsumerState<AccountingScreen> {
  int _selectedTab = 0;
  List<JournalEntry> _journalEntries = [];
  List<Account> _accounts = [];
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
      final results = await Future.wait([service.getJournalEntries(), service.getChartOfAccounts()]);
      _journalEntries = results[0] as List<JournalEntry>;
      _accounts = results[1] as List<Account>;
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Accounting'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: _selectedTab == 0 ? _showCreateJournalDialog : _showCreateAccountDialog),
        ],
      ),
      body: Column(
        children: [
          _buildTabBar(),
          Expanded(
            child: _isLoading
                ? const NxFullScreenLoader(message: 'Loading accounting data...')
                : _selectedTab == 0
                    ? _buildJournalEntries()
                    : _selectedTab == 1
                        ? _buildChartOfAccounts()
                        : _buildTrialBalance(),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          _tab('Journal Entries', 0),
          _tab('Chart of Accounts', 1),
          _tab('Trial Balance', 2),
        ],
      ),
    );
  }

  Widget _tab(String label, int index) {
    final selected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(color: selected ? AppColors.primary : Colors.transparent, borderRadius: BorderRadius.circular(12)),
          child: Text(label, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? Colors.white : AppColors.gray600)),
        ),
      ),
    );
  }

  Widget _buildJournalEntries() {
    if (_journalEntries.isEmpty) return const NxEmptyState(icon: Icons.book, title: 'No Journal Entries', subtitle: 'Create your first journal entry');
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _journalEntries.length,
      itemBuilder: (context, i) => _buildJournalCard(_journalEntries[i]),
    );
  }

  Widget _buildJournalCard(JournalEntry entry) {
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Text(entry.entryNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: entry.isApproved ? AppColors.success.withValues(alpha: 0.1) : AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(entry.isApproved ? 'Approved' : 'Pending', style: TextStyle(fontSize: 10, color: entry.isApproved ? AppColors.success : AppColors.warning, fontWeight: FontWeight.w600)),
              ),
            ]),
            const SizedBox(height: 4),
            Text(entry.description, style: const TextStyle(fontSize: 13, color: AppColors.gray600)),
            const SizedBox(height: 8),
            ...entry.lines.map((line) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(children: [
                Icon(line.side == AccountEntrySide.debit ? Icons.arrow_upward : Icons.arrow_downward, size: 14, color: line.side == AccountEntrySide.debit ? AppColors.success : AppColors.danger),
                const SizedBox(width: 6),
                Expanded(child: Text(line.accountName, style: const TextStyle(fontSize: 12))),
                Text(FinanceStatusHelpers.formatCurrency(line.amount), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: line.side == AccountEntrySide.debit ? AppColors.success : AppColors.danger)),
              ]),
            )),
            const Divider(),
            Row(children: [
              Text('Dr: ${FinanceStatusHelpers.formatCurrency(entry.totalDebit)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const Spacer(),
              Text('Cr: ${FinanceStatusHelpers.formatCurrency(entry.totalCredit)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildChartOfAccounts() {
    if (_accounts.isEmpty) return const NxEmptyState(icon: Icons.account_balance, title: 'No Accounts', subtitle: 'Set up your chart of accounts');
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _accounts.length,
      itemBuilder: (context, i) {
        final a = _accounts[i];
        final color = FinanceStatusHelpers.accountTypeColor(a.type);
        return NxCard(
          margin: const EdgeInsets.only(bottom: 6),
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
              child: Icon(Icons.account_balance_wallet, color: color, size: 20),
            ),
            title: Text('${a.code} - ${a.name}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
            subtitle: Text(FinanceStatusHelpers.accountTypeLabel(a.type), style: const TextStyle(fontSize: 11, color: AppColors.gray500)),
            trailing: Text(FinanceStatusHelpers.formatCurrency(a.balance), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          ),
        );
      },
    );
  }

  Widget _buildTrialBalance() {
    final totalDebit = _accounts.where((a) => a.type == AccountType.asset || a.type == AccountType.expense).fold(0.0, (sum, a) => sum + a.balance);
    final totalCredit = _accounts.where((a) => a.type == AccountType.liability || a.type == AccountType.equity || a.type == AccountType.revenue).fold(0.0, (sum, a) => sum + a.balance);
    final isBalanced = (totalDebit - totalCredit).abs() < 0.01;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          NxCard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text('Trial Balance', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Row(children: [
                    const Expanded(child: Text('Total Debit', style: TextStyle(fontSize: 14))),
                    Text(FinanceStatusHelpers.formatCurrency(totalDebit), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  ]),
                  const Divider(),
                  Row(children: [
                    const Expanded(child: Text('Total Credit', style: TextStyle(fontSize: 14))),
                    Text(FinanceStatusHelpers.formatCurrency(totalCredit), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  ]),
                  const Divider(),
                  Row(children: [
                    const Expanded(child: Text('Difference', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold))),
                    Text(
                      FinanceStatusHelpers.formatCurrency((totalDebit - totalCredit).abs()),
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: isBalanced ? AppColors.success : AppColors.danger),
                    ),
                  ]),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isBalanced ? AppColors.success.withValues(alpha: 0.1) : AppColors.danger.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(isBalanced ? Icons.check_circle : Icons.error, color: isBalanced ? AppColors.success : AppColors.danger, size: 16),
                        const SizedBox(width: 6),
                        Text(isBalanced ? 'Balance is equal' : 'Balance mismatch!', style: TextStyle(color: isBalanced ? AppColors.success : AppColors.danger, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          ...AccountType.values.map((type) {
            final accounts = _accounts.where((a) => a.type == type).toList();
            if (accounts.isEmpty) return const SizedBox.shrink();
            final total = accounts.fold(0.0, (sum, a) => sum + a.balance);
            return NxCard(
              margin: const EdgeInsets.only(bottom: 8),
              child: ExpansionTile(
                title: Text('${FinanceStatusHelpers.accountTypeLabel(type)} (${accounts.length})', style: const TextStyle(fontWeight: FontWeight.w600)),
                trailing: Text(FinanceStatusHelpers.formatCurrency(total), style: const TextStyle(fontWeight: FontWeight.bold)),
                children: accounts.map((a) => ListTile(
                  dense: true,
                  title: Text('${a.code} - ${a.name}', style: const TextStyle(fontSize: 13)),
                  trailing: Text(FinanceStatusHelpers.formatCurrency(a.balance), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                )).toList(),
              ),
            );
          }),
        ],
      ),
    );
  }

  void _showCreateJournalDialog() {
    final descCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Journal Entry'),
        content: TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description *')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx), child: const Text('Create')),
        ],
      ),
    );
  }

  void _showCreateAccountDialog() {
    final codeCtrl = TextEditingController();
    final nameCtrl = TextEditingController();
    AccountType type = AccountType.asset;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('New Account'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: codeCtrl, decoration: const InputDecoration(labelText: 'Account Code *')),
              const SizedBox(height: 12),
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Account Name *')),
              const SizedBox(height: 12),
              DropdownButtonFormField<AccountType>(
                value: type,
                decoration: const InputDecoration(labelText: 'Type'),
                items: AccountType.values.map((t) => DropdownMenuItem(value: t, child: Text(FinanceStatusHelpers.accountTypeLabel(t)))).toList(),
                onChanged: (v) => setDialogState(() => type = v!),
              ),
            ],
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
