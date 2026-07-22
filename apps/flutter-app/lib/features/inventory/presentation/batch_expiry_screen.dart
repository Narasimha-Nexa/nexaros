import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/inventory_models.dart';

class BatchExpiryScreen extends ConsumerStatefulWidget {
  const BatchExpiryScreen({super.key});

  @override
  ConsumerState<BatchExpiryScreen> createState() => _BatchExpiryScreenState();
}

class _BatchExpiryScreenState extends ConsumerState<BatchExpiryScreen> {
  late final dynamic _api;
  List<InventoryItem> _items = [];
  bool _isLoading = true;
  String _filter = 'all';

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
        setState(() {
          _items = (raw as List<dynamic>)
              .map((j) => InventoryItem.fromJson(j as Map<String, dynamic>))
              .toList();
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<InventoryItem> get _trackedItems {
    final tracked =
        _items.where((i) => i.batchTracking || i.expiryRequired).toList();
    if (_filter == 'batch') return tracked.where((i) => i.batchTracking).toList();
    if (_filter == 'expiry') return tracked.where((i) => i.expiryRequired).toList();
    if (_filter == 'both') {
      return tracked
          .where((i) => i.batchTracking && i.expiryRequired)
          .toList();
    }
    return tracked;
  }

  int get _batchCount => _items.where((i) => i.batchTracking).length;
  int get _expiryCount => _items.where((i) => i.expiryRequired).length;
  int get _bothCount => _items
      .where((i) => i.batchTracking && i.expiryRequired)
      .length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Batch & Expiry', style: AppTextStyles.h2),
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    'Items requiring batch or expiry tracking',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.gray500,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _filterChip('All', _items
                          .where((i) => i.batchTracking || i.expiryRequired)
                          .length),
                      const SizedBox(width: 8),
                      _filterChip('Batch', _batchCount),
                      const SizedBox(width: 8),
                      _filterChip('Expiry', _expiryCount),
                      const SizedBox(width: 8),
                      _filterChip('Both', _bothCount),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_trackedItems.isEmpty)
                    NxEmptyState(
                      icon: Icons.inventory_2,
                      title: 'No tracked items',
                      subtitle: _filter == 'all'
                          ? 'Enable batch or expiry tracking on inventory items'
                          : 'No items match this filter',
                    )
                  else
                    ..._trackedItems.map((item) => _buildItemCard(item)),
                ],
              ),
            ),
    );
  }

  Widget _filterChip(String label, int count) {
    final values = {'All': 'all', 'Batch': 'batch', 'Expiry': 'expiry', 'Both': 'both'};
    final isSelected = _filter == values[label];
    return GestureDetector(
      onTap: () => setState(() => _filter = values[label]!),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.1)
              : AppColors.gray100,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.gray200,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$count',
              style: AppTextStyles.labelLarge.copyWith(
                color: isSelected ? AppColors.primary : AppColors.gray600,
              ),
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                color: isSelected ? AppColors.primary : AppColors.gray500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItemCard(InventoryItem item) {
    final daysUntilExpiry = _getDaysUntilExpiry(item);
    final expiryColor = _expiryColor(daysUntilExpiry);
    final expiryLabel = _expiryLabel(daysUntilExpiry);

    return NxCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.inventory_2,
                  size: 20,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.name, style: AppTextStyles.h4),
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
                    style: AppTextStyles.statValue.copyWith(fontSize: 16),
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
          const SizedBox(height: 10),
          Row(
            children: [
              if (item.batchTracking)
                _trackingBadge(
                  Icons.tag,
                  'Batch: ${item.batchTracking ? "Yes" : "No"}',
                  AppColors.primary,
                ),
              if (item.batchTracking && item.expiryRequired)
                const SizedBox(width: 8),
              if (item.expiryRequired)
                _trackingBadge(
                  Icons.event_busy,
                  expiryLabel,
                  expiryColor,
                ),
            ],
          ),
          if (item.expiryRequired && daysUntilExpiry != null) ...[
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: LinearProgressIndicator(
                value: _expiryProgress(daysUntilExpiry),
                backgroundColor: AppColors.gray100,
                color: expiryColor,
                minHeight: 4,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              '$expiryLabel remaining',
              style: AppTextStyles.bodySmall.copyWith(
                color: expiryColor,
                fontSize: 10,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _trackingBadge(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTextStyles.labelSmall.copyWith(color: color),
          ),
        ],
      ),
    );
  }

  int? _getDaysUntilExpiry(InventoryItem item) {
    final batchMatch = item.description?.contains('expiry:') ?? false;
    if (!batchMatch) return null;
    try {
      final parts = item.description!.split('expiry:');
      if (parts.length > 1) {
        final dateStr = parts[1].trim().split(' ').first;
        final expiryDate = DateFormat('yyyy-MM-dd').parse(dateStr);
        return expiryDate.difference(DateTime.now()).inDays;
      }
    } catch (_) {}
    return null;
  }

  Color _expiryColor(int? days) {
    if (days == null) return AppColors.gray400;
    if (days < 0) return AppColors.danger;
    if (days <= 7) return AppColors.danger;
    if (days <= 30) return AppColors.warning;
    return AppColors.success;
  }

  String _expiryLabel(int? days) {
    if (days == null) return 'Expiry: Not Set';
    if (days < 0) return 'Expired ${-days}d ago';
    if (days == 0) return 'Expires today';
    if (days <= 7) return '$days days left';
    if (days <= 30) return '$days days left';
    return '$days days left';
  }

  double _expiryProgress(int days) {
    if (days < 0) return 0;
    if (days > 90) return 1.0;
    return (days / 90).clamp(0.0, 1.0);
  }
}
