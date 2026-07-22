import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/staff_models.dart';

class TrainingManagementScreen extends ConsumerStatefulWidget {
  const TrainingManagementScreen({super.key});
  @override
  ConsumerState<TrainingManagementScreen> createState() => _TrainingManagementScreenState();
}

class _TrainingManagementScreenState extends ConsumerState<TrainingManagementScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(staffProvider).loadTrainingCourses();
    });
  }

  @override
  Widget build(BuildContext context) {
    final staffProv = ref.watch(staffProvider);
    final courses = staffProv.state.trainingCourses;

    final totalEnrolled = courses.fold(0, (sum, c) => sum + c.enrolledCount);
    final totalCompleted = courses.fold(0, (sum, c) => sum + c.completedCount);
    final mandatory = courses.where((c) => c.isMandatory).length;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Training Management'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: () => _showCreateCourseDialog(context)),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Total Courses', value: '${courses.length}', icon: Icons.school, color: AppColors.primary)),
                SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Enrolled', value: '$totalEnrolled', icon: Icons.people, color: AppColors.info)),
                SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Completed', value: '$totalCompleted', icon: Icons.check_circle, color: AppColors.success)),
                SizedBox(width: (MediaQuery.of(context).size.width - 44) / 2, child: NxStatCard(title: 'Mandatory', value: '$mandatory', icon: Icons.warning, color: AppColors.warning)),
              ],
            ),
            const SizedBox(height: 20),
            Text('Courses', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            if (courses.isEmpty)
              const NxEmptyState(icon: Icons.school, title: 'No Courses', subtitle: 'Create training courses for your staff')
            else
              ...courses.map((c) => _buildCourseCard(context, c)),
          ],
        ),
      ),
    );
  }

  Widget _buildCourseCard(BuildContext context, TrainingCourse c) {
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 56, height: 56,
              decoration: BoxDecoration(
                color: (c.isMandatory ? AppColors.danger : AppColors.primary).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(c.isMandatory ? Icons.warning : Icons.school, color: c.isMandatory ? AppColors.danger : AppColors.primary, size: 28),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(child: Text(c.title, style: const TextStyle(fontWeight: FontWeight.w600))),
                    if (c.isMandatory) Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: AppColors.danger.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                      child: const Text('Mandatory', style: TextStyle(fontSize: 10, color: AppColors.danger, fontWeight: FontWeight.w600)),
                    ),
                  ]),
                  if (c.description != null) Text(c.description!, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                  const SizedBox(height: 4),
                  Row(children: [
                    const Icon(Icons.timer, size: 14, color: AppColors.gray500),
                    const SizedBox(width: 4),
                    Text(c.durationLabel, style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
                    const SizedBox(width: 12),
                    const Icon(Icons.people, size: 14, color: AppColors.gray500),
                    const SizedBox(width: 4),
                    Text('${c.enrolledCount} enrolled', style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
                  ]),
                  if (c.enrolledCount > 0) ...[
                    const SizedBox(height: 6),
                    LinearProgressIndicator(
                      value: c.completedCount / c.enrolledCount,
                      backgroundColor: AppColors.gray200,
                      color: AppColors.success,
                      minHeight: 6,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateCourseDialog(BuildContext context) {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    bool isMandatory = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Create Course'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Course Title *')),
                const SizedBox(height: 12),
                TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description'), maxLines: 2),
                const SizedBox(height: 12),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Mandatory'),
                  value: isMandatory,
                  onChanged: (v) => setDialogState(() => isMandatory = v),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                await ref.read(staffProvider).loadTrainingCourses();
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
