import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';

class PurchaseOrderScreen extends ConsumerStatefulWidget {
  const PurchaseOrderScreen({super.key});

  @override
  ConsumerState<PurchaseOrderScreen> createState() => _PurchaseOrderScreenState();
}

class _PurchaseOrderScreenState extends ConsumerState<PurchaseOrderScreen> {
  late final _api;
  List<dynamic> _purchases = [];
  List<dynamic> _suppliers = [];
  List<dynamic> _inventoryItems = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait<dynamic>([
        _api.getPurchases(),
        _api.getSuppliers(),
        _api.getInventoryItems(),
      ]);
      if (mounted) setState(() { _purchases = results[0]; _suppliers = results[1]; _inventoryItems = results[2]; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _showCreateDialog() async {
    String? selectedSupplierId;
    final items = <Map<String, dynamic>>[];

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          void addItem() {
            String? selectedItemId;
            final qtyCtrl = TextEditingController();
            final priceCtrl = TextEditingController();
            showDialog(context: ctx, builder: (ic) => StatefulBuilder(
              builder: (ic, setItemState) => AlertDialog(
                title: const Text('Add Item'),
                content: Column(mainAxisSize: MainAxisSize.min, children: [
                  DropdownButtonFormField<String>(
                    decoration: const InputDecoration(labelText: 'Item'),
                    items: _inventoryItems.map<DropdownMenuItem<String>>((i) => DropdownMenuItem(value: i['id'] as String?, child: Text(i['name']))).toList(),
                    onChanged: (v) => setItemState(() => selectedItemId = v),
                  ),
                  const SizedBox(height: 8),
                  TextField(controller: qtyCtrl, decoration: const InputDecoration(labelText: 'Quantity'), keyboardType: TextInputType.number),
                  const SizedBox(height: 8),
                  TextField(controller: priceCtrl, decoration: const InputDecoration(labelText: 'Unit Price'), keyboardType: TextInputType.number),
                ]),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(ic), child: const Text('Cancel')),
                  ElevatedButton(onPressed: () {
                    if (selectedItemId == null) return;
                    final item = _inventoryItems.cast<Map<String, dynamic>>().firstWhere((i) => i['id'] == selectedItemId, orElse: () => {});
                    setDialogState(() {
                      items.add({
                        'id': selectedItemId,
                        'name': item['name'] ?? '',
                        'qty': double.tryParse(qtyCtrl.text) ?? 0,
                        'price': double.tryParse(priceCtrl.text) ?? 0,
                      });
                    });
                    Navigator.pop(ic);
                  }, child: const Text('Add')),
                ],
              ),
            ));
          }

          return AlertDialog(
            title: const Text('Create Purchase Order'),
            content: SizedBox(
              width: double.maxFinite,
              child: SingleChildScrollView(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  DropdownButtonFormField<String>(
                    decoration: const InputDecoration(labelText: 'Supplier'),
                    items: _suppliers.map<DropdownMenuItem<String>>((s) => DropdownMenuItem<String>(value: s['id'] as String?, child: Text(s['name']))).toList(),
                    onChanged: (v) => setDialogState(() => selectedSupplierId = v),
                  ),
                  const SizedBox(height: 12),
                  ...items.map((item) => ListTile(
                    title: Text(item['name']),
                    trailing: Text('${item['qty']} x ₹${item['price']}'),
                  )),
                  TextButton.icon(
                    onPressed: addItem,
                    icon: const Icon(Icons.add),
                    label: const Text('Add Item'),
                  ),
                ]),
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
              ElevatedButton(onPressed: () async {
                if (selectedSupplierId == null || items.isEmpty) return;
                await _api.createPurchase({
                  'supplierId': selectedSupplierId,
                  'items': items.map((i) => {'inventoryItemId': i['id'], 'quantity': i['qty'], 'unitPrice': i['price']}).toList(),
                });
                if (ctx.mounted) Navigator.pop(ctx, true);
              }, child: const Text('Create')),
            ],
          );
        },
      ),
    );
    if (saved == true) _loadAll();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Purchase Orders', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [IconButton(icon: const Icon(Icons.add), onPressed: _showCreateDialog)],
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : _purchases.isEmpty
              ? const NxEmptyState(
                  icon: Icons.receipt,
                  title: 'No purchase orders',
                )
              : RefreshIndicator(
                  onRefresh: _loadAll,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _purchases.length,
                    itemBuilder: (ctx, i) => _buildPurchaseCard(_purchases[i]),
                  ),
                ),
    );
  }

  Widget _buildPurchaseCard(Map<String, dynamic> p) {
    final supplier = p['supplier'] as Map<String, dynamic>?;
    final items = p['items'] as List<dynamic>? ?? [];
    final status = p['status'] ?? 'PENDING';
    final total = double.tryParse(p['totalAmount']?.toString() ?? '0') ?? 0;

    Color statusColor;
    switch (status as String) {
      case 'RECEIVED': statusColor = AppColors.success; break;
      case 'CANCELLED': statusColor = AppColors.danger; break;
      default: statusColor = AppColors.warning;
    }

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(Icons.receipt, size: 18, color: AppColors.gray400),
              const SizedBox(width: 8),
              Text(supplier?['name'] ?? 'Unknown', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                child: Text(status, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: statusColor)),
              ),
            ]),
            const SizedBox(height: 8),
            if (items.isNotEmpty)
              ...items.take(3).map((item) {
                final inv = item['inventoryItem'] as Map<String, dynamic>?;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 2),
                  child: Text('${item['quantity']}x ${inv?['name'] ?? ''}  ×  ₹${item['unitPrice']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                );
              }),
            if (items.length > 3)
              Text('+${items.length - 3} more', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400, fontStyle: FontStyle.italic)),
            const Divider(height: 12),
            Row(children: [
              Text('Total: ₹${total.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
              const Spacer(),
              Text('#${p['id'].toString().substring(0, 8)}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
            ]),
          ],
        ),
      ),
    );
  }
}
