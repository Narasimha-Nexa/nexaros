import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/riverpod_providers.dart';

/// Result from the discount bottom sheet
class DiscountResult {
  final String type; // 'coupon', 'percentage', 'fixed', 'none'
  final double amount;
  final String? code;
  final String? description;

  const DiscountResult({
    required this.type,
    required this.amount,
    this.code,
    this.description,
  });
}

/// Shows a modal bottom sheet for applying discounts to an order
Future<DiscountResult?> showDiscountBottomSheet(
  BuildContext context, {
  required double orderTotal,
}) {
  return showModalBottomSheet<DiscountResult>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => _DiscountSheetContent(orderTotal: orderTotal),
  );
}

class _DiscountSheetContent extends ConsumerStatefulWidget {
  final double orderTotal;
  const _DiscountSheetContent({required this.orderTotal});

  @override
  ConsumerState<_DiscountSheetContent> createState() => _DiscountSheetContentView();
}

class _DiscountSheetContentView extends ConsumerState<_DiscountSheetContent> {
  final _couponCtrl = TextEditingController();
  bool _validatingCoupon = false;

  // Preset discount
  double _customPercent = 0;
  double _customAmount = 0;
  String _selectedTab = 'percent'; // 'percent', 'fixed', 'coupon'

  @override
  void dispose() {
    _couponCtrl.dispose();
    super.dispose();
  }

