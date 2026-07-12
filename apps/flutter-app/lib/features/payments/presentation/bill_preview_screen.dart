import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../payments/presentation/payment_screen.dart';

class BillPreviewScreen extends StatefulWidget {
  final String orderId;
  const BillPreviewScreen({super.key, required this.orderId});

  @override
  State<BillPreviewScreen> createState() => _BillPreviewScreenState();
}

class _BillPreviewScreenState extends State<BillPreviewScreen> {
  final _api = ApiClient();
  Map<String, dynamic>? _order;
  Map<String, dynamic>? _paymentInfo;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBill();
  }

  Future<void> _loadBill() async {
    setState(() => _isLoading = true);
    try {
      final order = await _api.getOrder(widget.orderId);
      final paymentInfo = await _api.getOrderPayments(widget.orderId);
      if (mounted) {
        setState(() {
          _order = order;
          _paymentInfo = paymentInfo;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Bill Preview', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _order == null
              ? const Center(child: Text('Order not found'))
              : _buildBillContent(),
    );
  }

  Widget _buildBillContent() {
    final order = _order!;
    final items = order['items'] as List<dynamic>? ?? [];
    final subtotal = double.tryParse(order['subtotal'].toString()) ?? 0;
    final taxAmount = double.tryParse(order['taxAmount'].toString()) ?? 0;
    final discount = double.tryParse(order['discountAmount'].toString()) ?? 0;
    final totalAmount = double.tryParse(order['totalAmount'].toString()) ?? 0;
    final remaining = _paymentInfo?['remaining'] ?? totalAmount;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Bill card
          Container(
            width: double.infinity,
            constraints: const BoxConstraints(maxWidth: 500),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.gray200),
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Center(
                  child: Column(
                    children: [
                      const Icon(Icons.restaurant, size: 32, color: AppColors.primary),
                      const SizedBox(height: 4),
                      Text(order['branch']?['tenant']?['name'] ?? 'Restaurant', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
                      Text(order['branch']?['name'] ?? 'Branch', style: GoogleFonts.inter(color: AppColors.gray500, fontSize: 12)),
                    ],
                  ),
                ),
                const Divider(height: 24),
                // Order info
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Order #${order['orderNumber']}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    Text(order['type'].toString().replaceAll('_', ' '), style: GoogleFonts.inter(color: AppColors.gray500, fontSize: 12)),
                  ],
                ),
                if (order['table'] != null)
                  Text('Table ${order['table']['number']}', style: GoogleFonts.inter(color: AppColors.gray500, fontSize: 12)),
                const SizedBox(height: 12),
                // Items header
                Row(
                  children: [
                    Expanded(flex: 4, child: Text('Item', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.gray500))),
                    Expanded(flex: 1, child: Text('Qty', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.gray500), textAlign: TextAlign.center)),
                    Expanded(flex: 2, child: Text('Rate', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.gray500), textAlign: TextAlign.right)),
                    Expanded(flex: 2, child: Text('Amount', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.gray500), textAlign: TextAlign.right)),
                  ],
                ),
                const Divider(height: 12),
                // Items
                ...items.map((item) {
                  final unitPrice = double.tryParse(item['unitPrice'].toString()) ?? 0;
                  final totalPrice = double.tryParse(item['totalPrice'].toString()) ?? 0;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 4,
                          child: Text(item['name'] ?? item['menuItem']?['name'] ?? '', style: GoogleFonts.inter(fontSize: 13)),
                        ),
                        Expanded(
                          flex: 1,
                          child: Text('${item['quantity']}', style: GoogleFonts.inter(fontSize: 13), textAlign: TextAlign.center),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text('₹${unitPrice.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray600), textAlign: TextAlign.right),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text('₹${totalPrice.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500), textAlign: TextAlign.right),
                        ),
                      ],
                    ),
                  );
                }),
                const Divider(height: 20),
                // Totals
                _billRow('Subtotal', '₹${subtotal.toStringAsFixed(2)}'),
                const SizedBox(height: 4),
                if (taxAmount > 0) ...[
                  _billRow('CGST (2.5%)', '₹${(taxAmount / 2).toStringAsFixed(2)}'),
                  _billRow('SGST (2.5%)', '₹${(taxAmount / 2).toStringAsFixed(2)}'),
                ],
                if (discount > 0) ...[
                  const SizedBox(height: 4),
                  _billRow('Discount', '-₹${discount.toStringAsFixed(2)}', color: AppColors.danger),
                ],
                const Divider(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
                    Text('₹${totalAmount.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primary)),
                  ],
                ),
                if (remaining > 0) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Amount Due', style: GoogleFonts.inter(fontSize: 13, color: AppColors.warning)),
                        Text('₹${remaining.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.warning)),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Center(
                  child: Text('Thank you for dining with us!', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray400)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Pay button
          if (remaining > 0)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  await Navigator.push(context, MaterialPageRoute(builder: (_) => PaymentScreen(orderId: widget.orderId)));
                  _loadBill();
                },
                icon: const Icon(Icons.payment, size: 20),
                label: Text('Make Payment', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _billRow(String label, String value, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 13, color: color ?? AppColors.gray600)),
        Text(value, style: GoogleFonts.inter(fontSize: 13, color: color)),
      ],
    );
  }
}
