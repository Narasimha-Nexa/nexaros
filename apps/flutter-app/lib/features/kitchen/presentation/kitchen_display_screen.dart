import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../data/kitchen_models.dart';
import '../providers/kitchen_provider.dart';
import 'widgets/kitchen_order_card.dart';
import 'widgets/kitchen_search_bar.dart';

class KitchenDisplayScreen extends ConsumerStatefulWidget {
  const KitchenDisplayScreen({super.key});
  @override
  ConsumerState<KitchenDisplayScreen> createState() => _KitchenDisplayScreenState();
}

class _KitchenDisplayScreenState extends ConsumerState<KitchenDisplayScreen> {
  Timer? _timerTick;
  String _selectedView = 'all'; // all, pending, cooking, ready, rush, delayed

  @override
  void initState() {
    super.initState();
    // 1-second tick for elapsed time display updates
    _timerTick = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
    // Initial load — Socket.IO handles subsequent updates
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadOrders());
  }

  void _loadOrders() {
    ref.read(kitchenProvider).loadOrders();
  }

  @override
  void dispose() {
    _timerTick?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final kitchen = ref.watch(kitchenProvider);
    final state = kitchen.state;
    final orders = _getFilteredOrders(state);

    return Scaffold(
      backgroundColor: state.isTvMode ? Colors.black : cs.surface,
      appBar: state.isTvMode ? null : _buildAppBar(cs, state, kitchen),
      body: RepaintBoundary(
        child: state.isTvMode ? _buildTvLayout(orders, state, kitchen) : _buildStandardLayout(orders, state, kitchen),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(ColorScheme cs, KitchenState state, KitchenProvider kitchen) {
    return AppBar(
      elevation: 0,
      backgroundColor: cs.surface,
      title: Row(children: [
        const Icon(Icons.restaurant_menu, size: 20),
        const SizedBox(width: 8),
        Text('Kitchen Display', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        const SizedBox(width: 12),
        // Live connection indicator
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: AppColors.success.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: AppColors.success,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 5),
              Text('LIVE', style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: AppColors.success,
                letterSpacing: 0.5,
              )),
            ],
          ),
        ),
        const SizedBox(width: 16),
        _CountBadge('New', state.pendingCount, KitchenOrderStatus.pending.color),
        const SizedBox(width: 6),
        _CountBadge('Cooking', state.preparingCount, KitchenOrderStatus.cooking.color),
        const SizedBox(width: 6),
        _CountBadge('Ready', state.readyCount, KitchenOrderStatus.ready.color),
        if (state.rushCount > 0) ...[
          const SizedBox(width: 6),
          _CountBadge('Rush', state.rushCount, KitchenOrderStatus.rush.color),
        ],
        if (state.delayedCount > 0) ...[
          const SizedBox(width: 6),
          _CountBadge('Delayed', state.delayedCount, AppColors.danger),
        ],
      ]),
      actions: [
        if (state.selectedOrderIds.isNotEmpty)
          IconButton(
            icon: Badge(
              label: Text('${state.selectedOrderIds.length}', style: const TextStyle(color: Colors.white, fontSize: 10)),
              child: const Icon(Icons.checklist, size: 20),
            ),
            tooltip: 'Bulk Actions',
            onPressed: () => _showBulkActions(state, kitchen),
          ),
        IconButton(
          icon: Icon(state.soundEnabled ? Icons.volume_up : Icons.volume_off, size: 20),
          tooltip: state.soundEnabled ? 'Sound ON' : 'Sound OFF',
          onPressed: () => kitchen.toggleSound(),
        ),
        IconButton(
          icon: Icon(state.isTvMode ? Icons.fullscreen_exit : Icons.fullscreen, size: 20),
          tooltip: state.isTvMode ? 'Exit TV Mode' : 'TV Mode',
          onPressed: () => kitchen.toggleTvMode(),
        ),
        if (state.unreadNotificationCount > 0)
          Badge(
            label: Text('${state.unreadNotificationCount}', style: const TextStyle(color: Colors.white, fontSize: 10)),
            child: IconButton(
              icon: const Icon(Icons.notifications, size: 20),
              onPressed: () {
                kitchen.markNotificationsRead();
                _showNotifications(state);
              },
            ),
          )
        else
          IconButton(
            icon: const Icon(Icons.notifications_none, size: 20),
            onPressed: () => _showNotifications(state),
          ),
        IconButton(
          icon: const Icon(Icons.refresh, size: 20),
          onPressed: _loadOrders,
        ),
      ],
    );
  }

  Widget _buildStandardLayout(List<KitchenOrder> orders, KitchenState state, KitchenProvider kitchen) {
    return Column(children: [
      // Search bar
      const Padding(
        padding: EdgeInsets.fromLTRB(12, 8, 12, 0),
        child: KitchenSearchBar(),
      ),
      // View filter chips
      _buildViewChips(state),
      // Orders grid
      Expanded(
        child: orders.isEmpty
            ? _buildEmptyState(state)
            : RefreshIndicator(
                onRefresh: () async => _loadOrders(),
                child: _buildOrdersGrid(orders, state, kitchen, false),
              ),
      ),
    ]);
  }

  Widget _buildTvLayout(List<KitchenOrder> orders, KitchenState state, KitchenProvider kitchen) {
    return Column(children: [
      // TV top bar
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
        color: Colors.black,
        child: Row(children: [
          const Icon(Icons.restaurant_menu, color: Colors.white, size: 26),
          const SizedBox(width: 12),
          Text('KITCHEN DISPLAY', style: GoogleFonts.inter(
            fontWeight: FontWeight.w800, fontSize: 18, color: Colors.white, letterSpacing: 2)),
          const Spacer(),
          _TvTab('ALL', state.activeOrders.length, AppColors.primary, _selectedView == 'all', () => setState(() => _selectedView = 'all')),
          const SizedBox(width: 6),
          _TvTab('NEW', state.pendingCount, KitchenOrderStatus.pending.color, _selectedView == 'pending', () => setState(() => _selectedView = 'pending')),
          const SizedBox(width: 6),
          _TvTab('COOKING', state.preparingCount, KitchenOrderStatus.cooking.color, _selectedView == 'cooking', () => setState(() => _selectedView = 'cooking')),
          const SizedBox(width: 6),
          _TvTab('READY', state.readyCount, KitchenOrderStatus.ready.color, _selectedView == 'ready', () => setState(() => _selectedView = 'ready')),
          const SizedBox(width: 6),
          _TvTab('RUSH', state.rushCount, Colors.red, _selectedView == 'rush', () => setState(() => _selectedView = 'rush')),
          const SizedBox(width: 6),
          _TvTab('DELAYED', state.delayedCount, AppColors.warning, _selectedView == 'delayed', () => setState(() => _selectedView = 'delayed')),
          const SizedBox(width: 16),
          Text(
            '${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}',
            style: GoogleFonts.inter(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ]),
      ),
      // Search
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        color: Colors.grey[900],
        child: const KitchenSearchBar(darkMode: true),
      ),
      // Orders
      Expanded(
        child: orders.isEmpty
            ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Icon(Icons.check_circle_outline, size: 64, color: Colors.white24),
                const SizedBox(height: 16),
                Text('All Clear!', style: GoogleFonts.inter(fontSize: 24, color: Colors.white54, fontWeight: FontWeight.w700)),
              ]))
            : _buildOrdersGrid(orders, state, kitchen, true),
      ),
    ]);
  }

  Widget _buildViewChips(KitchenState state) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(children: [
        _FilterChip('All', state.orders.length, _selectedView == 'all', AppColors.primary, () {
          setState(() => _selectedView = 'all');
          ref.read(kitchenProvider).clearFilters();
        }),
        const SizedBox(width: 6),
        _FilterChip('New', state.pendingCount, _selectedView == 'pending', KitchenOrderStatus.pending.color, () {
          setState(() => _selectedView = 'pending');
          ref.read(kitchenProvider).updateFilter((f) => f.copyWith(statuses: [KitchenOrderStatus.pending]));
        }),
        const SizedBox(width: 6),
        _FilterChip('Cooking', state.preparingCount, _selectedView == 'cooking', KitchenOrderStatus.cooking.color, () {
          setState(() => _selectedView = 'cooking');
          ref.read(kitchenProvider).updateFilter((f) => f.copyWith(statuses: [KitchenOrderStatus.preparing, KitchenOrderStatus.cooking]));
        }),
        const SizedBox(width: 6),
        _FilterChip('Ready', state.readyCount, _selectedView == 'ready', KitchenOrderStatus.ready.color, () {
          setState(() => _selectedView = 'ready');
          ref.read(kitchenProvider).updateFilter((f) => f.copyWith(statuses: [KitchenOrderStatus.ready]));
        }),
        if (state.rushCount > 0) ...[
          const SizedBox(width: 6),
          _FilterChip('Rush', state.rushCount, _selectedView == 'rush', Colors.red, () {
            setState(() => _selectedView = 'rush');
            ref.read(kitchenProvider).updateFilter((f) => f.copyWith(showRushOnly: true));
          }),
        ],
        if (state.delayedCount > 0) ...[
          const SizedBox(width: 6),
          _FilterChip('Delayed', state.delayedCount, _selectedView == 'delayed', AppColors.warning, () {
            setState(() => _selectedView = 'delayed');
            ref.read(kitchenProvider).updateFilter((f) => f.copyWith(showDelayedOnly: true));
          }),
        ],
      ]),
    );
  }

  Widget _buildOrdersGrid(List<KitchenOrder> orders, KitchenState state, KitchenProvider kitchen, bool isTvMode) {
    final crossCount = isTvMode ? _tvCrossAxisCount(context) : _standardCrossAxisCount(context);
    return GridView.builder(
      padding: EdgeInsets.all(isTvMode ? 12 : AppDimens.base),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossCount,
        childAspectRatio: isTvMode ? 0.85 : 0.78,
        mainAxisSpacing: isTvMode ? 10 : AppDimens.sm,
        crossAxisSpacing: isTvMode ? 10 : AppDimens.sm,
      ),
      itemCount: orders.length,
      itemBuilder: (context, index) => KitchenOrderCard(
        order: orders[index],
        isTvMode: isTvMode,
        isSelected: state.selectedOrderIds.contains(orders[index].id),
        onSelect: () => kitchen.toggleOrderSelection(orders[index].id),
        onStatusChange: (status) => kitchen.updateOrderStatus(orders[index].id, status),
        onItemStatusChange: (itemId, status) => kitchen.updateItemStatus(orders[index].id, itemId, status),
        onBump: () => kitchen.bumpOrder(orders[index].id),
        onRush: () => kitchen.rushOrder(orders[index].id),
        onHold: () => kitchen.holdOrder(orders[index].id),
        onRecall: () => kitchen.recallOrder(orders[index].id),
        onAssignChef: (chefId, chefName) => kitchen.assignChef(orders[index].id, chefId, chefName),
        onFireCourse: (course) => kitchen.fireCourse(orders[index].id, course),
        slaConfig: state.slaConfig,
      ),
    );
  }

  Widget _buildEmptyState(KitchenState state) {
    if (state.isLoading) return const Center(child: CircularProgressIndicator());
    if (state.error != null) {
      return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
        const SizedBox(height: 12),
        Text('Error: ${state.error}', style: GoogleFonts.inter(color: AppColors.danger)),
        const SizedBox(height: 12),
        ElevatedButton(onPressed: _loadOrders, child: const Text('Retry')),
      ]));
    }
    return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(Icons.restaurant_menu, size: 48, color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.3)),
      const SizedBox(height: 12),
      Text('No orders in kitchen', style: GoogleFonts.inter(
        fontSize: 16, color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.5))),
    ]));
  }

  List<KitchenOrder> _getFilteredOrders(KitchenState state) {
    var orders = state.orders;
    switch (_selectedView) {
      case 'pending': orders = state.pendingOrders; break;
      case 'cooking': orders = state.preparingOrders; break;
      case 'ready': orders = state.readyOrders; break;
      case 'rush': orders = state.rushOrders; break;
      case 'delayed': orders = state.delayedOrders; break;
      default: orders = state.filteredOrders;
    }
    return orders;
  }

  int _tvCrossAxisCount(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width > 1920) return 5;
    if (width > 1400) return 4;
    if (width > 1000) return 3;
    return 2;
  }

  int _standardCrossAxisCount(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width > 1200) return 4;
    if (width > 900) return 3;
    if (width > 600) return 2;
    return 1;
  }

  void _showNotifications(KitchenState state) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.5, minChildSize: 0.3, maxChildSize: 0.8, expand: false,
        builder: (ctx, scrollController) => ListView(
          controller: scrollController,
          padding: const EdgeInsets.all(16),
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),
            Text('Notifications', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 18)),
            const SizedBox(height: 12),
            if (state.notifications.isEmpty)
              Padding(padding: const EdgeInsets.all(24), child: Text('No notifications', style: GoogleFonts.inter(color: Colors.grey)))
            else
              ...state.notifications.take(20).map((n) => ListTile(
                leading: Icon(n.type == KitchenNotificationType.orderRush ? Icons.bolt : Icons.notifications,
                  color: n.type == KitchenNotificationType.orderDelayed ? AppColors.danger : AppColors.primary),
                title: Text(n.title, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                subtitle: Text(n.message, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey)),
                dense: true,
              )),
          ],
        ),
      ),
    );
  }

  void _showBulkActions(KitchenState state, KitchenProvider kitchen) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Text('${state.selectedOrderIds.length} orders selected', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        ),
        ListTile(leading: const Icon(Icons.check_circle), title: const Text('Mark All Ready'),
          onTap: () { Navigator.pop(ctx); kitchen.bulkUpdateStatus(state.selectedOrderIds, KitchenOrderStatus.ready); }),
        ListTile(leading: const Icon(Icons.cancel), title: const Text('Cancel All'),
          onTap: () { Navigator.pop(ctx); kitchen.bulkUpdateStatus(state.selectedOrderIds, KitchenOrderStatus.cancelled); }),
        ListTile(leading: const Icon(Icons.clear_all), title: const Text('Clear Selection'),
          onTap: () { Navigator.pop(ctx); kitchen.clearSelection(); }),
      ])),
    );
  }
}

