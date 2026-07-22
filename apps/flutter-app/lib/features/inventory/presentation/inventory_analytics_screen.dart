import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/inventory_models.dart';

class InventoryAnalyticsScreen extends ConsumerStatefulWidget {
  const InventoryAnalyticsScreen({super.key});

  @override
  ConsumerState<InventoryAnalyticsScreen> createState() =>
      _InventoryAnalyticsScreenState();
}

class _InventoryAnalyticsScreenState
    extends ConsumerState<InventoryAnalyticsScreen> {
  late final dynamic _api;
  List<InventoryItem> _items = [];
  List<dynamic> _stockMovements = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final raw = await _api.getInventoryItems();
      if (mounted) {
        final items = (raw as List<dynamic>)
            .map((j) => InventoryItem.fromJson(j as Map<String, dynamic>))
            .toList();

        final movements = <dynamic>[];
        for (final item in items) {
          movements.addAll(item.recentMovements);
        }
        movements.sort((a, b) {
          final da = a.createdAt as DateTime? ?? DateTime.now();
          final db = b.createdAt as DateTime? ?? DateTime.now();
          return db.compareTo(da);
        });

        setState(() {
          _items = items;
          _stockMovements = movements;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  double get _totalValue =>
      _items.fold<double>(0, (sum, i) => sum + i.stockValue);

  double get _totalCostValue =>
      _items.fold<double>(0, (sum, i) => sum + (i.currentStock * i.costPrice));

  int get _totalItems => _items.length;

  int get _lowStockCount => _items.where((i) => i.isLowStock && !i.isOutOfStock).length;

  int get _outOfStockCount => _items.where((i) => i.isOutOfStock).length;

  double get _turnoverRate {
    final totalConsumed = _stockMovements
        .where((m) => m.type.isDeduction)
        .fold<double>(0, (sum, m) => sum + m.quantity.abs());
    final avgStock = _totalItems > 0 ? _totalValue / _totalItems : 0;
    return avgStock > 0 ? totalConsumed / avgStock : 0;
  }

  double get _foodCostPercent {
    final totalSales = _stockMovements
        .where((m) => m.type == StockMovementType.sale)
        .fold<double>(0, (sum, m) => sum + (m.totalCost ?? 0));
    return totalSales > 0 ? (_totalCostValue / totalSales * 100) : 0;
  }

  Map<String, double> get _categoryValues {
    final map = <String, double>{};
    for (final item in _items) {
      final cat = item.category ?? 'Uncategorized';
      map[cat] = (map[cat] ?? 0) + item.stockValue;
    }
    final sorted = map.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return Map.fromEntries(sorted.take(8));
  }

  List<InventoryItem> get _topConsumingItems {
    final map = <String, double>{};
    for (final m in _stockMovements) {
      if (m.type.isDeduction) {
        final name = m.itemName ?? m.inventoryItemId;
        map[name] = (map[name] ?? 0) + m.quantity.abs();
      }
    }
    final sorted = map.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return sorted.take(5).map((e) {
      return _items.firstWhere(
        (i) => i.name == e.key || i.id == e.key,
        orElse: () => _items.first,
      );
    }).toList();
  }

  List<InventoryItem> get _slowMovingItems {
    return _items
        .where((i) =>
            i.currentStock > 0 &&
            (i.recentMovements.isEmpty ||
                i.recentMovements.every((m) =>
                    m.type == StockMovementType.purchase ||
                    m.type == StockMovementType.receive)))
        .toList()
      ..sort((a, b) => b.stockValue.compareTo(a.stockValue));
  }

  List<InventoryItem> get _agingItems {
    final now = DateTime.now();
    return _items.where((i) {
      if (i.updatedAt == null) return true;
      return now.difference(i.updatedAt!).inDays > 60;
    }).toList()
      ..sort((a, b) {
        final aDate = a.updatedAt ?? DateTime(2000);
        final bDate = b.updatedAt ?? DateTime(2000);
        return aDate.compareTo(bDate);
      });
  }

  @override
  Widget build(BuildContext context) {
    final maxCategoryValue = _categoryValues.isNotEmpty
        ? _categoryValues.values.first
        : 1.0;

    return Scaffold(
      appBar: AppBar(
        title: Text('Analytics', style: AppTextStyles.h2),
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text('Key Metrics', style: AppTextStyles.h3),
                  const SizedBox(height: 8),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1.4,
                    children: [
                      _kpiCard(
                        'Total Value',
                        '₹${_totalValue.toStringAsFixed(0)}',
                        Icons.account_balance_wallet,
                        AppColors.primary,
                        '$_totalItems items',
                      ),
                      _kpiCard(
                        'Turnover Rate',
                        _turnoverRate.toStringAsFixed(1),
                        Icons.autorenew,
                        AppColors.success,
                        'times per period',
                      ),
                      _kpiCard(
                        'Food Cost %',
                        '${_foodCostPercent.toStringAsFixed(1)}%',
                        Icons.pie_chart,
                        _foodCostPercent > 35 ? AppColors.danger : AppColors.success,
                        _foodCostPercent > 35 ? 'Above target' : 'Within target',
                      ),
                      _kpiCard(
                        'Stock Aging',
                        '${_agingItems.length}',
                        Icons.schedule,
                        _agingItems.length > 5 ? AppColors.warning : AppColors.success,
                        'items > 60 days',
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _miniStat('Low Stock', '$_lowStockCount', AppColors.warning),
                      const SizedBox(width: 8),
                      _miniStat(
                          'Out of Stock', '$_outOfStockCount', AppColors.danger),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text('Category Distribution', style: AppTextStyles.h3),
                  const SizedBox(height: 4),
                  Text(
                    'Inventory value by category',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.gray500,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (_categoryValues.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        'No category data available',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.gray400,
                        ),
                      ),
                    )
                  else
                    ..._categoryValues.entries.map((entry) {
                      final pct = maxCategoryValue > 0
                          ? (entry.value / maxCategoryValue * 100)
                              .clamp(0.0, 100.0)
                          : 0.0;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(entry.key, style: AppTextStyles.bodyMedium),
                                Text(
                                  '₹${entry.value.toStringAsFixed(0)}',
                                  style: AppTextStyles.labelLarge.copyWith(
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(3),
                              child: LinearProgressIndicator(
                                value: pct / 100,
                                backgroundColor: AppColors.gray100,
                                color: AppColors.primary,
                                minHeight: 6,
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  if (_topConsumingItems.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Text('Top Consuming Items', style: AppTextStyles.h3),
                    const SizedBox(height: 4),
                    Text(
                      'Highest consumption by quantity',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.gray500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ..._topConsumingItems.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final item = entry.value;
                      return NxCard(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        child: Row(
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Center(
                                child: Text(
                                  '${idx + 1}',
                                  style: AppTextStyles.labelSmall.copyWith(
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    style: AppTextStyles.labelLarge,
                                  ),
                                  Text(
                                    '${item.unit} • ₹${item.costPrice.toStringAsFixed(0)}/${item.unit}',
                                    style: AppTextStyles.bodySmall.copyWith(
                                      color: AppColors.gray500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  item.currentStock.toStringAsFixed(1),
                                  style: AppTextStyles.statValue.copyWith(
                                    fontSize: 14,
                                  ),
                                ),
                                Text(
                                  'in stock',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.gray400,
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                  if (_slowMovingItems.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Text('Slow Moving Items', style: AppTextStyles.h3),
                    const SizedBox(height: 4),
                    Text(
                      'Items with minimal or no recent movement',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.gray500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ..._slowMovingItems.take(5).map((item) {
                      final daysSinceUpdate = item.updatedAt != null
                          ? DateTime.now()
                              .difference(item.updatedAt!)
                              .inDays
                          : 0;
                      return NxCard(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppColors.warning.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Icon(
                                Icons.schedule,
                                size: 16,
                                color: AppColors.warning,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    style: AppTextStyles.labelLarge,
                                  ),
                                  Text(
                                    '${item.unit} • ₹${item.stockValue.toStringAsFixed(0)} value',
                                    style: AppTextStyles.bodySmall.copyWith(
                                      color: AppColors.gray500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '$daysSinceUpdate days',
                                  style: AppTextStyles.labelSmall.copyWith(
                                    color: daysSinceUpdate > 90
                                        ? AppColors.danger
                                        : AppColors.warning,
                                  ),
                                ),
                                Text(
                                  'no movement',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.gray400,
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _kpiCard(
    String title,
    String value,
    IconData icon,
    Color color,
    String subtitle,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, size: 18, color: color),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: AppTextStyles.statValue.copyWith(
              fontSize: 18,
              color: color,
            ),
          ),
          Text(
            title,
            style: AppTextStyles.labelMedium.copyWith(
              color: AppColors.gray600,
            ),
          ),
          Text(
            subtitle,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.gray400,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  Widget _miniStat(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.15)),
        ),
        child: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '$value',
              style: AppTextStyles.labelLarge.copyWith(color: color),
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.gray500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
