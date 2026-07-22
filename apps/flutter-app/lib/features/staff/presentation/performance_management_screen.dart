import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/staff_models.dart';

class PerformanceManagementScreen extends ConsumerStatefulWidget {
  const PerformanceManagementScreen({super.key});
  @override
  ConsumerState<PerformanceManagementScreen> createState() => _PerformanceManagementScreenState();
}

class _PerformanceManagementScreenState extends ConsumerState<PerformanceManagementScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(staffProvider).loadPerformanceReviews();
    });
  }

  @override
  Widget build(BuildContext context) {
    final staffProv = ref.watch(staffProvider);
    final reviews = staffProv.state.performanceReviews;
    final employees = staffProv.state.employees;

    final avgScore = reviews.isNotEmpty ? reviews.fold(0.0, (sum, r) => sum + r.score) / reviews.length : 0.0;
    final outstanding = reviews.where((r) => r.rating == PerformanceRating.outstanding).length;
    final needsImprovement = reviews.where((r) => r.rating == PerformanceRating.needsImprovement).length;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Performance Management'),
        actions: [
          IconButton(icon: const Icon(Icons.add_chart), onPressed: () => _showAddReviewDialog(context)),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSummaryCards(avgScore, outstanding, reviews.length, needsImprovement),
            const SizedBox(height: 20),
            _buildRatingDistribution(reviews),
            const SizedBox(height: 20),
            Text('Performance Reviews', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            if (reviews.isEmpty)
              const NxEmptyState(icon: Icons.assessment, title: 'No Reviews', subtitle: 'Create performance reviews for your team')
            else
              ...reviews.map((r) => _buildReviewCard(context, r)),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCards(double avgScore, int outstanding, int total, int needsImprovement) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        SizedBox(
          width: (MediaQuery.of(context).size.width - 44) / 2,
          child: NxStatCard(title: 'Avg Score', value: '${avgScore.toStringAsFixed(1)}%', icon: Icons.speed, color: AppColors.primary),
        ),
        SizedBox(
          width: (MediaQuery.of(context).size.width - 44) / 2,
          child: NxStatCard(title: 'Outstanding', value: '$outstanding', icon: Icons.emoji_events, color: AppColors.success),
        ),
        SizedBox(
          width: (MediaQuery.of(context).size.width - 44) / 2,
          child: NxStatCard(title: 'Total Reviews', value: '$total', icon: Icons.assessment, color: AppColors.info),
        ),
        SizedBox(
          width: (MediaQuery.of(context).size.width - 44) / 2,
          child: NxStatCard(title: 'Needs Improvement', value: '$needsImprovement', icon: Icons.trending_down, color: AppColors.warning),
        ),
      ],
    );
  }

  Widget _buildRatingDistribution(List<PerformanceReview> reviews) {
    final ratings = PerformanceRating.values;
    return NxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Rating Distribution', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ...ratings.map((r) {
            final count = reviews.where((rv) => rv.rating == r).length;
            final pct = reviews.isNotEmpty ? count / reviews.length : 0.0;
            final color = StatusHelpers.performanceColor(r);
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  SizedBox(
                    width: 120,
                    child: Text(StatusHelpers.performanceLabel(r), style: const TextStyle(fontSize: 12)),
                  ),
                  Expanded(
                    child: LinearProgressIndicator(
                      value: pct,
                      backgroundColor: AppColors.gray200,
                      color: color,
                      minHeight: 8,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(width: 30, child: Text('$count', textAlign: TextAlign.end, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildReviewCard(BuildContext context, PerformanceReview r) {
    final color = StatusHelpers.performanceColor(r.rating);
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                NxAvatar(name: r.employeeName, size: 40),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(r.employeeName, style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text('Review by ${r.reviewerName ?? "Manager"} • ${r.period}', style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('${r.score.toStringAsFixed(0)}%', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                      child: Text(StatusHelpers.performanceLabel(r.rating), style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ],
            ),
            if (r.feedback != null && r.feedback!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text('Feedback', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              Text(r.feedback!, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
            ],
            if (r.kpis.isNotEmpty) ...[
              const SizedBox(height: 10),
              ...r.kpis.take(3).map((kpi) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    Expanded(flex: 3, child: Text(kpi.name, style: const TextStyle(fontSize: 11))),
                    Expanded(
                      flex: 4,
                      child: LinearProgressIndicator(
                        value: kpi.achievement / 100,
                        backgroundColor: AppColors.gray200,
                        color: kpi.achievement >= 80 ? AppColors.success : AppColors.warning,
                        minHeight: 6,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(flex: 2, child: Text('${kpi.achievement.toStringAsFixed(0)}%', textAlign: TextAlign.end, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600))),
                  ],
                ),
              )),
            ],
          ],
        ),
      ),
    );
  }

  void _showAddReviewDialog(BuildContext context) {
    String? selectedEmployee;
    final feedbackCtrl = TextEditingController();
    double score = 75;
    PerformanceRating rating = PerformanceRating.meets;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Create Performance Review'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: selectedEmployee,
                  decoration: const InputDecoration(labelText: 'Employee'),
                  items: ref.read(staffProvider).state.employees.map((e) => DropdownMenuItem(value: e.id, child: Text(e.fullName))).toList(),
                  onChanged: (v) => setDialogState(() => selectedEmployee = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<PerformanceRating>(
                  value: rating,
                  decoration: const InputDecoration(labelText: 'Rating'),
                  items: PerformanceRating.values.map((r) => DropdownMenuItem(value: r, child: Text(StatusHelpers.performanceLabel(r)))).toList(),
                  onChanged: (v) => setDialogState(() => rating = v!),
                ),
                const SizedBox(height: 12),
                Text('Score: ${score.toStringAsFixed(0)}%'),
                Slider(
                  value: score,
                  onChanged: (v) => setDialogState(() => score = v),
                  min: 0,
                  max: 100,
                ),
                const SizedBox(height: 12),
                TextField(controller: feedbackCtrl, decoration: const InputDecoration(labelText: 'Feedback'), maxLines: 3),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                if (selectedEmployee != null) {
                  await ref.read(staffProvider).createPerformanceReview({
                    'employeeId': selectedEmployee,
                    'rating': rating.name,
                    'score': score,
                    'feedback': feedbackCtrl.text,
                    'period': '2026-Q3',
                  });
                }
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}
