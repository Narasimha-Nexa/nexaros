import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/ai_models.dart';
import '../../../core/providers/riverpod_providers.dart';

class AiWorkflowsScreen extends ConsumerStatefulWidget {
  const AiWorkflowsScreen({super.key});

  @override
  ConsumerState<AiWorkflowsScreen> createState() => _AiWorkflowsScreenState();
}

class _AiWorkflowsScreenState extends ConsumerState<AiWorkflowsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(aiWorkflowProvider).loadMockWorkflows();
    });
  }

  @override
  Widget build(BuildContext context) {
    final workflowProvider = ref.watch(aiWorkflowProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('AI Workflows', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, size: 20),
            onPressed: () => _showCreateWorkflow(),
          ),
        ],
      ),
      body: workflowProvider.isLoading
          ? const Center(child: NxFullScreenLoader())
          : workflowProvider.workflows.isEmpty
              ? NxEmptyState(icon: Icons.account_tree, title: 'No workflows yet', subtitle: 'Create your first automation workflow')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: workflowProvider.workflows.length,
                  itemBuilder: (ctx, i) => _buildWorkflowCard(workflowProvider.workflows[i]),
                ),
    );
  }

  Widget _buildWorkflowCard(AiWorkflow workflow) {
    final triggerIcon = switch (workflow.trigger) {
      WorkflowTrigger.schedule => Icons.schedule,
      WorkflowTrigger.event => Icons.bolt,
      WorkflowTrigger.threshold => Icons.speed,
      WorkflowTrigger.manual => Icons.touch_app,
    };
    final triggerLabel = switch (workflow.trigger) {
      WorkflowTrigger.schedule => 'Scheduled',
      WorkflowTrigger.event => 'Event',
      WorkflowTrigger.threshold => 'Threshold',
      WorkflowTrigger.manual => 'Manual',
    };

    return NxCard(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: workflow.isActive ? AppColors.success.withValues(alpha: 0.1) : AppColors.gray200,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(triggerIcon, color: workflow.isActive ? AppColors.success : AppColors.gray500, size: 18),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(workflow.name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                      Text(workflow.description, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    ],
                  ),
                ),
                Switch(
                  value: workflow.isActive,
                  onChanged: (_) => ref.read(aiWorkflowProvider).toggleWorkflow(workflow.id),
                  activeColor: AppColors.success,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildMetaChip(triggerLabel, triggerIcon),
                const SizedBox(width: 8),
                _buildMetaChip('${workflow.steps.length} steps', Icons.linear_scale),
                const SizedBox(width: 8),
                _buildMetaChip('Ran ${workflow.executionCount}x', Icons.play_circle_outline),
              ],
            ),
            if (workflow.steps.any((s) => s.requiresApproval)) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.verified, size: 12, color: AppColors.warning),
                  const SizedBox(width: 4),
                  Text('Requires approval', style: GoogleFonts.inter(fontSize: 10, color: AppColors.warning)),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMetaChip(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(12)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppColors.gray500),
          const SizedBox(width: 4),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray600)),
        ],
      ),
    );
  }

  void _showCreateWorkflow() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Create Workflow', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(decoration: InputDecoration(labelText: 'Workflow Name', border: const OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(decoration: InputDecoration(labelText: 'Description', border: const OutlineInputBorder()), maxLines: 2),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Trigger Type', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: 'schedule', child: Text('Schedule')),
                DropdownMenuItem(value: 'event', child: Text('Event')),
                DropdownMenuItem(value: 'threshold', child: Text('Threshold')),
                DropdownMenuItem(value: 'manual', child: Text('Manual')),
              ],
              onChanged: (_) {},
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: AppColors.white),
                child: Text('Create', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
