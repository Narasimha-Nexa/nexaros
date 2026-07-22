import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/order_models.dart';
import '../providers/orders_provider.dart';
import 'widgets/order_card.dart';
import 'widgets/order_filter_sheet.dart';
import 'widgets/order_search_bar.dart';

class OrderDashboardScreen extends ConsumerStatefulWidget {
  const OrderDashboardScreen({super.key});
  @override
  ConsumerState<OrderDashboardScreen> createState() => _OrderDashboardScreenState();
}

class _OrderDashboardScreenState extends ConsumerState<OrderDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isSearchOpen = false;
  bool _isSelectionMode = false;

  static const _tabs = [
    _TabDef('active', 'Active', Icons.play_circle_outline),
    _TabDef('pending', 'Pending', Icons.schedule),
    _TabDef('preparing', 'Preparing', Icons.restaurant),
    _TabDef('ready', 'Ready', Icons.check_circle),
    _TabDef('completed', 'Completed', Icons.task_alt),
    _TabDef('cancelled', 'Cancelled', Icons.cancel),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(() => setState(() {}));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(ordersProvider).loadOrders();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final provider = ref.watch(ordersProvider);
    final state = provider.state;

    return Scaffold(
      backgroundColor: cs.surface,
      appBar: AppBar(
        elevation: 0, scrolledUnderElevation: 1,
        title: _isSearchOpen
          ? OrderSearchBar(
              initialQuery: state.filter.searchQuery ?? '',
              onSearch: (q) => provider.updateFilter((f) => f.copyWith(searchQuery: q)),
              onClose: () { setState(() => _isSearchOpen = false); provider.updateFilter((f) => f.copyWith(clearSearch: true)); },
            )
          : Row(children: [
              Text('Orders', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 20)),
              const SizedBox(width: 8),
              _CountBadge(count: state.totalCount),
            ]),
        actions: [
          if (_isSelectionMode) ...[
            IconButton(
              icon: const Icon(Icons.select_all, size: 20),
              tooltip: 'Select All',
              onPressed: () => provider.selectAllOrders(),
            ),
            Text('${state.selectedOrderIds.length}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            IconButton(
              icon: const Icon(Icons.close, size: 20),
              onPressed: () { provider.clearSelection(); setState(() => _isSelectionMode = false); },
            ),
          ] else ...[
            IconButton(
              icon: Icon(_isSearchOpen ? Icons.close : Icons.search, size: 20),
              onPressed: () => setState(() => _isSearchOpen = !_isSearchOpen),
            ),
            IconButton(
              icon: Stack(children: [
                const Icon(Icons.filter_list, size: 20),
                if (state.filter.hasActiveFilters)
                  Positioned(right: 0, top: 0, child: Container(
                    width: 8, height: 8,
                    decoration: const BoxDecoration(color: AppColors.danger, shape: BoxShape.circle),
                  )),
              ]),
              onPressed: _showFilterSheet,
            ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, size: 20),
              onSelected: _handleMenuAction,
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'select', child: Text('Select Mode')),
                const PopupMenuItem(value: 'export', child: Text('Export Orders')),
                const PopupMenuItem(value: 'refresh', child: Text('Refresh')),
              ],
            ),
          ],
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelPadding: const EdgeInsets.symmetric(horizontal: 12),
          tabs: _tabs.map((t) => Tab(
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(t.icon, size: 14),
              const SizedBox(width: 4),
              Text(t.label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
            ]),
          )).toList(),
        ),
      ),
      body: Column(children: [
        if (_isSelectionMode && state.selectedOrderIds.isNotEmpty)
          _BulkActionBar(
            selectedCount: state.selectedOrderIds.length,
            isProcessing: state.isBulkActionInProgress,
            onAction: (action) => _executeBulkAction(action),
          ),
        Expanded(child: state.isLoading && state.orders.isEmpty
          ? const Center(child: NxLoadingSpinner())
          : RepaintBoundary(
              child: RefreshIndicator(
                onRefresh: () => provider.loadOrders(refresh: true),
                child: _buildTabContent(provider, state),
              ),
            )),
        if (state.error != null)
          _ErrorBanner(message: state.error!, onDismiss: () => provider.clearError()),
      ]),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateOrder(),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add, size: 20),
        label: Text('New Order', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _buildTabContent(OrdersProvider provider, OrdersState state) {
    final tab = _tabs[_tabController.index].key;
    final orders = provider.getFilteredByTab(tab);

    if (orders.isEmpty) {
      return NxEmptyState(
        icon: Icons.receipt_long,
        title: 'No $tab orders',
        subtitle: tab == 'active' ? 'All active orders will appear here' : 'No orders with this status',
      );
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification && notification.metrics.pixels >= notification.metrics.maxScrollExtent * 0.9) {
          provider.loadMore();
        }
        return false;
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(AppDimens.base),
        itemCount: orders.length + (state.isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= orders.length) {
            return const Center(child: Padding(
              padding: EdgeInsets.all(AppDimens.base),
              child: NxLoadingSpinner(),
            ));
          }
          final order = orders[index];
          final isSelected = state.selectedOrderIds.contains(order.id);
          return OrderCard(
            order: order,
            isSelected: isSelected,
            isSelectionMode: _isSelectionMode,
            onTap: () {
              if (_isSelectionMode) {
                provider.toggleOrderSelection(order.id);
              } else {
                _openOrderDetail(order.id);
              }
            },
            onLongPress: () {
              if (!_isSelectionMode) {
                setState(() => _isSelectionMode = true);
                provider.toggleOrderSelection(order.id);
              }
            },
            onStatusChange: (status) => provider.updateStatus(order.id, status),
            onCancel: () => _confirmCancel(order.id),
            onPrint: () => provider.printKot(order.id),
          );
        },
      ),
    );
  }

  void _showFilterSheet() {
    final provider = ref.read(ordersProvider);
    showModalBottomSheet(
      context: context, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => OrderFilterSheet(
        currentFilter: provider.state.filter,
        onApply: (filter) => provider.applyFilter(filter),
        onClear: () => provider.clearFilters(),
      ),
    );
  }

  void _openOrderDetail(String orderId) {
    ref.read(ordersProvider).selectOrder(orderId);
    Navigator.push(context, MaterialPageRoute(builder: (_) => const _OrderDetailPlaceholder()));
  }

  void _showCreateOrder() {
    // Will be wired to full create order sheet in Phase 3.8
  }

  void _confirmCancel(String orderId) {
    final provider = ref.read(ordersProvider);
    showDialog(
      context: context,
      builder: (ctx) => NxConfirmationDialog(
        title: 'Cancel Order',
        message: 'Are you sure you want to cancel this order?',
        confirmLabel: 'Cancel Order',
        confirmColor: AppColors.danger,
        onConfirm: () { Navigator.pop(ctx); provider.cancelOrder(orderId); },
      ),
    );
  }

  void _handleMenuAction(String action) {
    final provider = ref.read(ordersProvider);
    switch (action) {
      case 'select':
        setState(() => _isSelectionMode = true);
      case 'refresh':
        provider.loadOrders(refresh: true);
      case 'export':
        break;
    }
  }

  void _executeBulkAction(BulkActionType action) {
    final provider = ref.read(ordersProvider);
    final ids = provider.state.selectedOrderIds.toList();
    provider.executeBulkAction(BulkActionRequest(action: action, orderIds: ids));
    setState(() => _isSelectionMode = false);
  }
}

