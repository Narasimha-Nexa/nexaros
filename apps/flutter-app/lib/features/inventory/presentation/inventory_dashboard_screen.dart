import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../data/inventory_models.dart';
import '../providers/inventory_provider.dart';

class InventoryDashboardScreen extends ConsumerStatefulWidget {
  const InventoryDashboardScreen({super.key});

  @override
  ConsumerState<InventoryDashboardScreen> createState() => _InventoryDashboardScreenState();
}

class _InventoryDashboardScreenState extends ConsumerState<InventoryDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(inventoryProvider).loadAll();
    });
  }

  @override
  Widget build(BuildContext context) {
    final inv = ref.watch(inventoryProvider);
    final state = inv.state;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.inventory_2, size: 20),
            const SizedBox(width: 8),
            Text('Inventory', style: AppTextStyles.h2),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: () => inv.loadAll(),
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
              ? Center(child: Text('Error: ${state.error}'))
              : RefreshIndicator(
                  onRefresh: () => inv.loadAll(),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildKpiRow(state),
                        const SizedBox(height: 16),
                        _buildQuickActions(context),
                        const SizedBox(height: 16),
                        if (state.suggestions.isNotEmpty) ...[
                          _buildPurchaseSuggestions(state.suggestions),
                          const SizedBox(height: 16),
                        ],
                        if (state.insights.isNotEmpty) ...[
                          _buildInsights(state.insights),
                          const SizedBox(height: 16),
                        ],
                        _buildLowStockAlert(state.lowStockItems),
                        const SizedBox(height: 16),
                        _buildRecentMovements(state.recentMovements),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildKpiRow(InventoryState state) {
    final dashboard = state.dashboard;
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        _KpiCard('Total Value', '₹${dashboard.totalValue.toStringAsFixed(0)}', AppColors.primary, Icons.account_balance_wallet),
        _KpiCard('Items', '${dashboard.totalItems}', AppColors.primary, Icons.inventory_2),
        _KpiCard('Low Stock', '${dashboard.lowStockCount}', AppColors.warning, Icons.warning_amber),
        _KpiCard('Out of Stock', '${dashboard.outOfStockCount}', AppColors.danger, Icons.error_outline),
        _KpiCard('Health Score', '${dashboard.healthScore.toStringAsFixed(0)}%', AppColors.success, Icons.favorite),
        _KpiCard('Pending PO', '${dashboard.pendingPurchaseOrders}', AppColors.primary, Icons.shopping_cart),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      _ActionData('Products', Icons.inventory, '/shell/inventory/items'),
      _ActionData('Purchases', Icons.shopping_cart, '/shell/inventory/purchase-orders'),
      _ActionData('Suppliers', Icons.business, '/shell/inventory/suppliers'),
      _ActionData('Recipes', Icons.restaurant_menu, '/shell/inventory/recipes'),
      _ActionData('Stock Count', Icons.fact_check, '/shell/inventory/stock-count'),
      _ActionData('Transfers', Icons.swap_horiz, '/shell/inventory/transfers'),
      _ActionData('Waste', Icons.delete_outline, '/shell/inventory/waste'),
      _ActionData('Analytics', Icons.analytics, '/shell/inventory/analytics'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Quick Actions', style: AppTextStyles.h3),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 1,
          ),
          itemCount: actions.length,
          itemBuilder: (context, index) {
            final a = actions[index];
            return InkWell(
              onTap: () => context.push(a.route),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(a.icon, size: 24, color: AppColors.primary),
                    const SizedBox(height: 4),
                    Text(a.label, style: AppTextStyles.labelSmall, textAlign: TextAlign.center),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildPurchaseSuggestions(List<PurchaseSuggestion> suggestions) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.shopping_cart_checkout, size: 18, color: AppColors.primary),
            const SizedBox(width: 6),
            Text('Purchase Suggestions', style: AppTextStyles.h3),
          ],
        ),
        const SizedBox(height: 8),
        ...suggestions.take(5).map((s) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: s.urgency == 'critical'
                ? AppColors.danger.withValues(alpha: 0.1)
                : AppColors.warning.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: s.urgency == 'critical' ? AppColors.danger.withValues(alpha: 0.3) : AppColors.warning.withValues(alpha: 0.3),
            ),
          ),
          child: Row(
            children: [
              Icon(
                s.urgency == 'critical' ? Icons.error : Icons.warning,
                size: 16,
                color: s.urgency == 'critical' ? AppColors.danger : AppColors.warning,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.itemName, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                    Text(
                      'Stock: ${s.currentStock} | Reorder: ${s.reorderLevel} | Suggest: ${s.suggestedQuantity.toStringAsFixed(0)}',
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ),
              ),
              Text('₹${s.estimatedCost.toStringAsFixed(0)}', style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
        )),
      ],
    );
  }

  Widget _buildInsights(List<InventoryInsight> insights) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.lightbulb, size: 18, color: Colors.amber),
            const SizedBox(width: 6),
            Text('AI Insights', style: AppTextStyles.h3),
          ],
        ),
        const SizedBox(height: 8),
        ...insights.take(3).map((i) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: i.type == 'critical'
                ? AppColors.danger.withValues(alpha: 0.1)
                : i.type == 'warning'
                    ? AppColors.warning.withValues(alpha: 0.1)
                    : AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(
                i.type == 'critical' ? Icons.error : i.type == 'warning' ? Icons.warning : Icons.info,
                size: 16,
                color: i.type == 'critical' ? AppColors.danger : i.type == 'warning' ? AppColors.warning : AppColors.primary,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(i.title, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                    Text(i.description, style: AppTextStyles.bodySmall),
                  ],
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }

  Widget _buildLowStockAlert(List<InventoryItem> lowStock) {
    if (lowStock.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.warning_amber, size: 18, color: AppColors.warning),
            const SizedBox(width: 6),
            Text('Low Stock Alert', style: AppTextStyles.h3),
            const Spacer(),
            TextButton(
              onPressed: () => context.push('/shell/inventory/items'),
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...lowStock.take(5).map((item) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 40,
                decoration: BoxDecoration(
                  color: item.stockLevel.color,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.name, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                    Text('Stock: ${item.currentStock} ${item.unit} | Min: ${item.minimumStock}', style: AppTextStyles.bodySmall),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: item.stockLevel.color.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  item.stockLevel.label,
                  style: AppTextStyles.labelSmall.copyWith(color: item.stockLevel.color),
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }

  Widget _buildRecentMovements(List<StockMovement> movements) {
    if (movements.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Recent Movements', style: AppTextStyles.h3),
        const SizedBox(height: 8),
        ...movements.take(10).map((m) => Container(
          margin: const EdgeInsets.only(bottom: 6),
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: m.type.color.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(m.type.icon, size: 16, color: m.type.color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(m.itemName ?? 'Unknown', style: AppTextStyles.bodyMedium),
                    Text(m.type.label, style: AppTextStyles.bodySmall),
                  ],
                ),
              ),
              Text(
                '${m.isAddition ? '+' : '-'}${m.quantity.toStringAsFixed(1)}',
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.bold,
                  color: m.isAddition ? AppColors.success : AppColors.danger,
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;
  const _KpiCard(this.label, this.value, this.color, this.icon);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 150,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(value, style: AppTextStyles.h2.copyWith(color: color)),
          const SizedBox(height: 2),
          Text(label, style: AppTextStyles.bodySmall),
        ],
      ),
    );
  }
}

class _ActionData {
  final String label;
  final IconData icon;
  final String route;
  const _ActionData(this.label, this.icon, this.route);
}
