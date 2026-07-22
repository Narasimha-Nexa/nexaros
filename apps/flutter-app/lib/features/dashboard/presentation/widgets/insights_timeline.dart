import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/dashboard_models.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../shared/widgets/shared_widgets.dart';
import '../../../../core/utils/date_utils.dart' as app_date_utils;

class AiInsightsPanel extends StatelessWidget {
  final List<AiInsight> insights;
  const AiInsightsPanel({super.key, required this.insights});

  @override
  Widget build(BuildContext context) {
    if (insights.isEmpty) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      NxSectionHeader(title: 'AI Insights', trailing: Icon(Icons.auto_awesome, size: 16, color: AppColors.secondary)),
      const SizedBox(height: AppDimens.sm),
      ...insights.take(5).map((i) => _InsightCard(insight: i)),
    ]);
  }
}

class _InsightCard extends StatelessWidget {
  final AiInsight insight;
  const _InsightCard({required this.insight});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(elevation: 0, margin: const EdgeInsets.only(bottom: 6),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppDimens.cardRadius),
        side: BorderSide(color: insight.color.withValues(alpha: 0.2))),
      child: Container(
        padding: const EdgeInsets.all(AppDimens.base),
        decoration: BoxDecoration(color: insight.color.withValues(alpha: 0.04), borderRadius: BorderRadius.circular(AppDimens.cardRadius)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(width: 32, height: 32, decoration: BoxDecoration(
            color: insight.color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(AppDimens.radiusSm)),
            child: Icon(insight.icon, size: 16, color: insight.color)),
          const SizedBox(width: AppDimens.sm),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(insight.title, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(color: insight.color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(AppDimens.radiusXs)),
                child: Text(insight.type.toUpperCase(), style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w700, color: insight.color)),
              ),
              if (insight.confidence != null) ...[
                const SizedBox(width: 4),
                Text('${(insight.confidence! * 100).toStringAsFixed(0)}%', style: GoogleFonts.inter(fontSize: 9, color: cs.outline)),
              ],
            ]),
            const SizedBox(height: 2),
            Text(insight.description, style: GoogleFonts.inter(fontSize: 11, color: cs.onSurfaceVariant), maxLines: 3, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(_timeAgo(insight.timestamp), style: GoogleFonts.inter(fontSize: 9, color: cs.outline)),
          ])),
        ]),
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return app_date_utils.DateUtils.formatDate(dt);
  }
}

class ActivityTimelinePanel extends StatelessWidget {
  final List<ActivityEvent> events;
  const ActivityTimelinePanel({super.key, required this.events});

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      NxSectionHeader(title: 'Activity Timeline'),
      const SizedBox(height: AppDimens.sm),
      NxCard(padding: const EdgeInsets.all(AppDimens.base), child: _buildTimeline(context, events)),
    ]);
  }

  Widget _buildTimeline(BuildContext context, List<ActivityEvent> events) {
    final cs = Theme.of(context).colorScheme;
    return Column(children: List.generate(events.length, (i) {
      final e = events[i];
      final isLast = i == events.length - 1;
      return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Column(children: [
          Container(width: 26, height: 26, decoration: BoxDecoration(
            color: e.color.withValues(alpha: 0.12), shape: BoxShape.circle),
            child: Icon(e.icon, size: 13, color: e.color)),
          if (!isLast) Container(width: 2, height: 24, color: cs.outline.withValues(alpha: 0.15)),
        ]),
        const SizedBox(width: AppDimens.sm),
        Expanded(child: Padding(padding: EdgeInsets.only(bottom: isLast ? 0 : AppDimens.sm),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(e.title, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500)),
            if (e.subtitle != null) Text(e.subtitle!, style: GoogleFonts.inter(fontSize: 10, color: cs.onSurfaceVariant)),
            Text(_timeAgo(e.timestamp), style: GoogleFonts.inter(fontSize: 9, color: cs.outline)),
          ]))),
      ]);
    }));
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return app_date_utils.DateUtils.formatDate(dt);
  }
}
