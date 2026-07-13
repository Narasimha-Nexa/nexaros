import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';

class WasteTrackingScreen extends StatefulWidget {
  const WasteTrackingScreen({super.key});

  @override
  State<WasteTrackingScreen> createState() => _WasteTrackingScreenState();
}

class _WasteTrackingScreenState extends State<WasteTrackingScreen> {
  final _api = ApiClient();
  List<dynamic> _inventoryItems = [];
  List<Map<String, dynamic>> _wasteRecords = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final items = await _api.getInventoryItems();
      if (mounted) {
        setState(() {
          _inventoryItems = items;
          // Extract waste movements from inventory items
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
            return db!.compareTo(da!);
          });
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _recordWaste() async {
    String? selectedItemId;
    final qtyCtrl = TextEditingController();
    final notesCtrl = TextEditingController();

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Record Waste'),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Item', prefixIcon: Icon(Icons.inventory_2, size: 20)),
              items: _inventoryItems.map<DropdownMenuItem<String>>((i) => DropdownMenuItem<String>(
                value: i['id'] as String?,
                child: Text('${i['name']} (${i['currentStock']} ${i['unit']})'),
              )).toList(),
              onChanged: (v) => setDialogState(() => selectedItemId = v),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: qtyCtrl,
              decoration: const InputDecoration(labelText: 'Quantity Wasted', prefixIcon: Icon(Icons.remove_circle, size: 20)),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesCtrl,
              decoration: const InputDecoration(labelText: 'Reason / Notes', prefixIcon: Icon(Icons.notes, size: 20)),
              maxLines: 2,
            ),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.warning),
              onPressed: () async {
                if (selectedItemId == null || qtyCtrl.text.isEmpty) return;
                await _api.adjustStock(selectedItemId!, {
                  'type': 'WASTE',
                  'quantity': double.tryParse(qtyCtrl.text) ?? 0,
                  'notes': notesCtrl.text,
                });
                if (ctx.mounted) Navigator.pop(ctx, true);
              },
              child: const Text('Record Waste'),
            ),
          ],
        ),
      ),
    );
    if (saved == true) _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Waste Tracking', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          TextButton.icon(
            onPressed: _recordWaste,
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Record'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _wasteRecords.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.delete_outline, size: 64, color: AppColors.gray300),
                      const SizedBox(height: 12),
                      Text('No waste recorded', style: GoogleFonts.inter(color: AppColors.gray500)),
                      const SizedBox(height: 8),
                      TextButton.icon(
                        onPressed: _recordWaste,
                        icon: const Icon(Icons.add),
                        label: const Text('Record Waste'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _wasteRecords.length,
                    itemBuilder: (ctx, i) => _buildWasteCard(_wasteRecords[i]),
                  ),
                ),
    );
  }

  Widget _buildWasteCard(Map<String, dynamic> record) {
    final date = DateTime.tryParse(record['createdAt'] ?? '');
    final qty = double.tryParse(record['quantity']?.toString() ?? '0') ?? 0;
    final notes = record['notes'] as String? ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.delete, color: AppColors.warning, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(record['itemName'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 2),
                  Row(children: [
                    Text('${qty.abs().toStringAsFixed(1)} ${record['itemUnit'] ?? ''}',
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.danger)),
                    if (notes.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      Text(notes, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500, fontStyle: FontStyle.italic)),
                    ],
                  ]),
                  if (date != null) ...[
                    const SizedBox(height: 2),
                    Text(DateFormat('MMM d, yyyy HH:mm').format(date), style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
