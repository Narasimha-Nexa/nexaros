import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../data/pos_models.dart';

class RefundScreen extends ConsumerStatefulWidget {
  final String orderId;
  final String? orderNumber;
  final double maxRefundAmount;
  const RefundScreen({super.key, required this.orderId, this.orderNumber, this.maxRefundAmount = 0});
  @override
  ConsumerState<RefundScreen> createState() => _RefundScreenState();
}

class _RefundScreenState extends ConsumerState<RefundScreen> {
  final _amountController = TextEditingController();
  final _reasonController = TextEditingController();
  RefundReason _selectedReason = RefundReason.customerRequest;
  bool _isFullRefund = true;

  @override
  void initState() {
    super.initState();
    if (widget.maxRefundAmount > 0) {
      _amountController.text = widget.maxRefundAmount.toStringAsFixed(0);
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text('Process Refund', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        backgroundColor: cs.surface,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Order Info
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.receipt_long, color: AppColors.primary, size: 20),
                      const SizedBox(width: 8),
                      Text('Order #${widget.orderNumber ?? widget.orderId}',
                        style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Maximum refund: ₹${widget.maxRefundAmount.toStringAsFixed(0)}',
                    style: GoogleFonts.inter(fontSize: 13, color: cs.outline)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Refund Type
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Refund Type', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  SegmentedButton<bool>(
                    segments: const [
                      ButtonSegment(value: true, label: Text('Full Refund'), icon: Icon(Icons.money_off)),
                      ButtonSegment(value: false, label: Text('Partial'), icon: Icon(Icons.monetization_on)),
                    ],
                    selected: {_isFullRefund},
                    onSelectionChanged: (v) => setState(() {
                      _isFullRefund = v.first;
                      if (_isFullRefund) _amountController.text = widget.maxRefundAmount.toStringAsFixed(0);
                    }),
                  ),
                  if (!_isFullRefund) ...[
                    const SizedBox(height: 12),
                    TextField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Refund Amount',
                        prefixText: '₹ ',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Reason
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Reason', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<RefundReason>(
                    initialValue: _selectedReason,
                    items: RefundReason.values.map((r) => DropdownMenuItem(value: r, child: Text(r.label))).toList(),
                    onChanged: (v) => setState(() => _selectedReason = v!),
                    decoration: InputDecoration(
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _reasonController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Additional notes (optional)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Submit
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _processRefund,
              icon: const Icon(Icons.money_off, size: 18),
              label: Text(
                'Process Refund  •  ₹${_amountController.text.isEmpty ? '0' : _amountController.text}',
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                backgroundColor: AppColors.danger,
                foregroundColor: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _processRefund() async {
    final amount = double.tryParse(_amountController.text) ?? 0;
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid refund amount'), backgroundColor: AppColors.danger),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Refund'),
        content: Text('Process refund of ₹${amount.toStringAsFixed(0)}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger, foregroundColor: Colors.white),
            child: const Text('Refund'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final pos = ref.read(posProvider.notifier);
    final result = await pos.processRefund(
      orderId: widget.orderId,
      amount: amount,
      reason: _reasonController.text.isEmpty ? _selectedReason.label : _reasonController.text,
      reasonType: _selectedReason,
    );

    if (mounted) {
      if (result.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Refund processed successfully'), backgroundColor: AppColors.success),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.error ?? 'Refund failed'), backgroundColor: AppColors.danger),
        );
      }
    }
  }
}
