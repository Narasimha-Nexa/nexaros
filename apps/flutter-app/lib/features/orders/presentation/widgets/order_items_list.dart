import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../data/order_models.dart';

class OrderItemsList extends StatelessWidget {
  final List<OrderItemModel> items;
  final bool canModify;
  final void Function(String itemId, int qty)? onQuantityChange;
  final void Function(String itemId)? onRemoveItem;

  const OrderItemsList({
    super.key, required this.items, this.canModify = false,
    this.onQuantityChange, this.onRemoveItem,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final total = items.fold<double>(0, (s, i) => s + i.computedTotal);

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDimens.cardRadius),
        side: BorderSide(color: cs.outline.withValues(alpha: 0.1)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Text('Items (${items.length})', style: GoogleFonts.inter(
              fontSize: 13, fontWeight: FontWeight.w600)),
            const Spacer(),
            Text('₹${total.toStringAsFixed(0)}', style: GoogleFonts.inter(
              fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary)),
          ]),
          const Divider(height: 16),
          ...items.map((item) => _ItemTile(
            item: item, canModify: canModify,
            onQuantityChange: onQuantityChange,
            onRemoveItem: onRemoveItem,
          )),
        ]),
      ),
    );
  }
}

class _ItemTile extends StatelessWidget {
  final OrderItemModel item;
  final bool canModify;
  final void Function(String itemId, int qty)? onQuantityChange;
  final void Function(String itemId)? onRemoveItem;

  const _ItemTile({required this.item, this.canModify = false, this.onQuantityChange, this.onRemoveItem});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final status = item.status;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(children: [
        if (item.isVeg)
          Container(
            width: 12, height: 12,
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.success, width: 1.5),
              borderRadius: BorderRadius.circular(2),
            ),
            child: Center(child: Container(width: 5, height: 5,
              decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle))),
          ),
        if (!item.isVeg)
          Container(
            width: 12, height: 12,
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.danger, width: 1.5),
              borderRadius: BorderRadius.circular(2),
            ),
            child: Center(child: Container(width: 5, height: 5,
              decoration: const BoxDecoration(color: AppColors.danger, shape: BoxShape.circle))),
          ),
        const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(item.name, style: GoogleFonts.inter(
              fontSize: 12, fontWeight: FontWeight.w500))),
            if (status != OrderItemStatus.pending)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                decoration: BoxDecoration(
                  color: status.color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(status.label, style: GoogleFonts.inter(
                  fontSize: 8, fontWeight: FontWeight.w600, color: status.color)),
              ),
          ]),
          if (item.addOns.isNotEmpty)
            Text(item.addOns.map((a) => '+ ${a.name}').join(', '),
              style: GoogleFonts.inter(fontSize: 10, color: cs.onSurfaceVariant)),
          if (item.notes != null)
            Text(item.notes!, style: GoogleFonts.inter(
              fontSize: 10, color: cs.onSurfaceVariant.withValues(alpha: 0.6), fontStyle: FontStyle.italic)),
        ])),
        const SizedBox(width: 8),
        if (canModify)
          _QuantityControl(
            quantity: item.quantity,
            onIncrement: () => onQuantityChange?.call(item.id ?? '', item.quantity + 1),
            onDecrement: () => onQuantityChange?.call(item.id ?? '', item.quantity - 1),
          )
        else
          Text('${item.quantity}x', style: GoogleFonts.inter(
            fontSize: 12, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
        const SizedBox(width: 8),
        Text('₹${item.computedTotal.toStringAsFixed(0)}', style: GoogleFonts.inter(
          fontSize: 12, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

class _QuantityControl extends StatelessWidget {
  final int quantity;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;
  const _QuantityControl({required this.quantity, required this.onIncrement, required this.onDecrement});

  @override
  Widget build(BuildContext context) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      GestureDetector(
        onTap: onDecrement,
        child: Container(
          width: 22, height: 22,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(4),
          ),
          child: const Icon(Icons.remove, size: 14),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6),
        child: Text('$quantity', style: GoogleFonts.inter(
          fontSize: 12, fontWeight: FontWeight.w600)),
      ),
      GestureDetector(
        onTap: onIncrement,
        child: Container(
          width: 22, height: 22,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Icon(Icons.add, size: 14, color: AppColors.primary),
        ),
      ),
    ]);
  }
}
