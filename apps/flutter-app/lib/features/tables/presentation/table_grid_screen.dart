import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';

class TableGridScreen extends StatefulWidget {
  const TableGridScreen({super.key});

  @override
  State<TableGridScreen> createState() => _TableGridScreenState();
}

class _TableGridScreenState extends State<TableGridScreen> {
  final _api = ApiClient();
  List<dynamic> _tables = [];
  Map<String, dynamic> _summary = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFloorPlan();
  }

  Future<void> _loadFloorPlan() async {
    setState(() => _isLoading = true);
    try {
      final result = await _api.getFloorPlan();
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

  Color _statusColor(String status) {
    switch (status) {
      case 'FREE': return AppColors.tableFree;
      case 'OCCUPIED': return AppColors.tableOccupied;
      case 'RESERVED': return AppColors.tableReserved;
      case 'CLEANING': return AppColors.tableCleaning;
      case 'ORDER_READY': return AppColors.tableReady;
      case 'BILLING': return AppColors.tableBilling;
      default: return AppColors.gray400;
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
    return Scaffold(
      appBar: AppBar(
        title: Text('Tables', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(onPressed: _loadFloorPlan, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Summary bar
                Container(
                  color: AppColors.white,
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _summaryItem('Total', _summary['total'] ?? 0, AppColors.gray600),
                      _summaryItem('Free', _summary['free'] ?? 0, AppColors.tableFree),
                      _summaryItem('Occupied', _summary['occupied'] ?? 0, AppColors.tableOccupied),
                      _summaryItem('Reserved', _summary['reserved'] ?? 0, AppColors.tableReserved),
                      _summaryItem('Ready', _summary['orderReady'] ?? 0, AppColors.tableReady),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Table grid
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
                      itemBuilder: (ctx, i) => _buildTableCard(_tables[i]),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  int _getCrossAxisCount(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width > 1200) return 5;
    if (width > 900) return 4;
    if (width > 600) return 3;
    return 2;
  }

  Widget _summaryItem(String label, int count, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10, height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(height: 4),
        Text('$count', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
        Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
      ],
    );
  }

  Widget _buildTableCard(Map<String, dynamic> table) {
    final status = table['status'] ?? 'FREE';
    final color = _statusColor(status);
    final activeOrders = (table['orders'] as List<dynamic>?) ?? [];
    final ordersCount = activeOrders.length;

    return InkWell(
      onTap: () => _showTableDetails(table),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
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
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: color),
            ),
            if (table['name'] != null)
              Text(table['name'], style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(_statusLabel(status), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
            ),
            if (ordersCount > 0) ...[
              const SizedBox(height: 4),
              Text('$ordersCount order${ordersCount > 1 ? 's' : ''}', style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
            ],
            const SizedBox(height: 2),
            Text('${table['capacity']} seats', style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray400)),
          ],
        ),
      ),
    );
  }

  void _showTableDetails(Map<String, dynamic> table) {
    final status = table['status'] ?? 'FREE';
    final activeOrders = (table['orders'] as List<dynamic>?) ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
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
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: _statusColor(status).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text('Table ${table['number']}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _statusColor(status).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(_statusLabel(status), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: _statusColor(status))),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Status actions
              Text('Update Status', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: ['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'ORDER_READY', 'BILLING'].map((s) {
                  final isSelected = status == s;
                  return ActionChip(
                    label: Text(_statusLabel(s), style: GoogleFonts.inter(fontSize: 12)),
                    onPressed: isSelected ? null : () => _updateTableStatus(table['id'], s),
                    backgroundColor: isSelected ? _statusColor(s).withValues(alpha: 0.15) : null,
                    side: BorderSide(color: isSelected ? _statusColor(s) : AppColors.gray300),
                  );
                }).toList(),
              ),
              if (activeOrders.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('Active Orders (${activeOrders.length})', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 8),
                ...activeOrders.map((o) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: AppColors.orderPreparing.withValues(alpha: 0.15),
                    child: Text('#${o['orderNumber']}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                  title: Text('${o['status']}', style: GoogleFonts.inter(fontSize: 13)),
                  subtitle: Text('₹${double.tryParse(o['totalAmount'].toString())?.toStringAsFixed(0) ?? '0'}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary)),
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
}
