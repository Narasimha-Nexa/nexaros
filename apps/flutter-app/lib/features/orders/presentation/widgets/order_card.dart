import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../data/order_models.dart';

class OrderCard extends StatelessWidget {
  final OrderModel order;
  final bool isSelected;
  final bool isSelectionMode;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final ValueChanged<OrderStatus>? onStatusChange;
  final VoidCallback? onCancel;
  final VoidCallback? onPrint;

  const OrderCard({
    super.key, required this.order, this.isSelected = false,
    this.isSelectionMode = false, required this.onTap, this.onLongPress,
    this.onStatusChange, this.onCancel, this.onPrint,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final status = order.parsedStatus;

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDimens.cardRadius),
        side: BorderSide(
          color: isSelected ? AppColors.primary
            : cs.outline.withValues(alpha: 0.1),
          width: isSelected ? 2 : 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(AppDimens.cardRadius),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _buildHeader(context, status),
            const SizedBox(height: 8),
            _buildItems(context),
            if (order.customerName != null || order.displayTable.isNotEmpty) ...[
              const SizedBox(height: 6),
              _buildMeta(context),
            ],
            const SizedBox(height: 8),
            _buildFooter(context, status),
          ]),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, OrderStatus status) {
    return Row(children: [
      if (isSelectionMode)
        Padding(
          padding: const EdgeInsets.only(right: 8),
          child: Icon(isSelected ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 20, color: isSelected ? AppColors.primary : Colors.grey),
        ),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: status.color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppDimens.radiusXs),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(status.icon, size: 12, color: status.color),
          const SizedBox(width: 3),
          Text(status.label, style: GoogleFonts.inter(
            fontSize: 10, fontWeight: FontWeight.w600, color: status.color)),
        ]),
      ),
      const SizedBox(width: 6),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppDimens.radiusXs),
        ),
        child: Text(order.type.label, style: GoogleFonts.inter(
          fontSize: 9, color: AppColors.primary, fontWeight: FontWeight.w500)),
      ),
      if (order.channel != OrderChannel.dineIn) ...[
        const SizedBox(width: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
          decoration: BoxDecoration(
            color: order.channel.color.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(AppDimens.radiusXs),
          ),
          child: Text(order.channel.label, style: GoogleFonts.inter(
            fontSize: 9, color: order.channel.color, fontWeight: FontWeight.w500)),
        ),
      ],
      const Spacer(),
      Text(order.orderNumberDisplay, style: GoogleFonts.inter(
        fontSize: 13, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.onSurface)),
      const SizedBox(width: 8),
      Text(order.ageDisplay, style: GoogleFonts.inter(
        fontSize: 10, color: order.age.inMinutes > 30 ? AppColors.danger : Theme.of(context).colorScheme.onSurfaceVariant)),
    ]);
  }

  Widget _buildItems(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final displayItems = order.items.take(3).map((i) =>
      '${i.quantity}x ${i.name}').join(', ');
    final remaining = order.items.length - 3;

    return Row(children: [
      Icon(Icons.receipt, size: 14, color: cs.onSurfaceVariant),
      const SizedBox(width: 4),
      Expanded(child: Text(
        '$displayItems${remaining > 0 ? ' +$remaining more' : ''}',
        style: GoogleFonts.inter(fontSize: 11, color: cs.onSurfaceVariant),
        maxLines: 1, overflow: TextOverflow.ellipsis,
      )),
    ]);
  }

  Widget _buildMeta(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(children: [
      if (order.displayTable.isNotEmpty) ...[
        Icon(Icons.table_restaurant, size: 12, color: cs.onSurfaceVariant),
        const SizedBox(width: 3),
        Text(order.displayTable, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
        const SizedBox(width: 8),
      ],
      if (order.customerName != null) ...[
        Icon(Icons.person, size: 12, color: cs.onSurfaceVariant),
        const SizedBox(width: 3),
        Text(order.customerName!, style: GoogleFonts.inter(fontSize: 10, color: cs.onSurfaceVariant)),
      ],
    ]);
  }

  Widget _buildFooter(BuildContext context, OrderStatus status) {
    final cs = Theme.of(context).colorScheme;
    return Row(children: [
      Text('₹${order.totalAmount.toStringAsFixed(0)}',
        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: cs.onSurface)),
      const Spacer(),
      if (!status.isTerminal) ...[
        if (onPrint != null)
          _ActionChip(icon: Icons.print, label: 'KOT', onTap: onPrint!),
        const SizedBox(width: 4),
        _buildNextActionButton(status),
      ],
      if (status == OrderStatus.completed) ...[
        _PaymentBadge(status: order.paymentStatus),
      ],
      if (order.canCancel && onCancel != null)
        Padding(
          padding: const EdgeInsets.only(left: 4),
          child: ActionChip(
            avatar: const Icon(Icons.cancel, size: 12, color: AppColors.danger),
            label: Text('Cancel', style: GoogleFonts.inter(fontSize: 10, color: AppColors.danger)),
            onPressed: onCancel, visualDensity: VisualDensity.compact,
            side: const BorderSide(color: AppColors.danger, width: 0.5),
          ),
        ),
    ]);
  }

  Widget _buildNextActionButton(OrderStatus status) {
    final nextStatus = switch (status) {
      OrderStatus.pending => OrderStatus.preparing,
      OrderStatus.confirmed => OrderStatus.preparing,
      OrderStatus.accepted => OrderStatus.preparing,
      OrderStatus.preparing => OrderStatus.ready,
      OrderStatus.cooking => OrderStatus.ready,
      OrderStatus.ready => OrderStatus.completed,
      OrderStatus.packed => OrderStatus.completed,
      _ => null,
    };
    final nextLabel = switch (status) {
      OrderStatus.pending => 'Prepare',
      OrderStatus.confirmed => 'Prepare',
      OrderStatus.accepted => 'Prepare',
      OrderStatus.preparing => 'Ready',
      OrderStatus.cooking => 'Ready',
      OrderStatus.ready => 'Complete',
      OrderStatus.packed => 'Complete',
      _ => '',
    };
    if (nextStatus == null) return const SizedBox.shrink();

    return ActionChip(
      label: Text(nextLabel, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.white)),
      backgroundColor: AppColors.primary,
      onPressed: () => onStatusChange?.call(nextStatus),
      visualDensity: VisualDensity.compact,
      padding: EdgeInsets.zero,
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ActionChip({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppDimens.radiusXs),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
        decoration: BoxDecoration(
          border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2)),
          borderRadius: BorderRadius.circular(AppDimens.radiusXs),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
          const SizedBox(width: 3),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ]),
      ),
    );
  }
}

class _PaymentBadge extends StatelessWidget {
  final PaymentStatus status;
  const _PaymentBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: status.color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppDimens.radiusXs),
      ),
      child: Text(status.label, style: GoogleFonts.inter(
        fontSize: 9, fontWeight: FontWeight.w600, color: status.color)),
    );
  }
}
