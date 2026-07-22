import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../shared/widgets/shared_widgets.dart';

enum _StaffTab { list, performance, schedule }

class StaffManagementScreen extends ConsumerStatefulWidget {
  const StaffManagementScreen({super.key});

  @override
  ConsumerState<StaffManagementScreen> createState() => _StaffManagementScreenState();
}

class _StaffManagementScreenState extends ConsumerState<StaffManagementScreen> {
  late final dynamic _api;
  List<dynamic> _staff = [];
  List<dynamic> _roles = [];
  List<dynamic> _schedule = [];
  bool _isLoading = true;
  _StaffTab _currentTab = _StaffTab.list;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() => _isLoading = true);
    try {
      final branchId = ref.read(appStateProvider).branchId ?? '';
      final results = await Future.wait<dynamic>([
        _api.getStaff(branchId: branchId).then((r) => r is Map ? List<dynamic>.from(r['staff'] ?? []) : r).catchError((_) => <dynamic>[]),
        _api.getRoles().catchError((_) => <dynamic>[]),
        _api.getSchedule(branchId, _formatDate(DateTime.now())).catchError((_) => <dynamic>[]),
      ]);
      if (mounted) {
        setState(() {
          _staff = results[0];
          _roles = results[1];
          _schedule = results[2];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _formatDate(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  List<dynamic> get _filteredStaff {
    if (_searchQuery.isEmpty) return _staff;
    final q = _searchQuery.toLowerCase();
    return _staff.where((s) {
      final name = (s['name'] as String? ?? '').toLowerCase();
      final phone = (s['phone'] as String? ?? '').toLowerCase();
      final role = ((s['role'] as Map<String, dynamic>?)?['name'] as String? ?? '').toLowerCase();
      return name.contains(q) || phone.contains(q) || role.contains(q);
    }).toList();
  }

  // ─── Staff CRUD Dialog ───
  Future<void> _showStaffDialog({Map<String, dynamic>? existing}) async {
    final nameCtrl = TextEditingController(text: existing?['name'] ?? '');
    final phoneCtrl = TextEditingController(text: existing?['phone'] ?? '');
    final emailCtrl = TextEditingController(text: existing?['email'] ?? '');
    final pinCtrl = TextEditingController(text: existing?['pin'] ?? '');
    String? selectedRoleId = existing?['roleId'] as String? ?? (existing?['role'] as Map<String, dynamic>?)?['id'] as String?;
    bool isActive = existing?['isActive'] as bool? ?? true;

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Row(children: [
            Icon(existing != null ? Icons.edit : Icons.person_add, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(existing != null ? 'Edit Staff' : 'Add Staff', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ]),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person, size: 20)),
                  textCapitalization: TextCapitalization.words,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneCtrl,
                  decoration: const InputDecoration(labelText: 'Phone', prefixIcon: Icon(Icons.phone, size: 20)),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: emailCtrl,
                  decoration: const InputDecoration(labelText: 'Email (optional)', prefixIcon: Icon(Icons.email, size: 20)),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 12),
                // PIN with strength indicator
                TextField(
                  controller: pinCtrl,
                  decoration: InputDecoration(
                    labelText: 'PIN (4-6 digits)',
                    helperText: 'Used for POS login & clock in/out',
                    prefixIcon: const Icon(Icons.lock, size: 20),
                    suffixIcon: pinCtrl.text.isNotEmpty
                        ? Icon(
                            pinCtrl.text.length >= 4 ? Icons.check_circle : Icons.warning,
                            size: 18,
                            color: pinCtrl.text.length >= 4 ? AppColors.success : AppColors.warning,
                          )
                        : null,
                  ),
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  obscureText: true,
                  onChanged: (_) => setDialogState(() {}),
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
                const SizedBox(height: 12),
                // Active toggle
                SwitchListTile(
                  title: Text('Active', style: GoogleFonts.inter(fontSize: 14)),
                  subtitle: Text(isActive ? 'Staff member is active' : 'Staff member is inactive',
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                  value: isActive,
                  onChanged: (v) => setDialogState(() => isActive = v),
                  contentPadding: EdgeInsets.zero,
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
                if (nameCtrl.text.trim().isEmpty) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(content: Text('Name is required'), backgroundColor: AppColors.danger),
                  );
                  return;
                }
                final branchId = ref.read(appStateProvider).branchId ?? '';
                final data = <String, dynamic>{
                  'name': nameCtrl.text.trim(),
                  'phone': phoneCtrl.text.trim(),
                  'email': emailCtrl.text.trim(),
                  if (pinCtrl.text.isNotEmpty) 'pin': pinCtrl.text,
                  if (selectedRoleId != null) 'roleId': selectedRoleId,
                  'isActive': isActive,
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

  // ─── PIN Reset Dialog ───
  Future<void> _showPinResetDialog(Map<String, dynamic> staff) async {
    final newPinCtrl = TextEditingController();
    final confirmPinCtrl = TextEditingController();

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Row(children: [
            const Icon(Icons.lock_reset, size: 20, color: AppColors.warning),
            const SizedBox(width: 8),
            Text('Reset PIN - ${staff['name']}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ]),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: newPinCtrl,
                decoration: const InputDecoration(labelText: 'New PIN (4-6 digits)'),
                keyboardType: TextInputType.number,
                maxLength: 6,
                obscureText: true,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: confirmPinCtrl,
                decoration: const InputDecoration(labelText: 'Confirm PIN'),
                keyboardType: TextInputType.number,
                maxLength: 6,
                obscureText: true,
                onChanged: (_) => setDialogState(() {}),
              ),
              if (confirmPinCtrl.text.isNotEmpty && confirmPinCtrl.text != newPinCtrl.text)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text('PINs do not match', style: GoogleFonts.inter(fontSize: 12, color: AppColors.danger)),
                ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: newPinCtrl.text == confirmPinCtrl.text && newPinCtrl.text.length >= 4
                  ? () async {
                      try {
                        await _api.updateStaff(staff['id'], {'pin': newPinCtrl.text});
                        if (ctx.mounted) Navigator.pop(ctx, true);
                      } catch (e) {
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger),
                          );
                        }
                      }
                    }
                  : null,
              child: const Text('Reset PIN'),
            ),
          ],
        ),
      ),
    );
    if (saved == true) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('PIN reset successfully'), backgroundColor: AppColors.success),
        );
      }
      _loadAll();
    }
  }

  Future<void> _confirmDelete(String id, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Staff'),
        content: Text('Deactivate $name? They will no longer be able to log in.'),
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
          if (_currentTab == _StaffTab.list)
            IconButton(
              icon: const Icon(Icons.search, size: 20),
              onPressed: () => _showSearchDialog(),
            ),
        ],
      ),
      floatingActionButton: _currentTab == _StaffTab.list
          ? FloatingActionButton(
              onPressed: () => _showStaffDialog(),
              child: const Icon(Icons.add),
            )
          : null,
      body: _isLoading
          ? const NxFullScreenLoader()
          : Column(children: [
              // Tab bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                child: Row(children: [
                  _StaffTabBtn(
                    icon: Icons.people, label: 'Staff',
                    isSelected: _currentTab == _StaffTab.list,
                    onTap: () => setState(() => _currentTab = _StaffTab.list),
                  ),
                  const SizedBox(width: 8),
                  _StaffTabBtn(
                    icon: Icons.bar_chart, label: 'Performance',
                    isSelected: _currentTab == _StaffTab.performance,
                    onTap: () => setState(() => _currentTab = _StaffTab.performance),
                  ),
                  const SizedBox(width: 8),
                  _StaffTabBtn(
                    icon: Icons.schedule, label: 'Schedule',
                    isSelected: _currentTab == _StaffTab.schedule,
                    onTap: () => setState(() => _currentTab = _StaffTab.schedule),
                  ),
                  const Spacer(),
                  Text('${_staff.length} staff', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray400)),
                ]),
              ),
              // Content
              Expanded(
                child: switch (_currentTab) {
                  _StaffTab.list => _buildStaffList(),
                  _StaffTab.performance => _buildPerformanceView(),
                  _StaffTab.schedule => _buildScheduleView(),
                },
              ),
            ]),
    );
  }

  void _showSearchDialog() {
    final ctrl = TextEditingController(text: _searchQuery);
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Search Staff'),
          content: TextField(
            controller: ctrl,
            autofocus: true,
            decoration: const InputDecoration(hintText: 'Name, phone, or role...'),
          ),
          actions: [
            TextButton(onPressed: () { setState(() => _searchQuery = ''); Navigator.pop(ctx); }, child: const Text('Clear')),
            ElevatedButton(onPressed: () { setState(() => _searchQuery = ctrl.text); Navigator.pop(ctx); }, child: const Text('Search')),
          ],
        ),
      ),
    );
  }

  // ─── Staff List Tab ───
  Widget _buildStaffList() {
    final displayStaff = _filteredStaff;
    if (displayStaff.isEmpty) {
      return NxEmptyState(
        icon: Icons.people_outline,
        title: _searchQuery.isNotEmpty ? 'No matching staff' : 'No staff members',
        actionLabel: _searchQuery.isNotEmpty ? null : 'Add Staff',
        onAction: _searchQuery.isNotEmpty ? null : () => _showStaffDialog(),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAll,
      child: ResponsiveLayout.isDesktop(context)
          ? GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3, childAspectRatio: 2.2, crossAxisSpacing: 10, mainAxisSpacing: 10,
              ),
              itemCount: displayStaff.length,
              itemBuilder: (ctx, i) => _buildStaffCard(displayStaff[i]),
            )
          : ResponsiveLayout.isTablet(context)
              ? GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2, childAspectRatio: 2.2, crossAxisSpacing: 10, mainAxisSpacing: 10,
                  ),
                  itemCount: displayStaff.length,
                  itemBuilder: (ctx, i) => _buildStaffCard(displayStaff[i]),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: displayStaff.length,
                  itemBuilder: (ctx, i) => _buildStaffCard(displayStaff[i]),
                ),
    );
  }

  Widget _buildStaffCard(Map<String, dynamic> staff) {
    final role = staff['role'] as Map<String, dynamic>?;
    final orderCount = (staff['_count'] as Map<String, dynamic>?)?['orders'] ?? 0;
    final hasPin = staff['pin'] != null && (staff['pin'] as String).isNotEmpty;
    final isActive = staff['isActive'] as bool? ?? true;

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Avatar
            Stack(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: isActive ? AppColors.primary50 : AppColors.gray100,
                  child: Text(
                    (staff['name'] as String? ?? '?')[0].toUpperCase(),
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: isActive ? AppColors.primary : AppColors.gray400,
                    ),
                  ),
                ),
                if (!isActive)
                  Positioned(
                    right: 0, bottom: 0,
                    child: Container(
                      width: 14, height: 14,
                      decoration: BoxDecoration(
                        color: AppColors.danger,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: const Icon(Icons.block, size: 8, color: Colors.white),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(
                      child: Text(staff['name'] ?? '', style: GoogleFonts.inter(
                        fontWeight: FontWeight.w600, fontSize: 14,
                        color: isActive ? null : AppColors.gray400,
                      )),
                    ),
                    if (!isActive)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.gray100, borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text('Inactive', style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray400)),
                      ),
                  ]),
                  const SizedBox(height: 2),
                  Row(children: [
                    Text(role?['name'] ?? 'Staff', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    if (staff['phone'] != null) ...[
                      const SizedBox(width: 6),
                      Icon(Icons.phone, size: 12, color: AppColors.gray400),
                      const SizedBox(width: 2),
                      Text(staff['phone'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    ],
                  ]),
                  const SizedBox(height: 2),
                  Row(children: [
                    if (hasPin) ...[
                      Icon(Icons.lock, size: 12, color: AppColors.success),
                      const SizedBox(width: 2),
                      Text('PIN set', style: GoogleFonts.inter(fontSize: 11, color: AppColors.success)),
                    ] else ...[
                      Icon(Icons.lock_open, size: 12, color: AppColors.gray400),
                      const SizedBox(width: 2),
                      Text('No PIN', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                    ],
                    const SizedBox(width: 12),
                    Icon(Icons.shopping_bag, size: 12, color: AppColors.gray400),
                    const SizedBox(width: 2),
                    Text('$orderCount orders', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                  ]),
                ],
              ),
            ),
            // Actions
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, size: 18),
              onSelected: (value) {
                switch (value) {
                  case 'edit': _showStaffDialog(existing: staff);
                  case 'pin': _showPinResetDialog(staff);
                  case 'delete': _confirmDelete(staff['id'], staff['name'] ?? '');
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit, size: 16), SizedBox(width: 8), Text('Edit')])),
                const PopupMenuItem(value: 'pin', child: Row(children: [Icon(Icons.lock_reset, size: 16), SizedBox(width: 8), Text('Reset PIN')])),
                const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete, size: 16, color: AppColors.danger), SizedBox(width: 8), Text('Remove', style: TextStyle(color: AppColors.danger))])),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ─── Performance Tab ───
  Widget _buildPerformanceView() {
    if (_staff.isEmpty) {
      return const NxEmptyState(icon: Icons.people_outline, title: 'No staff data');
    }

    final sorted = List<dynamic>.from(_staff)
      ..sort((a, b) => ((b['_count'] as Map?)?['orders'] as int? ?? 0).compareTo((a['_count'] as Map?)?['orders'] as int? ?? 0));

    final totalOrders = sorted.fold<int>(0, (sum, s) => sum + ((s['_count'] as Map?)?['orders'] as int? ?? 0));
    final avgPerStaff = _staff.isEmpty ? '0' : (totalOrders / _staff.length).toStringAsFixed(1);
    final activeCount = _staff.where((s) => s['isActive'] as bool? ?? true).length;

    return Column(children: [
      // Summary stats
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        color: AppColors.primary50,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _PerfStat('Total Staff', '${_staff.length}', AppColors.primary),
            _PerfStat('Active', '$activeCount', AppColors.success),
            _PerfStat('Total Orders', '$totalOrders', AppColors.warning),
            _PerfStat('Avg/Staff', avgPerStaff, AppColors.primary),
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
    ]);
  }

  Widget _buildPerformanceCard(Map<String, dynamic> staff, int rank, int totalOrders) {
    final orderCount = (staff['_count'] as Map<String, dynamic>?)?['orders'] as int? ?? 0;
    final percentage = totalOrders > 0 ? (orderCount / totalOrders * 100) : 0.0;

    Color rankColor;
    String rankLabel;
    if (rank == 1) { rankColor = const Color(0xFFFFD700); rankLabel = '1st'; }
    else if (rank == 2) { rankColor = const Color(0xFFC0C0C0); rankLabel = '2nd'; }
    else if (rank == 3) { rankColor = const Color(0xFFCD7F32); rankLabel = '3rd'; }
    else { rankColor = AppColors.gray300; rankLabel = '#$rank'; }

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            // Rank badge
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                color: rankColor.withValues(alpha: 0.15),
                shape: BoxShape.circle,
                border: rank <= 3 ? Border.all(color: rankColor.withValues(alpha: 0.3)) : null,
              ),
              child: Center(
                child: rank <= 3
                    ? Icon(Icons.emoji_events, size: 18, color: rankColor)
                    : Text('$rank', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: rankColor)),
              ),
            ),
            const SizedBox(width: 12),
            // Staff info + progress
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Text(staff['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(width: 6),
                    Text(rankLabel, style: GoogleFonts.inter(fontSize: 11, color: rankColor, fontWeight: FontWeight.w600)),
                  ]),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: totalOrders > 0 ? orderCount / totalOrders : 0,
                      backgroundColor: AppColors.gray100,
                      color: rank <= 3 ? rankColor : AppColors.primary,
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text('${percentage.toStringAsFixed(1)}% of total orders', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            // Order count
            Column(
              children: [
                Text('$orderCount', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 20, color: AppColors.primary)),
                Text('orders', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ─── Schedule Tab ───
  Widget _buildScheduleView() {
    if (_schedule.isEmpty) {
      return const NxEmptyState(
        icon: Icons.schedule,
        title: 'No schedule for today',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAll,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _schedule.length,
        itemBuilder: (ctx, i) => _buildScheduleCard(_schedule[i]),
      ),
    );
  }

  Widget _buildScheduleCard(Map<String, dynamic> entry) {
    final staff = entry['staff'] as Map<String, dynamic>?;
    final shift = entry['shift'] as Map<String, dynamic>?;
    final status = entry['status'] as String? ?? 'ASSIGNED';
    final isCheckedIn = status == 'CHECKED_IN';

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isCheckedIn ? AppColors.success.withValues(alpha: 0.15) : AppColors.primary50,
          child: Text((staff?['name'] as String? ?? '?')[0], style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            color: isCheckedIn ? AppColors.success : AppColors.primary,
          )),
        ),
        title: Text(staff?['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        subtitle: Row(children: [
          Text('${shift?['name'] ?? ''}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
          const SizedBox(width: 8),
          Icon(Icons.access_time, size: 12, color: AppColors.gray400),
          const SizedBox(width: 2),
          Text('${shift?['startTime'] ?? ''} - ${shift?['endTime'] ?? ''}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray400)),
        ]),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: isCheckedIn ? AppColors.success.withValues(alpha: 0.1) : AppColors.gray100,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(status, style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: isCheckedIn ? AppColors.success : AppColors.gray500,
          )),
        ),
      ),
    );
  }
}

// ─── Tab Button Widget ───
class _StaffTabBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  const _StaffTabBtn({required this.icon, required this.label, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(AppDimens.radiusFull),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 16, color: isSelected ? Colors.white : AppColors.gray500),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.inter(
            fontSize: 12, fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.gray600,
          )),
        ]),
      ),
    );
  }
}

// ─── Performance Stat Widget ───
class _PerfStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _PerfStat(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 20, color: color)),
      const SizedBox(height: 2),
      Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
    ]);
  }
}
