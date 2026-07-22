import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/staff_models.dart';
import '../providers/staff_provider.dart';

class LeaveManagementScreen extends ConsumerStatefulWidget {
  const LeaveManagementScreen({super.key});
  @override
  ConsumerState<LeaveManagementScreen> createState() => _LeaveManagementScreenState();
}

class _LeaveManagementScreenState extends ConsumerState<LeaveManagementScreen> {
  LeaveStatus? _statusFilter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(staffProvider).loadLeaveRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    final staffProv = ref.watch(staffProvider);
    final leaves = staffProv.state.leaveRequests.where((l) => _statusFilter == null || l.status == _statusFilter).toList();
    final pending = staffProv.state.leaveRequests.where((l) => l.status == LeaveStatus.pending).toList();

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Leave Management'),
        actions: [
          if (pending.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: AppColors.warning, borderRadius: BorderRadius.circular(12)),
              child: Text('${pending.length} pending', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
        ],
      ),
      body: Column(
        children: [
          _buildSummaryBar(context, staffProv.state),
          _buildFilterChips(),
          Expanded(
            child: staffProv.state.isLoading
                ? const NxFullScreenLoader(message: 'Loading leave requests...')
                : leaves.isEmpty
                    ? const NxEmptyState(icon: Icons.event_busy, title: 'No Leave Requests', subtitle: 'No leave requests found')
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: leaves.length,
                        itemBuilder: (context, i) => _buildLeaveCard(context, leaves[i]),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showRequestLeaveDialog(context),
        icon: const Icon(Icons.add),
        label: const Text('Request Leave'),
      ),
    );
  }

  Widget _buildSummaryBar(BuildContext context, StaffState s) {
    final pending = s.leaveRequests.where((l) => l.status == LeaveStatus.pending).length;
    final approved = s.leaveRequests.where((l) => l.status == LeaveStatus.approved).length;
    final rejected = s.leaveRequests.where((l) => l.status == LeaveStatus.rejected).length;
    return Container(
      padding: const EdgeInsets.all(16),
      color: AppColors.primary.withOpacity(0.05),
      child: Row(
        children: [
          _summaryItem('Pending', '$pending', AppColors.warning),
          _summaryItem('Approved', '$approved', AppColors.success),
          _summaryItem('Rejected', '$rejected', AppColors.danger),
          _summaryItem('Total', '${s.leaveRequests.length}', AppColors.primary),
        ],
      ),
    );
  }

  Widget _summaryItem(String label, String value, Color color) {
    return Expanded(
      child: Column(children: [
        Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
      ]),
    );
  }

  Widget _buildFilterChips() {
    final filters = [
      (null as LeaveStatus?, 'All'),
      (LeaveStatus.pending, 'Pending'),
      (LeaveStatus.approved, 'Approved'),
      (LeaveStatus.rejected, 'Rejected'),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: filters.map((f) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: FilterChip(
            label: Text(f.$2, style: TextStyle(fontSize: 12, color: _statusFilter == f.$1 ? Colors.white : AppColors.gray700)),
            selected: _statusFilter == f.$1,
            onSelected: (_) => setState(() => _statusFilter = f.$1),
            selectedColor: AppColors.primary,
            backgroundColor: AppColors.gray100,
            checkmarkColor: Colors.white,
          ),
        )).toList(),
      ),
    );
  }

  Widget _buildLeaveCard(BuildContext context, LeaveRequest l) {
    final statusColor = StatusHelpers.leaveStatusColor(l.status);
    final isPending = l.status == LeaveStatus.pending;

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                NxAvatar(name: l.employeeName, size: 40),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l.employeeName, style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text(StatusHelpers.leaveTypeLabel(l.type), style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(StatusHelpers.leaveStatusLabel(l.status), style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(children: [
              const Icon(Icons.date_range, size: 14, color: AppColors.gray500),
              const SizedBox(width: 4),
              Text('${DateFormat('MMM d').format(l.startDate)} - ${DateFormat('MMM d, yyyy').format(l.endDate)}', style: const TextStyle(fontSize: 12)),
              const SizedBox(width: 12),
              Text('${l.days} day${l.days > 1 ? 's' : ''}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            ]),
            if (l.reason != null && l.reason!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(l.reason!, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
            ],
            if (isPending) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => ref.read(staffProvider).rejectLeave(l.id),
                      style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
                      child: const Text('Reject'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => ref.read(staffProvider).approveLeave(l.id),
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                      child: const Text('Approve'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showRequestLeaveDialog(BuildContext context) {
    LeaveType selectedType = LeaveType.annual;
    final reasonCtrl = TextEditingController();
    DateTime startDate = DateTime.now();
    DateTime endDate = DateTime.now();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Request Leave'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<LeaveType>(
                  value: selectedType,
                  decoration: const InputDecoration(labelText: 'Leave Type'),
                  items: LeaveType.values.map((t) => DropdownMenuItem(value: t, child: Text(StatusHelpers.leaveTypeLabel(t)))).toList(),
                  onChanged: (v) => setDialogState(() => selectedType = v!),
                ),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Start Date'),
                  trailing: Text(DateFormat('MMM d, yyyy').format(startDate)),
                  onTap: () async {
                    final picked = await showDatePicker(context: ctx, initialDate: startDate, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                    if (picked != null) setDialogState(() => startDate = picked);
                  },
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('End Date'),
                  trailing: Text(DateFormat('MMM d, yyyy').format(endDate)),
                  onTap: () async {
                    final picked = await showDatePicker(context: ctx, initialDate: endDate, firstDate: startDate, lastDate: DateTime.now().add(const Duration(days: 365)));
                    if (picked != null) setDialogState(() => endDate = picked);
                  },
                ),
                TextField(controller: reasonCtrl, decoration: const InputDecoration(labelText: 'Reason'), maxLines: 2),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final data = {
                  'type': selectedType.name,
                  'startDate': startDate.toIso8601String(),
                  'endDate': endDate.toIso8601String(),
                  'days': endDate.difference(startDate).inDays + 1,
                  'reason': reasonCtrl.text,
                };
                await ref.read(staffProvider).createLeaveRequest(data);
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }
}
