import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/order_model.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class OrderListScreen extends ConsumerStatefulWidget {
  const OrderListScreen({super.key});

  @override
  ConsumerState<OrderListScreen> createState() => _OrderListScreenState();
}

class _OrderListScreenState extends ConsumerState<OrderListScreen> {
  List<OrderModel> _orders = [];
  bool _isLoading = true;
  String _statusFilter = '';

  static const _filters = ['', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];
  static const _filterLabels = {
    '': 'All', 'PENDING': 'Pending', 'CONFIRMED': 'Confirmed',
    'PREPARING': 'Preparing', 'READY': 'Ready', 'SERVED': 'Served',
    'COMPLETED': 'Completed', 'CANCELLED': 'Cancelled',
  };

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(appStateProvider).api;
      final raw = await api.getOrders(status: _statusFilter.isEmpty ? null : _statusFilter);
      if (mounted) {
        setState(() {
          _orders = raw.map((o) => OrderModel.fromJson(o as Map<String, dynamic>)).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Orders'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _loadOrders,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          Container(
            color: cs.surface,
            padding: const EdgeInsets.symmetric(horizontal: AppDimens.base, vertical: AppDimens.sm),
            child: SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _filters.length,
                separatorBuilder: (_, __) => const SizedBox(width: AppDimens.sm),
                itemBuilder: (ctx, i) {
                  final isSelected = _statusFilter == _filters[i];
                  return FilterChip(
                    label: Text(_filterLabels[_filters[i]]!, style: const TextStyle(fontSize: 12)),
                    selected: isSelected,
                    onSelected: (_) { _statusFilter = _filters[i]; _loadOrders(); },
                    selectedColor: cs.primary.withValues(alpha: 0.1),
                    checkmarkColor: cs.primary,
                  );
                },
              ),
            ),
          ),
          // Orders list
          Expanded(
            child: _isLoading
                ? const NxFullScreenLoader()
                : _orders.isEmpty
                    ? NxEmptyState(
                        icon: Icons.receipt_long,
                        title: 'No orders found',
                        subtitle: _statusFilter.isNotEmpty ? 'Try a different filter' : null,
                      )
                    : RefreshIndicator(
                        onRefresh: _loadOrders,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(AppDimens.sm),
                          itemCount: _orders.length,
                          itemBuilder: (ctx, i) => _buildOrderCard(_orders[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(OrderModel order) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => context.go('/shell/pos'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(AppDimens.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Row 1: Order number + status badge
              Row(
                children: [
                  Text(
                    '#${order.orderNumber}',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: cs.onSurface),
                  ),
                  const Spacer(),
                  NxStatusBadge.order(order.status),
                ],
              ),
              const SizedBox(height: AppDimens.xs),
              // Row 2: Time, type, table
              Row(
                children: [
                  Icon(Icons.access_time, size: 14, color: AppColors.gray400),
                  const SizedBox(width: 4),
                  Text(order.formattedTime, style: TextStyle(fontSize: 12, color: AppColors.gray500)),
                  const SizedBox(width: AppDimens.md),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(4)),
                    child: Text(order.type.replaceAll('_', ' '), style: TextStyle(fontSize: 11, color: AppColors.gray600)),
                  ),
                  if (order.displayTable.isNotEmpty) ...[
                    const SizedBox(width: AppDimens.sm),
                    Icon(Icons.table_restaurant, size: 14, color: AppColors.gray400),
                    const SizedBox(width: 4),
                    Text(order.displayTable, style: TextStyle(fontSize: 12, color: AppColors.gray500)),
                  ],
                ],
              ),
              // Row 3: Items
              if (order.items.isNotEmpty) ...[
                const SizedBox(height: AppDimens.xs),
                Text(
                  order.displayItems,
                  style: TextStyle(fontSize: 12, color: AppColors.gray500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const Divider(height: 16),
              // Row 4: Total + action buttons
              Row(
                children: [
                  Text(
                    '₹${order.totalAmount.toStringAsFixed(2)}',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: cs.onSurface),
                  ),
                  const Spacer(),
                  if (order.status == 'PENDING' || order.status == 'CONFIRMED') ...[
                    _ActionBtn('KOT', AppColors.warning, () => _printKot(order.id)),
                    const SizedBox(width: 8),
                    _ActionBtn('Prepare', AppColors.orderPreparing, () => _updateStatus(order.id, 'PREPARING')),
                  ],
                  if (order.status == 'PREPARING')
                    _ActionBtn('Ready', AppColors.orderReady, () => _updateStatus(order.id, 'READY')),
                  if (order.status == 'READY')
                    _ActionBtn('Served', AppColors.orderServed, () => _updateStatus(order.id, 'SERVED')),
                  if (order.status == 'SERVED')
                    _ActionBtn('Pay', AppColors.primary, () {
                      context.push('/payment?orderId=${order.id}').then((_) => _loadOrders());
                    }),
                  if (order.status != 'COMPLETED' && order.status != 'CANCELLED')
                    Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: TextButton(
                        onPressed: () => _confirmCancel(order.id),
                        child: const Text('Cancel', style: TextStyle(color: AppColors.danger, fontSize: 12)),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirmCancel(String orderId) async {
    final confirmed = await NxConfirmationDialog.show(
      context: context,
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order?',
      confirmLabel: 'Yes, Cancel',
    );
    if (confirmed == true) _updateStatus(orderId, 'CANCELLED');
  }

  Future<void> _updateStatus(String orderId, String status) async {
    try {
      final api = ref.read(appStateProvider).api;
      await api.updateOrderStatus(orderId, status);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Order updated to $status'), backgroundColor: AppColors.success),
        );
        _loadOrders();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  Future<void> _printKot(String orderId) async {
    try {
      final api = ref.read(appStateProvider).api;
      await api.printKot(orderId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('KOT sent to kitchen'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: AppColors.danger),
        );
      }
    }
  }
}

class _ActionBtn extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onPressed;
  const _ActionBtn(this.label, this.color, this.onPressed);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 30,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: AppColors.white,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
        child: Text(label),
      ),
    );
  }
}
