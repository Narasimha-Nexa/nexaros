import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/ai_models.dart';
import '../../../core/providers/riverpod_providers.dart';

class AiInsightsScreen extends ConsumerStatefulWidget {
  const AiInsightsScreen({super.key});

  @override
  ConsumerState<AiInsightsScreen> createState() => _AiInsightsScreenState();
}

class _AiInsightsScreenState extends ConsumerState<AiInsightsScreen> {
  String _selectedCategory = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(aiDashboardProvider).loadInsights();
    });
  }

  @override
  Widget build(BuildContext context) {
    final dashboard = ref.watch(aiDashboardProvider);
    final insights = dashboard.insights;
    final categories = ['all', ...insights.map((i) => i.category).toSet()];
    final filtered = _selectedCategory == 'all' ? insights : insights.where((i) => i.category == _selectedCategory).toList();

    return Scaffold(
      appBar: AppBar(title: Text('AI Insights', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: Column(
        children: [
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (ctx, i) {
                final cat = categories[i];
                final selected = cat == _selectedCategory;
                return ChoiceChip(
                  label: Text(cat.toUpperCase(), style: GoogleFonts.inter(fontSize: 11, color: selected ? AppColors.white : AppColors.gray600)),
                  selected: selected,
                  onSelected: (_) => setState(() => _selectedCategory = cat),
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.gray100,
                );
              },
            ),
          ),
          Expanded(
            child: dashboard.isLoading
                ? const Center(child: NxFullScreenLoader())
                : filtered.isEmpty
                    ? const NxEmptyState(icon: Icons.lightbulb_outline, title: 'No insights available')
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        itemBuilder: (ctx, i) => _buildInsightCard(filtered[i]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildInsightCard(AiInsight insight) {
    final color = switch (insight.severity) {
      AiAlertSeverity.critical => AppColors.danger,
      AiAlertSeverity.warning => AppColors.warning,
      AiAlertSeverity.success => AppColors.success,
      _ => AppColors.info,
    };
    final icon = switch (insight.severity) {
      AiAlertSeverity.critical => Icons.error_outline,
      AiAlertSeverity.warning => Icons.warning_amber,
      AiAlertSeverity.success => Icons.check_circle_outline,
      _ => Icons.info_outline,
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
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: Icon(icon, color: color, size: 18),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(insight.title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                      Text(insight.category, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
                    ],
                  ),
                ),
                if (insight.confidence != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                    child: Text('${(insight.confidence! * 100).round()}%', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primary)),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(insight.description, style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray700, height: 1.5)),
            if (insight.actionLabel != null) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.arrow_forward, size: 14),
                  label: Text(insight.actionLabel!, style: GoogleFonts.inter(fontSize: 12)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
