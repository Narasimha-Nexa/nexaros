import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class CouponManagementScreen extends ConsumerStatefulWidget {
  const CouponManagementScreen({super.key});

  @override
  ConsumerState<CouponManagementScreen> createState() => _CouponManagementScreenState();
}

class _CouponManagementScreenState extends ConsumerState<CouponManagementScreen> {
  String? _typeFilter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(offersProvider.notifier).loadCoupons();
    });
  }

  Future<void> _showCouponDialog({Map<String, dynamic>? existing}) async {
    final codeCtrl = TextEditingController(text: existing?['code'] ?? '');
    final descCtrl = TextEditingController(text: existing?['description'] ?? '');
    final valueCtrl = TextEditingController(text: existing?['value']?.toString() ?? '');
    final maxDiscountCtrl = TextEditingController(text: existing?['maxDiscount']?.toString() ?? '');
    final expiryCtrl = TextEditingController(
      text: existing != null
          ? DateFormat('yyyy-MM-dd').format(DateTime.parse(existing['expiry']))
          : DateFormat('yyyy-MM-dd').format(DateTime.now().add(const Duration(days: 30))),
    );
    final maxUsesCtrl = TextEditingController(text: existing?['maxTotalUses']?.toString() ?? '');
    String type = existing?['type'] ?? 'PERCENTAGE';
    bool isActive = existing?['isActive'] ?? true;

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(existing != null ? 'Edit Coupon' : 'Create Coupon'),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextField(
                controller: codeCtrl,
                decoration: const InputDecoration(
                  labelText: 'Coupon Code',
                  prefixIcon: Icon(Icons.local_offer, size: 20),
                  hintText: 'FEST20',
                ),
                textCapitalization: TextCapitalization.characters,
                enabled: existing == null,
              ),
              const SizedBox(height: 10),
              TextField(
                controller: descCtrl,
                decoration: const InputDecoration(
                  labelText: 'Description (optional)',
                  prefixIcon: Icon(Icons.description, size: 20),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                key: ValueKey(type),
                initialValue: type,
                decoration: const InputDecoration(labelText: 'Discount Type', prefixIcon: Icon(Icons.category, size: 20)),
                items: const [
                  DropdownMenuItem(value: 'PERCENTAGE', child: Text('Percentage (%)')),
                  DropdownMenuItem(value: 'FIXED_AMOUNT', child: Text('Fixed Amount (₹)')),
                ],
                onChanged: (v) => setDialogState(() => type = v ?? 'PERCENTAGE'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: valueCtrl,
                decoration: InputDecoration(
                  labelText: type == 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount (₹)',
                  prefixIcon: const Icon(Icons.discount, size: 20),
                  hintText: type == 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 100',
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 10),
              TextField(
                controller: maxDiscountCtrl,
                decoration: const InputDecoration(
                  labelText: 'Max Discount (₹) - optional',
                  prefixIcon: Icon(Icons.money_off, size: 20),
                  hintText: 'e.g. 500',
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 10),
              TextField(
                controller: expiryCtrl,
                decoration: const InputDecoration(
                  labelText: 'Expiry Date',
                  prefixIcon: Icon(Icons.calendar_today, size: 20),
                ),
                readOnly: true,
                onTap: () async {
                  final picked = await showDatePicker(
                    context: ctx,
                    initialDate: DateTime.tryParse(expiryCtrl.text) ?? DateTime.now().add(const Duration(days: 30)),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) expiryCtrl.text = DateFormat('yyyy-MM-dd').format(picked);
                },
              ),
              const SizedBox(height: 10),
              TextField(
                controller: maxUsesCtrl,
                decoration: const InputDecoration(
                  labelText: 'Max Total Uses (optional)',
                  prefixIcon: Icon(Icons.repeat, size: 20),
                ),
                keyboardType: TextInputType.number,
              ),
              if (existing != null) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.toggle_on, size: 20, color: AppColors.gray600),
                    const SizedBox(width: 8),
                    Text('Active', style: GoogleFonts.inter(fontSize: 14)),
                    const Spacer(),
                    Switch(
                      value: isActive,
                      onChanged: (v) => setDialogState(() => isActive = v),
                    ),
                  ],
                ),
              ],
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final data = {
                  'code': codeCtrl.text.trim().toUpperCase(),
                  'description': descCtrl.text.trim(),
                  'type': type,
                  'value': double.tryParse(valueCtrl.text) ?? 0,
                  if (maxDiscountCtrl.text.isNotEmpty) 'maxDiscount': double.tryParse(maxDiscountCtrl.text) ?? 0,
                  'expiry': expiryCtrl.text,
                  if (maxUsesCtrl.text.isNotEmpty) 'maxTotalUses': int.tryParse(maxUsesCtrl.text) ?? 100,
                  if (existing != null) 'isActive': isActive,
                };
                bool success;
                if (existing != null) {
                  success = await ref.read(offersProvider.notifier).updateCoupon(existing['id'], data) != null;
                } else {
                  success = await ref.read(offersProvider.notifier).createCoupon(data) != null;
                }
                if (ctx.mounted) Navigator.pop(ctx, success);
              },
              child: Text(existing != null ? 'Update' : 'Create'),
            ),
          ],
        ),
      ),
    );
    if (saved == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(existing != null ? 'Coupon updated!' : 'Coupon created!'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  Future<void> _showStatsDialog(Map<String, dynamic> coupon) async {
    final offers = ref.read(offersProvider.notifier);
    await offers.loadCouponStats(coupon['id']);
    if (!mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.bar_chart, size: 22, color: AppColors.primary),
            const SizedBox(width: 8),
            Text('${coupon['code']} Stats', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ],
        ),
        content: offers.couponStats != null
            ? Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _statRow('Total Used', '${offers.couponStats!['stats']?['totalUsed'] ?? 0}'),
                  _statRow('Total Discount', '₹${(offers.couponStats!['stats']?['totalDiscount'] ?? 0).toStringAsFixed(0)}'),
                  _statRow('Max Uses', '${offers.couponStats!['stats']?['maxTotalUses'] ?? 'Unlimited'}'),
                  if (coupon['festivalTag'] != null) ...[
                    const Divider(),
                    _statRow('Campaign', coupon['festivalTag']),
                  ],
                ],
              )
            : const Text('No stats available'),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close'))],
      ),
    );
  }

  Widget _statRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray600)),
          Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(String id, String code) async {
    final offers = ref.read(offersProvider.notifier);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Deactivate Coupon'),
        content: Text('Deactivate coupon "$code"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Deactivate', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      final success = await offers.deleteCoupon(id);
      if (success) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Coupon deactivated'), backgroundColor: AppColors.success),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final offers = ref.watch(offersProvider);
    final coupons = offers.coupons;

    final filtered = _typeFilter != null
        ? coupons.where((c) => c['type'] == _typeFilter).toList()
        : coupons;

    return Scaffold(
      appBar: AppBar(
        title: Text('Coupons & Offers', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.secondary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showCouponDialog(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Type filter chips
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(12),
            child: SizedBox(
              height: 32,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _filterChip('All', null),
                  _filterChip('Percentage', 'PERCENTAGE'),
                  _filterChip('Fixed Amount', 'FIXED_AMOUNT'),
                ],
              ),
            ),
          ),
          Expanded(
            child: offers.couponsLoading && coupons.isEmpty
                ? const Center(child: NxFullScreenLoader())
                : filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.local_offer, size: 48, color: AppColors.gray300),
                            const SizedBox(height: 8),
                            Text('No coupons yet', style: GoogleFonts.inter(color: AppColors.gray500)),
                            const SizedBox(height: 12),
                            ElevatedButton.icon(
                              onPressed: () => _showCouponDialog(),
                              icon: const Icon(Icons.add, size: 18),
                              label: const Text('Create Coupon'),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () => offers.loadCoupons(),
                        child: ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: filtered.length,
                          itemBuilder: (ctx, i) => _buildCouponCard(filtered[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String label, String? value) {
    final selected = _typeFilter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(label, style: GoogleFonts.inter(fontSize: 11)),
        selected: selected,
        onSelected: (_) => setState(() => _typeFilter = selected ? null : value),
        selectedColor: AppColors.secondary.withValues(alpha: 0.12),
        checkmarkColor: AppColors.secondary,
        visualDensity: VisualDensity.compact,
      ),
    );
  }

  Widget _buildCouponCard(Map<String, dynamic> coupon) {
    final isPercentage = coupon['type'] == 'PERCENTAGE';
    final value = double.tryParse(coupon['value']?.toString() ?? '0') ?? 0;
    final isActive = coupon['isActive'] ?? false;
    final expiry = DateTime.tryParse(coupon['expiry']);
    final isExpired = expiry != null && expiry.isBefore(DateTime.now());
    final expiryStr = expiry != null ? DateFormat('dd MMM yyyy').format(expiry) : 'No expiry';
    final maxDiscount = double.tryParse(coupon['maxDiscount']?.toString() ?? '0');
    final festivalTag = coupon['festivalTag'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Code badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: isActive && !isExpired
                        ? AppColors.secondary.withValues(alpha: 0.12)
                        : AppColors.gray100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    coupon['code'] ?? '',
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: isActive && !isExpired ? AppColors.secondary : AppColors.gray400,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Type badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.gray100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    isPercentage ? '$value% OFF' : '₹${value.toStringAsFixed(0)} OFF',
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.gray700),
                  ),
                ),
                const Spacer(),
                // Status indicator
                Container(
                  width: 8, height: 8,
                  decoration: BoxDecoration(
                    color: isExpired ? AppColors.danger : (isActive ? AppColors.success : AppColors.gray400),
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
            if (coupon['description'] != null && (coupon['description'] as String).isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(coupon['description'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 12, color: isExpired ? AppColors.danger : AppColors.gray400),
                const SizedBox(width: 4),
                Text(
                  isExpired ? 'Expired: $expiryStr' : 'Valid until: $expiryStr',
                  style: GoogleFonts.inter(fontSize: 11, color: isExpired ? AppColors.danger : AppColors.gray500),
                ),
                if (festivalTag != null) ...[
                  const SizedBox(width: 12),
                  Icon(Icons.celebration, size: 12, color: AppColors.warning),
                  const SizedBox(width: 4),
                  Text(festivalTag, style: GoogleFonts.inter(fontSize: 11, color: AppColors.warning, fontWeight: FontWeight.w500)),
                ],
                if (maxDiscount != null && maxDiscount > 0) ...[
                  const Spacer(),
                  Text('Max disc: ₹${maxDiscount.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray400)),
                ],
              ],
            ),
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () => _showStatsDialog(coupon),
                  icon: const Icon(Icons.bar_chart, size: 16),
                  label: const Text('Stats', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(foregroundColor: AppColors.primary),
                ),
                const SizedBox(width: 4),
                TextButton.icon(
                  onPressed: () => _showCouponDialog(existing: coupon),
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Edit', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(foregroundColor: AppColors.gray600),
                ),
                const SizedBox(width: 4),
                TextButton.icon(
                  onPressed: () => _confirmDelete(coupon['id'], coupon['code']),
                  icon: const Icon(Icons.delete_outline, size: 16),
                  label: const Text('Deactivate', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
