import 'dart:async';
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
  late final dynamic _api;
  late final dynamic _appState;
  List<dynamic> _tables = [];
  Map<String, dynamic> _summary = {};
  bool _isLoading = true;
  String? _selectedSection;
  Timer? _tickTimer;

  // Merge mode
  bool _mergeMode = false;
  final Set<String> _selectedTableIds = {};

  @override
  void initState() {
    super.initState();
    _appState = ref.read(appStateProvider);
    _api = _appState.api;
    _loadFloorPlan();
    // Tick every second for live timers
    _tickTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tickTimer?.cancel();
    super.dispose();
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

  List<String> get _sections {
    final sections = _tables
        .map((t) => (t['section'] as String?) ?? 'Main')
        .toSet()
        .toList();
    sections.sort();
    return sections;
  }

  List<dynamic> get _filteredTables {
    if (_selectedSection == null) return _tables;
    return _tables.where((t) => ((t['section'] as String?) ?? 'Main') == _selectedSection).toList();
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

  String _formatDuration(Duration d) {
    if (d.inHours > 0) return '${d.inHours}h ${d.inMinutes % 60}m';
    if (d.inMinutes > 0) return '${d.inMinutes}m ${d.inSeconds % 60}s';
    return '${d.inSeconds}s';
  }

  Duration? _occupiedDuration(Map<String, dynamic> table) {
    final occupiedSince = table['occupiedSince'];
    if (occupiedSince == null) return null;
    final since = DateTime.tryParse(occupiedSince.toString());
    if (since == null) return null;
    return DateTime.now().difference(since);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text(_mergeMode ? 'Select tables to merge (${_selectedTableIds.length})' : 'Tables'),
        actions: [
          if (_mergeMode) ...[
            TextButton(
              onPressed: _selectedTableIds.length >= 2 ? _performMerge : null,
              child: Text('Merge (${_selectedTableIds.length})', style: TextStyle(color: _selectedTableIds.length >= 2 ? cs.primary : AppColors.gray400)),
            ),
            IconButton(onPressed: () => setState(() { _mergeMode = false; _selectedTableIds.clear(); }), icon: const Icon(Icons.close)),
          ] else ...[
            IconButton(onPressed: _loadFloorPlan, icon: const Icon(Icons.refresh)),
            PopupMenuButton<String>(
              onSelected: _handleMenuAction,
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'merge', child: Text('Merge Tables')),
                const PopupMenuItem(value: 'batch_status', child: Text('Batch Status Update')),
                const PopupMenuItem(value: 'utilization', child: Text('View Utilization')),
              ],
            ),
          ],
        ],
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : Column(
              children: [
                _buildSummaryBar(cs),
                if (_sections.length > 1) _buildSectionFilter(cs),
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
                      itemCount: _filteredTables.length,
                      itemBuilder: (ctx, i) => _buildTableCard(_filteredTables[i], cs),
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
      case DeviceType.desktop: return 5;
      case DeviceType.tablet: return 3;
      case DeviceType.mobile: return 2;
    }
  }

  Widget _buildSummaryBar(ColorScheme cs) {
    return Container(
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
          _summaryItem('Billing', _summary['billing'] ?? 0, AppColors.tableBilling, cs),
        ],
      ),
    );
  }

  Widget _buildSectionFilter(ColorScheme cs) {
    return SizedBox(
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        children: [
          _sectionChip(null, 'All', cs),
          ..._sections.map((s) => _sectionChip(s, s, cs)),
        ],
      ),
    );
  }

  Widget _sectionChip(String? value, String label, ColorScheme cs) {
    final isSelected = _selectedSection == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label, style: TextStyle(fontSize: 12)),
        selected: isSelected,
        onSelected: (_) => setState(() => _selectedSection = value),
        selectedColor: cs.primary.withValues(alpha: 0.15),
        checkmarkColor: cs.primary,
      ),
    );
  }

  Widget _summaryItem(String label, int count, Color color, ColorScheme cs) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
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
    final isSelected = _selectedTableIds.contains(table['id']);
    final duration = _occupiedDuration(table);
    final mergedFrom = table['mergedFrom'] as List<dynamic>?;
    final isMerged = mergedFrom != null && mergedFrom.isNotEmpty;

    return InkWell(
      onTap: _mergeMode ? () => _toggleTableSelection(table) : () => _showTableDetails(table, cs),
      onLongPress: () => _showTableOptions(table, cs),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: _mergeMode && isSelected
              ? cs.primary.withValues(alpha: 0.2)
              : color.withValues(alpha: Theme.of(context).brightness == Brightness.dark ? 0.15 : 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _mergeMode && isSelected ? cs.primary : color.withValues(alpha: 0.3),
            width: _mergeMode && isSelected ? 2.5 : 1.5,
          ),
        ),
        child: Stack(
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (_mergeMode && isSelected)
                  Icon(Icons.check_circle, color: cs.primary, size: 24)
                else
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
                if (isMerged) ...[
                  const SizedBox(height: 2),
                  Icon(Icons.merge_type, size: 12, color: AppColors.gray400),
                ],
                if (ordersCount > 0) ...[
                  const SizedBox(height: 4),
                  Text('$ordersCount order${ordersCount > 1 ? 's' : ''}', style: TextStyle(fontSize: 10, color: AppColors.gray500)),
                ],
                const SizedBox(height: 2),
                Text('${table['capacity']} seats', style: TextStyle(fontSize: 10, color: AppColors.gray400)),
              ],
            ),
            // Live timer badge for occupied tables
            if (duration != null && status == 'OCCUPIED')
              Positioned(
                top: 6,
                right: 6,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: duration.inMinutes > 60
                        ? AppColors.danger
                        : duration.inMinutes > 30
                            ? AppColors.tableOccupied
                            : AppColors.tableFree,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _formatDuration(duration),
                    style: const TextStyle(fontSize: 9, color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _toggleTableSelection(Map<String, dynamic> table) {
    setState(() {
      final id = table['id'] as String;
      if (_selectedTableIds.contains(id)) {
        _selectedTableIds.remove(id);
      } else {
        _selectedTableIds.add(id);
      }
    });
  }

  void _handleMenuAction(String action) {
    switch (action) {
      case 'merge':
        setState(() { _mergeMode = true; _selectedTableIds.clear(); });
        break;
      case 'batch_status':
        _showBatchStatusDialog();
        break;
      case 'utilization':
        _showUtilization();
        break;
    }
  }

  void _showTableOptions(Map<String, dynamic> table, ColorScheme cs) {
    final status = table['status'] ?? 'FREE';
    final isMerged = (table['mergedFrom'] as List<dynamic>?)?.isNotEmpty == true;

    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.table_restaurant, color: cs.primary),
              title: Text('Table ${table['number']} — ${_statusLabel(status)}'),
              subtitle: isMerged ? const Text('Merged table') : null,
            ),
            if (status != 'FREE')
              ListTile(
                leading: const Icon(Icons.cleaning_services),
                title: const Text('Mark as Free'),
                onTap: () { Navigator.pop(ctx); _updateTableStatus(table['id'], 'FREE'); },
              ),
            if (isMerged)
              ListTile(
                leading: const Icon(Icons.call_split),
                title: const Text('Split Table'),
                onTap: () { Navigator.pop(ctx); _splitTable(table); },
              ),
            ListTile(
              leading: const Icon(Icons.qr_code),
              title: const Text('Generate QR Code'),
              onTap: () { Navigator.pop(ctx); _generateQrCode(table['id']); },
            ),
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Edit'),
              onTap: () { Navigator.pop(ctx); _showEditTableDialog(table); },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: AppColors.danger),
              title: Text('Delete', style: TextStyle(color: AppColors.danger)),
              onTap: () { Navigator.pop(ctx); _deleteTable(table); },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _updateTableStatus(String tableId, String status) async {
    try {
      await _api.updateTableStatus(tableId, status);
      if (mounted) {
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

  // ─── Merge ───

  Future<void> _performMerge() async {
    if (_selectedTableIds.length < 2) return;
    final nameController = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Merge ${_selectedTableIds.length} Tables'),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(hintText: 'Merged table name (optional)'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Merge')),
        ],
      ),
    );
    if (result != true) return;

    try {
      await _api.mergeTables(
        _selectedTableIds.toList(),
        name: nameController.text.isNotEmpty ? nameController.text : null,
      );
      setState(() { _mergeMode = false; _selectedTableIds.clear(); });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tables merged successfully'), backgroundColor: AppColors.success),
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

  Future<void> _splitTable(Map<String, dynamic> table) async {
    final mergedFrom = table['mergedFrom'] as List<dynamic>?;
    final sourceCount = mergedFrom?.length ?? 2;
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Split Table ${table['number']}'),
        content: Text('This will restore the original $sourceCount tables.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Split')),
        ],
      ),
    );
    if (result != true) return;

    try {
      await _api.splitTable(table['id']);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Table split successfully'), backgroundColor: AppColors.success),
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

  // ─── Batch Status ───

  void _showBatchStatusDialog() {
    final selectedIds = <String>{};
    String? selectedStatus;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (ctx, scrollCtrl) => Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Text('Batch Status Update', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const Spacer(),
                    TextButton(
                      onPressed: selectedIds.isNotEmpty && selectedStatus != null
                          ? () async {
                              Navigator.pop(ctx);
                              try {
                                await _api.batchUpdateTableStatus(selectedIds.toList(), selectedStatus!);
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('${selectedIds.length} tables updated to ${_statusLabel(selectedStatus!)}'), backgroundColor: AppColors.success),
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
                          : null,
                      child: const Text('Apply'),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'ORDER_READY', 'BILLING'].map((s) {
                    final isSelected = selectedStatus == s;
                    return ChoiceChip(
                      label: Text(_statusLabel(s), style: const TextStyle(fontSize: 12)),
                      selected: isSelected,
                      onSelected: (_) => setSheetState(() => selectedStatus = s),
                      selectedColor: AppColors.tableStatusColor(s).withValues(alpha: 0.15),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: ListView.builder(
                  controller: scrollCtrl,
                  itemCount: _tables.length,
                  itemBuilder: (ctx, i) {
                    final table = _tables[i];
                    final tableId = table['id'] as String;
                    final isSelected = selectedIds.contains(tableId);
                    return CheckboxListTile(
                      value: isSelected,
                      onChanged: (v) => setSheetState(() {
                        if (v == true) {
                          selectedIds.add(tableId);
                        } else {
                          selectedIds.remove(tableId);
                        }
                      }),
                      title: Text('Table ${table['number']}'),
                      subtitle: Text(_statusLabel(table['status'] ?? 'FREE'), style: TextStyle(fontSize: 12, color: AppColors.tableStatusColor(table['status'] ?? 'FREE'))),
                      secondary: Icon(_statusIcon(table['status'] ?? 'FREE'), color: AppColors.tableStatusColor(table['status'] ?? 'FREE'), size: 20),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Utilization ───

  Future<void> _showUtilization() async {
    try {
      final data = await _api.getTableUtilization(branchId: _appState.branchId, period: 'today');
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Table Utilization — Today'),
          content: SizedBox(
            width: double.maxFinite,
            height: 400,
            child: Column(
              children: [
                _utilizationSummary(data['summary']),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView.builder(
                    itemCount: (data['tables'] as List?)?.length ?? 0,
                    itemBuilder: (ctx, i) {
                      final t = (data['tables'] as List)[i];
                      return ListTile(
                        dense: true,
                        leading: CircleAvatar(
                          backgroundColor: AppColors.tableStatusColor(t['currentStatus']).withValues(alpha: 0.15),
                          child: Text('T${t['tableNumber']}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                        title: Text('Table ${t['tableNumber']}', style: const TextStyle(fontSize: 13)),
                        subtitle: Text('${t['completedOrders']} orders · ₹${t['totalRevenue'].toStringAsFixed(0)}', style: const TextStyle(fontSize: 11)),
                        trailing: Text('${t['avgDurationMinutes']}min avg', style: TextStyle(fontSize: 11, color: AppColors.gray500)),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close'))],
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  Widget _utilizationSummary(Map<String, dynamic> summary) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.gray50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _statItem('Occupancy', '${summary['avgOccupancyRate']}%'),
              _statItem('Orders', '${summary['totalOrders']}'),
              _statItem('Revenue', '₹${summary['totalRevenue'].toStringAsFixed(0)}'),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _statItem('Peak Hour', summary['peakHour'] ?? 'N/A'),
              _statItem('Turnover', '${summary['avgTurnoverPerHour']}/hr'),
              _statItem('Tables', '${summary['totalTables']}'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statItem(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        Text(label, style: TextStyle(fontSize: 10, color: AppColors.gray500)),
      ],
    );
  }

  // ─── Existing methods ───

  void _showTableDetails(Map<String, dynamic> table, ColorScheme cs) {
    final status = table['status'] ?? 'FREE';
    final activeOrders = (table['orders'] as List<dynamic>?) ?? [];
    final color = AppColors.tableStatusColor(status);
    final duration = _occupiedDuration(table);
    final isMerged = (table['mergedFrom'] as List<dynamic>?)?.isNotEmpty == true;

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
                child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.gray300, borderRadius: BorderRadius.circular(2))),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text('Table ${table['number']}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: cs.onSurface)),
                  if (isMerged) ...[
                    const SizedBox(width: 8),
                    Icon(Icons.merge_type, size: 16, color: AppColors.gray400),
                  ],
                  const Spacer(),
                  NxStatusBadge(label: _statusLabel(status), color: color),
                ],
              ),
              if (duration != null && status == 'OCCUPIED') ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.timer_outlined, size: 14, color: AppColors.gray500),
                    const SizedBox(width: 4),
                    Text('Occupied for ${_formatDuration(duration)}', style: TextStyle(fontSize: 12, color: AppColors.gray500)),
                  ],
                ),
              ],
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
                  if (isMerged) ...[
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () { Navigator.pop(ctx); _splitTable(table); },
                        icon: const Icon(Icons.call_split, size: 18),
                        label: const Text('Split'),
                      ),
                    ),
                  ],
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
    final sectionController = TextEditingController(text: table['section'] ?? '');
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
            const SizedBox(height: 12),
            TextField(controller: sectionController, decoration: const InputDecoration(labelText: 'Section (e.g. Indoor, Patio)')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final name = nameController.text.isNotEmpty ? nameController.text : null;
              final capacity = int.tryParse(capacityController.text) ?? 4;
              final section = sectionController.text.isNotEmpty ? sectionController.text : null;
              Navigator.pop(ctx);
              try {
                await _api.updateTable(table['id'], {'capacity': capacity, 'name': name, 'section': section});
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

  Future<void> _deleteTable(Map<String, dynamic> table) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete Table ${table['number']}?'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await _api.deleteTable(table['id']);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Table deleted'), backgroundColor: AppColors.success),
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
}
