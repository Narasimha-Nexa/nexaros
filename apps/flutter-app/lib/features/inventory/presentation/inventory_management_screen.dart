import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/barcode_scanner_field.dart';
import 'waste_tracking_screen.dart';

class InventoryManagementScreen extends StatefulWidget {
  const InventoryManagementScreen({super.key});

  @override
  State<InventoryManagementScreen> createState() => _InventoryManagementScreenState();
}

class _InventoryManagementScreenState extends State<InventoryManagementScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  List<dynamic> _lowStockItems = [];
  bool _isLoading = true;
  bool _showLowStock = false;

  @override
  void initState() {
    super.initState();
    _loadItems();
  }

  Future<void> _loadItems() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _api.getInventoryItems(),
        _api.getLowStock(),
      ]);
      if (mounted) {
        setState(() {
          _items = results[0];
          _lowStockItems = results[1];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _showItemDialog({Map<String, dynamic>? existing}) async {
    final nameCtrl = TextEditingController(text: existing?['name'] ?? '');
    final unitCtrl = TextEditingController(text: existing?['unit'] ?? 'kg');
    final stockCtrl = TextEditingController(text: existing?['currentStock']?.toString() ?? '0');
    final minStockCtrl = TextEditingController(text: existing?['minimumStock']?.toString() ?? '10');
    final costCtrl = TextEditingController(text: existing?['costPrice']?.toString() ?? '0');
    final barcodeCtrl = TextEditingController(text: existing?['barcode'] ?? '');

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(existing != null ? 'Edit Item' : 'Add Item'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: TextField(controller: unitCtrl, decoration: const InputDecoration(labelText: 'Unit'))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: stockCtrl, decoration: const InputDecoration(labelText: 'Current Stock'), keyboardType: TextInputType.number)),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: TextField(controller: minStockCtrl, decoration: const InputDecoration(labelText: 'Min Stock'), keyboardType: TextInputType.number)),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: costCtrl, decoration: const InputDecoration(labelText: 'Cost Price'), keyboardType: TextInputType.number)),
            ]),
            const SizedBox(height: 8),
            TextField(controller: barcodeCtrl, decoration: const InputDecoration(labelText: 'Barcode')),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () async {
            final data = {
              'name': nameCtrl.text, 'unit': unitCtrl.text,
              'currentStock': double.tryParse(stockCtrl.text) ?? 0,
              'minimumStock': double.tryParse(minStockCtrl.text) ?? 10,
              'costPrice': double.tryParse(costCtrl.text) ?? 0,
              if (barcodeCtrl.text.isNotEmpty) 'barcode': barcodeCtrl.text,
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

    // Barcode scanner integration - find inventory item by barcode
  void _onBarcodeScanned(String barcode) {
    final item = _items.cast<Map<String, dynamic>>().firstWhere(
      (i) => i['barcode'] == barcode,
      orElse: () => <String, dynamic>{},
    );
    if (item.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No item found with barcode: $barcode'), backgroundColor: AppColors.warning),
      );
      return;
    }
    _showAdjustDialog(item);
  }

  Future<void> _showAdjustDialog(Map<String, dynamic> item) async {
    final qtyCtrl = TextEditingController();
    final typeCtrl = TextEditingController(text: 'ADJUSTMENT');
    final notesCtrl = TextEditingController();
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('Adjust: ${item['name']}'),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            DropdownButtonFormField<String>(
              initialValue: 'ADJUSTMENT',
              decoration: const InputDecoration(labelText: 'Type'),
              items: ['ADJUSTMENT', 'SALE', 'WASTE', 'TRANSFER'].map<DropdownMenuItem<String>>((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
              onChanged: (v) => setDialogState(() => typeCtrl.text = v ?? 'ADJUSTMENT'),
            ),
            const SizedBox(height: 12),
            TextField(controller: qtyCtrl, decoration: const InputDecoration(labelText: 'Quantity'), keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Notes'), maxLines: 2),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(onPressed: () async {
              await _api.adjustStock(item['id'], {
                'type': typeCtrl.text,
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

  @override
  Widget build(BuildContext context) {
    final displayItems = _showLowStock ? _lowStockItems : _items;
    return Scaffold(
      appBar: AppBar(
        title: Text('Inventory', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.warning),
            tooltip: 'Waste tracking',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const WasteTrackingScreen())),
          ),
          if (_lowStockItems.isNotEmpty)
            TextButton.icon(
              onPressed: () => setState(() => _showLowStock = !_showLowStock),
              icon: Icon(_showLowStock ? Icons.inventory_2 : Icons.warning_amber, size: 18, color: AppColors.warning),
              label: Text('${_lowStockItems.length} low', style: GoogleFonts.inter(fontSize: 12, color: AppColors.warning)),
            ),
          IconButton(icon: const Icon(Icons.add), onPressed: () => _showItemDialog()),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Barcode scanner for quick lookup
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
                  child: BarcodeScannerField(
                    onBarcodeScanned: _onBarcodeScanned,
                    hintText: 'Scan barcode to find item...',
                    labelText: 'Barcode Lookup',
                  ),
                ),
                Expanded(
                  child: displayItems.isEmpty
                      ? Center(child: Text(_showLowStock ? 'No low stock items' : 'No inventory items', style: GoogleFonts.inter(color: AppColors.gray500)))
                      : RefreshIndicator(
                          onRefresh: _loadItems,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(12),
                            itemCount: displayItems.length,
                            itemBuilder: (ctx, i) => _buildItemCard(displayItems[i]),
                          ),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildItemCard(Map<String, dynamic> item) {
    final stock = double.tryParse(item['currentStock']?.toString() ?? '0') ?? 0;
    final minStock = double.tryParse(item['minimumStock']?.toString() ?? '0') ?? 0;
    final isLow = stock <= minStock;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 4, height: 40,
              decoration: BoxDecoration(
                color: isLow ? AppColors.danger : AppColors.success,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 2),
                  Text('${item['unit'] ?? ''}  •  ₹${item['costPrice'] ?? 0}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('${stock.toStringAsFixed(1)} ${item['unit'] ?? ''}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: isLow ? AppColors.danger : AppColors.gray800)),
                if (isLow)
                  Text('Min: ${minStock.toStringAsFixed(1)}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.danger)),
              ],
            ),
            const SizedBox(width: 8),              IconButton(icon: const Icon(Icons.tune, size: 18), onPressed: () => _showAdjustDialog(item), tooltip: 'Adjust stock'),
            IconButton(icon: const Icon(Icons.edit, size: 18), onPressed: () => _showItemDialog(existing: item)),
          ],
        ),
      ),
    );
  }
}
