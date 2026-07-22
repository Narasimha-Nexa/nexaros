import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/inventory_models.dart';

class TransferManagementScreen extends ConsumerStatefulWidget {
  const TransferManagementScreen({super.key});

  @override
  ConsumerState<TransferManagementScreen> createState() =>
      _TransferManagementScreenState();
}

class _TransferManagementScreenState
    extends ConsumerState<TransferManagementScreen> {
  late final dynamic _api;
  List<StockTransfer> _transfers = [];
  List<dynamic> _warehouses = [];
  List<dynamic> _items = [];
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
        _api.getTransfers().catchError((_) => <dynamic>[]),
        _api.getWarehouses().catchError((_) => <dynamic>[]),
        _api.getInventoryItems(),
      ]);
      if (mounted) {
        setState(() {
          _transfers = (results[0] as List<dynamic>)
              .map((j) => StockTransfer.fromJson(j as Map<String, dynamic>))
              .toList();
          _warehouses = results[1] as List<dynamic>;
          _items = results[2] as List<dynamic>;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showCreateDialog() {
    String? fromWarehouseId;
    String? toWarehouseId;
    final notesCtrl = TextEditingController();
    final List<Map<String, dynamic>> selectedItems = [];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.swap_horiz, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              Text('New Transfer', style: AppTextStyles.h3),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'From Warehouse *',
                    prefixIcon: Icon(Icons.arrow_forward, size: 20),
                  ),
                  items: _warehouses.map<DropdownMenuItem<String>>((w) {
                    return DropdownMenuItem<String>(
                      value: w['id'] as String?,
                      child: Text(w['name'] as String? ?? ''),
                    );
                  }).toList(),
                  onChanged: (v) =>
                      setDialogState(() => fromWarehouseId = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'To Warehouse *',
                    prefixIcon: Icon(Icons.arrow_back, size: 20),
                  ),
                  items: _warehouses.map<DropdownMenuItem<String>>((w) {
                    return DropdownMenuItem<String>(
                      value: w['id'] as String?,
                      child: Text(w['name'] as String? ?? ''),
                    );
                  }).toList(),
                  onChanged: (v) =>
                      setDialogState(() => toWarehouseId = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Add Item',
                    prefixIcon: Icon(Icons.add, size: 20),
                  ),
                  items: _items.map<DropdownMenuItem<String>>((item) {
                    return DropdownMenuItem<String>(
                      value: item['id'] as String?,
                      child: Text(
                        '${item['name']} (${item['currentStock']} ${item['unit']})',
                      ),
                    );
                  }).toList(),
                  onChanged: (v) {
                    if (v == null) return;
                    final existing = selectedItems
                        .where((si) => si['inventoryItemId'] == v)
                        .toList();
                    if (existing.isEmpty) {
                      setDialogState(() {
                        selectedItems.add({
                          'inventoryItemId': v,
                          'quantity': 1.0,
                        });
                      });
                    }
                  },
                ),
                if (selectedItems.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  ...selectedItems.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final si = entry.value;
                    final itemName = _items
                        .where((i) => i['id'] == si['inventoryItemId'])
                        .map((i) => i['name'])
                        .firstOrNull;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              itemName ?? 'Item',
                              style: AppTextStyles.bodyMedium,
                            ),
                          ),
                          SizedBox(
                            width: 80,
                            child: TextField(
                              decoration: const InputDecoration(
                                isDense: true,
                                hintText: 'Qty',
                              ),
                              keyboardType: TextInputType.number,
                              onChanged: (v) {
                                setDialogState(() {
                                  selectedItems[idx]['quantity'] =
                                      double.tryParse(v) ?? 1.0;
                                });
                              },
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, size: 16),
                            onPressed: () {
                              setDialogState(() {
                                selectedItems.removeAt(idx);
                              });
                            },
                          ),
                        ],
                      ),
                    );
                  }),
                ],
                const SizedBox(height: 8),
                TextField(
                  controller: notesCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Notes',
                    prefixIcon: Icon(Icons.notes, size: 20),
                  ),
                  maxLines: 2,
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
                if (fromWarehouseId == null || toWarehouseId == null) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(
                      content: Text('Both warehouses are required'),
                      backgroundColor: AppColors.danger,
                    ),
                  );
                  return;
                }
                try {
                  await _api.createTransfer({
                    'fromWarehouseId': fromWarehouseId,
                    'toWarehouseId': toWarehouseId,
                    'items': selectedItems,
                    if (notesCtrl.text.isNotEmpty)
                      'notes': notesCtrl.text.trim(),
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
              child: const Text('Create Transfer'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final draftCount =
        _transfers.where((t) => t.status == TransferStatus.draft).length;
    final pendingCount =
        _transfers.where((t) => t.status == TransferStatus.pending).length;
    final transitCount =
        _transfers.where((t) => t.status == TransferStatus.inTransit).length;
    final receivedCount =
        _transfers.where((t) => t.status == TransferStatus.received).length;

    return Scaffold(
      appBar: AppBar(
        title: Text('Transfers', style: AppTextStyles.h2),
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
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _statusChip('Draft', draftCount, AppColors.gray500),
                        const SizedBox(width: 8),
                        _statusChip(
                            'Pending', pendingCount, AppColors.warning),
                        const SizedBox(width: 8),
                        _statusChip(
                            'In Transit', transitCount, AppColors.info),
                        const SizedBox(width: 8),
                        _statusChip(
                            'Received', receivedCount, AppColors.success),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (_transfers.isEmpty)
                    NxEmptyState(
                      icon: Icons.swap_horiz,
                      title: 'No transfers',
                      subtitle: 'Transfer inventory between warehouses',
                      actionLabel: 'New Transfer',
                      onAction: _showCreateDialog,
                    )
                  else
                    ..._transfers.map((t) => _buildTransferCard(t)),
                ],
              ),
            ),
    );
  }

  Widget _statusChip(String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$count',
            style: AppTextStyles.labelLarge.copyWith(color: color),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTextStyles.bodySmall.copyWith(color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildTransferCard(StockTransfer transfer) {
    final statusColor = transfer.status.color;
    final dateStr = DateFormat('MMM d, yyyy').format(transfer.createdAt);

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
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  transfer.status == TransferStatus.inTransit
                      ? Icons.local_shipping
                      : transfer.status == TransferStatus.received
                          ? Icons.check_circle
                          : Icons.swap_horiz,
                  size: 20,
                  color: statusColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            transfer.fromWarehouseName ?? 'Source',
                            style: AppTextStyles.labelLarge,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 6),
                          child: Icon(
                            Icons.arrow_forward,
                            size: 14,
                            color: AppColors.gray400,
                          ),
                        ),
                        Flexible(
                          child: Text(
                            transfer.toWarehouseName ?? 'Destination',
                            style: AppTextStyles.labelLarge,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '$dateStr • ${transfer.items.length} items',
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
                  transfer.status.label,
                  style: AppTextStyles.labelSmall.copyWith(
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          if (transfer.notes != null && transfer.notes!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.gray50,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                transfer.notes!,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.gray600,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ],
          if (transfer.items.isNotEmpty) ...[
            const SizedBox(height: 8),
            ...transfer.items.take(3).map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      const Icon(Icons.circle, size: 6, color: AppColors.gray400),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          item.itemName ?? 'Unknown',
                          style: AppTextStyles.bodySmall,
                        ),
                      ),
                      Text(
                        '${item.quantity.toStringAsFixed(1)}',
                        style: AppTextStyles.bodySmall.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (item.receivedQuantity != null) ...[
                        Text(
                          ' / ${item.receivedQuantity!.toStringAsFixed(1)}',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.success,
                          ),
                        ),
                      ],
                    ],
                  ),
                )),
            if (transfer.items.length > 3)
              Text(
                '+${transfer.items.length - 3} more items',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.gray400,
                ),
              ),
          ],
        ],
      ),
    );
  }
}
