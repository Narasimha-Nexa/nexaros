import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/inventory_models.dart';

class WarehouseManagementScreen extends ConsumerStatefulWidget {
  const WarehouseManagementScreen({super.key});

  @override
  ConsumerState<WarehouseManagementScreen> createState() =>
      _WarehouseManagementScreenState();
}

class _WarehouseManagementScreenState
    extends ConsumerState<WarehouseManagementScreen> {
  late final dynamic _api;
  List<dynamic> _warehouses = [];
  List<InventoryItem> _items = [];
  bool _isLoading = true;
  String? _selectedWarehouseId;

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait<dynamic>([
        _api.getWarehouses().catchError((_) => <dynamic>[]),
        _api.getInventoryItems(),
      ]);
      if (mounted) {
        setState(() {
          _warehouses = results[0] as List<dynamic>;
          _items = (results[1] as List<dynamic>)
              .map((j) => InventoryItem.fromJson(j as Map<String, dynamic>))
              .toList();
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  int _itemCountForWarehouse(String warehouseId) {
    return _items.where((i) => i.warehouseId == warehouseId).length;
  }

  double _totalValueForWarehouse(String warehouseId) {
    return _items
        .where((i) => i.warehouseId == warehouseId)
        .fold<double>(0, (sum, i) => sum + i.stockValue);
  }

  List<InventoryItem> get _filteredItems {
    if (_selectedWarehouseId == null) return _items;
    return _items.where((i) => i.warehouseId == _selectedWarehouseId).toList();
  }

  void _onWarehouseTap(String? warehouseId) {
    setState(() {
      _selectedWarehouseId =
          _selectedWarehouseId == warehouseId ? null : warehouseId;
    });
  }

  IconData _warehouseIcon(String? type) {
    return switch (type?.toLowerCase()) {
      'kitchen' => Icons.restaurant,
      'cold' => Icons.ac_unit,
      'freezer' => Icons.ac_unit,
      'dry' => Icons.warehouse,
      'central' => Icons.domain,
      _ => Icons.store,
    };
  }

  Color _warehouseColor(String? type) {
    return switch (type?.toLowerCase()) {
      'kitchen' => AppColors.warning,
      'cold' => AppColors.info,
      'freezer' => AppColors.info,
      'dry' => AppColors.success,
      'central' => AppColors.primary,
      _ => AppColors.gray500,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Warehouses', style: AppTextStyles.h2),
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text('Storage Locations', style: AppTextStyles.h3),
                  const SizedBox(height: 4),
                  Text(
                    'Tap a warehouse to filter inventory by location',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.gray500,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (_warehouses.isEmpty)
                    NxEmptyState(
                      icon: Icons.warehouse_outlined,
                      title: 'No warehouses configured',
                      subtitle: 'Set up storage locations in settings',
                    )
                  else
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 1.1,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: _warehouses.length,
                      itemBuilder: (ctx, i) =>
                          _buildWarehouseCard(_warehouses[i]),
                    ),
                  if (_selectedWarehouseId != null) ...[
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Filtered Items (${_filteredItems.length})',
                            style: AppTextStyles.h3,
                          ),
                        ),
                        TextButton(
                          onPressed: () =>
                              setState(() => _selectedWarehouseId = null),
                          child: Text(
                            'Clear Filter',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ..._filteredItems.map((item) => _buildItemRow(item)),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildWarehouseCard(dynamic warehouse) {
    final id = warehouse['id'] as String? ?? '';
    final name = warehouse['name'] as String? ?? 'Unknown';
    final type = warehouse['type'] as String?;
    final isSelected = _selectedWarehouseId == id;
    final itemCount = _itemCountForWarehouse(id);
    final totalValue = _totalValueForWarehouse(id);
    final icon = _warehouseIcon(type);
    final color = _warehouseColor(type);

    return NxCard(
      onTap: () => _onWarehouseTap(id),
      borderColor: isSelected ? AppColors.primary : null,
      elevated: isSelected,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primary.withValues(alpha: 0.15)
                  : color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              size: 28,
              color: isSelected ? AppColors.primary : color,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            name,
            style: AppTextStyles.labelLarge,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            '$itemCount items',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.gray500,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '₹${totalValue.toStringAsFixed(0)}',
            style: AppTextStyles.statValue.copyWith(
              fontSize: 14,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemRow(InventoryItem item) {
    final isLow = item.isLowStock;
    return NxCard(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 36,
            decoration: BoxDecoration(
              color: isLow ? AppColors.danger : AppColors.success,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name, style: AppTextStyles.labelLarge),
                Text(
                  '${item.unit} • ${item.category ?? "Uncategorized"}',
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
                  color: isLow ? AppColors.danger : AppColors.gray800,
                ),
              ),
              Text(
                '₹${item.stockValue.toStringAsFixed(0)}',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.gray400,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
