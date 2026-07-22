import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/pos_models.dart';
import '../../providers/pos_provider.dart';

class SplitPaymentSheet extends ConsumerStatefulWidget {
  final PosProvider pos;
  const SplitPaymentSheet({super.key, required this.pos});

  @override
  ConsumerState<SplitPaymentSheet> createState() => _SplitPaymentSheetState();
}

class _SplitPaymentSheetState extends ConsumerState<SplitPaymentSheet> {
  final List<_SplitPaymentEntry> _entries = [];
  final _amountController = TextEditingController();
  final _referenceController = TextEditingController();
  PosPaymentMethod _selectedMethod = PosPaymentMethod.cash;

  @override
  void initState() {
    super.initState();
    final billing = widget.pos.state.billing;
    if (billing != null && billing.amountDue > 0) {
      _amountController.text = billing.amountDue.toStringAsFixed(2);
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _referenceController.dispose();
    super.dispose();
  }

  double get _totalEntered => _entries.fold(0.0, (s, e) => s + e.amount);
  double get _amountDue => widget.pos.state.billing?.amountDue ?? 0.0;
  double get _remainingDue => _amountDue - _totalEntered;

  bool get _canComplete => _remainingDue <= 0.01 && _entries.isNotEmpty;

  void _addEntry() {
    final amount = double.tryParse(_amountController.text) ?? 0;
    if (amount <= 0) return;
    if (amount > _remainingDue + 0.01) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Amount exceeds remaining due: ₹${_remainingDue.toStringAsFixed(2)}'), backgroundColor: AppColors.warning),
      );
      return;
    }

    setState(() {
      _entries.add(_SplitPaymentEntry(
        method: _selectedMethod,
        amount: amount,
        reference: _referenceController.text.isEmpty ? null : _referenceController.text,
      ));
      _amountController.clear();
      _referenceController.clear();
    });
  }

  void _removeEntry(int index) {
    setState(() => _entries.removeAt(index));
  }

  void _completePayments() {
    for (final entry in _entries) {
      widget.pos.addPayment(entry.method, entry.amount, reference: entry.reference);
    }
    Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final billing = widget.pos.state.billing;
    if (billing == null) return const SizedBox.shrink();

    return DraggableScrollableSheet(
      initialChildSize: 0.8,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (ctx, scrollController) => Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          controller: scrollController,
          children: [
            Center(
              child: Container(width: 40, height: 4,
                decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 16),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Split Payment', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _remainingDue <= 0 ? AppColors.success.withValues(alpha: 0.1) : cs.primaryContainer,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _remainingDue <= 0 ? 'Fully Paid' : 'Due: ₹${_remainingDue.toStringAsFixed(2)}',
                    style: GoogleFonts.inter(
                      fontSize: 12, fontWeight: FontWeight.w600,
                      color: _remainingDue <= 0 ? AppColors.success : cs.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('Total: ₹${billing.totalAmount.toStringAsFixed(2)}  |  Entered: ₹${_totalEntered.toStringAsFixed(2)}  |  Due: ₹${_amountDue.toStringAsFixed(2)}',
              style: GoogleFonts.inter(fontSize: 13, color: cs.outline)),
            const SizedBox(height: 16),

            if (_entries.isNotEmpty) ...[
              Text('Payments Added', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              ..._entries.asMap().entries.map((e) => _buildEntryTile(e.key, e.value, cs)),
              const SizedBox(height: 16),
            ],

            Text('Add Payment', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),

            Wrap(
              spacing: 6, runSpacing: 6,
              children: PosPaymentMethod.values.map((m) => ChoiceChip(
                label: Text(m.label, style: GoogleFonts.inter(fontSize: 11)),
                selected: _selectedMethod == m,
                onSelected: (_) => setState(() => _selectedMethod = m),
                avatar: Icon(m.icon, size: 14, color: m.color),
              )).toList(),
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _amountController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Amount',
                      prefixText: '₹ ',
                      hintText: 'Remaining: ₹${_remainingDue.toStringAsFixed(2)}',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                if (_selectedMethod != PosPaymentMethod.cash)
                  Expanded(
                    child: TextFormField(
                      controller: _referenceController,
                      decoration: InputDecoration(
                        labelText: 'Reference',
                        hintText: 'Transaction ID',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _addEntry,
                    icon: const Icon(Icons.add, size: 18),
                    label: Text('Add', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      foregroundColor: cs.primary,
                    ),
                  ),
                ),
                if (_canComplete) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _completePayments,
                      icon: const Icon(Icons.check, size: 18),
                      label: Text('Complete (${_entries.length})', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: AppColors.success,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEntryTile(int index, _SplitPaymentEntry entry, ColorScheme cs) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        dense: true,
        leading: CircleAvatar(
          radius: 18,
          backgroundColor: entry.method.color.withValues(alpha: 0.15),
          child: Icon(entry.method.icon, size: 18, color: entry.method.color),
        ),
        title: Text(entry.method.label, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        subtitle: entry.reference != null
            ? Text('Ref: ${entry.reference}', style: GoogleFonts.inter(fontSize: 11, color: cs.outline))
            : null,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('₹${entry.amount.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14)),
            IconButton(
              icon: Icon(Icons.remove_circle, size: 20, color: AppColors.danger),
              onPressed: () => _removeEntry(index),
              tooltip: 'Remove',
            ),
          ],
        ),
      ),
    );
  }
}

class _SplitPaymentEntry {
  final PosPaymentMethod method;
  final double amount;
  final String? reference;
  const _SplitPaymentEntry({required this.method, required this.amount, this.reference});
}