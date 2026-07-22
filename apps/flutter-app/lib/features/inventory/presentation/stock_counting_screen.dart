import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/inventory_models.dart';

class StockCountingScreen extends ConsumerStatefulWidget {
  const StockCountingScreen({super.key});

  @override
  ConsumerState<StockCountingScreen> createState() =>
      _StockCountingScreenState();
}

class _StockCountingScreenState extends ConsumerState<StockCountingScreen> {
  late final dynamic _api;
  List<StockCount> _stockCounts = [];
  List<dynamic> _warehouses = [];
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
      final results = await Future.wait<dynamic>([
        _api.getStockCounts().catchError((_) => <dynamic>[]),
        _api.getWarehouses().catchError((_) => <dynamic>[]),
      ]);
      if (mounted) {
        setState(() {
          _stockCounts = (results[0] as List<dynamic>)
              .map((j) => StockCount.fromJson(j as Map<String, dynamic>))
              .toList();
          _warehouses = results[1] as List<dynamic>;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showCreateDialog() {
    final nameCtrl = TextEditingController();
    String? selectedWarehouseId;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.playlist_add, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              Text('New Stock Count', style: AppTextStyles.h3),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Count Name *',
                    prefixIcon: Icon(Icons.label, size: 20),
                    hintText: 'e.g., Monthly Count - Jan 2026',
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Warehouse *',
                    prefixIcon: Icon(Icons.warehouse, size: 20),
                  ),
                  items: _warehouses.map<DropdownMenuItem<String>>((w) {
                    return DropdownMenuItem<String>(
                      value: w['id'] as String?,
                      child: Text(w['name'] as String? ?? ''),
                    );
                  }).toList(),
                  onChanged: (v) =>
                      setDialogState(() => selectedWarehouseId = v),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (nameCtrl.text.trim().isEmpty ||
                    selectedWarehouseId == null) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(
                      content: Text('Name and warehouse are required'),
                      backgroundColor: AppColors.danger,
                    ),
                  );
                  return;
                }
                try {
                  await _api.createStockCount({
                    'name': nameCtrl.text.trim(),
                    'warehouseId': selectedWarehouseId,
                  });
                  if (ctx.mounted) Navigator.pop(ctx);
                  _loadData();
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(
                        content: Text('Error: $e'),
                        backgroundColor: AppColors.danger,
                      ),
                    );
                  }
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final draftCount =
        _stockCounts.where((sc) => sc.status == StockCountStatus.draft).length;
    final inProgressCount = _stockCounts
        .where((sc) => sc.status == StockCountStatus.inProgress)
        .length;
    final completedCount =
        _stockCounts.where((sc) => sc.status == StockCountStatus.completed).length;

    return Scaffold(
      appBar: AppBar(
        title: Text('Stock Counting', style: AppTextStyles.h2),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showCreateDialog,
          ),
        ],
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    children: [
                      _countSummaryChip('Draft', draftCount, AppColors.gray500),
                      const SizedBox(width: 8),
                      _countSummaryChip(
                          'In Progress', inProgressCount, AppColors.primary),
                      const SizedBox(width: 8),
                      _countSummaryChip(
                          'Completed', completedCount, AppColors.success),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_stockCounts.isEmpty)
                    NxEmptyState(
                      icon: Icons.playlist_add,
                      title: 'No stock counts',
                      subtitle: 'Create a stock count to reconcile inventory',
                      actionLabel: 'New Stock Count',
                      onAction: _showCreateDialog,
                    )
                  else
                    ..._stockCounts.map((sc) => _buildStockCountCard(sc)),
                ],
              ),
            ),
    );
  }

  Widget _countSummaryChip(String label, int count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Text(
              '$count',
              style: AppTextStyles.statValue.copyWith(
                fontSize: 18,
                color: color,
              ),
            ),
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(color: color),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStockCountCard(StockCount stockCount) {
    final statusColor = stockCount.status.color;
    final dateStr = DateFormat('MMM d, yyyy').format(stockCount.createdAt);
    final hasVariance = stockCount.varianceCount > 0;

    return NxCard(
      margin: const EdgeInsets.only(bottom: 10),
      onTap: () => _showStockCountDetail(stockCount),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  stockCount.status == StockCountStatus.completed
                      ? Icons.check_circle
                      : stockCount.status == StockCountStatus.approved
                          ? Icons.verified
                          : Icons.fact_check,
                  size: 20,
                  color: statusColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(stockCount.name, style: AppTextStyles.h4),
                    Text(
                      '${stockCount.warehouseName ?? "All"} • $dateStr',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.gray500,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  stockCount.status.label,
                  style: AppTextStyles.labelSmall.copyWith(
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.gray50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                _countStat(
                    'Items', '${stockCount.itemCount}', Icons.inventory_2),
                const SizedBox(width: 16),
                _countStat(
                  'Variances',
                  '${stockCount.varianceCount}',
                  Icons.compare_arrows,
                  color: hasVariance ? AppColors.danger : AppColors.success,
                ),
                const SizedBox(width: 16),
                _countStat(
                  'Status',
                  stockCount.status.label,
                  Icons.info_outline,
                  color: statusColor,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _countStat(String label, String value, IconData icon,
      {Color? color}) {
    final effectiveColor = color ?? AppColors.gray600;
    return Expanded(
      child: Row(
        children: [
          Icon(icon, size: 14, color: effectiveColor),
          const SizedBox(width: 4),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: AppTextStyles.labelSmall.copyWith(
                  color: effectiveColor,
                ),
              ),
              Text(
                label,
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
  }

  void _showStockCountDetail(StockCount stockCount) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.65,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (ctx, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: ListView(
            controller: scrollController,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.gray300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Text(stockCount.name, style: AppTextStyles.h2),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: stockCount.status.color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      stockCount.status.label,
                      style: AppTextStyles.labelSmall.copyWith(
                        color: stockCount.status.color,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${stockCount.warehouseName ?? "All Warehouses"} • ${DateFormat('MMM d, yyyy HH:mm').format(stockCount.createdAt)}',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.gray500,
                ),
              ),
              const SizedBox(height: 16),
              Text('Count Items', style: AppTextStyles.h3),
              const SizedBox(height: 8),
              if (stockCount.items.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    'No items counted yet',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.gray400,
                    ),
                  ),
                )
              else
                ...stockCount.items.map((item) => _buildCountItemRow(item)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCountItemRow(StockCountItem item) {
    final variance = item.variance ?? 0;
    final hasVariance = item.hasVariance;
    final varianceColor = variance > 0
        ? AppColors.success
        : variance < 0
            ? AppColors.danger
            : AppColors.gray400;

    return NxCard(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.itemName ?? 'Unknown',
                  style: AppTextStyles.labelLarge,
                ),
                const SizedBox(height: 2),
                Text(
                  'System: ${item.systemQuantity.toStringAsFixed(1)}',
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
                'Counted: ${item.countedQuantity?.toStringAsFixed(1) ?? '-'}',
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (item.isCounted)
                Text(
                  'Variance: ${variance >= 0 ? '+' : ''}${variance.toStringAsFixed(1)}',
                  style: AppTextStyles.labelSmall.copyWith(
                    color: hasVariance ? varianceColor : AppColors.gray400,
                    fontWeight:
                        hasVariance ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
            ],
          ),
          if (hasVariance) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: varianceColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Icon(
                variance > 0 ? Icons.trending_up : Icons.trending_down,
                size: 16,
                color: varianceColor,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
