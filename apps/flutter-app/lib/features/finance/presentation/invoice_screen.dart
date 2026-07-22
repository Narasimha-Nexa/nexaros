import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../data/finance_models.dart';

class InvoiceScreen extends ConsumerStatefulWidget {
  const InvoiceScreen({super.key});

  @override
  ConsumerState<InvoiceScreen> createState() => _InvoiceScreenState();
}

class _InvoiceScreenState extends ConsumerState<InvoiceScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(financeProvider.notifier).loadInvoices();
    });
  }

  Future<void> _showGenerateDialog() async {
    final paymentIdCtrl = TextEditingController();
    final generated = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Generate Invoice'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enter the payment ID to generate an invoice for.'),
            const SizedBox(height: 12),
            TextField(controller: paymentIdCtrl, decoration: const InputDecoration(labelText: 'Payment ID', prefixIcon: Icon(Icons.payment, size: 20))),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (paymentIdCtrl.text.isEmpty) return;
              final success = await ref.read(financeProvider.notifier).generateInvoiceEntry(paymentIdCtrl.text);
              if (ctx.mounted) Navigator.pop(ctx, success);
            },
            child: const Text('Generate'),
          ),
        ],
      ),
    );
    if (generated == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invoice generated!'), backgroundColor: AppColors.success));
    }
  }

  Future<void> _showInvoiceDetail(Invoice invoice) async {
    await ref.read(financeProvider.notifier).selectInvoice(invoice.id);
    if (!mounted) return;
    showModalBottomSheet(context: context, isScrollControlled: true, builder: (_) => _InvoiceDetailSheet(invoice: invoice));
  }

  @override
  Widget build(BuildContext context) {
    final finance = ref.watch(financeProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('Invoices', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.info, foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.add), tooltip: 'Generate Invoice', onPressed: _showGenerateDialog),
          IconButton(icon: const Icon(Icons.refresh), onPressed: () => finance.loadInvoices()),
        ],
      ),
      body: finance.invoicesLoading && finance.invoices.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : finance.invoices.isEmpty
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.description, size: 64, color: AppColors.gray300),
                  const SizedBox(height: 12), Text('No invoices', style: GoogleFonts.inter(fontSize: 16, color: AppColors.gray500)),
                  const SizedBox(height: 8), Text('Generate invoices from completed payments', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray400)),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(onPressed: _showGenerateDialog, icon: const Icon(Icons.add, size: 18), label: const Text('Generate Invoice')),
                ]))
              : RefreshIndicator(
                  onRefresh: () async => finance.loadInvoices(),
                  child: ListView.builder(padding: const EdgeInsets.all(12), itemCount: finance.invoices.length, itemBuilder: (ctx, i) => _buildInvoiceCard(finance.invoices[i])),
                ),
    );
  }

  Widget _buildInvoiceCard(Invoice invoice) {
    final dateStr = DateFormat('dd MMM yyyy, HH:mm').format(invoice.createdAt);
    final method = invoice.paymentMethod?.name.toUpperCase() ?? 'N/A';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => _showInvoiceDetail(invoice),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.info.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.description, color: AppColors.info, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(invoice.invoiceNumber.isNotEmpty ? invoice.invoiceNumber : 'INV-${invoice.id.length > 6 ? invoice.id.substring(0, 6) : invoice.id}',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 4),
                    Row(children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(4)),
                        child: Text(method, style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
                      ),
                      if (invoice.orderNumber != null) ...[
                        const SizedBox(width: 6),
                        Text('Order #${invoice.orderNumber}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                      ],
                    ]),
                    const SizedBox(height: 2),
                    Text(dateStr, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('₹${invoice.total.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.info)),
                  const SizedBox(height: 4),
                  Icon(Icons.chevron_right, size: 18, color: AppColors.gray400),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InvoiceDetailSheet extends StatelessWidget {
  final Invoice invoice;
  const _InvoiceDetailSheet({required this.invoice});

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('dd MMM yyyy').format(invoice.invoiceDate);

    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      builder: (ctx, scrollCtrl) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(borderRadius: BorderRadius.vertical(top: Radius.circular(20)), color: Colors.white),
        child: ListView(
          controller: scrollCtrl,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.gray300, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('TAX INVOICE', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.gray800)),
                const SizedBox(height: 4),
                Text(invoice.invoiceNumber, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.info)),
                Text('Date: $dateStr', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
              ])),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.info.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.description, color: AppColors.info, size: 32),
              ),
            ]),
            const Divider(height: 24),
            if (invoice.customerName != null) ...[
              Text(invoice.customerName!, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15)),
              if (invoice.customerPhone != null) Text(invoice.customerPhone!, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
            ],
            if (invoice.branchName != null) ...[
              const SizedBox(height: 4),
              Text(invoice.branchName!, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
            ],
            const Divider(height: 16),
            if (invoice.orderNumber != null) ...[
              Row(children: [
                Text('Order #${invoice.orderNumber}', style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13)),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(4)),
                  child: Text(invoice.status.name.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
                ),
              ]),
            ],
            const Divider(height: 16),
            Text('Items', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 8),
            ...invoice.items.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(children: [
                if (item.isVeg)
                  Container(width: 10, height: 10, margin: const EdgeInsets.only(right: 8), decoration: BoxDecoration(border: Border.all(color: AppColors.success, width: 1.5), borderRadius: BorderRadius.circular(2)),
                    child: Center(child: Container(width: 4, height: 4, decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle))))
                else
                  Container(width: 10, height: 10, margin: const EdgeInsets.only(right: 8), decoration: BoxDecoration(border: Border.all(color: AppColors.danger, width: 1.5), borderRadius: BorderRadius.circular(2)),
                    child: Center(child: Container(width: 4, height: 4, decoration: const BoxDecoration(color: AppColors.danger, shape: BoxShape.circle)))),
                Expanded(child: Text('${item.quantity}x ${item.name}', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray700))),
                Text('₹${item.total.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
              ]),
            )),
            const Divider(height: 16),
            _totalRow('Subtotal', '₹${invoice.subtotal.toStringAsFixed(2)}', AppColors.gray700),
            if (invoice.taxAmount > 0) ...[
              const SizedBox(height: 4),
              _totalRow('Tax', '₹${invoice.taxAmount.toStringAsFixed(2)}', AppColors.warning),
            ],
            if (invoice.discount > 0) ...[
              const SizedBox(height: 4),
              _totalRow('Discount', '-₹${invoice.discount.toStringAsFixed(2)}', AppColors.danger),
            ],
            const Divider(),
            _totalRow('Total Amount', '₹${invoice.total.toStringAsFixed(2)}', AppColors.success),
            _totalRow('Amount Paid', '₹${invoice.amountPaid.toStringAsFixed(2)}', AppColors.success),
            if (invoice.amountDue > 0) _totalRow('Amount Due', '₹${invoice.amountDue.toStringAsFixed(2)}', AppColors.danger),
            const SizedBox(height: 20),
            Center(
              child: SizedBox(
                width: double.infinity, height: 44,
                child: OutlinedButton.icon(
                  onPressed: () { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('PDF download coming soon'), backgroundColor: AppColors.info)); },
                  icon: const Icon(Icons.download, size: 18), label: const Text('Download PDF'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _totalRow(String label, String value, Color valueColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray600)),
        Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: valueColor)),
      ]),
    );
  }
}
