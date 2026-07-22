import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../data/order_models.dart';

class OrderFilterSheet extends StatefulWidget {
  final OrderFilter currentFilter;
  final ValueChanged<OrderFilter> onApply;
  final VoidCallback onClear;
  const OrderFilterSheet({super.key, required this.currentFilter, required this.onApply, required this.onClear});

  @override
  State<OrderFilterSheet> createState() => _OrderFilterSheetState();
}

class _OrderFilterSheetState extends State<OrderFilterSheet> {
  late OrderFilter _filter;

  @override
  void initState() {
    super.initState();
    _filter = widget.currentFilter;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return DraggableScrollableSheet(
      initialChildSize: 0.7, maxChildSize: 0.9, minChildSize: 0.5,
      expand: false,
      builder: (ctx, scrollCtrl) => Container(
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: ListView(
          controller: scrollCtrl,
          padding: const EdgeInsets.all(AppDimens.base),
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(
              color: cs.outline.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ))),
            const SizedBox(height: 16),
            Row(children: [
              Text('Filters', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
              const Spacer(),
              TextButton(onPressed: () { widget.onClear(); Navigator.pop(context); },
                child: Text('Clear All', style: GoogleFonts.inter(color: AppColors.danger, fontSize: 13))),
            ]),
            const SizedBox(height: 12),
            _buildSection('Order Status', Wrap(
              spacing: 6, runSpacing: 6,
              children: OrderStatus.values.take(10).map((s) => _FilterChip(
                label: s.label, color: s.color,
                isSelected: _filter.statuses.contains(s),
                onTap: () => setState(() {
                  final list = List<OrderStatus>.from(_filter.statuses);
                  list.contains(s) ? list.remove(s) : list.add(s);
                  _filter = _filter.copyWith(statuses: list);
                }),
              )).toList(),
            )),
            const SizedBox(height: 12),
            _buildSection('Order Type', Wrap(
              spacing: 6, runSpacing: 6,
              children: OrderType.values.map((t) => _FilterChip(
                label: t.label, icon: t.icon,
                isSelected: _filter.types.contains(t),
                onTap: () => setState(() {
                  final list = List<OrderType>.from(_filter.types);
                  list.contains(t) ? list.remove(t) : list.add(t);
                  _filter = _filter.copyWith(types: list);
                }),
              )).toList(),
            )),
            const SizedBox(height: 12),
            _buildSection('Payment', Wrap(
              spacing: 6, runSpacing: 6,
              children: PaymentStatus.values.map((p) => _FilterChip(
                label: p.label, color: p.color,
                isSelected: _filter.paymentStatus == p,
                onTap: () => setState(() {
                  _filter = _filter.copyWith(
                    paymentStatus: _filter.paymentStatus == p ? null : p,
                    clearPayment: _filter.paymentStatus == p,
                  );
                }),
              )).toList(),
            )),
            const SizedBox(height: 12),
            _buildSection('Sort By', Wrap(
              spacing: 6, runSpacing: 6,
              children: SortOrder.values.map((s) => _FilterChip(
                label: s.label,
                isSelected: _filter.sortOrder == s,
                onTap: () => setState(() => _filter = _filter.copyWith(sortOrder: s)),
              )).toList(),
            )),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () { widget.onApply(_filter); Navigator.pop(context); },
                style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                child: Text('Apply Filters', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, Widget child) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurfaceVariant)),
      const SizedBox(height: 6),
      child,
    ]);
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final Color? color;
  final IconData? icon;
  final bool isSelected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, this.color, this.icon, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? (color ?? AppColors.primary).withValues(alpha: 0.1) : cs.surfaceContainerHighest.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(AppDimens.radiusFull),
          border: Border.all(
            color: isSelected ? (color ?? AppColors.primary) : cs.outline.withValues(alpha: 0.2),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          if (icon != null) ...[Icon(icon, size: 12, color: isSelected ? (color ?? AppColors.primary) : cs.onSurfaceVariant), const SizedBox(width: 3)],
          Text(label, style: GoogleFonts.inter(
            fontSize: 11, fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            color: isSelected ? (color ?? AppColors.primary) : cs.onSurfaceVariant)),
        ]),
      ),
    );
  }
}
