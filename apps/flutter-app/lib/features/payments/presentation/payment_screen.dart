import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';

class PaymentScreen extends StatefulWidget {
  final String orderId;
  const PaymentScreen({super.key, required this.orderId});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _api = ApiClient();
  Map<String, dynamic>? _paymentInfo;
  String _selectedMethod = 'CASH';
  bool _isLoading = true;
  bool _isProcessing = false;
  final _referenceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadPaymentInfo();
  }

  @override
  void dispose() {
    _referenceController.dispose();
    super.dispose();
  }

  Future<void> _loadPaymentInfo() async {
    setState(() => _isLoading = true);
    try {
      final info = await _api.getOrderPayments(widget.orderId);
      if (mounted) setState(() { _paymentInfo = info; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _processPayment() async {
    if (_paymentInfo == null) return;
    final remaining = (_paymentInfo!['remaining'] as num).toDouble();
    if (remaining <= 0) return;

    setState(() => _isProcessing = true);
    try {
      final result = await _api.processPayment(
        widget.orderId,
        method: _selectedMethod,
        amount: remaining,
        reference: _referenceController.text.isNotEmpty ? _referenceController.text : null,
      );
      // Generate invoice after successful payment
      String? invoiceNumber;
      try {
        final invoice = await _api.generateInvoice(result['id']);
        invoiceNumber = invoice['number'];
      } catch (_) {}
      if (mounted) {
        final msg = invoiceNumber != null
            ? 'Payment processed! Invoice: $invoiceNumber'
            : 'Payment processed successfully!';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: AppColors.success),
        );
        Navigator.pop(context, result);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: AppColors.danger),
        );
      }
    }
    if (mounted) setState(() => _isProcessing = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Payment', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _paymentInfo == null
              ? const Center(child: Text('Order not found'))
              : _buildPaymentContent(),
    );
  }

  Widget _buildPaymentContent() {
    final totalAmount = (_paymentInfo!['totalAmount'] as num).toDouble();
    final totalPaid = (_paymentInfo!['totalPaid'] as num).toDouble();
    final remaining = (_paymentInfo!['remaining'] as num).toDouble();

    final methods = [
      {'key': 'CASH', 'label': 'Cash', 'icon': Icons.money},
      {'key': 'UPI', 'label': 'UPI', 'icon': Icons.qr_code},
      {'key': 'CREDIT_CARD', 'label': 'Credit Card', 'icon': Icons.credit_card},
      {'key': 'DEBIT_CARD', 'label': 'Debit Card', 'icon': Icons.credit_card},
      {'key': 'NET_BANKING', 'label': 'Net Banking', 'icon': Icons.account_balance},
      {'key': 'WALLET', 'label': 'Wallet', 'icon': Icons.account_balance_wallet},
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Bill summary card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.gray200),
            ),
            child: Column(
              children: [
                Text('Bill Summary', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total Amount', style: GoogleFonts.inter(color: AppColors.gray600)),
                    Text('₹${totalAmount.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                ),
                if (totalPaid > 0) ...[
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Already Paid', style: GoogleFonts.inter(color: AppColors.success)),
                      Text('-₹${totalPaid.toStringAsFixed(2)}', style: GoogleFonts.inter(color: AppColors.success)),
                    ],
                  ),
                ],
                const Divider(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Amount Due', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
                    Text('₹${remaining.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 20, color: AppColors.primary)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Payment method selector
          Text('Select Payment Method', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              childAspectRatio: 1.4,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemCount: methods.length,
            itemBuilder: (ctx, i) {
              final method = methods[i];
              final isSelected = _selectedMethod == method['key'];
              return InkWell(
                onTap: () => setState(() => _selectedMethod = method['key'] as String),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : AppColors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.gray200,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(method['icon'] as IconData, color: isSelected ? AppColors.primary : AppColors.gray500, size: 24),
                      const SizedBox(height: 4),
                      Text(method['label'] as String, style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                        color: isSelected ? AppColors.primary : AppColors.gray600,
                      )),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 20),
          // Reference field
          TextField(
            controller: _referenceController,
            decoration: InputDecoration(
              labelText: 'Reference / Transaction ID (optional)',
              prefixIcon: const Icon(Icons.receipt, size: 20),
            ),
          ),
          const SizedBox(height: 24),
          // Process payment button
          SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: _isProcessing ? null : _processPayment,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                foregroundColor: AppColors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: _isProcessing
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text('Pay ₹${remaining.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
          // Previous payments
          if ((_paymentInfo!['payments'] as List).isNotEmpty) ...[
            const SizedBox(height: 24),
            Text('Previous Payments', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ...(_paymentInfo!['payments'] as List).map((p) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                backgroundColor: p['status'] == 'COMPLETED' ? AppColors.success.withValues(alpha: 0.15) : AppColors.danger.withValues(alpha: 0.15),
                child: Icon(
                  p['status'] == 'COMPLETED' ? Icons.check : Icons.close,
                  color: p['status'] == 'COMPLETED' ? AppColors.success : AppColors.danger,
                  size: 18,
                ),
              ),
              title: Text('₹${double.tryParse(p['amount'].toString())?.toStringAsFixed(2) ?? '0'} - ${p['method']}', style: GoogleFonts.inter(fontSize: 14)),
              subtitle: Text(p['status'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
            )),
          ],
        ],
      ),
    );
  }
}
