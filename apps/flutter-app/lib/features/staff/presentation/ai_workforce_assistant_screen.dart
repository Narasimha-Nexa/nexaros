import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/staff_models.dart';

class AiWorkforceAssistantScreen extends ConsumerStatefulWidget {
  const AiWorkforceAssistantScreen({super.key});
  @override
  ConsumerState<AiWorkforceAssistantScreen> createState() => _AiWorkforceAssistantScreenState();
}

class _AiWorkforceAssistantScreenState extends ConsumerState<AiWorkforceAssistantScreen> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(title: const Text('AI Workforce Assistant')),
      body: Column(
        children: [
          _buildTabBar(),
          Expanded(child: _buildTabContent()),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    final tabs = ['Insights', 'Scheduling', 'Predictions', 'Optimization'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Row(
        children: tabs.asMap().entries.map((entry) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: ChoiceChip(
            label: Text(entry.value, style: TextStyle(fontSize: 12, color: _selectedTab == entry.key ? Colors.white : AppColors.gray700)),
            selected: _selectedTab == entry.key,
            onSelected: (_) => setState(() => _selectedTab = entry.key),
            selectedColor: AppColors.primary,
            backgroundColor: AppColors.gray100,
          ),
        )).toList(),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_selectedTab) {
      case 0: return _buildInsightsTab();
      case 1: return _buildSchedulingTab();
      case 2: return _buildPredictionsTab();
      case 3: return _buildOptimizationTab();
      default: return _buildInsightsTab();
    }
  }

  Widget _buildInsightsTab() {
    final insights = [
      _AiInsight('Attendance Pattern', 'Staff attendance drops by 15% on Mondays. Consider flexible scheduling.', Icons.trending_down, AppColors.warning, 'High'),
      _AiInsight('Labor Cost Alert', 'Overtime costs increased 22% this month. Review shift coverage.', Icons.attach_money, AppColors.danger, 'Urgent'),
      _AiInsight('Performance Trend', 'Kitchen team performance improved 8% after training program.', Icons.trending_up, AppColors.success, 'Info'),
      _AiInsight('Turnover Risk', '2 employees showing high attrition risk based on engagement patterns.', Icons.person_off, AppColors.secondary, 'Medium'),
      _AiInsight('Productivity Peak', 'Peak productivity observed between 10 AM - 2 PM across all branches.', Icons.access_time, AppColors.info, 'Info'),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: insights.length,
      itemBuilder: (context, i) {
        final insight = insights[i];
        return NxCard(
          margin: const EdgeInsets.only(bottom: 8),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: insight.color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: Icon(insight.icon, color: insight.color, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Text(insight.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: insight.color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                          child: Text(insight.severity, style: TextStyle(fontSize: 10, color: insight.color, fontWeight: FontWeight.w600)),
                        ),
                      ]),
                      const SizedBox(height: 4),
                      Text(insight.description, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSchedulingTab() {
    final suggestions = [
      _ScheduleSuggestion('Morning Rush Coverage', 'Add 2 waiters between 7-9 AM based on historical order volume patterns.', 85, AppColors.success),
      _ScheduleSuggestion('Weekend Staffing', 'Increase kitchen staff by 30% on Saturdays based on last 4 weeks data.', 78, AppColors.info),
      _ScheduleSuggestion('Night Shift Gap', 'Critical understaffing detected on Tuesday nights. Recommend 2 additional staff.', 92, AppColors.warning),
      _ScheduleSuggestion('Break Optimization', 'Stagger breaks to maintain minimum 3 staff during peak hours (12-2 PM).', 70, AppColors.primary),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: suggestions.length,
      itemBuilder: (context, i) {
        final s = suggestions[i];
        return NxCard(
          margin: const EdgeInsets.only(bottom: 8),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text(s.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const Spacer(),
                  Text('${s.confidence}% match', style: TextStyle(fontSize: 12, color: s.color, fontWeight: FontWeight.w600)),
                ]),
                const SizedBox(height: 6),
                Text(s.description, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: s.confidence / 100,
                  backgroundColor: AppColors.gray200,
                  color: s.color,
                  minHeight: 6,
                  borderRadius: BorderRadius.circular(3),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(child: OutlinedButton(onPressed: () {}, child: const Text('Dismiss'))),
                    const SizedBox(width: 8),
                    Expanded(child: ElevatedButton(onPressed: () {}, child: const Text('Apply'))),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildPredictionsTab() {
    final predictions = [
      _Prediction('Next Month Overtime', 'Estimated 120 overtime hours based on current scheduling trends.', '120 hrs', AppColors.warning),
      _Prediction('Staff Requirement', 'Projected need for 5 additional staff in Q4 based on growth.', '5 staff', AppColors.info),
      _Prediction('Absenteeism Rate', 'Expected 8.5% absenteeism next week (currently 7.2%).', '8.5%', AppColors.danger),
      _Prediction('Training Completion', 'At current pace, 85% of mandatory training will complete by deadline.', '85%', AppColors.success),
      _Prediction('Labor Cost Forecast', 'Monthly labor cost projected at ₹4.8L (current ₹4.5L).', '₹4.8L', AppColors.secondary),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: predictions.length,
      itemBuilder: (context, i) {
        final p = predictions[i];
        return NxCard(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: p.color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.auto_graph, color: p.color),
            ),
            title: Text(p.title, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text(p.description, style: const TextStyle(fontSize: 12)),
            trailing: Text(p.value, style: TextStyle(fontWeight: FontWeight.bold, color: p.color)),
          ),
        );
      },
    );
  }

  Widget _buildOptimizationTab() {
    final optimizations = [
      _OptimizationItem('Shift Overlap Reduction', 'Reduce shift overlaps by 15% by adjusting start times.', 'Save ₹12K/month', AppColors.success, 0.78),
      _OptimizationItem('Idle Time Minimization', 'Identify 2.5 hours of daily idle time per staff member.', 'Improve efficiency 18%', AppColors.info, 0.65),
      _OptimizationItem('Cross-Training ROI', 'Cross-train waiters on cashier duties to handle peak loads.', 'Reduce wait time 25%', AppColors.primary, 0.82),
      _OptimizationItem('Schedule Compliance', 'Current schedule compliance is 87%. Target: 95%.', 'Improve compliance', AppColors.warning, 0.87),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: optimizations.length,
      itemBuilder: (context, i) {
        final o = optimizations[i];
        return NxCard(
          margin: const EdgeInsets.only(bottom: 8),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text(o.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const Spacer(),
                  Text(o.impact, style: TextStyle(fontSize: 12, color: o.color, fontWeight: FontWeight.w600)),
                ]),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: o.score,
                  backgroundColor: AppColors.gray200,
                  color: o.color,
                  minHeight: 8,
                  borderRadius: BorderRadius.circular(4),
                ),
                const SizedBox(height: 4),
                Text('Score: ${(o.score * 100).toStringAsFixed(0)}%', style: const TextStyle(fontSize: 11, color: AppColors.gray500)),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _AiInsight {
  final String title, description, severity;
  final IconData icon;
  final Color color;
  const _AiInsight(this.title, this.description, this.icon, this.color, this.severity);
}

class _ScheduleSuggestion {
  final String title, description;
  final int confidence;
  final Color color;
  const _ScheduleSuggestion(this.title, this.description, this.confidence, this.color);
}

class _Prediction {
  final String title, description, value;
  final Color color;
  const _Prediction(this.title, this.description, this.value, this.color);
}

class _OptimizationItem {
  final String title, description, impact;
  final Color color;
  final double score;
  const _OptimizationItem(this.title, this.description, this.impact, this.color, this.score);
}
