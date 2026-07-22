import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/staff_models.dart';

class ShiftManagementScreen extends ConsumerStatefulWidget {
  const ShiftManagementScreen({super.key});
  @override
  ConsumerState<ShiftManagementScreen> createState() => _ShiftManagementScreenState();
}

class _ShiftManagementScreenState extends ConsumerState<ShiftManagementScreen> {
  DateTime _selectedDate = DateTime.now();
  int _selectedTab = 0; // 0: shifts, 1: schedule

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final branchId = ref.read(appStateProvider).branchId ?? '';
      if (branchId.isNotEmpty) {
        ref.read(staffProvider).loadShifts(branchId);
        ref.read(staffProvider).loadSchedule(branchId, DateFormat('yyyy-MM-dd').format(_selectedDate));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final staffProv = ref.watch(staffProvider);
    final shifts = staffProv.state.shifts;
    final schedule = staffProv.state.schedule;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Shift Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: () => _showCreateShiftDialog(context),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildTabBar(),
          if (_selectedTab == 1) _buildDateNavigator(),
          Expanded(
            child: staffProv.state.isLoading
                ? const NxFullScreenLoader(message: 'Loading shifts...')
                : _selectedTab == 0
                    ? _buildShiftsList(context, shifts)
                    : _buildScheduleList(context, schedule),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      decoration: BoxDecoration(
        color: AppColors.gray100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(child: _tab('Shift Templates', 0)),
          Expanded(child: _tab('Daily Schedule', 1)),
        ],
      ),
    );
  }

  Widget _tab(String label, int index) {
    final selected = _selectedTab == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: selected ? Colors.white : AppColors.gray600),
        ),
      ),
    );
  }

  Widget _buildDateNavigator() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: () => setState(() => _selectedDate = _selectedDate.subtract(const Duration(days: 1))),
          ),
          Expanded(
            child: Text(
              DateFormat('EEEE, MMM d, yyyy').format(_selectedDate),
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: () => setState(() => _selectedDate = _selectedDate.add(const Duration(days: 1))),
          ),
        ],
      ),
    );
  }

  Widget _buildShiftsList(BuildContext context, List<Shift> shifts) {
    if (shifts.isEmpty) return const NxEmptyState(icon: Icons.schedule, title: 'No Shifts', subtitle: 'Create your first shift template');
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: shifts.length,
      itemBuilder: (context, i) => _buildShiftCard(context, shifts[i]),
    );
  }

  Widget _buildShiftCard(BuildContext context, Shift s) {
    final typeColor = s.type == ShiftType.night ? AppColors.secondary
        : s.type == ShiftType.overtime ? AppColors.warning
        : AppColors.primary;
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(color: typeColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.access_time, color: typeColor, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Text(s.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: typeColor.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                      child: Text(s.type.name, style: TextStyle(fontSize: 10, color: typeColor, fontWeight: FontWeight.w600)),
                    ),
                  ]),
                  const SizedBox(height: 4),
                  Text('${s.timeRange} • ${s.duration.inHours}h ${s.duration.inMinutes % 60}m', style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                  Text('${s.assignedStaff}/${s.maxStaff} staff assigned', style: const TextStyle(fontSize: 11, color: AppColors.gray500)),
                ],
              ),
            ),
            PopupMenuButton<String>(
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'edit', child: Text('Edit')),
                const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: AppColors.danger))),
              ],
              onSelected: (v) {
                if (v == 'delete') _confirmDeleteShift(s);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleList(BuildContext context, List<ShiftAssignment> schedule) {
    if (schedule.isEmpty) return const NxEmptyState(icon: Icons.calendar_month, title: 'No Assignments', subtitle: 'Assign shifts to staff members');
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: schedule.length,
      itemBuilder: (context, i) => _buildScheduleCard(context, schedule[i]),
    );
  }

  Widget _buildScheduleCard(BuildContext context, ShiftAssignment a) {
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            NxAvatar(name: a.employeeName, size: 40),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(a.employeeName, style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text('${a.shiftName} • ${a.type.name}', style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: a.status == 'confirmed' ? AppColors.success.withOpacity(0.1) : AppColors.warning.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(a.status, style: TextStyle(fontSize: 11, color: a.status == 'confirmed' ? AppColors.success : AppColors.warning, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateShiftDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    TimeOfDay startTime = const TimeOfDay(hour: 9, minute: 0);
    TimeOfDay endTime = const TimeOfDay(hour: 17, minute: 0);

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Create Shift'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Shift Name *')),
                const SizedBox(height: 16),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Start Time'),
                  trailing: Text(startTime.format(ctx), style: const TextStyle(fontWeight: FontWeight.w600)),
                  onTap: () async {
                    final picked = await showTimePicker(context: ctx, initialTime: startTime);
                    if (picked != null) setDialogState(() => startTime = picked);
                  },
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('End Time'),
                  trailing: Text(endTime.format(ctx), style: const TextStyle(fontWeight: FontWeight.w600)),
                  onTap: () async {
                    final picked = await showTimePicker(context: ctx, initialTime: endTime);
                    if (picked != null) setDialogState(() => endTime = picked);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final branchId = ref.read(appStateProvider).branchId ?? '';
                final data = {
                  'name': nameCtrl.text,
                  'startTime': '${startTime.hour.toString().padLeft(2, '0')}:${startTime.minute.toString().padLeft(2, '0')}',
                  'endTime': '${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')}',
                  'type': 'regular',
                  'maxStaff': 10,
                };
                await ref.read(staffProvider).createShift(branchId, data);
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDeleteShift(Shift s) async {
    final confirmed = await NxConfirmationDialog.show(
      context: context,
      title: 'Delete Shift',
      message: 'Delete shift "${s.name}"?',
      confirmLabel: 'Delete',
    );
    if (confirmed == true && context.mounted) {
      // await ref.read(staffProvider).deleteShift(s.id);
    }
  }
}
