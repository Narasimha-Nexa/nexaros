import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../data/inventory_models.dart';

class ProductManagementScreen extends ConsumerStatefulWidget {
  const ProductManagementScreen({super.key});

  @override
  ConsumerState<ProductManagementScreen> createState() => _ProductManagementScreenState();
}

class _ProductManagementScreenState extends ConsumerState<ProductManagementScreen> {
  String _searchQuery = '';
  InventoryItemType? _selectedType;
  StockLevel? _selectedStockLevel;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(inventoryProvider).loadItems();
    });
  }

  @override
  Widget build(BuildContext context) {
    final inv = ref.watch(inventoryProvider);
    final state = inv.state;
    final filtered = _applyFilter(state.items);

    return Scaffold(
      appBar: AppBar(
        title: Text('Products & Ingredients', style: AppTextStyles.h2),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: () => inv.loadItems(),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildFilterChips(),
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.inventory_2, size: 64, color: Colors.grey),
                            const SizedBox(height: 16),
                            Text('No items found', style: AppTextStyles.h3),
                          ],
                        ),
                      )
                    : _buildItemsList(filtered),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showItemDialog(),
        icon: const Icon(Icons.add),
        label: const Text('Add Item'),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: TextField(
        onChanged: (v) => setState(() => _searchQuery = v),
        decoration: InputDecoration(
          hintText: 'Search by name, SKU, barcode...',
          prefixIcon: const Icon(Icons.search, size: 20),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, size: 18),
                  onPressed: () => setState(() => _searchQuery = ''),
                )
              : null,
          filled: true,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          isDense: true,
        ),
      ),
    );
  }

  Widget _buildFilterChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _buildChip('All', _selectedType == null && _selectedStockLevel == null, () {
            setState(() { _selectedType = null; _selectedStockLevel = null; });
          }),
          for (final t in InventoryItemType.values.take(4))
            _buildChip(t.label, _selectedType == t, () {
              setState(() { _selectedType = _selectedType == t ? null : t; _selectedStockLevel = null; });
            }),
          _buildChip('Low Stock', _selectedStockLevel == StockLevel.low, () {
            setState(() { _selectedStockLevel = _selectedStockLevel == StockLevel.low ? null : StockLevel.low; _selectedType = null; });
          }),
          _buildChip('Out of Stock', _selectedStockLevel == StockLevel.outOfStock, () {
            setState(() { _selectedStockLevel = _selectedStockLevel == StockLevel.outOfStock ? null : StockLevel.outOfStock; _selectedType = null; });
          }),
        ],
      ),
    );
  }

  Widget _buildChip(String label, bool selected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label, style: TextStyle(fontSize: 12, color: selected ? Colors.white : null)),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.primary,
        checkmarkColor: Colors.white,
        visualDensity: VisualDensity.compact,
      ),
    );
  }

  Widget _buildItemsList(List<InventoryItem> items) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (context, index) => _buildItemCard(items[index]),
    );
  }

  Widget _buildItemCard(InventoryItem item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => _showItemDetail(item),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 50,
                decoration: BoxDecoration(
                  color: item.stockLevel.color,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(item.name, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                        ),
                        if (item.barcode != null)
                          const Icon(Icons.qr_code, size: 14, color: Colors.grey),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${item.unit} | ${item.category ?? "Uncategorized"}${item.supplierName != null ? " | ${item.supplierName}" : ""}',
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${item.currentStock.toStringAsFixed(1)} ${item.unit}', style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: item.stockLevel.color.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(item.stockLevel.label, style: AppTextStyles.labelSmall.copyWith(color: item.stockLevel.color)),
                  ),
                ],
              ),
              const SizedBox(width: 8),
              PopupMenuButton<String>(
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'edit', child: Text('Edit')),
                  const PopupMenuItem(value: 'adjust', child: Text('Adjust Stock')),
                  const PopupMenuItem(value: 'waste', child: Text('Record Waste')),
                  const PopupMenuItem(value: 'delete', child: Text('Delete')),
                ],
                onSelected: (v) => _handleAction(v, item),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleAction(String action, InventoryItem item) {
    switch (action) {
      case 'edit': _showItemDialog(existing: item);
      case 'adjust': _showAdjustDialog(item);
      case 'waste': _showWasteDialog(item);
      case 'delete': _confirmDelete(item);
    }
  }

  void _showItemDialog({InventoryItem? existing}) {
    final nameCtrl = TextEditingController(text: existing?.name ?? '');
    final unitCtrl = TextEditingController(text: existing?.unit ?? 'pcs');
    final stockCtrl = TextEditingController(text: existing?.currentStock.toString() ?? '0');
    final minCtrl = TextEditingController(text: existing?.minimumStock.toString() ?? '0');
    final costCtrl = TextEditingController(text: existing?.costPrice.toString() ?? '0');
    final barcodeCtrl = TextEditingController(text: existing?.barcode ?? '');
    final categoryCtrl = TextEditingController(text: existing?.category ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(existing != null ? 'Edit Item' : 'New Item'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name *')),
              TextField(controller: unitCtrl, decoration: const InputDecoration(labelText: 'Unit *')),
              TextField(controller: stockCtrl, decoration: const InputDecoration(labelText: 'Current Stock'), keyboardType: TextInputType.number),
              TextField(controller: minCtrl, decoration: const InputDecoration(labelText: 'Minimum Stock'), keyboardType: TextInputType.number),
              TextField(controller: costCtrl, decoration: const InputDecoration(labelText: 'Cost Price'), keyboardType: TextInputType.number),
              TextField(controller: barcodeCtrl, decoration: const InputDecoration(labelText: 'Barcode')),
              TextField(controller: categoryCtrl, decoration: const InputDecoration(labelText: 'Category')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final data = {
                'name': nameCtrl.text,
                'unit': unitCtrl.text,
                'currentStock': double.tryParse(stockCtrl.text) ?? 0,
                'minimumStock': double.tryParse(minCtrl.text) ?? 0,
                'costPrice': double.tryParse(costCtrl.text) ?? 0,
                'barcode': barcodeCtrl.text.isNotEmpty ? barcodeCtrl.text : null,
                'category': categoryCtrl.text.isNotEmpty ? categoryCtrl.text : null,
              };
              final inv = ref.read(inventoryProvider);
              if (existing != null) {
                await inv.updateItem(existing.id, data);
              } else {
                await inv.createItem(data);
              }
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: Text(existing != null ? 'Update' : 'Create'),
          ),
        ],
      ),
    );
  }

  void _showAdjustDialog(InventoryItem item) {
    final qtyCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    StockMovementType selectedType = StockMovementType.adjustment;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('Adjust: ${item.name}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Current Stock: ${item.currentStock} ${item.unit}', style: AppTextStyles.bodyMedium),
              const SizedBox(height: 12),
              DropdownButtonFormField<StockMovementType>(
                value: selectedType,
                items: StockMovementType.values.map((t) => DropdownMenuItem(value: t, child: Text(t.label))).toList(),
                onChanged: (v) => setDialogState(() => selectedType = v!),
                decoration: const InputDecoration(labelText: 'Type'),
              ),
              TextField(controller: qtyCtrl, decoration: const InputDecoration(labelText: 'Quantity'), keyboardType: TextInputType.number),
              TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Notes')),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final qty = double.tryParse(qtyCtrl.text) ?? 0;
                if (qty > 0) {
                  await ref.read(inventoryProvider).adjustStock(
                    item.id, selectedType, qty, notes: notesCtrl.text,
                  );
                  if (ctx.mounted) Navigator.pop(ctx);
                }
              },
              child: const Text('Adjust'),
            ),
          ],
        ),
      ),
    );
  }

  void _showWasteDialog(InventoryItem item) {
    final qtyCtrl = TextEditingController();
    final notesCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Record Waste: ${item.name}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Current Stock: ${item.currentStock} ${item.unit}', style: AppTextStyles.bodyMedium),
            const SizedBox(height: 12),
            TextField(controller: qtyCtrl, decoration: const InputDecoration(labelText: 'Quantity Wasted'), keyboardType: TextInputType.number),
            TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Reason')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final qty = double.tryParse(qtyCtrl.text) ?? 0;
              if (qty > 0) {
                await ref.read(inventoryProvider).wasteStock(item.id, qty, notes: notesCtrl.text);
                if (ctx.mounted) Navigator.pop(ctx);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Record Waste'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(InventoryItem item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Item'),
        content: Text('Delete "${item.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              await ref.read(inventoryProvider).deleteItem(item.id);
              if (ctx.mounted) Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showItemDetail(InventoryItem item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.3,
        expand: false,
        builder: (ctx, controller) => SingleChildScrollView(
          controller: controller,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              Text(item.name, style: AppTextStyles.h2),
              const SizedBox(height: 4),
              Text(item.description ?? item.category ?? '', style: AppTextStyles.bodySmall),
              const SizedBox(height: 16),
              _buildDetailRow('Stock', '${item.currentStock} ${item.unit}'),
              _buildDetailRow('Minimum', '${item.minimumStock} ${item.unit}'),
              _buildDetailRow('Maximum', '${item.maximumStock} ${item.unit}'),
              _buildDetailRow('Reorder Level', '${item.reorderLevel} ${item.unit}'),
              _buildDetailRow('Cost Price', '₹${item.costPrice.toStringAsFixed(2)}'),
              _buildDetailRow('Stock Value', '₹${item.stockValue.toStringAsFixed(2)}'),
              if (item.barcode != null) _buildDetailRow('Barcode', item.barcode!),
              if (item.supplierName != null) _buildDetailRow('Supplier', item.supplierName!),
              if (item.recentMovements.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('Recent Movements', style: AppTextStyles.h3),
                const SizedBox(height: 8),
                ...item.recentMovements.take(5).map((m) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      Icon(m.type.icon, size: 14, color: m.type.color),
                      const SizedBox(width: 8),
                      Expanded(child: Text('${m.type.label} - ${m.notes ?? ""}', style: AppTextStyles.bodySmall)),
                      Text('${m.isAddition ? "+" : "-"}${m.quantity}', style: AppTextStyles.bodySmall),
                    ],
                  ),
                )),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTextStyles.bodySmall),
          Text(value, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  List<InventoryItem> _applyFilter(List<InventoryItem> items) {
    var result = items;
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      result = result.where((i) =>
        i.name.toLowerCase().contains(q) ||
        (i.sku?.toLowerCase().contains(q) ?? false) ||
        (i.barcode?.toLowerCase().contains(q) ?? false)
      ).toList();
    }
    if (_selectedType != null) {
      result = result.where((i) => i.type == _selectedType).toList();
    }
    if (_selectedStockLevel != null) {
      result = result.where((i) => i.stockLevel == _selectedStockLevel).toList();
    }
    return result;
  }
}
