import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/staff_models.dart';

class TaskManagementScreen extends ConsumerStatefulWidget {
  const TaskManagementScreen({super.key});
  @override
  ConsumerState<TaskManagementScreen> createState() => _TaskManagementScreenState();
}

class _TaskManagementScreenState extends ConsumerState<TaskManagementScreen> {
  TaskStatus? _statusFilter;
  TaskPriority? _priorityFilter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final branchId = ref.read(appStateProvider).branchId ?? '';
      ref.read(staffProvider).loadTasks(branchId: branchId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final staffProv = ref.watch(staffProvider);
    final tasks = staffProv.state.tasks.where((t) {
      if (_statusFilter != null && t.status != _statusFilter) return false;
      if (_priorityFilter != null && t.priority != _priorityFilter) return false;
      return true;
    }).toList();

    final pending = staffProv.state.tasks.where((t) => t.status == TaskStatus.pending).length;
    final overdue = staffProv.state.tasks.where((t) => t.isOverdue).length;
    final completed = staffProv.state.tasks.where((t) => t.status == TaskStatus.completed).length;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Task Management'),
        actions: [
          IconButton(icon: const Icon(Icons.add_task), onPressed: () => _showCreateTaskDialog(context)),
        ],
      ),
      body: Column(
        children: [
          _buildSummaryBar(pending, overdue, completed, tasks.length),
          _buildFilterChips(),
          Expanded(
            child: staffProv.state.isLoading
                ? const NxFullScreenLoader(message: 'Loading tasks...')
                : tasks.isEmpty
                    ? const NxEmptyState(icon: Icons.task_alt, title: 'No Tasks', subtitle: 'Create tasks for your team')
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: tasks.length,
                        itemBuilder: (context, i) => _buildTaskCard(context, tasks[i]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryBar(int pending, int overdue, int completed, int total) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: AppColors.primary.withOpacity(0.05),
      child: Row(
        children: [
          _summaryItem('Pending', '$pending', AppColors.warning),
          _summaryItem('Overdue', '$overdue', AppColors.danger),
          _summaryItem('Done', '$completed', AppColors.success),
          _summaryItem('Total', '$total', AppColors.primary),
        ],
      ),
    );
  }

  Widget _summaryItem(String label, String value, Color color) {
    return Expanded(
      child: Column(children: [
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
      ]),
    );
  }

  Widget _buildFilterChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          ...TaskStatus.values.map((s) => Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(StatusHelpers.taskStatusLabel(s), style: TextStyle(fontSize: 11, color: _statusFilter == s ? Colors.white : AppColors.gray700)),
              selected: _statusFilter == s,
              onSelected: (_) => setState(() => _statusFilter = _statusFilter == s ? null : s),
              selectedColor: StatusHelpers.taskStatusColor(s),
              backgroundColor: AppColors.gray100,
              checkmarkColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 2),
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildTaskCard(BuildContext context, StaffTask t) {
    final statusColor = StatusHelpers.taskStatusColor(t.status);
    final priorityColor = t.priority == TaskPriority.urgent ? AppColors.danger
        : t.priority == TaskPriority.high ? AppColors.warning
        : t.priority == TaskPriority.medium ? AppColors.warning
        : AppColors.gray400;

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => _showTaskDetail(context, t),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      final newStatus = t.status == TaskStatus.completed ? TaskStatus.pending : TaskStatus.completed;
                      ref.read(staffProvider).updateTask(t.id, {'status': newStatus.name});
                    },
                    child: Icon(
                      t.status == TaskStatus.completed ? Icons.check_circle : Icons.radio_button_unchecked,
                      color: statusColor,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(t.title, style: TextStyle(fontWeight: FontWeight.w600, decoration: t.status == TaskStatus.completed ? TextDecoration.lineThrough : null)),
                        if (t.description != null) Text(t.description!, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: priorityColor.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                    child: Text(t.priority.name.toUpperCase(), style: TextStyle(fontSize: 9, color: priorityColor, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  if (t.assignedToName != null) ...[
                    const Icon(Icons.person, size: 14, color: AppColors.gray500),
                    const SizedBox(width: 4),
                    Text(t.assignedToName!, style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
                    const SizedBox(width: 12),
                  ],
                  if (t.dueDate != null) ...[
                    Icon(Icons.event, size: 14, color: t.isOverdue ? AppColors.danger : AppColors.gray500),
                    const SizedBox(width: 4),
                    Text(DateFormat('MMM d').format(t.dueDate!), style: TextStyle(fontSize: 11, color: t.isOverdue ? AppColors.danger : AppColors.gray600)),
                  ],
                  const Spacer(),
                  if (t.isRecurring)
                    const Icon(Icons.repeat, size: 14, color: AppColors.info),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showTaskDetail(BuildContext context, StaffTask t) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        expand: false,
        builder: (ctx, scrollCtrl) => SingleChildScrollView(
          controller: scrollCtrl,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(t.title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(children: [
                _tag(StatusHelpers.taskStatusLabel(t.status), StatusHelpers.taskStatusColor(t.status)),
                const SizedBox(width: 8),
                _tag(t.priority.name.toUpperCase(), t.priority == TaskPriority.urgent ? AppColors.danger : AppColors.warning),
              ]),
              if (t.description != null) ...[
                const SizedBox(height: 16),
                Text(t.description!, style: const TextStyle(color: AppColors.gray700)),
              ],
              const SizedBox(height: 16),
              if (t.assignedToName != null) _infoRow('Assigned to', t.assignedToName!),
              if (t.dueDate != null) _infoRow('Due date', DateFormat('MMM d, yyyy').format(t.dueDate!)),
              if (t.isRecurring) _infoRow('Recurring', t.recurringPattern ?? 'Yes'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(width: 100, child: Text(label, style: const TextStyle(color: AppColors.gray600, fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
        ],
      ),
    );
  }

  void _showCreateTaskDialog(BuildContext context) {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    TaskPriority priority = TaskPriority.medium;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Create Task'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title *')),
                const SizedBox(height: 12),
                TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description'), maxLines: 2),
                const SizedBox(height: 12),
                DropdownButtonFormField<TaskPriority>(
                  value: priority,
                  decoration: const InputDecoration(labelText: 'Priority'),
                  items: TaskPriority.values.map((p) => DropdownMenuItem(value: p, child: Text(p.name.toUpperCase()))).toList(),
                  onChanged: (v) => setDialogState(() => priority = v!),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final branchId = ref.read(appStateProvider).branchId ?? '';
                await ref.read(staffProvider).createTask({
                  'title': titleCtrl.text,
                  'description': descCtrl.text,
                  'priority': priority.name,
                  'branchId': branchId,
                });
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }
}
