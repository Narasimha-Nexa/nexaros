import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/app_state.dart';
import '../../../core/providers/branch_provider.dart';
import '../../../core/theme/app_colors.dart';

class StaffBranchAssignmentScreen extends StatefulWidget {
  const StaffBranchAssignmentScreen({super.key});

  @override
  State<StaffBranchAssignmentScreen> createState() => _StaffBranchAssignmentScreenState();
}

class _StaffBranchAssignmentScreenState extends State<StaffBranchAssignmentScreen> {
  final _api = ApiClient();
  List<dynamic> _staff = [];
  bool _isLoading = true;
  String? _selectedBranchId;

  @override
  void initState() {
    super.initState();
    _selectedBranchId = context.read<AppState>().branchId;
    _loadStaff();
  }

  Future<void> _loadStaff() async {
    setState(() => _isLoading = true);
    try {
      final staff = await _api.getStaff(branchId: _selectedBranchId ?? '').catchError((_) => <dynamic>[]);
      if (mounted) setState(() { _staff = staff; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Staff Assignment', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      ),
      body: Column(
        children: [
          _buildBranchFilter(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _staff.isEmpty
                    ? _buildEmptyState()
                    : _buildStaffList(),
          ),
        ],
      ),
    );
  }

  Widget _buildBranchFilter() {
    return Consumer<BranchProvider>(
      builder: (context, bp, _) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: AppColors.gray100)),
          ),
          child: Row(
            children: [
              Icon(Icons.filter_list, size: 18, color: AppColors.gray500),
              const SizedBox(width: 8),
              Text('Filter by branch:', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray600)),
              const SizedBox(width: 8),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    color: AppColors.gray50,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.gray200),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedBranchId,
                      isDense: true,
                      icon: Icon(Icons.keyboard_arrow_down, size: 16, color: AppColors.gray500),
                      style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray700),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('All Branches')),
                        ...bp.branches.map((b) => DropdownMenuItem(
                          value: b.id,
                          child: Text(b.name, overflow: TextOverflow.ellipsis),
                        )),
                      ],
                      onChanged: (val) {
                        setState(() => _selectedBranchId = val);
                        _loadStaff();
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 64, color: AppColors.gray300),
          const SizedBox(height: 16),
          Text('No staff found', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.gray700)),
          const SizedBox(height: 8),
          Text('Add staff members to assign them to branches', style: GoogleFonts.inter(color: AppColors.gray500)),
        ],
      ),
    );
  }

  Widget _buildStaffList() {
    return RefreshIndicator(
      onRefresh: _loadStaff,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _staff.length,
        itemBuilder: (context, index) {
          final member = _staff[index];
          return _buildStaffCard(member);
        },
      ),
    );
  }

  Widget _buildStaffCard(Map<String, dynamic> member) {
    final name = member['name'] as String? ?? 'Unknown';
    final phone = member['phone'] as String?;
    final role = (member['role'] as Map<String, dynamic>?)?['name'] as String? ?? 'No Role';
    final isActive = member['isActive'] as bool? ?? true;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.gray100),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: isActive ? AppColors.primary50 : AppColors.gray100,
          child: Text(
            name.substring(0, 1).toUpperCase(),
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w600,
              color: isActive ? AppColors.primary : AppColors.gray500,
            ),
          ),
        ),
        title: Text(
          name,
          style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 2),
            Text(
              role,
              style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500),
            ),
            if (phone != null && phone.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                phone,
                style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400),
              ),
            ],
          ],
        ),
        trailing: _buildBranchChip(member),
      ),
    );
  }

  Widget _buildBranchChip(Map<String, dynamic> member) {
    return Consumer<BranchProvider>(
      builder: (context, bp, _) {
        final branchId = member['branchId'] as String?;
        final assignedBranch = bp.branches.where((b) => b.id == branchId).firstOrNull;

        return GestureDetector(
          onTap: () => _showReassignDialog(context, bp, member),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: assignedBranch != null ? AppColors.primary50 : AppColors.gray50,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: assignedBranch != null ? AppColors.primary.withValues(alpha: 0.3) : AppColors.gray200,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.store,
                  size: 12,
                  color: assignedBranch != null ? AppColors.primary : AppColors.gray400,
                ),
                const SizedBox(width: 4),
                Text(
                  assignedBranch?.name ?? 'Unassigned',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: assignedBranch != null ? AppColors.primary : AppColors.gray500,
                  ),
                ),
                const SizedBox(width: 2),
                Icon(Icons.chevron_right, size: 14, color: AppColors.gray400),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showReassignDialog(BuildContext context, BranchProvider bp, Map<String, dynamic> member) {
    final currentBranchId = member['branchId'] as String?;
    final memberName = member['name'] as String? ?? 'Staff';
    final staffId = member['id'] as String;
    String? selectedBranchId = currentBranchId;

    // Use a ValueNotifier to track selection for the dialog
    final selectionNotifier = ValueNotifier<String?>(selectedBranchId);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Reassign $memberName'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Select a branch to assign this staff member:',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray600),
            ),
            const SizedBox(height: 16),
            ...bp.branches.map((branch) {
              return ValueListenableBuilder<String?>(
                valueListenable: selectionNotifier,
                builder: (_, selectedVal, __) {
                  return RadioListTile<String>(
                    value: branch.id,
                    groupValue: selectedVal,
                    onChanged: (val) => selectionNotifier.value = val,
                    title: Text(branch.name, style: GoogleFonts.inter(fontSize: 14)),
                    subtitle: branch.isPrimary
                        ? Text('Primary', style: GoogleFonts.inter(fontSize: 11, color: AppColors.warning))
                        : null,
                    activeColor: AppColors.primary,
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                  );
                },
              );
            }),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ValueListenableBuilder<String?>(
            valueListenable: selectionNotifier,
            builder: (_, selectedVal, __) {
              return FilledButton(
                onPressed: selectedVal == currentBranchId
                    ? null
                    : () async {
                        final scaffold = ScaffoldMessenger.of(context);
                        Navigator.pop(ctx);
                        try {
                          await _api.updateStaff(staffId, {'branchId': selectedVal});
                          await _loadStaff();
                          if (mounted) {
                            scaffold.showSnackBar(
                              SnackBar(content: Text('$memberName reassigned')),
                            );
                          }
                        } catch (e) {
                          if (mounted) {
                            scaffold.showSnackBar(
                              SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger),
                            );
                          }
                        }
                      },
                child: const Text('Assign'),
              );
            },
          ),
        ],
      ),
    );
  }
}
