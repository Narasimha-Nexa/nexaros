import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';

class SupplierManagementScreen extends ConsumerStatefulWidget {
  const SupplierManagementScreen({super.key});

  @override
  ConsumerState<SupplierManagementScreen> createState() => _SupplierManagementScreenState();
}

class _SupplierManagementScreenState extends ConsumerState<SupplierManagementScreen> {
  late final _api;
  List<dynamic> _suppliers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _loadSuppliers();
  }

  Future<void> _loadSuppliers() async {
    setState(() => _isLoading = true);
    try {
      final suppliers = await _api.getSuppliers();
      if (mounted) setState(() { _suppliers = suppliers; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _showSupplierDialog({Map<String, dynamic>? existing}) async {
    final nameCtrl = TextEditingController(text: existing?['name'] ?? '');
    final phoneCtrl = TextEditingController(text: existing?['phone'] ?? '');
    final emailCtrl = TextEditingController(text: existing?['email'] ?? '');
    final addressCtrl = TextEditingController(text: existing?['address'] ?? '');
    final gstCtrl = TextEditingController(text: existing?['gstNumber'] ?? '');

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(existing != null ? 'Edit Supplier' : 'Add Supplier'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone'))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email'))),
            ]),
            const SizedBox(height: 8),
            TextField(controller: addressCtrl, decoration: const InputDecoration(labelText: 'Address'), maxLines: 2),
            const SizedBox(height: 8),
            TextField(controller: gstCtrl, decoration: const InputDecoration(labelText: 'GST Number')),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () async {
            try {
              if (existing != null) {
                await _api.updateSupplier(existing['id'], {
                  'name': nameCtrl.text, 'phone': phoneCtrl.text, 'email': emailCtrl.text,
                  'address': addressCtrl.text, 'gstNumber': gstCtrl.text,
                });
              } else {
                await _api.createSupplier({
                  'name': nameCtrl.text, 'phone': phoneCtrl.text, 'email': emailCtrl.text,
                  'address': addressCtrl.text, 'gstNumber': gstCtrl.text,
                });
              }
              if (ctx.mounted) Navigator.pop(ctx, true);
            } catch (e) {
              if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger));
            }
          }, child: Text(existing != null ? 'Update' : 'Add')),
        ],
      ),
    );
    if (saved == true) _loadSuppliers();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Suppliers', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [IconButton(icon: const Icon(Icons.add), onPressed: () => _showSupplierDialog())],
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : _suppliers.isEmpty
              ? const NxEmptyState(
                  icon: Icons.business,
                  title: 'No suppliers',
                )
              : RefreshIndicator(
                  onRefresh: _loadSuppliers,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _suppliers.length,
                    itemBuilder: (ctx, i) => _buildSupplierCard(_suppliers[i]),
                  ),
                ),
    );
  }

  Widget _buildSupplierCard(Map<String, dynamic> s) {
    final purchaseCount = (s['_count'] as Map<String, dynamic>?)?['purchases'] ?? 0;
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.primary50,
          child: Text((s['name'] as String? ?? '?')[0], style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppColors.primary)),
        ),
        title: Text(s['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        subtitle: Text([s['phone'], s['email']].where((x) => x != null && x.isNotEmpty).join('  •  '), style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (purchaseCount > 0)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Text('$purchaseCount purchases', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
              ),
            IconButton(icon: const Icon(Icons.edit, size: 18), onPressed: () => _showSupplierDialog(existing: s)),
          ],
        ),
      ),
    );
  }
}
