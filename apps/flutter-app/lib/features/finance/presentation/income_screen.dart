import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../data/finance_models.dart';

class IncomeScreen extends ConsumerStatefulWidget {
  const IncomeScreen({super.key});

  @override
  ConsumerState<IncomeScreen> createState() => _IncomeScreenState();
}

class _IncomeScreenState extends ConsumerState<IncomeScreen> {
  final _searchCtrl = TextEditingController();
  String? _categoryFilter;
  DateTimeRange? _dateRange;

  static const _categories = ['Dine In', 'Takeaway', 'Delivery', 'Online Order', 'Catering'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(financeProvider.notifier).loadIncome();
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
    await ref.read(financeProvider.notifier).loadIncome(
      startDate: start,
      endDate: end,
      category: _categoryFilter,
    );
  }

  Future<void> _showIncomeDialog({IncomeEntry? existing}) async {
    final nameCtrl = TextEditingController(text: existing?.description ?? '');
    final amountCtrl = TextEditingController(text: existing != null ? existing.amount.toString() : '');
    final dateCtrl = TextEditingController(
      text: existing != null ? DateFormat('yyyy-MM-dd').format(existing.date) : DateFormat('yyyy-MM-dd').format(DateTime.now()),
    );
    String category = existing?.category.name ?? 'dineIn';
    String method = existing?.paymentMethod.name ?? 'cash';
    final notesCtrl = TextEditingController(text: existing?.notes ?? '');

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(existing != null ? 'Edit Income' : 'Add Income'),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Description', prefixIcon: Icon(Icons.description, size: 20)),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amountCtrl,
                decoration: const InputDecoration(labelText: 'Amount (₹)', prefixIcon: Icon(Icons.currency_rupee, size: 20)),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: dateCtrl,
                decoration: const InputDecoration(labelText: 'Date', prefixIcon: Icon(Icons.calendar_today, size: 20), suffixIcon: Icon(Icons.date_range, size: 18)),
                readOnly: true,
                onTap: () async {
                  final picked = await showDatePicker(
                    context: ctx,
                    initialDate: DateTime.tryParse(dateCtrl.text) ?? DateTime.now(),
                    firstDate: DateTime(2020),
                    lastDate: DateTime(2030),
                  );
                  if (picked != null) dateCtrl.text = DateFormat('yyyy-MM-dd').format(picked);
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                key: ValueKey(category),
                initialValue: category,
                decoration: const InputDecoration(labelText: 'Category', prefixIcon: Icon(Icons.category, size: 20)),
                items: _categories.map((c) => DropdownMenuItem(value: c.toLowerCase().replaceAll(' ', ''), child: Text(c))).toList(),
                onChanged: (v) => setDialogState(() => category = v ?? 'dineIn'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                key: ValueKey(method),
                initialValue: method,
                decoration: const InputDecoration(labelText: 'Payment Method', prefixIcon: Icon(Icons.payment, size: 20)),
                items: ['cash', 'card', 'upi', 'googlePay', 'phonePe']
                    .map((m) => DropdownMenuItem(value: m, child: Text(m.toUpperCase())))
                    .toList(),
                onChanged: (v) => setDialogState(() => method = v ?? 'cash'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: notesCtrl,
                decoration: const InputDecoration(labelText: 'Notes', prefixIcon: Icon(Icons.notes, size: 20)),
                maxLines: 2,
              ),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final data = {
                  'description': nameCtrl.text,
                  'amount': double.tryParse(amountCtrl.text) ?? 0,
                  'date': dateCtrl.text,
                  'category': category,
                  'paymentMethod': method,
                  if (notesCtrl.text.isNotEmpty) 'notes': notesCtrl.text,
                };
                bool success;
                if (existing != null) {
                  success = await ref.read(financeProvider.notifier).updateIncomeEntry(existing.id, data);
                } else {
                  success = await ref.read(financeProvider.notifier).createIncomeEntry(data);
                }
                if (ctx.mounted) Navigator.pop(ctx, success);
              },
              child: Text(existing != null ? 'Update' : 'Add'),
            ),
          ],
        ),
      ),
    );
    if (saved == true) _loadData();
  }

  Future<void> _confirmDelete(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Income'),
        content: const Text('Are you sure you want to delete this income entry?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      final success = await ref.read(financeProvider.notifier).deleteIncomeEntry(id);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Income deleted'), backgroundColor: AppColors.success),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final finance = ref.watch(financeProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('Income', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.success,
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: () => _showIncomeDialog()),
        ],
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                TextField(
                  controller: _searchCtrl,
                  decoration: InputDecoration(
                    hintText: 'Search income...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onChanged: (_) => _loadData(),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 32,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          children: [
                            _buildFilterChip('All', null),
                            ..._categories.map((c) => _buildFilterChip(c, c.toLowerCase().replaceAll(' ', ''))),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    InkWell(
                      onTap: () async {
                        final picked = await showDateRangePicker(
                          context: context,
                          firstDate: DateTime(2020),
                          lastDate: DateTime.now(),
                          initialDateRange: _dateRange,
                        );
                        if (picked != null) {
                          setState(() => _dateRange = picked);
                          _loadData();
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        decoration: BoxDecoration(border: Border.all(color: AppColors.gray200), borderRadius: BorderRadius.circular(6)),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.date_range, size: 14, color: AppColors.gray500),
                            const SizedBox(width: 4),
                            Text(
                              _dateRange != null
                                  ? '${DateFormat('dd/MM').format(_dateRange!.start)}-${DateFormat('dd/MM').format(_dateRange!.end)}'
                                  : 'Filter',
                              style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (finance.incomeList.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              color: AppColors.success.withValues(alpha: 0.05),
              child: Row(
                children: [
                  const Icon(Icons.trending_up, size: 18, color: AppColors.success),
                  const SizedBox(width: 8),
                  Text(
                    'Total: ₹${finance.incomeList.fold<double>(0, (sum, i) => sum + i.amount).toStringAsFixed(2)}',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.success),
                  ),
                  const Spacer(),
                  Text('${finance.incomeList.length} entries', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                ],
              ),
            ),
          Expanded(
            child: finance.incomeLoading && finance.incomeList.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : finance.incomeList.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.trending_up, size: 48, color: AppColors.gray300),
                            const SizedBox(height: 8),
                            Text('No income entries', style: GoogleFonts.inter(color: AppColors.gray400)),
                            const SizedBox(height: 12),
                            ElevatedButton.icon(
                              onPressed: () => _showIncomeDialog(),
                              icon: const Icon(Icons.add, size: 18),
                              label: const Text('Add Income'),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: finance.incomeList.length,
                          itemBuilder: (ctx, i) => _buildIncomeCard(finance.incomeList[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String? filterValue) {
    final selected = _categoryFilter == filterValue;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(label, style: GoogleFonts.inter(fontSize: 11)),
        selected: selected,
        onSelected: (_) {
          setState(() => _categoryFilter = filterValue);
          _loadData();
        },
        selectedColor: AppColors.success.withValues(alpha: 0.15),
        checkmarkColor: AppColors.success,
        visualDensity: VisualDensity.compact,
      ),
    );
  }

  Widget _buildIncomeCard(IncomeEntry item) {
    final dateStr = DateFormat('dd MMM yyyy').format(item.date);
    final category = item.category.name;
    final description = item.description ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.trending_up, color: AppColors.success, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(description, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14)),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(4)),
                        child: Text(category, style: GoogleFonts.inter(fontSize: 10, color: AppColors.success, fontWeight: FontWeight.w500)),
                      ),
                      const SizedBox(width: 6),
                      Text(dateStr, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                    ],
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '₹${item.amount.toStringAsFixed(2)}',
                  style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.success),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InkWell(
                      onTap: () => _showIncomeDialog(existing: item),
                      child: Icon(Icons.edit, size: 16, color: AppColors.gray400),
                    ),
                    const SizedBox(width: 12),
                    InkWell(
                      onTap: () => _confirmDelete(item.id),
                      child: Icon(Icons.delete_outline, size: 16, color: AppColors.danger),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