// ─── Helper Widgets ───

class _CountBadge extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  const _CountBadge(this.label, this.count, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: count > 0 ? color.withValues(alpha: 0.15) : Colors.transparent,
        borderRadius: BorderRadius.circular(AppDimens.radiusFull),
        border: count > 0 ? Border.all(color: color.withValues(alpha: 0.3)) : null,
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: count > 0 ? color : Colors.grey, fontWeight: FontWeight.w500)),
        if (count > 0) ...[
          const SizedBox(width: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
            decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(10)),
            child: Text('$count', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
          ),
        ],
      ]),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final int count;
  final bool isSelected;
  final Color color;
  final VoidCallback onTap;
  const _FilterChip(this.label, this.count, this.isSelected, this.color, this.onTap);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? color : Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(AppDimens.radiusFull),
        ),
        child: Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: isSelected ? Colors.white : Colors.grey[600])),
      ),
    );
  }
}

class _TvTab extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final bool isSelected;
  final VoidCallback onTap;
  const _TvTab(this.label, this.count, this.color, this.isSelected, this.onTap);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.3) : Colors.white10,
          borderRadius: BorderRadius.circular(8),
          border: isSelected ? Border.all(color: color, width: 2) : null,
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
          if (count > 0) ...[
            const SizedBox(width: 5),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(10)),
              child: Text('$count', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
            ),
          ],
        ]),
      ),
    );
  }
}
