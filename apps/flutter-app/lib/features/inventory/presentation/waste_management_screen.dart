import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/inventory_models.dart';

class WasteManagementScreen extends ConsumerStatefulWidget {
  const WasteManagementScreen({super.key});

  @override
  ConsumerState<WasteManagementScreen> createState() =>
      _WasteManagementScreenState();
}

class _WasteManagementScreenState extends ConsumerState<WasteManagementScreen> {
  late final dynamic _api;
  List<dynamic> _inventoryItems = [];
  List<Map<String, dynamic>> _wasteRecords = [];
  bool _isLoading = true;
  WasteReason? _selectedReasonFilter;

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final items = await _api.getInventoryItems();
      if (mounted) {
        setState(() {
          _inventoryItems = items;
          _wasteRecords = [];
          for (final item in items) {
            final movements = item['stockMovements'] as List<dynamic>? ?? [];
            for (final m in movements) {
              if (m['type'] == 'WASTE') {
                _wasteRecords.add({
                  ...m as Map<String, dynamic>,
                  'itemName': item['name'],
                  'itemUnit': item['unit'],
                });
              }
            }
          }
          _wasteRecords.sort((a, b) {
            final da = DateTime.tryParse(a['createdAt'] ?? '');
            final db = DateTime.tryParse(b['createdAt'] ?? '');
            return (db ?? DateTime.now()).compareTo(da ?? DateTime.now());
          });
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> get _filteredRecords {
    if (_selectedReasonFilter == null) return _wasteRecords;
    return _wasteRecords
        .where((r) => _matchesReason(r, _selectedReasonFilter!))
        .toList();
  }

  bool _matchesReason(Map<String, dynamic> record, WasteReason reason) {
    final notes = (record['notes'] as String? ?? '').toLowerCase();
    return notes.contains(reason.label.toLowerCase());
  }

  double get _totalWasteCost {
    return _wasteRecords.fold<double>(0, (sum, r) {
      final qty = (r['quantity'] as num?)?.toDouble() ?? 0;
      final cost = (r['unitCost'] as num?)?.toDouble() ?? 0;
      return sum + (qty.abs() * cost);
    });
  }

  double get _totalWasteQuantity {
    return _wasteRecords.fold<double>(0, (sum, r) {
      return sum + ((r['quantity'] as num?)?.toDouble() ?? 0).abs();
    });
  }

  Map<WasteReason, int> get _wasteByReason {
    final map = <WasteReason, int>{};
    for (final r in _wasteRecords) {
      final notes = r['notes'] as String? ?? '';
      final reason = _parseReason(notes);
      map[reason] = (map[reason] ?? 0) + 1;
    }
    return map;
  }

  WasteReason _parseReason(String notes) {
    final lower = notes.toLowerCase();
    for (final reason in WasteReason.values) {
      if (lower.contains(reason.label.toLowerCase())) return reason;
    }
    return WasteReason.other;
  }

  void _showRecordWasteDialog() {
    String? selectedItemId;
    WasteReason selectedReason = WasteReason.other;
    final qtyCtrl = TextEditingController();
    final notesCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.delete, size: 20, color: AppColors.danger),
              const SizedBox(width: 8),
              Text('Record Waste', style: AppTextStyles.h3),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Item *',
                    prefixIcon: Icon(Icons.inventory_2, size: 20),
                  ),
                  items: _inventoryItems.map<DropdownMenuItem<String>>((i) {
                    return DropdownMenuItem<String>(
                      value: i['id'] as String?,
                      child: Text(
                        '${i['name']} (${i['currentStock']} ${i['unit']})',
                      ),
                    );
                  }).toList(),
                  onChanged: (v) =>
                      setDialogState(() => selectedItemId = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<WasteReason>(
                  decoration: const InputDecoration(
                    labelText: 'Reason *',
                    prefixIcon: Icon(Icons.help_outline, size: 20),
                  ),
                  value: selectedReason,
                  items: WasteReason.values
                      .map<DropdownMenuItem<WasteReason>>((r) {
                    return DropdownMenuItem<WasteReason>(
                      value: r,
                      child: Row(
                        children: [
                          Icon(r.icon, size: 16, color: AppColors.gray600),
                          const SizedBox(width: 8),
                          Text(r.label),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (v) =>
                      setDialogState(() => selectedReason = v ?? WasteReason.other),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: qtyCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Quantity Wasted *',
                    prefixIcon: Icon(Icons.remove_circle, size: 20),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Additional Notes',
                    prefixIcon: Icon(Icons.notes, size: 20),
                    hintText: 'e.g., Batch #1234, Expired on Jan 15',
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
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.danger,
              ),
              onPressed: () async {
                if (selectedItemId == null || qtyCtrl.text.isEmpty) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(
                      content: Text('Item and quantity are required'),
                      backgroundColor: AppColors.danger,
                    ),
                  );
                  return;
                }
                final reasonText = '[${selectedReason.label}]';
                final notes = notesCtrl.text.isNotEmpty
                    ? '$reasonText ${notesCtrl.text}'
                    : reasonText;
                await _api.adjustStock(selectedItemId!, {
                  'type': 'WASTE',
                  'quantity': double.tryParse(qtyCtrl.text) ?? 0,
                  'notes': notes,
                });
                if (ctx.mounted) Navigator.pop(ctx, true);
              },
              child: const Text('Record Waste'),
            ),
          ],
        ),
      ),
    ).then((saved) {
      if (saved == true) _loadData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final topReasons = _wasteByReason.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Scaffold(
      appBar: AppBar(
        title: Text('Waste Management', style: AppTextStyles.h2),
        actions: [
          TextButton.icon(
            onPressed: _showRecordWasteDialog,
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Record'),
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
                  _buildSummaryCards(),
                  const SizedBox(height: 20),
                  if (topReasons.isNotEmpty) ...[
                    Text('Waste by Reason', style: AppTextStyles.h3),
                    const SizedBox(height: 8),
                    ...topReasons.map((entry) => Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            children: [
                              Icon(entry.key.icon,
                                  size: 16, color: AppColors.gray500),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  entry.key.label,
                                  style: AppTextStyles.bodyMedium,
                                ),
                              ),
                              Text(
                                '${entry.value} records',
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.gray500,
                                ),
                              ),
                            ],
                          ),
                        )),
                    const SizedBox(height: 16),
                  ],
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Waste Records (${_filteredRecords.length})',
                          style: AppTextStyles.h3,
                        ),
                      ),
                      if (_selectedReasonFilter != null)
                        TextButton(
                          onPressed: () =>
                              setState(() => _selectedReasonFilter = null),
                          child: Text(
                            'Clear Filter',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: WasteReason.values.map((r) {
                        final isSelected = _selectedReasonFilter == r;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            avatar: Icon(
                              r.icon,
                              size: 14,
                              color: isSelected
                                  ? AppColors.white
                                  : AppColors.gray600,
                            ),
                            label: Text(r.label),
                            selected: isSelected,
                            onSelected: (_) {
                              setState(() {
                                _selectedReasonFilter =
                                    isSelected ? null : r;
                              });
                            },
                            selectedColor:
                                AppColors.primary.withValues(alpha: 0.1),
                            checkmarkColor: AppColors.primary,
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (_filteredRecords.isEmpty)
                    NxEmptyState(
                      icon: Icons.delete_outline,
                      title: _selectedReasonFilter != null
                          ? 'No records for this reason'
                          : 'No waste recorded',
                      subtitle: 'Track waste to identify reduction opportunities',
                      actionLabel: _selectedReasonFilter != null
                          ? null
                          : 'Record Waste',
                      onAction:
                          _selectedReasonFilter != null ? null : _showRecordWasteDialog,
                    )
                  else
                    ..._filteredRecords.map((r) => _buildWasteCard(r)),
                ],
              ),
            ),
    );
  }

  Widget _buildSummaryCards() {
    return Row(
      children: [
        Expanded(
          child: _summaryCard(
            'Total Waste',
            '${_wasteRecords.length}',
            Icons.delete,
            AppColors.danger,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _summaryCard(
            'Quantity',
            _totalWasteQuantity.toStringAsFixed(1),
            Icons.numbers,
            AppColors.warning,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _summaryCard(
            'Cost',
            '₹${_totalWasteCost.toStringAsFixed(0)}',
            Icons.currency_rupee,
            AppColors.danger,
          ),
        ),
      ],
    );
  }

  Widget _summaryCard(
      String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 6),
          Text(
            value,
            style: AppTextStyles.statValue.copyWith(
              fontSize: 16,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.gray500,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWasteCard(Map<String, dynamic> record) {
    final date = DateTime.tryParse(record['createdAt'] ?? '');
    final qty = (record['quantity'] as num?)?.toDouble() ?? 0;
    final notes = record['notes'] as String? ?? '';
    final reason = _parseReason(notes);

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.danger.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(reason.icon, color: AppColors.danger, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    record['itemName'] ?? '',
                    style: AppTextStyles.labelLarge,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.danger.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Text(
                          reason.label,
                          style: AppTextStyles.labelSmall.copyWith(
                            color: AppColors.danger,
                          ),
                        ),
                      ),
                      if (date != null) ...[
                        const SizedBox(width: 8),
                        Text(
                          DateFormat('MMM d, HH:mm').format(date),
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.gray400,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Text(
              '${qty.abs().toStringAsFixed(1)} ${record['itemUnit'] ?? ''}',
              style: AppTextStyles.statValue.copyWith(
                fontSize: 14,
                color: AppColors.danger,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
