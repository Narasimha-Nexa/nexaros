import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/order_models.dart';
import '../providers/orders_provider.dart';
import 'widgets/order_timeline.dart';
import 'widgets/order_items_list.dart';

class OrderDetailScreen extends ConsumerStatefulWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  ConsumerState<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends ConsumerState<OrderDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(ordersProvider).selectOrder(widget.orderId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final provider = ref.watch(ordersProvider);
    final order = provider.state.selectedOrder;

    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Order Details')),
        body: const Center(child: NxLoadingSpinner()),
      );
    }

    return Scaffold(
      backgroundColor: cs.surface,
      appBar: AppBar(
        title: Text('Order ${order.orderNumberDisplay}',
          style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        actions: [
          if (order.canModify)
            IconButton(icon: const Icon(Icons.edit, size: 20), onPressed: () {}),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, size: 20),
            onSelected: (v) => _handleAction(v, provider, order),
            itemBuilder: (_) => [
              if (!order.kotPrinted) const PopupMenuItem(value: 'print', child: Text('Print KOT')),
              const PopupMenuItem(value: 'duplicate', child: Text('Duplicate Order')),
              if (order.canCancel) const PopupMenuItem(value: 'cancel', child: Text('Cancel Order')),
              if (order.canRefund) const PopupMenuItem(value: 'refund', child: Text('Refund')),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppDimens.base),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _StatusBanner(order: order),
          const SizedBox(height: AppDimens.base),
          _OrderInfoCard(order: order),
          const SizedBox(height: AppDimens.base),
          OrderItemsList(
            items: order.items,
            canModify: order.canModify,
            onQuantityChange: order.canModify ? (itemId, qty) {} : null,
            onRemoveItem: order.canModify ? (itemId) {} : null,
          ),
          const SizedBox(height: AppDimens.base),
          _PaymentCard(order: order),
          if (order.notes != null && order.notes!.isNotEmpty) ...[
            const SizedBox(height: AppDimens.base),
            _NotesCard(notes: order.notes!),
          ],
          const SizedBox(height: AppDimens.base),
          OrderTimeline(history: order.statusHistory, currentStatus: order.parsedStatus),
          const SizedBox(height: 100),
        ]),
      ),
      bottomNavigationBar: _BottomActions(order: order, provider: provider),
    );
  }

  void _handleAction(String action, OrdersProvider provider, OrderModel order) {
    switch (action) {
      case 'print': provider.printKot(order.id);
      case 'cancel':
        showDialog(context: context, builder: (ctx) => NxConfirmationDialog(
          title: 'Cancel Order', message: 'Are you sure you want to cancel this order?',
          confirmLabel: 'Cancel Order', confirmColor: AppColors.danger,
          onConfirm: () { Navigator.pop(ctx); provider.cancelOrder(order.id); },
        ));
    }
  }
}

class _StatusBanner extends StatelessWidget {
  final OrderModel order;
  const _StatusBanner({required this.order});

  @override
  Widget build(BuildContext context) {
    final status = order.parsedStatus;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: status.color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppDimens.cardRadius),
        border: Border.all(color: status.color.withValues(alpha: 0.2)),
      ),
      child: Row(children: [
        Icon(status.icon, color: status.color, size: 24),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(status.label, style: GoogleFonts.inter(
            fontSize: 15, fontWeight: FontWeight.w700, color: status.color)),
          Text(order.type.label, style: GoogleFonts.inter(
            fontSize: 11, color: status.color.withValues(alpha: 0.7))),
        ]),
        const Spacer(),
        Text(order.ageDisplay, style: GoogleFonts.inter(
          fontSize: 12, fontWeight: FontWeight.w600, color: status.color)),
      ]),
    );
  }
}

class _OrderInfoCard extends StatelessWidget {
  final OrderModel order;
  const _OrderInfoCard({required this.order});

