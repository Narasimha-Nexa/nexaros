import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/ai_models.dart';
import '../../../core/providers/riverpod_providers.dart';

class AiDashboardScreen extends ConsumerStatefulWidget {
  const AiDashboardScreen({super.key});

  @override
  ConsumerState<AiDashboardScreen> createState() => _AiDashboardScreenState();
}

class _AiDashboardScreenState extends ConsumerState<AiDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(aiDashboardProvider).loadAll();
    });
  }

  @override
  Widget build(BuildContext context) {
    final dashboard = ref.watch(aiDashboardProvider);

    return Scaffold(
      backgroundColor: AppColors.gray50,
      appBar: AppBar(
        title: Text('AI Assistant', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.white,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.chat_bubble_outline, size: 20), onPressed: () => context.push('/shell/ai-chat')),
          IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: () => dashboard.loadAll()),
        ],
      ),
      body: dashboard.isLoading && dashboard.health == null
          ? const Center(child: NxFullScreenLoader())
          : RefreshIndicator(
              onRefresh: () => dashboard.loadAll(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHealthScore(dashboard.health),
                    const SizedBox(height: 16),
                    _buildQuickActions(),
                    const SizedBox(height: 16),
                    _buildInsightsSection(dashboard.insights),
                    const SizedBox(height: 16),
                    _buildForecastSection(dashboard.revenueForecast),
                    const SizedBox(height: 16),
                    _buildRecentInsights(dashboard.insights),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildHealthScore(AiBusinessHealth? health) {
    final score = health?.score ?? 75;
    final label = health?.label ?? 'Good';
    final color = score >= 70 ? AppColors.success : score >= 50 ? AppColors.warning : AppColors.danger;

    return NxCard(
      elevated: true,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [color.withValues(alpha: 0.1), color.withValues(alpha: 0.2)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      '${score.round()}',
                      style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: color),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Business Health', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                      Text(label, style: GoogleFonts.inter(fontSize: 14, color: color, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
                Icon(Icons.auto_awesome, color: AppColors.primary, size: 28),
              ],
            ),
            if (health?.insights.isNotEmpty == true) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
              Text('AI Summary', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.gray600)),
              const SizedBox(height: 4),
              Text(
                health!.insights.first.description,
                style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray700),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      _ActionData(Icons.chat, 'Chat with AI', AppColors.primary, '/shell/ai-chat'),
      _ActionData(Icons.insights, 'Insights', AppColors.secondary, '/shell/ai-insights'),
      _ActionData(Icons.analytics, 'Reports', AppColors.info, '/shell/ai-reports'),
      _ActionData(Icons.trending_up, 'Forecast', AppColors.success, '/shell/ai-forecast'),
      _ActionData(Icons.account_tree, 'Workflows', AppColors.warning, '/shell/ai-workflows'),
      _ActionData(Icons.search, 'Search', AppColors.gray600, '/shell/ai-search'),
      _ActionData(Icons.notifications_active, 'Alerts', AppColors.danger, '/shell/ai-alerts'),
      _ActionData(Icons.settings, 'Settings', AppColors.gray500, '/shell/ai-settings'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Quick Actions', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4, mainAxisSpacing: 8, crossAxisSpacing: 8),
          itemCount: actions.length,
          itemBuilder: (ctx, i) {
            final a = actions[i];
            return GestureDetector(
              onTap: () => context.push(a.route),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.gray200),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(a.icon, color: a.color, size: 24),
                    const SizedBox(height: 6),
                    Text(a.label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w500), textAlign: TextAlign.center),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildInsightsSection(List<AiInsight> insights) {
    if (insights.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('AI Insights', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
            const Spacer(),
            TextButton(
              onPressed: () => context.push('/shell/ai-insights'),
              child: Text('View All', style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...insights.take(3).map((insight) => _buildInsightCard(insight)),
      ],
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
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
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
                  Text(insight.title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(insight.description, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray600), maxLines: 2, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            if (insight.confidence != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                child: Text('${(insight.confidence! * 100).round()}%', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.primary)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildForecastSection(AiForecast? forecast) {
    if (forecast == null || forecast.predictions.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('7-Day Revenue Forecast', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
            const Spacer(),
            TextButton(
              onPressed: () => context.push('/shell/ai-forecast'),
              child: Text('Details', style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        NxCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: forecast.predictions.take(7).map((p) {
                final maxVal = forecast.predictions.map((e) => e.value).reduce((a, b) => a > b ? a : b);
                final ratio = maxVal > 0 ? p.value / maxVal : 0.0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      SizedBox(width: 60, child: Text(_dayLabel(p.date), style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray600))),
                      Expanded(
                        child: LinearProgressIndicator(
                          value: ratio,
                          backgroundColor: AppColors.gray200,
                          color: AppColors.primary,
                          minHeight: 8,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(width: 60, child: Text('₹${p.value.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600), textAlign: TextAlign.right)),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRecentInsights(List<AiInsight> insights) {
    if (insights.length <= 3) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('More Insights', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        ...insights.skip(3).take(5).map((insight) => _buildInsightCard(insight)),
      ],
    );
  }

  String _dayLabel(DateTime date) {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[date.weekday - 1];
  }
}

class _ActionData {
  final IconData icon;
  final String label;
  final Color color;
  final String route;
  const _ActionData(this.icon, this.label, this.color, this.route);
}
