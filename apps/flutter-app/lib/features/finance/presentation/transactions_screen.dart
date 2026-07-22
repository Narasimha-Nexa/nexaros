import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../data/finance_models.dart';

class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  final _searchCtrl = TextEditingController();
  String? _typeFilter;
  DateTimeRange? _dateRange;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(financeProvider.notifier).loadTransactions();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final start = _dateRange != null ? DateFormat('yyyy-MM-dd').format(_dateRange!.start) : null;
    final end = _dateRange != null ? DateFormat('yyyy-MM-dd').format(_dateRange!.end) : null;
    await ref.read(financeProvider.notifier).loadTransactions(
      startDate: start, endDate: end, type: _typeFilter,
      search: _searchCtrl.text.isEmpty ? null : _searchCtrl.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    final finance = ref.watch(financeProvider);
    final transactions = finance.transactions;

    double totalIncome = 0, totalExpenses = 0;
    for (final t in transactions) {
      if (t.isCredit) {
        totalIncome += t.amount.abs();
      } else {
        totalExpenses += t.amount.abs();
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Transactions', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary, foregroundColor: Colors.white,
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData)],
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white, padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                TextField(
                  controller: _searchCtrl,
                  decoration: InputDecoration(
                    hintText: 'Search transactions...', prefixIcon: const Icon(Icons.search, size: 20), isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    suffixIcon: _searchCtrl.text.isNotEmpty ? IconButton(icon: const Icon(Icons.clear, size: 18), onPressed: () { _searchCtrl.clear(); _loadData(); }) : null,
                  ),
                  onSubmitted: (_) => _loadData(),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: SizedBox(height: 32, child: ListView(scrollDirection: Axis.horizontal, children: [
                        _filterChip('All', null, AppColors.primary),
                        _filterChip('Income', 'income', AppColors.success),
                        _filterChip('Expense', 'expense', AppColors.danger),
                      ])),
                    ),
                    const SizedBox(width: 8),
                    InkWell(
                      onTap: () async {
                        final picked = await showDateRangePicker(context: context, firstDate: DateTime(2020), lastDate: DateTime.now(), initialDateRange: _dateRange);
                        if (picked != null) { setState(() => _dateRange = picked); _loadData(); }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        decoration: BoxDecoration(border: Border.all(color: AppColors.gray200), borderRadius: BorderRadius.circular(6)),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(Icons.date_range, size: 14, color: _dateRange != null ? AppColors.primary : AppColors.gray500),
                          const SizedBox(width: 4),
                          Text(_dateRange != null ? '${DateFormat('dd/MM').format(_dateRange!.start)}-${DateFormat('dd/MM').format(_dateRange!.end)}' : 'Date',
                            style: GoogleFonts.inter(fontSize: 11, color: _dateRange != null ? AppColors.primary : AppColors.gray500)),
                          if (_dateRange != null) ...[
                            const SizedBox(width: 4),
                            InkWell(onTap: () { setState(() => _dateRange = null); _loadData(); }, child: Icon(Icons.close, size: 12, color: AppColors.gray400)),
                          ],
                        ]),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            width: double.infinity, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(color: Colors.white, border: Border(bottom: BorderSide(color: AppColors.gray200))),
            child: Row(children: [
              _summaryBadge(Icons.trending_up, 'Income', '₹${totalIncome.toStringAsFixed(0)}', AppColors.success),
              const SizedBox(width: 16),
              _summaryBadge(Icons.trending_down, 'Expenses', '₹${totalExpenses.toStringAsFixed(0)}', AppColors.danger),
              const Spacer(),
              Text('${transactions.length} entries', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
            ]),
          ),
          Expanded(
            child: finance.transactionsLoading && finance.transactions.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : transactions.isEmpty
                    ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.receipt_long, size: 48, color: AppColors.gray300),
                        const SizedBox(height: 8), Text('No transactions found', style: GoogleFonts.inter(color: AppColors.gray400)),
                      ]))
                    : RefreshIndicator(onRefresh: _loadData, child: ListView.builder(padding: const EdgeInsets.all(12), itemCount: transactions.length, itemBuilder: (ctx, i) => _buildTransactionCard(transactions[i]))),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String label, String? value, Color color) {
    final selected = _typeFilter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(label, style: GoogleFonts.inter(fontSize: 11)), selected: selected,
        onSelected: (_) { setState(() => _typeFilter = selected ? null : value); _loadData(); },
        selectedColor: color.withValues(alpha: 0.12), checkmarkColor: color, visualDensity: VisualDensity.compact,
      ),
    );
  }

  Widget _summaryBadge(IconData icon, String label, String value, Color color) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 14, color: color), const SizedBox(width: 4),
      Text('$label: ', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
      Text(value, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
    ]);
  }

  Widget _buildTransactionCard(FinanceTransaction tx) {
    final isIncome = tx.isCredit;
    final amount = tx.amount.abs();
    final dateStr = DateFormat('dd MMM yyyy, HH:mm').format(tx.date);
    final category = tx.category ?? tx.type.name;

    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                color: isIncome ? AppColors.success.withValues(alpha: 0.1) : AppColors.danger.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(isIncome ? Icons.arrow_downward : Icons.arrow_upward, color: isIncome ? AppColors.success : AppColors.danger, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(tx.description ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13)),
                  const SizedBox(height: 2),
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: isIncome ? AppColors.success.withValues(alpha: 0.08) : AppColors.danger.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(3),
                      ),
                      child: Text(category, style: GoogleFonts.inter(fontSize: 9, color: isIncome ? AppColors.success : AppColors.danger, fontWeight: FontWeight.w500)),
                    ),
                    if (tx.referenceId != null && tx.referenceId!.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Text(tx.referenceId!, style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray400)),
                    ],
                  ]),
                  Text(dateStr, style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray400)),
                ],
              ),
            ),
            Text(
              '${isIncome ? '+' : '-'}₹${amount.toStringAsFixed(2)}',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: isIncome ? AppColors.success : AppColors.danger),
            ),
          ],
        ),
      ),
    );
  }
}
