import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class TableGridScreen extends ConsumerStatefulWidget {
  const TableGridScreen({super.key});

  @override
  ConsumerState<TableGridScreen> createState() => _TableGridScreenState();
}

class _TableGridScreenState extends ConsumerState<TableGridScreen> {
  late final _api;
  late final _appState;
  List<dynamic> _tables = [];
  Map<String, dynamic> _summary = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _appState = ref.read(appStateProvider);
    _api = _appState.api;
    _loadFloorPlan();
  }

  Future<void> _loadFloorPlan() async {
    setState(() => _isLoading = true);
    try {
      final result = await _api.getFloorPlan(branchId: _appState.branchId);
      if (mounted) {
        setState(() {
          _tables = result['tables'] ?? [];
          _summary = result['summary'] ?? {};
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'FREE': return Icons.check_circle_outline;
      case 'OCCUPIED': return Icons.person;
      case 'RESERVED': return Icons.bookmark_outline;
      case 'CLEANING': return Icons.cleaning_services;
      case 'ORDER_READY': return Icons.restaurant;
      case 'BILLING': return Icons.payment;
      default: return Icons.table_restaurant;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'FREE': return 'Free';
      case 'OCCUPIED': return 'Occupied';
      case 'RESERVED': return 'Reserved';
      case 'CLEANING': return 'Cleaning';
      case 'ORDER_READY': return 'Ready';
      case 'BILLING': return 'Billing';
      default: return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tables'),
        actions: [
          IconButton(onPressed: _loadFloorPlan, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : Column(
              children: [
                Container(
                  color: cs.surface,
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _summaryItem('Total', _summary['total'] ?? 0, AppColors.gray600, cs),
                      _summaryItem('Free', _summary['free'] ?? 0, AppColors.tableFree, cs),
                      _summaryItem('Occupied', _summary['occupied'] ?? 0, AppColors.tableOccupied, cs),
                      _summaryItem('Reserved', _summary['reserved'] ?? 0, AppColors.tableReserved, cs),
                      _summaryItem('Ready', _summary['orderReady'] ?? 0, AppColors.tableReady, cs),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _loadFloorPlan,
                    child: GridView.builder(
                      padding: const EdgeInsets.all(12),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: _getCrossAxisCount(context),
                        childAspectRatio: 1.0,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                      ),
                      itemCount: _tables.length,
                      itemBuilder: (ctx, i) => _buildTableCard(_tables[i], cs),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  int _getCrossAxisCount(BuildContext context) {
    final deviceType = ResponsiveLayout.deviceType(context);
    switch (deviceType) {
      case DeviceType.desktop:
        return 5;
      case DeviceType.tablet:
        return 3;
      case DeviceType.mobile:
        return 2;
    }
  }

  Widget _summaryItem(String label, int count, Color color, ColorScheme cs) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10, height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(height: 4),
        Text('$count', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: cs.onSurface)),
        Text(label, style: TextStyle(fontSize: 10, color: AppColors.gray500)),
      ],
    );
  }

  Widget _buildTableCard(Map<String, dynamic> table, ColorScheme cs) {
    final status = table['status'] ?? 'FREE';
    final color = AppColors.tableStatusColor(status);
    final activeOrders = (table['orders'] as List<dynamic>?) ?? [];
    final ordersCount = activeOrders.length;

    return InkWell(
      onTap: () => _showTableDetails(table, cs),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: color.withValues(alpha: Theme.of(context).brightness == Brightness.dark ? 0.15 : 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3), width: 1.5),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(_statusIcon(status), color: color, size: 28),
            const SizedBox(height: 6),
            Text(
              table['number'].toString(),
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: color),
            ),
            if (table['name'] != null)
              Text(table['name'], style: TextStyle(fontSize: 10, color: AppColors.gray500)),
            const SizedBox(height: 4),
            NxStatusBadge(label: _statusLabel(status), color: color, small: true),
            if (ordersCount > 0) ...[
              const SizedBox(height: 4),
              Text('$ordersCount order${ordersCount > 1 ? 's' : ''}', style: TextStyle(fontSize: 10, color: AppColors.gray500)),
            ],
            const SizedBox(height: 2),
            Text('${table['capacity']} seats', style: TextStyle(fontSize: 10, color: AppColors.gray400)),
          ],
        ),
      ),
    );
  }

  void _showTableDetails(Map<String, dynamic> table, ColorScheme cs) {
    final status = table['status'] ?? 'FREE';
    final activeOrders = (table['orders'] as List<dynamic>?) ?? [];
    final color = AppColors.tableStatusColor(status);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        minChildSize: 0.3,
        maxChildSize: 0.8,
        expand: false,
        builder: (ctx, scrollCtrl) => SingleChildScrollView(
          controller: scrollCtrl,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: AppColors.gray300, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text('Table ${table['number']}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: cs.onSurface)),
                  const Spacer(),
                  NxStatusBadge(label: _statusLabel(status), color: color),
                ],
              ),
              const SizedBox(height: 16),
              Text('Update Status', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: cs.onSurface)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: ['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'ORDER_READY', 'BILLING'].map((s) {
                  final isSelected = status == s;
                  return ActionChip(
                    label: Text(_statusLabel(s), style: const TextStyle(fontSize: 12)),
                    onPressed: isSelected ? null : () => _updateTableStatus(table['id'], s),
                    backgroundColor: isSelected ? AppColors.tableStatusColor(s).withValues(alpha: 0.15) : null,
                    side: BorderSide(color: isSelected ? AppColors.tableStatusColor(s) : cs.outline),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _generateQrCode(table['id']),
                      icon: const Icon(Icons.qr_code, size: 18),
                      label: const Text('QR Code'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _showEditTableDialog(table),
                      icon: const Icon(Icons.edit, size: 18),
                      label: const Text('Edit'),
                    ),
                  ),
                ],
              ),
              if (activeOrders.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('Active Orders (${activeOrders.length})', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: cs.onSurface)),
                const SizedBox(height: 8),
                ...activeOrders.map((o) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: AppColors.orderPreparing.withValues(alpha: 0.15),
                    child: Text('#${o['orderNumber']}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                  title: Text('${o['status']}', style: const TextStyle(fontSize: 13)),
                  subtitle: Text('₹${double.tryParse(o['totalAmount'].toString())?.toStringAsFixed(0) ?? '0'}', style: TextStyle(fontSize: 12, color: cs.primary)),
                )),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _updateTableStatus(String tableId, String status) async {
    try {
      await _api.updateTableStatus(tableId, status);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Table updated to ${_statusLabel(status)}'), backgroundColor: AppColors.success),
        );
        _loadFloorPlan();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  Future<void> _generateQrCode(String tableId) async {
    try {
      await _api.updateTable(tableId, {});
      final plan = await _api.getFloorPlan();
      final table = (plan['tables'] as List).firstWhere((t) => t['id'] == tableId, orElse: () => null);
      final qrUrl = table?['qrCode'];
      if (mounted && qrUrl != null) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Table QR Code'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Scan to order from this table', style: TextStyle(fontSize: 12, color: AppColors.gray500)),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.gray50, borderRadius: BorderRadius.circular(8)),
                  child: Text(qrUrl, style: TextStyle(fontSize: 10, color: AppColors.primary), textAlign: TextAlign.center),
                ),
              ],
            ),
            actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close'))],
          ),
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

  void _showEditTableDialog(Map<String, dynamic> table) {
    final nameController = TextEditingController(text: table['name'] ?? '');
    final capacityController = TextEditingController(text: '${table['capacity'] ?? 4}');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Edit Table ${table['number']}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name (optional)')),
            const SizedBox(height: 12),
            TextField(controller: capacityController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Capacity')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final name = nameController.text.isNotEmpty ? nameController.text : null;
              final capacity = int.tryParse(capacityController.text) ?? 4;
              Navigator.pop(ctx);
              try {
                await _api.updateTable(table['id'], {'capacity': capacity});
                if (name != null) await _api.updateTable(table['id'], {'name': name});
                _loadFloorPlan();
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: AppColors.danger),
                  );
                }
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