  @override
  Widget build(BuildContext context) {
    return NxCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Order Info', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        const Divider(height: 16),
        _infoRow(context, 'Order #', order.orderNumberDisplay),
        _infoRow(context, 'Type', order.type.label),
        _infoRow(context, 'Channel', order.channel.label),
        if (order.displayTable.isNotEmpty)
          _infoRow(context, 'Table', order.displayTable),
        if (order.customerName != null)
          _infoRow(context, 'Customer', order.customerName!),
        if (order.customerPhone != null)
          _infoRow(context, 'Phone', order.customerPhone!),
        if (order.guestCount != null)
          _infoRow(context, 'Guests', '${order.guestCount}'),
        if (order.createdBy != null)
          _infoRow(context, 'Created by', order.createdBy!),
        _infoRow(context, 'Time', '${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year} ${order.displayTime}'),
      ]),
    );
  }

  Widget _infoRow(BuildContext context, String label, String value) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(children: [
        SizedBox(width: 100, child: Text(label, style: GoogleFonts.inter(
          fontSize: 12, color: cs.onSurfaceVariant))),
        Expanded(child: Text(value, style: GoogleFonts.inter(
          fontSize: 12, fontWeight: FontWeight.w500))),
      ]),
    );
  }
}

class _PaymentCard extends StatelessWidget {
  final OrderModel order;
  const _PaymentCard({required this.order});

  @override
  Widget build(BuildContext context) {
    return NxCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text('Payment', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: order.paymentStatus.color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppDimens.radiusXs),
            ),
            child: Text(order.paymentStatus.label, style: GoogleFonts.inter(
              fontSize: 10, fontWeight: FontWeight.w600, color: order.paymentStatus.color)),
          ),
        ]),
        const Divider(height: 16),
        _amountRow(context, 'Subtotal', '₹${order.subtotal.toStringAsFixed(2)}'),
        _amountRow(context, 'Tax', '₹${order.taxAmount.toStringAsFixed(2)}'),
        if (order.discountAmount > 0)
          _amountRow(context, 'Discount', '-₹${order.discountAmount.toStringAsFixed(2)}', color: AppColors.danger),
        const Divider(height: 12),
        _amountRow(context, 'Total', '₹${order.totalAmount.toStringAsFixed(2)}', isBold: true),
      ]),
    );
  }

  Widget _amountRow(BuildContext context, String label, String value, {bool isBold = false, Color? color}) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: cs.onSurfaceVariant)),
        const Spacer(),
        Text(value, style: GoogleFonts.inter(
          fontSize: isBold ? 14 : 12,
          fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
          color: color ?? cs.onSurface)),
      ]),
    );
  }
}

class _NotesCard extends StatelessWidget {
  final String notes;
  const _NotesCard({required this.notes});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return NxCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.notes, size: 16, color: cs.onSurfaceVariant),
          const SizedBox(width: 6),
          Text('Special Instructions', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        ]),
        const SizedBox(height: 6),
        Text(notes, style: GoogleFonts.inter(fontSize: 12, color: cs.onSurfaceVariant)),
      ]),
    );
  }
}

class _BottomActions extends StatelessWidget {
  final OrderModel order;
  final OrdersProvider provider;
  const _BottomActions({required this.order, required this.provider});

  @override
  Widget build(BuildContext context) {
    final status = order.parsedStatus;
    if (status.isTerminal) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(AppDimens.base),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(top: BorderSide(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.1))),
      ),
      child: SafeArea(child: Row(children: [
        if (!order.kotPrinted)
          Expanded(child: OutlinedButton.icon(
            onPressed: () => provider.printKot(order.id),
            icon: const Icon(Icons.print, size: 16),
            label: Text('Print KOT', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          )),
        if (!order.kotPrinted) const SizedBox(width: 8),
        Expanded(child: FilledButton(
          onPressed: () {
            final next = switch (status) {
              OrderStatus.pending => OrderStatus.preparing,
              OrderStatus.confirmed => OrderStatus.preparing,
              OrderStatus.preparing => OrderStatus.ready,
              OrderStatus.ready => OrderStatus.completed,
              _ => status,
            };
            provider.updateStatus(order.id, next);
          },
          style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
          child: Text(_nextStatusLabel(status), style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        )),
      ])),
    );
  }

  String _nextStatusLabel(OrderStatus status) => switch (status) {
    OrderStatus.pending => 'Start Preparing',
    OrderStatus.confirmed => 'Start Preparing',
    OrderStatus.preparing => 'Mark Ready',
    OrderStatus.ready => 'Complete',
    _ => 'Update',
  };
}
