import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class ComboScreen extends ConsumerStatefulWidget {
  const ComboScreen({super.key});

  @override
  ConsumerState<ComboScreen> createState() => _ComboScreenState();
}

class _ComboScreenState extends ConsumerState<ComboScreen> {
  List<Map<String, dynamic>> _menuItems = [];
  bool _loadingMenu = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(offersProvider.notifier).loadCombos();
      _loadMenuItems();
    });
  }

  Future<void> _loadMenuItems() async {
    try {
      final items = await ref.read(apiClientProvider).getMenuItems();
      if (mounted) {
        setState(() {
          _menuItems = items.cast<Map<String, dynamic>>();
          _loadingMenu = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingMenu = false);
    }
  }

  Future<void> _showComboDialog({Map<String, dynamic>? existing}) async {
    final nameCtrl = TextEditingController(text: existing?['name'] ?? '');
    final priceCtrl = TextEditingController(text: existing?['price']?.toString() ?? '');
    final descCtrl = TextEditingController(text: existing?['description'] ?? '');
    List<String> selectedItems = existing != null
        ? List<String>.from((existing['items'] as List?)?.map((i) => i['menuItemId'] ?? i['id']) ?? [])
        : [];
    bool isActive = existing?['isActive'] ?? true;

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(existing != null ? 'Edit Combo' : 'Create Combo Meal'),
          content: SizedBox(
            width: 400,
            child: SingleChildScrollView(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Combo Name',
                    prefixIcon: Icon(Icons.restaurant_menu, size: 20),
                    hintText: 'e.g. Family Feast',
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: descCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    prefixIcon: Icon(Icons.description, size: 20),
                  ),
                  maxLines: 2,
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: priceCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Combo Price (₹)',
                    prefixIcon: Icon(Icons.currency_rupee, size: 20),
                    hintText: 'e.g. 499',
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.fastfood, size: 18, color: AppColors.gray600),
                    const SizedBox(width: 8),
                    Text('Select Items in Combo', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 8),
                if (_loadingMenu)
                  const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator(strokeWidth: 2)))
                else if (_menuItems.isEmpty)
                  Text('No menu items available', style: GoogleFonts.inter(color: AppColors.gray400, fontSize: 12))
                else
                  SizedBox(
                    height: 200,
                    child: ListView(
                      children: _menuItems.map((item) {
                        final id = item['id'] as String;
                        final isSelected = selectedItems.contains(id);
                        final price = double.tryParse(item['price']?.toString() ?? '0') ?? 0;
                        return CheckboxListTile(
                          dense: true,
                          value: isSelected,
                          title: Row(
                            children: [
                              Container(
                                width: 8, height: 8,
                                decoration: BoxDecoration(
                                  border: Border.all(color: item['isVeg'] == true ? AppColors.success : AppColors.danger, width: 1.5),
                                  borderRadius: BorderRadius.circular(2),
                                ),
                                child: Center(child: Container(width: 3, height: 3, decoration: BoxDecoration(
                                  color: item['isVeg'] == true ? AppColors.success : AppColors.danger,
                                  shape: BoxShape.circle,
                                ))),
                              ),
                              const SizedBox(width: 6),
                              Text(item['name'] ?? '', style: GoogleFonts.inter(fontSize: 13)),
                            ],
                          ),
                          subtitle: Text('₹${price.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
                          onChanged: (v) {
                            setDialogState(() {
                              if (v == true) {
                                selectedItems.add(id);
                              } else {
                                selectedItems.remove(id);
                              }
                            });
                          },
                          controlAffinity: ListTileControlAffinity.trailing,
                        );
                      }).toList(),
                    ),
                  ),
                if (existing != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Text('Active'),
                      const Spacer(),
                      Switch(value: isActive, onChanged: (v) => setDialogState(() => isActive = v)),
                    ],
                  ),
                ],
              ]),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                if (nameCtrl.text.trim().isEmpty || selectedItems.isEmpty) return;
                final data = {
                  'name': nameCtrl.text.trim(),
                  'description': descCtrl.text.trim(),
                  'price': double.tryParse(priceCtrl.text) ?? 0,
                  'itemIds': selectedItems,
                  if (existing != null) 'isActive': isActive,
                };
                bool success;
                if (existing != null) {
                  success = await ref.read(offersProvider.notifier).updateCombo(existing['id'], data) != null;
                } else {
                  success = await ref.read(offersProvider.notifier).createCombo(data) != null;
                }
                if (ctx.mounted) Navigator.pop(ctx, success);
              },
              child: Text(existing != null ? 'Update' : 'Create'),
            ),
          ],
        ),
      ),
    );
    if (saved == true) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(existing != null ? 'Combo updated!' : 'Combo created!'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  Future<void> _confirmDelete(String id, String name) async {
    final offers = ref.read(offersProvider.notifier);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Combo'),
        content: Text('Delete combo "$name"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      final success = await offers.deleteCombo(id);
      if (success) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Combo deleted'), backgroundColor: AppColors.success),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final offers = ref.watch(offersProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('Combo Meals', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.warning,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showComboDialog(),
          ),
        ],
      ),
      body: offers.combosLoading && offers.combos.isEmpty
          ? const Center(child: NxFullScreenLoader())
          : offers.combos.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.fastfood, size: 64, color: AppColors.gray300),
                      const SizedBox(height: 12),
                      Text('No combo meals', style: GoogleFonts.inter(fontSize: 16, color: AppColors.gray500)),
                      const SizedBox(height: 8),
                      Text('Create combos by bundling menu items at a special price',
                          style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray400)),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => _showComboDialog(),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Create Combo'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => offers.loadCombos(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: offers.combos.length,
                    itemBuilder: (ctx, i) => _buildComboCard(offers.combos[i]),
                  ),
                ),
    );
  }

  Widget _buildComboCard(Map<String, dynamic> combo) {
    final price = double.tryParse(combo['price']?.toString() ?? '0') ?? 0;
    final isActive = combo['isActive'] ?? combo['isAvailable'] ?? true;
    final items = (combo['items'] as List?) ?? [];
    final totalItemPrice = items.fold<double>(0, (sum, i) {
      final itemPrice = (i is Map) ? (double.tryParse(i['price']?.toString() ?? '0') ?? 0) : 0;
      return sum + itemPrice;
    });
    final savings = totalItemPrice > 0 ? totalItemPrice - price : 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.fastfood, color: AppColors.warning, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(combo['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15)),
                      if (combo['description'] != null && (combo['description'] as String).isNotEmpty)
                        Text(combo['description'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₹${price.toStringAsFixed(0)}',
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.warning),
                    ),
                    if (savings > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(3)),
                        child: Text('Save ₹${savings.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 10, color: AppColors.success, fontWeight: FontWeight.w600)),
                      ),
                  ],
                ),
              ],
            ),
            if (items.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text('Items:', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.gray500)),
              const SizedBox(height: 4),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: items.map((item) {
                  final name = item is Map ? (item['name'] ?? item['menuItem']?['name'] ?? '') : item.toString();
                  final isVeg = item is Map ? (item['isVeg'] ?? item['menuItem']?['isVeg'] ?? true) : true;
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: isVeg ? AppColors.success.withValues(alpha: 0.06) : AppColors.danger.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: isVeg ? AppColors.success.withValues(alpha: 0.2) : AppColors.danger.withValues(alpha: 0.2)),
                    ),
                    child: Text(name, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray600)),
                  );
                }).toList(),
              ),
            ],
            const Divider(height: 16),
            Row(
              children: [
                if (!isActive)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(3)),
                    child: Text('Inactive', style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
                  ),
                const Spacer(),
                TextButton.icon(
                  onPressed: () => _showComboDialog(existing: combo),
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Edit', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(foregroundColor: AppColors.gray600),
                ),
                const SizedBox(width: 4),
                TextButton.icon(
                  onPressed: () => _confirmDelete(combo['id'], combo['name']),
                  icon: const Icon(Icons.delete_outline, size: 16),
                  label: const Text('Delete', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
