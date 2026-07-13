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
  List<dynamic> _roles = [];
  bool _isLoading = true;
  bool _showPerformance = false;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() => _isLoading = true);
    try {
      final branchId = context.read<AppState>().branchId ?? '';
      // Load staff and roles independently so a failure in one doesn't block the other
      final staff = await _api.getStaff(branchId: branchId).catchError((_) => <dynamic>[]);
      final roles = await _api.getRoles().catchError((_) => <dynamic>[]);
      if (mounted) setState(() { _staff = staff; _roles = roles; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // Use _loadAll() instead - loads staff + roles together

  Future<void> _showStaffDialog({Map<String, dynamic>? existing}) async {
    final nameCtrl = TextEditingController(text: existing?['name'] ?? '');
    final phoneCtrl = TextEditingController(text: existing?['phone'] ?? '');
    final pinCtrl = TextEditingController(text: existing?['pin'] ?? '');
    String? selectedRoleId = existing?['roleId'] as String? ?? (existing?['role'] as Map<String, dynamic>?)?['id'] as String?;

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(existing != null ? 'Edit Staff' : 'Add Staff'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Name', prefixIcon: Icon(Icons.person, size: 20)),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneCtrl,
                  decoration: const InputDecoration(labelText: 'Phone', prefixIcon: Icon(Icons.phone, size: 20)),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: pinCtrl,
                  decoration: const InputDecoration(
                    labelText: 'PIN (4-6 digits)',
                    helperText: 'Used for POS login',
                    prefixIcon: Icon(Icons.lock, size: 20),
                  ),
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Role',
                    prefixIcon: Icon(Icons.badge, size: 20),
                  ),
                  initialValue: selectedRoleId,
                  items: _roles.map<DropdownMenuItem<String>>((r) => DropdownMenuItem<String>(
                    value: r['id'] as String?,
                    child: Text(r['name'] ?? ''),
                  )).toList(),
                  onChanged: (v) => setDialogState(() => selectedRoleId = v),
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
                final data = <String, dynamic>{
                  'name': nameCtrl.text,
                  'phone': phoneCtrl.text,
                  if (pinCtrl.text.isNotEmpty) 'pin': pinCtrl.text,
                  if (selectedRoleId != null) 'roleId': selectedRoleId,
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
      ),
    );
    if (saved == true) _loadAll();
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
        _loadAll();
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
      appBar: AppBar(
        title: Text('Staff', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            icon: Icon(_showPerformance ? Icons.people : Icons.bar_chart, size: 20),
            tooltip: _showPerformance ? 'Show staff list' : 'Show performance',
            onPressed: () => setState(() => _showPerformance = !_showPerformance),
          ),
        ],
      ),
      floatingActionButton: _showPerformance
          ? null
          : FloatingActionButton(
              onPressed: () => _showStaffDialog(),
              child: const Icon(Icons.add),
            ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _showPerformance
              ? _buildPerformanceView()
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
                      onRefresh: _loadAll,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _staff.length,
                        itemBuilder: (ctx, i) => _buildStaffCard(_staff[i]),
                      ),
                    ),
    );
  }

  Widget _buildPerformanceView() {
    if (_staff.isEmpty) {
      return Center(child: Text('No staff data', style: GoogleFonts.inter(color: AppColors.gray500)));
    }

    // Sort by order count descending
    final sorted = List<dynamic>.from(_staff)
      ..sort((a, b) => ((b['_count'] as Map?)?['orders'] as int? ?? 0).compareTo((a['_count'] as Map?)?['orders'] as int? ?? 0));

    final totalOrders = sorted.fold<int>(0, (sum, s) => sum + ((s['_count'] as Map?)?['orders'] as int? ?? 0));
    final avgPerStaff = _staff.isEmpty ? '0' : (totalOrders / _staff.length).toStringAsFixed(1);

    return Column(
      children: [
        // Summary header
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          color: AppColors.primary50,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _perfStat('Total Staff', '${_staff.length}', AppColors.primary),
              _perfStat('Total Orders', '$totalOrders', AppColors.success),
              _perfStat('Avg/Staff', avgPerStaff, AppColors.warning),
            ],
          ),
        ),
        // Ranking list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: sorted.length,
            itemBuilder: (ctx, i) => _buildPerformanceCard(sorted[i], i + 1, totalOrders),
          ),
        ),
      ],
    );
  }

  Widget _perfStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 20, color: color)),
        const SizedBox(height: 2),
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
      ],
    );
  }

  Widget _buildPerformanceCard(Map<String, dynamic> staff, int rank, int totalOrders) {
    final orderCount = (staff['_count'] as Map<String, dynamic>?)?['orders'] as int? ?? 0;
    final percentage = totalOrders > 0 ? (orderCount / totalOrders * 100) : 0.0;

    Color rankColor;
    if (rank == 1) {
      rankColor = const Color(0xFFFFD700);
    } else if (rank == 2) {
      rankColor = const Color(0xFFC0C0C0);
    } else if (rank == 3) {
      rankColor = const Color(0xFFCD7F32);
    } else {
      rankColor = AppColors.gray300;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            // Rank badge
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: rankColor.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text('$rank', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: rankColor)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(staff['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: totalOrders > 0 ? orderCount / totalOrders : 0,
                      backgroundColor: AppColors.gray100,
                      color: rank <= 3 ? rankColor : AppColors.primary,
                      minHeight: 6,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text('$orderCount', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
            const SizedBox(width: 4),
            Text('(${percentage.toStringAsFixed(0)}%)', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
          ],
        ),
      ),
    );
  }

  Widget _buildStaffCard(Map<String, dynamic> staff) {
    final role = staff['role'] as Map<String, dynamic>?;
    final orderCount = (staff['_count'] as Map<String, dynamic>?)?['orders'] ?? 0;
    final hasPin = staff['pin'] != null && (staff['pin'] as String).isNotEmpty;

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
        title: Row(
          children: [
            Text(staff['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            if (hasPin) ...[const SizedBox(width: 6), Icon(Icons.lock, size: 14, color: AppColors.gray400)],
          ],
        ),
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
