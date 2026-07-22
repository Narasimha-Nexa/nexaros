import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/barcode_scanner_field.dart';
import '../../../shared/widgets/shared_widgets.dart';
import 'waste_tracking_screen.dart';

enum _InventoryTab { items, lowStock, movements }

class InventoryManagementScreen extends ConsumerStatefulWidget {
  const InventoryManagementScreen({super.key});

  @override
  ConsumerState<InventoryManagementScreen> createState() => _InventoryManagementScreenState();
}

class _InventoryManagementScreenState extends ConsumerState<InventoryManagementScreen> {
  late final dynamic _api;
  List<dynamic> _items = [];
  List<dynamic> _lowStockItems = [];
  List<Map<String, dynamic>> _stockMovements = [];
  bool _isLoading = true;
  _InventoryTab _currentTab = _InventoryTab.items;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _loadItems();
  }

  Future<void> _loadItems() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait<dynamic>([
        _api.getInventoryItems(),
        _api.getLowStock(),
      ]);
      if (mounted) {
        setState(() {
          _items = results[0];
          _lowStockItems = results[1];
          // Extract stock movements from all items
          _stockMovements = [];
          for (final item in _items) {
            final movements = item['stockMovements'] as List<dynamic>? ?? [];
            for (final m in movements) {
              _stockMovements.add({
                ...m as Map<String, dynamic>,
                'itemName': item['name'],
                'itemUnit': item['unit'],
              });
            }
          }
          _stockMovements.sort((a, b) {
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

  List<dynamic> get _filteredItems {
    if (_search.isEmpty) return _items;
    final q = _search.toLowerCase();
    return _items.where((item) {
      final name = (item['name'] as String? ?? '').toLowerCase();
      final unit = (item['unit'] as String? ?? '').toLowerCase();
      final barcode = (item['barcode'] as String? ?? '').toLowerCase();
      return name.contains(q) || unit.contains(q) || barcode.contains(q);
    }).toList();
  }

  // ─── Item Dialog ───
  Future<void> _showItemDialog({Map<String, dynamic>? existing}) async {
    final nameCtrl = TextEditingController(text: existing?['name'] ?? '');
    final unitCtrl = TextEditingController(text: existing?['unit'] ?? 'kg');
    final stockCtrl = TextEditingController(text: existing?['currentStock']?.toString() ?? '0');
    final minStockCtrl = TextEditingController(text: existing?['minimumStock']?.toString() ?? '10');
    final costCtrl = TextEditingController(text: existing?['costPrice']?.toString() ?? '0');
    final barcodeCtrl = TextEditingController(text: existing?['barcode'] ?? '');
    final categoryCtrl = TextEditingController(text: existing?['category'] ?? '');

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(children: [
          Icon(existing != null ? Icons.edit : Icons.add_circle, size: 20, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(existing != null ? 'Edit Item' : 'Add Item', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        ]),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name *', prefixIcon: Icon(Icons.inventory_2, size: 20))),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: TextField(controller: unitCtrl, decoration: const InputDecoration(labelText: 'Unit (kg/ltr/pcs)'))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: categoryCtrl, decoration: const InputDecoration(labelText: 'Category'))),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: TextField(controller: stockCtrl, decoration: const InputDecoration(labelText: 'Current Stock *'), keyboardType: TextInputType.number)),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: minStockCtrl, decoration: const InputDecoration(labelText: 'Min Stock'), keyboardType: TextInputType.number)),
            ]),
            const SizedBox(height: 12),
            TextField(controller: costCtrl, decoration: const InputDecoration(labelText: 'Cost Price (₹)', prefixIcon: Icon(Icons.currency_rupee, size: 20)), keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            TextField(controller: barcodeCtrl, decoration: const InputDecoration(labelText: 'Barcode', prefixIcon: Icon(Icons.qr_code, size: 20))),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () async {
            if (nameCtrl.text.trim().isEmpty) {
              ScaffoldMessenger.of(ctx).showSnackBar(
                const SnackBar(content: Text('Name is required'), backgroundColor: AppColors.danger),
              );
              return;
            }
            final data = {
              'name': nameCtrl.text.trim(),
              'unit': unitCtrl.text.trim(),
              'category': categoryCtrl.text.trim(),
              'currentStock': double.tryParse(stockCtrl.text) ?? 0,
              'minimumStock': double.tryParse(minStockCtrl.text) ?? 10,
              'costPrice': double.tryParse(costCtrl.text) ?? 0,
              if (barcodeCtrl.text.isNotEmpty) 'barcode': barcodeCtrl.text.trim(),
            };
            try {
              if (existing != null) {
                await _api.updateInventoryItem(existing['id'], data);
              } else {
                await _api.createInventoryItem(data);
              }
              if (ctx.mounted) Navigator.pop(ctx, true);
            } catch (e) {
              if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger));
            }
          }, child: Text(existing != null ? 'Update' : 'Add')),
        ],
      ),
    );
    if (saved == true) _loadItems();
  }

  // ─── Stock Adjust Dialog ───
  Future<void> _showAdjustDialog(Map<String, dynamic> item) async {
    final qtyCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    String adjustType = 'ADJUSTMENT';

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Row(children: [
            const Icon(Icons.tune, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Expanded(child: Text('Adjust: ${item['name']}', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
          ]),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              // Current stock display
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(children: [
                  Icon(Icons.inventory_2, size: 20, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text('Current: ${item['currentStock']} ${item['unit']}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                ]),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: adjustType,
                decoration: const InputDecoration(labelText: 'Type *', prefixIcon: Icon(Icons.category, size: 20)),
                items: [
                  DropdownMenuItem(value: 'ADJUSTMENT', child: Text('Adjustment')),
                  DropdownMenuItem(value: 'SALE', child: Text('Sale')),
                  DropdownMenuItem(value: 'WASTE', child: Text('Waste')),
                  DropdownMenuItem(value: 'TRANSFER', child: Text('Transfer')),
                  DropdownMenuItem(value: 'RECEIVE', child: Text('Receive')),
                ].map<DropdownMenuItem<String>>((t) => t).toList(),
                onChanged: (v) => setDialogState(() => adjustType = v ?? 'ADJUSTMENT'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: qtyCtrl,
                decoration: InputDecoration(
                  labelText: 'Quantity *',
                  prefixIcon: const Icon(Icons.numbers, size: 20),
                  helperText: adjustType == 'WASTE' || adjustType == 'SALE' || adjustType == 'TRANSFER'
                      ? 'Negative value to reduce stock'
                      : 'Positive value to increase stock',
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: notesCtrl,
                decoration: const InputDecoration(labelText: 'Notes (optional)', prefixIcon: Icon(Icons.notes, size: 20)),
                maxLines: 2,
              ),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(onPressed: () async {
              if (qtyCtrl.text.isEmpty) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(content: Text('Quantity is required'), backgroundColor: AppColors.danger),
                );
                return;
              }
              await _api.adjustStock(item['id'], {
                'type': adjustType,
                'quantity': double.tryParse(qtyCtrl.text) ?? 0,
                if (notesCtrl.text.isNotEmpty) 'notes': notesCtrl.text,
              });
              if (ctx.mounted) Navigator.pop(ctx, true);
            }, child: const Text('Adjust')),
          ],
        ),
      ),
    );
    if (saved == true) _loadItems();
  }

  // ─── Item Detail Dialog ───
  void _showItemDetail(Map<String, dynamic> item) {
    final stock = double.tryParse(item['currentStock']?.toString() ?? '0') ?? 0;
    final minStock = double.tryParse(item['minimumStock']?.toString() ?? '0') ?? 0;
    final costPrice = double.tryParse(item['costPrice']?.toString() ?? '0') ?? 0;
    final stockValue = stock * costPrice;
    final isLow = stock <= minStock;

    // Get movements for this item
    final itemMovements = _stockMovements.where((m) => m['inventoryItemId'] == item['id']).toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (ctx, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: ListView(
            controller: scrollController,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: AppColors.gray300, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              // Header
              Row(children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isLow ? AppColors.danger.withValues(alpha: 0.1) : AppColors.success.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isLow ? Icons.warning : Icons.check_circle,
                    color: isLow ? AppColors.danger : AppColors.success,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 18)),
                      Text('${item['unit'] ?? ''} • ${item['category'] ?? 'No category'}', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray500)),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.edit),
                  onPressed: () { Navigator.pop(ctx); _showItemDialog(existing: item); },
                ),
              ]),
              const SizedBox(height: 20),
              // Stock info cards
              Row(children: [
                _DetailCard(title: 'Current Stock', value: '${stock.toStringAsFixed(1)} ${item['unit'] ?? ''}', color: isLow ? AppColors.danger : AppColors.success),
                const SizedBox(width: 8),
                _DetailCard(title: 'Min Stock', value: '${minStock.toStringAsFixed(1)} ${item['unit'] ?? ''}', color: AppColors.gray500),
                const SizedBox(width: 8),
                _DetailCard(title: 'Stock Value', value: '₹${stockValue.toStringAsFixed(0)}', color: AppColors.primary),
              ]),
              if (isLow) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.danger.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
                  ),
                  child: Row(children: [
                    const Icon(Icons.warning, color: AppColors.danger, size: 20),
                    const SizedBox(width: 8),
                    Expanded(child: Text(
                      'Low stock alert! Current stock is below minimum threshold of ${minStock.toStringAsFixed(1)} ${item['unit'] ?? ''}',
                      style: GoogleFonts.inter(fontSize: 12, color: AppColors.danger),
                    )),
                  ]),
                ),
              ],
              const SizedBox(height: 16),
              // Quick actions
              Row(children: [
                Expanded(child: OutlinedButton.icon(
                  onPressed: () { Navigator.pop(ctx); _showAdjustDialog(item); },
                  icon: const Icon(Icons.tune, size: 16),
                  label: const Text('Adjust Stock'),
                )),
                const SizedBox(width: 8),
                Expanded(child: OutlinedButton.icon(
                  onPressed: () { Navigator.pop(ctx); _showItemDialog(existing: item); },
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Edit Item'),
                )),
              ]),
              const SizedBox(height: 16),
              // Stock movements
              Text('Recent Movements', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
              const SizedBox(height: 8),
              if (itemMovements.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text('No movements recorded', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray400)),
                )
              else
                ...itemMovements.take(10).map((m) {
                  final date = DateTime.tryParse(m['createdAt'] ?? '');
                  final qty = double.tryParse(m['quantity']?.toString() ?? '0') ?? 0;
                  final type = m['type'] as String? ?? 'UNKNOWN';
                  return ListTile(
                    dense: true,
                    leading: Icon(
                      type == 'WASTE' ? Icons.delete : type == 'SALE' ? Icons.shopping_bag : Icons.tune,
                      size: 18,
                      color: qty < 0 ? AppColors.danger : AppColors.success,
                    ),
                    title: Text(type, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                    subtitle: Text(
                      date != null ? DateFormat('MMM d, HH:mm').format(date) : '',
                      style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400),
                    ),
                    trailing: Text(
                      '${qty >= 0 ? '+' : ''}${qty.toStringAsFixed(1)} ${item['unit'] ?? ''}',
                      style: GoogleFonts.inter(
                        fontSize: 13, fontWeight: FontWeight.w600,
                        color: qty < 0 ? AppColors.danger : AppColors.success,
                      ),
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Barcode Scanned ───
  void _onBarcodeScanned(String barcode) {
    final item = _items.cast<Map<String, dynamic>>().firstWhere(
      (i) => i['barcode'] == barcode,
      orElse: () => <String, dynamic>{},
    );
    if (item.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('No item found with barcode: $barcode'),
          backgroundColor: AppColors.warning,
          action: SnackBarAction(
            label: 'Add New',
            textColor: Colors.white,
            onPressed: () => _showItemDialog(),
          ),
        ),
      );
      return;
    }
    _showItemDetail(item);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Inventory', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.warning),
            tooltip: 'Waste tracking',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const WasteTrackingScreen())),
          ),
          IconButton(icon: const Icon(Icons.add), onPressed: () => _showItemDialog()),
        ],
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : Column(children: [
              // Barcode scanner
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
                child: BarcodeScannerField(
                  onBarcodeScanned: _onBarcodeScanned,
                  hintText: 'Scan barcode to find item...',
                  labelText: 'Barcode Lookup',
                ),
              ),
              // Tab bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(children: [
                  _InvTabBtn(
                    icon: Icons.inventory_2, label: 'Items',
                    count: _items.length,
                    isSelected: _currentTab == _InventoryTab.items,
                    onTap: () => setState(() => _currentTab = _InventoryTab.items),
                  ),
                  const SizedBox(width: 6),
                  _InvTabBtn(
                    icon: Icons.warning_amber, label: 'Low Stock',
                    count: _lowStockItems.length,
                    isSelected: _currentTab == _InventoryTab.lowStock,
                    color: _lowStockItems.isNotEmpty ? AppColors.danger : null,
                    onTap: () => setState(() => _currentTab = _InventoryTab.lowStock),
                  ),
                  const SizedBox(width: 6),
                  _InvTabBtn(
                    icon: Icons.history, label: 'Movements',
                    count: _stockMovements.length,
                    isSelected: _currentTab == _InventoryTab.movements,
                    onTap: () => setState(() => _currentTab = _InventoryTab.movements),
                  ),
                ]),
              ),
              // Content
              Expanded(
                child: switch (_currentTab) {
                  _InventoryTab.items => _buildItemsList(_filteredItems),
                  _InventoryTab.lowStock => _buildLowStockList(),
                  _InventoryTab.movements => _buildMovementsList(),
                },
              ),
            ]),
    );
  }

  Widget _buildItemsList(List<dynamic> items) {
    if (items.isEmpty) {
      return NxEmptyState(
        icon: Icons.inventory_2_outlined,
        title: _search.isNotEmpty ? 'No matching items' : 'No inventory items',
        actionLabel: _search.isNotEmpty ? null : 'Add Item',
        onAction: _search.isNotEmpty ? null : () => _showItemDialog(),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadItems,
      child: ResponsiveLayout.isDesktop(context)
          ? GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3, childAspectRatio: 2.2, crossAxisSpacing: 10, mainAxisSpacing: 10,
              ),
              itemCount: items.length,
              itemBuilder: (ctx, i) => _buildItemCard(items[i]),
            )
          : ResponsiveLayout.isTablet(context)
              ? GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2, childAspectRatio: 2.2, crossAxisSpacing: 10, mainAxisSpacing: 10,
                  ),
                  itemCount: items.length,
                  itemBuilder: (ctx, i) => _buildItemCard(items[i]),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: items.length,
                  itemBuilder: (ctx, i) => _buildItemCard(items[i]),
                ),
    );
  }

  Widget _buildItemCard(Map<String, dynamic> item) {
    final stock = double.tryParse(item['currentStock']?.toString() ?? '0') ?? 0;
    final minStock = double.tryParse(item['minimumStock']?.toString() ?? '0') ?? 0;
    final costPrice = double.tryParse(item['costPrice']?.toString() ?? '0') ?? 0;
    final isLow = stock <= minStock;
    final stockValue = stock * costPrice;

    return GestureDetector(
      onTap: () => _showItemDetail(item),
      child: NxCard(
        margin: const EdgeInsets.only(bottom: 8),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              // Stock indicator
              Container(
                width: 4, height: 48,
                decoration: BoxDecoration(
                  color: isLow ? AppColors.danger : stock <= minStock * 1.5 ? AppColors.warning : AppColors.success,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Expanded(child: Text(item['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14))),
                      if (isLow)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.danger.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text('LOW', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.danger)),
                        ),
                    ]),
                    const SizedBox(height: 2),
                    Row(children: [
                      Text(item['unit'] ?? '', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                      const SizedBox(width: 8),
                      Text('₹${costPrice.toStringAsFixed(0)}/${item['unit'] ?? ''}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                      if (item['barcode'] != null) ...[
                        const SizedBox(width: 8),
                        Icon(Icons.qr_code, size: 12, color: AppColors.gray400),
                      ],
                    ]),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Stock value
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(stock.toStringAsFixed(1), style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold, fontSize: 18,
                    color: isLow ? AppColors.danger : AppColors.gray800,
                  )),
                  Text('₹${stockValue.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                ],
              ),
              const SizedBox(width: 8),
              // Actions
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, size: 18),
                onSelected: (v) {
                  switch (v) {
                    case 'adjust': _showAdjustDialog(item);
                    case 'edit': _showItemDialog(existing: item);
                  }
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(value: 'adjust', child: Row(children: [Icon(Icons.tune, size: 16), SizedBox(width: 8), Text('Adjust Stock')])),
                  const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit, size: 16), SizedBox(width: 8), Text('Edit Item')])),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLowStockList() {
    if (_lowStockItems.isEmpty) {
      return const NxEmptyState(
        icon: Icons.check_circle_outline,
        title: 'All items are well stocked',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadItems,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _lowStockItems.length,
        itemBuilder: (ctx, i) => _buildLowStockCard(_lowStockItems[i]),
      ),
    );
  }

  Widget _buildLowStockCard(Map<String, dynamic> item) {
    final stock = double.tryParse(item['currentStock']?.toString() ?? '0') ?? 0;
    final minStock = double.tryParse(item['minimumStock']?.toString() ?? '0') ?? 0;
    final deficit = minStock - stock;
    final urgency = minStock > 0 ? (1 - stock / minStock).clamp(0.0, 1.0) : 0.0;

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.danger.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.warning_amber, color: AppColors.danger, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 4),
                  Row(children: [
                    Text('Stock: ${stock.toStringAsFixed(1)} ${item['unit'] ?? ''}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.danger)),
                    const SizedBox(width: 8),
                    Text('Min: ${minStock.toStringAsFixed(1)}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                  ]),
                  const SizedBox(height: 4),
                  // Urgency bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: LinearProgressIndicator(
                      value: urgency,
                      backgroundColor: AppColors.gray100,
                      color: urgency > 0.7 ? AppColors.danger : AppColors.warning,
                      minHeight: 4,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text('Need ${deficit.toStringAsFixed(1)} ${item['unit'] ?? ''} more', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.add_shopping_cart, size: 20),
              color: AppColors.primary,
              tooltip: 'Create purchase order',
              onPressed: () {
                // Navigate to purchase order screen with this item pre-selected
                Navigator.pushNamed(context, '/shell/inventory/purchase-orders');
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMovementsList() {
    if (_stockMovements.isEmpty) {
      return const NxEmptyState(
        icon: Icons.history,
        title: 'No stock movements recorded',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadItems,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _stockMovements.length,
        itemBuilder: (ctx, i) => _buildMovementCard(_stockMovements[i]),
      ),
    );
  }

  Widget _buildMovementCard(Map<String, dynamic> movement) {
    final date = DateTime.tryParse(movement['createdAt'] ?? '');
    final qty = double.tryParse(movement['quantity']?.toString() ?? '0') ?? 0;
    final type = movement['type'] as String? ?? 'UNKNOWN';
    final notes = movement['notes'] as String? ?? '';

    IconData icon;
    Color color;
    switch (type) {
      case 'WASTE': icon = Icons.delete; color = AppColors.danger; break;
      case 'SALE': icon = Icons.shopping_bag; color = AppColors.success; break;
      case 'TRANSFER': icon = Icons.swap_horiz; color = AppColors.primary; break;
      case 'RECEIVE': icon = Icons.input; color = AppColors.success; break;
      default: icon = Icons.tune; color = AppColors.gray500;
    }

    return NxCard(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        title: Row(children: [
          Text(movement['itemName'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(type, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
          ),
        ]),
        subtitle: Row(children: [
          if (date != null) Text(DateFormat('MMM d, HH:mm').format(date), style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
          if (notes.isNotEmpty) ...[
            const SizedBox(width: 8),
            Expanded(child: Text(notes, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400, fontStyle: FontStyle.italic), overflow: TextOverflow.ellipsis)),
          ],
        ]),
        trailing: Text(
          '${qty >= 0 ? '+' : ''}${qty.toStringAsFixed(1)} ${movement['itemUnit'] ?? ''}',
          style: GoogleFonts.inter(
            fontSize: 13, fontWeight: FontWeight.w600,
            color: qty < 0 ? AppColors.danger : AppColors.success,
          ),
        ),
      ),
    );
  }
}

// ─── Tab Button Widget ───
class _InvTabBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final int count;
  final bool isSelected;
  final Color? color;
  final VoidCallback onTap;
  const _InvTabBtn({
    required this.icon, required this.label, required this.count,
    required this.isSelected, this.color, required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? AppColors.primary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? effectiveColor : Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(AppDimens.radiusFull),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 16, color: isSelected ? Colors.white : (color ?? AppColors.gray500)),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.inter(
            fontSize: 12, fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.gray600,
          )),
          if (count > 0) ...[
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white.withValues(alpha: 0.2) : effectiveColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text('$count', style: GoogleFonts.inter(
                fontSize: 10, fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : effectiveColor,
              )),
            ),
          ],
        ]),
      ),
    );
  }
}

// ─── Detail Card Widget ───
class _DetailCard extends StatelessWidget {
  final String title;
  final String value;
  final Color color;
  const _DetailCard({required this.title, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
            const SizedBox(height: 4),
            Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16, color: color)),
          ],
        ),
      ),
    );
  }
}