class _TabDef {
  final String key;
  final String label;
  final IconData icon;
  const _TabDef(this.key, this.label, this.icon);
}

class _CountBadge extends StatelessWidget {
  final int count;
  const _CountBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppDimens.radiusFull),
      ),
      child: Text('$count', style: GoogleFonts.inter(
        fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primary)),
    );
  }
}

class _BulkActionBar extends StatelessWidget {
  final int selectedCount;
  final bool isProcessing;
  final ValueChanged<BulkActionType> onAction;
  const _BulkActionBar({required this.selectedCount, required this.isProcessing, required this.onAction});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppDimens.base, vertical: 8),
      color: AppColors.primary.withValues(alpha: 0.05),
      child: Row(children: [
        Text('$selectedCount selected', style: GoogleFonts.inter(
          fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary)),
        const Spacer(),
        ...BulkActionType.values.take(4).map((action) => Padding(
          padding: const EdgeInsets.only(left: 4),
          child: ActionChip(
            avatar: Icon(action.icon, size: 14),
            label: Text(action.label, style: GoogleFonts.inter(fontSize: 11)),
            onPressed: isProcessing ? null : () => onAction(action),
            visualDensity: VisualDensity.compact,
            padding: EdgeInsets.zero,
          ),
        )),
      ]),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback onDismiss;
  const _ErrorBanner({required this.message, required this.onDismiss});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.danger.withValues(alpha: 0.1),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(children: [
          const Icon(Icons.error_outline, size: 16, color: AppColors.danger),
          const SizedBox(width: 8),
          Expanded(child: Text(message, style: GoogleFonts.inter(
            fontSize: 12, color: AppColors.danger), maxLines: 1, overflow: TextOverflow.ellipsis)),
          IconButton(
            icon: const Icon(Icons.close, size: 16, color: AppColors.danger),
            onPressed: onDismiss, visualDensity: VisualDensity.compact,
          ),
        ]),
      ),
    );
  }
}

class _OrderDetailPlaceholder extends StatelessWidget {
  const _OrderDetailPlaceholder();
  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: NxLoadingSpinner()));
  }
}
