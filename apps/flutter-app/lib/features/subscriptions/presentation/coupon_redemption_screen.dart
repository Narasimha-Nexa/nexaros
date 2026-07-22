import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/razorpay_service.dart';
import '../../../shared/widgets/shared_widgets.dart';

class CouponRedemptionScreen extends ConsumerStatefulWidget {
  final String planId;
  final String planName;
  final double planPrice;

  const CouponRedemptionScreen({
    super.key,
    required this.planId,
    required this.planName,
    required this.planPrice,
  });

  @override
  ConsumerState<CouponRedemptionScreen> createState() => _CouponRedemptionScreenState();
}

class _CouponRedemptionScreenState extends ConsumerState<CouponRedemptionScreen> {
  final _couponController = TextEditingController();
  bool _isValidating = false;
  bool _isCheckingOut = false;
  Map<String, dynamic>? _couponResult;
  String? _couponError;
  double _finalPrice = 0;

  @override
  void initState() {
    super.initState();
    _finalPrice = widget.planPrice;
  }

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _validateCoupon() async {
    if (_couponController.text.trim().isEmpty) return;

    setState(() {
      _isValidating = true;
      _couponError = null;
      _couponResult = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      final tenantId = api.branchId ?? '';
      final result = await api.requestWithRetry(
        () => api.validateCouponRaw(_couponController.text.trim(), tenantId),
      );

      if (mounted) {
        setState(() {
          _couponResult = result;
          if (result['discount'] != null) {
            _finalPrice = widget.planPrice - (result['discount'] as num).toDouble();
            if (_finalPrice < 0) _finalPrice = 0;
          } else if (result['value'] != null) {
            if (result['type'] == 'PERCENTAGE') {
              _finalPrice = widget.planPrice * (1 - (result['value'] as num).toDouble() / 100);
            } else {
              _finalPrice = widget.planPrice - (result['value'] as num).toDouble();
            }
            if (_finalPrice < 0) _finalPrice = 0;
          }
          _isValidating = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _couponError = e.toString().replaceAll('Exception: ', '');
          _isValidating = false;
        });
      }
    }
  }

  void _removeCoupon() {
    setState(() {
      _couponController.clear();
      _couponResult = null;
      _couponError = null;
      _finalPrice = widget.planPrice;
    });
  }

  Future<void> _proceedCheckout() async {
    setState(() => _isCheckingOut = true);

    try {
      final api = ref.read(apiClientProvider);
      final tenantId = api.branchId ?? '';
      final couponCode = _couponResult != null ? _couponController.text.trim() : null;

      final razorpay = RazorpayService(
        keyId: const String.fromEnvironment('RAZORPAY_KEY_ID', defaultValue: 'rzp_test_demo'),
      );

      final result = await razorpay.checkoutAndVerify(
        tenantId: tenantId,
        planId: widget.planId,
        couponCode: couponCode,
        prefillName: '',
        prefillEmail: '',
        prefillContact: '',
      );

      if (mounted) {
        if (result != null && result['success'] == true) {
          _showCheckoutResult(result);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Payment cancelled or failed'), backgroundColor: AppColors.warning),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Checkout failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isCheckingOut = false);
    }
  }

  void _showCheckoutResult(Map<String, dynamic> result) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(result['freeTrial'] == true ? 'Free Plan Activated!' : 'Payment Successful!', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (result['freeTrial'] == true)
              Text('Your free plan has been activated. No payment required.', style: GoogleFonts.inter(fontSize: 14))
            else ...[
              Text('Order ID: ${result['orderId'] ?? 'N/A'}', style: GoogleFonts.inter(fontSize: 13)),
              const SizedBox(height: 8),
              Text('Amount: ₹${_finalPrice.toStringAsFixed(0)}/month',
                  style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primary)),
            ],
            const SizedBox(height: 12),
            Text(
              'Your subscription has been activated. You can now access all features of your plan.',
              style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              final provider = ref.read(subscriptionProvider.notifier);
              await provider.loadEntitlements();
              if (mounted) Navigator.of(context).pop();
            },
            child: Text('Done', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasDiscount = _couponResult != null && _finalPrice < widget.planPrice;

    return Scaffold(
      appBar: AppBar(
        title: Text('Upgrade to ${widget.planName}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Plan summary
            NxCard(
              elevated: true,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.planName, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Text('Plan Price', style: GoogleFonts.inter(fontSize: 14, color: AppColors.gray600)),
                        const Spacer(),
                        Text(
                          '₹${widget.planPrice.toStringAsFixed(0)}/month',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: hasDiscount ? AppColors.gray400 : AppColors.gray800,
                            decoration: hasDiscount ? TextDecoration.lineThrough : null,
                          ),
                        ),
                      ],
                    ),
                    if (hasDiscount) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Text('After Discount', style: GoogleFonts.inter(fontSize: 14, color: AppColors.gray600)),
                          const Spacer(),
                          Text(
                            '₹${_finalPrice.toStringAsFixed(0)}/month',
                            style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.success),
                          ),
                        ],
                      ),
                      if (_couponResult!['discount'] != null) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.local_offer, size: 14, color: AppColors.success),
                            const SizedBox(width: 4),
                            Text(
                              'You save ₹${(_couponResult!['discount'] as num).toStringAsFixed(0)}',
                              style: GoogleFonts.inter(fontSize: 13, color: AppColors.success, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Coupon section
            Text('Have a coupon?', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _couponController,
                    decoration: InputDecoration(
                      hintText: 'Enter coupon code',
                      border: const OutlineInputBorder(),
                      prefixIcon: const Icon(Icons.local_offer, size: 20),
                      suffixIcon: _couponResult != null
                          ? IconButton(
                              icon: const Icon(Icons.close, size: 18),
                              onPressed: _removeCoupon,
                            )
                          : null,
                      errorText: _couponError,
                    ),
                    textCapitalization: TextCapitalization.characters,
                    enabled: _couponResult == null,
                    onSubmitted: (_) => _validateCoupon(),
                  ),
                ),
                const SizedBox(width: 8),
                if (_couponResult == null)
                  ElevatedButton(
                    onPressed: _isValidating ? null : _validateCoupon,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.white,
                    ),
                    child: _isValidating
                        ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text('Apply', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  ),
              ],
            ),

            if (_couponResult != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, size: 16, color: AppColors.success),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Coupon applied: ${_couponResult!['code'] ?? _couponController.text}',
                        style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF16A34A), fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 32),

            // Checkout button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isCheckingOut ? null : _proceedCheckout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isCheckingOut
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(
                        hasDiscount ? 'Pay ₹${_finalPrice.toStringAsFixed(0)} / month' : 'Pay ₹${widget.planPrice.toStringAsFixed(0)} / month',
                        style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