  Future<void> _validateCoupon() async {
    if (_couponCtrl.text.trim().isEmpty) return;
    setState(() => _validatingCoupon = true);

    final offers = ref.read(offersProvider.notifier);
    final valid = await offers.validateCoupon(
      _couponCtrl.text.trim(),
      orderAmount: widget.orderTotal,
    );

    setState(() => _validatingCoupon = false);
    if (valid && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Coupon applied!'), backgroundColor: AppColors.success),
      );
    }
  }

  void _applyDiscount() {
    final offers = ref.read(offersProvider.notifier);
    final discount = offers.validatedDiscount;
    double amount = 0;
    String type = 'none';
    String? code;

    if (_selectedTab == 'coupon' && discount != null) {
      amount = offers.calculateDiscount(widget.orderTotal);
      type = 'coupon';
      code = _couponCtrl.text.trim().toUpperCase();
    } else if (_selectedTab == 'percent' && _customPercent > 0) {
      amount = widget.orderTotal * _customPercent / 100;
      type = 'percentage';
    } else if (_selectedTab == 'fixed' && _customAmount > 0) {
      amount = _customAmount > widget.orderTotal ? widget.orderTotal : _customAmount;
      type = 'fixed';
    }

    Navigator.pop(context, DiscountResult(
      type: type,
      amount: amount,
      code: code,
      description: type == 'coupon'
          ? 'Coupon $code applied'
          : type == 'percentage'
              ? '${_customPercent.toStringAsFixed(0)}% off'
              : '₹${amount.toStringAsFixed(0)} off',
    ));
  }

  @override
  Widget build(BuildContext context) {
    final offers = ref.watch(offersProvider);
    final discount = offers.validatedDiscount;
    final hasDiscount = discount?['valid'] == true;

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.5,
      maxChildSize: 0.9,
      builder: (ctx, scrollCtrl) => Container(
        padding: const EdgeInsets.all(16),
        child: ListView(
          controller: scrollCtrl,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.gray300, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),
            Text('Add Discount', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Order Total: ₹${widget.orderTotal.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 14, color: AppColors.gray500)),
            const SizedBox(height: 20),

            // Discount method tabs
            Row(
              children: [
                _tabButton('Percentage', 'percent', Icons.percent),
                const SizedBox(width: 8),
                _tabButton('Fixed Amount', 'fixed', Icons.currency_rupee),
                const SizedBox(width: 8),
                _tabButton('Coupon Code', 'coupon', Icons.local_offer),
              ],
            ),
            const SizedBox(height: 20),

            // Tab content
            if (_selectedTab == 'percent') ...[
              Text('Select Discount %', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [5, 10, 15, 20, 25, 30, 40, 50].map((pct) {
                  final selected = _customPercent == pct;
                  return GestureDetector(
                    onTap: () => setState(() => _customPercent = selected ? 0 : pct.toDouble()),
                    child: Container(
                      width: 70,
                      height: 50,
                      decoration: BoxDecoration(
                        color: selected ? AppColors.primary : AppColors.gray50,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: selected ? AppColors.primary : AppColors.gray200, width: selected ? 2 : 1),
                      ),
                      child: Center(
                        child: Text(
                          '$pct%',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: selected ? Colors.white : AppColors.gray700,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              if (_customPercent > 0) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.discount, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text('Discount: ₹${(widget.orderTotal * _customPercent / 100).toStringAsFixed(2)}',
                          style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ],

            if (_selectedTab == 'fixed') ...[
              Text('Enter Fixed Amount', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
              const SizedBox(height: 12),
              TextField(
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  prefixText: '₹ ',
                  hintText: 'Enter discount amount',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onChanged: (v) => setState(() => _customAmount = double.tryParse(v) ?? 0),
              ),
              if (_customAmount > 0) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.discount, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text('Discount: ₹${_customAmount.toStringAsFixed(2)}',
                          style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ],

            if (_selectedTab == 'coupon') ...[
              Text('Enter Coupon Code', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _couponCtrl,
                      decoration: InputDecoration(
                        hintText: 'Enter code',
                        prefixIcon: const Icon(Icons.local_offer, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        suffixIcon: offers.discountError != null
                            ? IconButton(
                                icon: const Icon(Icons.close, size: 18, color: AppColors.danger),
                                onPressed: () => offers.clearDiscount(),
                              )
                            : null,
                      ),
                      textCapitalization: TextCapitalization.characters,
                      onSubmitted: (_) => _validateCoupon(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _validatingCoupon ? null : _validateCoupon,
                    child: _validatingCoupon
                        ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Apply'),
                  ),
                ],
              ),
              if (offers.discountError != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: AppColors.danger.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(6)),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, size: 16, color: AppColors.danger),
                      const SizedBox(width: 6),
                      Expanded(child: Text(offers.discountError!, style: GoogleFonts.inter(fontSize: 12, color: AppColors.danger))),
                    ],
                  ),
                ),
              ],
              if (hasDiscount) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(6)),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, size: 16, color: AppColors.success),
                      const SizedBox(width: 6),
                      Expanded(child: Text(
                        '${discount!['code'] ?? _couponCtrl.text}: ${discount['type'] == 'PERCENTAGE' ? '${discount['value']}% off' : '₹${discount['value']} off'}',
                        style: GoogleFonts.inter(fontSize: 12, color: AppColors.success, fontWeight: FontWeight.w600),
                      )),
                      IconButton(
                        icon: const Icon(Icons.close, size: 16, color: AppColors.success),
                        onPressed: () => offers.clearDiscount(),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.info.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(8)),
                  child: Row(
                    children: [
                      const Icon(Icons.discount, color: AppColors.info),
                      const SizedBox(width: 8),
                      Text('Discount: ₹${offers.calculateDiscount(widget.orderTotal).toStringAsFixed(2)}',
                          style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ],

            const SizedBox(height: 24),

            // Apply button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _hasDiscount() ? _applyDiscount : null,
                icon: const Icon(Icons.check, size: 20),
                label: Text('Apply Discount', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),

            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: OutlinedButton(
                onPressed: () {
                  offers.clearDiscount();
                  Navigator.pop(context);
                },
                child: const Text('Cancel'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tabButton(String label, String tab, IconData icon) {
    final selected = _selectedTab == tab;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = tab),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : AppColors.gray50,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: selected ? AppColors.primary : AppColors.gray200, width: selected ? 2 : 1),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 22, color: selected ? Colors.white : AppColors.gray500),
              const SizedBox(height: 4),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: selected ? Colors.white : AppColors.gray500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool _hasDiscount() {
    if (_selectedTab == 'coupon') return ref.read(offersProvider).validatedDiscount?['valid'] == true;
    if (_selectedTab == 'percent') return _customPercent > 0;
    if (_selectedTab == 'fixed') return _customAmount > 0;
    return false;
  }
}
