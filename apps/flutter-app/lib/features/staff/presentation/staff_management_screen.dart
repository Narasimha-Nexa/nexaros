import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/app_state.dart';
import '../../../core/theme/app_colors.dart';

class StaffManagementScreen extends StatefulWidget {
  const StaffManagementScreen({super.key});

  @override
  State<StaffManagementScreen> createState() => _StaffManagementScreenState();
}

class _StaffManagementScreenState extends State<StaffManagementScreen> {
  final _api = ApiClient();
  List<dynamic> _staff = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStaff();
  }

  Future<void> _loadStaff() async {
    setState(() => _isLoading = true);
    try {
      final branchId = context.read<AppState>().branchId ?? '';
      final staff = await _api.getStaff(branchId: branchId);
      if (mounted) setState(() { _staff = staff; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _showStaffDialog({Map<String, dynamic>? existing}) async {
    final nameCtrl = TextEditingController(text: existing?['name'] ?? '');
    final phoneCtrl = TextEditingController(text: existing?['phone'] ?? '');
    final pinCtrl = TextEditingController(text: existing?['pin'] ?? '');

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(existing != null ? 'Edit Staff' : 'Add Staff'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Name'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneCtrl,
                decoration: const InputDecoration(labelText: 'Phone'),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: pinCtrl,
                decoration: const InputDecoration(
                  labelText: 'PIN (4-6 digits)',
                  helperText: 'Used for POS login',
                ),
                keyboardType: TextInputType.number,
                maxLength: 6,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final branchId = context.read<AppState>().branchId ?? '';
              final data = {
                'name': nameCtrl.text,
                'phone': phoneCtrl.text,
                if (pinCtrl.text.isNotEmpty) 'pin': pinCtrl.text,
              };
              try {
                if (existing != null) {
                  await _api.updateStaff(existing['id'], data);
                } else {
                  await _api.createStaff(branchId, data);
                }
                if (ctx.mounted) Navigator.pop(ctx, true);
              } catch (e) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger),
                  );
                }
              }
            },
            child: Text(existing != null ? 'Update' : 'Add'),
          ),
        ],
      ),
    );
    if (saved == true) _loadStaff();
  }

  Future<void> _confirmDelete(String id, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Staff'),
        content: Text('Deactivate $name?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      try {
        await _api.deleteStaff(id);
        _loadStaff();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Staff removed'), backgroundColor: AppColors.success),
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
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Staff', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showStaffDialog(),
        child: const Icon(Icons.add),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _staff.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.people_outline, size: 64, color: AppColors.gray300),
                      const SizedBox(height: 12),
                      Text('No staff members', style: GoogleFonts.inter(color: AppColors.gray500)),
                      const SizedBox(height: 8),
                      TextButton.icon(
                        onPressed: () => _showStaffDialog(),
                        icon: const Icon(Icons.add),
                        label: const Text('Add Staff'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadStaff,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _staff.length,
                    itemBuilder: (ctx, i) => _buildStaffCard(_staff[i]),
                  ),
                ),
    );
  }

  Widget _buildStaffCard(Map<String, dynamic> staff) {
    final role = staff['role'] as Map<String, dynamic>?;
    final orderCount = (staff['_count'] as Map<String, dynamic>?)?['orders'] ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.primary50,
          child: Text(
            (staff['name'] as String? ?? '?')[0].toUpperCase(),
            style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppColors.primary),
          ),
        ),
        title: Text(staff['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        subtitle: Text(
          '${role?['name'] ?? 'Staff'}${staff['phone'] != null ? ' • ${staff['phone']}' : ''}',
          style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (orderCount > 0)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Text('$orderCount orders', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
              ),
            IconButton(
              icon: const Icon(Icons.edit, size: 18),
              onPressed: () => _showStaffDialog(existing: staff),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.danger),
              onPressed: () => _confirmDelete(staff['id'], staff['name'] ?? ''),
            ),
          ],
        ),
      ),
    );
  }
}
