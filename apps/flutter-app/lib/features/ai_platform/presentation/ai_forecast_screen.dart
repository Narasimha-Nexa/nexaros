import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/ai_models.dart';
import '../data/ai_service.dart';
import '../../../core/providers/riverpod_providers.dart';

final aiForecastProvider = FutureProvider.family<AiForecast, int>((ref, days) async {
  final service = ref.watch(aiPlatformServiceProvider);
  return service.getForecast(days: days);
});

class AiForecastScreen extends ConsumerStatefulWidget {
  const AiForecastScreen({super.key});

  @override
  ConsumerState<AiForecastScreen> createState() => _AiForecastScreenState();
}

class _AiForecastScreenState extends ConsumerState<AiForecastScreen> {
  int _selectedDays = 7;

  @override
  Widget build(BuildContext context) {
    final forecastAsync = ref.watch(aiForecastProvider(_selectedDays));

    return Scaffold(
      appBar: AppBar(title: Text('Revenue Forecast', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [7, 14, 30].map((days) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text('${days}D', style: GoogleFonts.inter(fontSize: 12, color: _selectedDays == days ? AppColors.white : AppColors.gray600)),
                  selected: _selectedDays == days,
                  onSelected: (_) => setState(() => _selectedDays = days),
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.gray100,
                ),
              )).toList(),
            ),
          ),
          Expanded(
            child: forecastAsync.when(
              loading: () => const Center(child: NxFullScreenLoader()),
              error: (e, _) => Center(child: Text('Error: $e', style: GoogleFonts.inter(color: AppColors.danger))),
              data: (forecast) => _buildForecastContent(forecast),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildForecastContent(AiForecast forecast) {
    if (forecast.predictions.isEmpty) {
      return const NxEmptyState(icon: Icons.trending_up, title: 'No forecast data available');
    }

    final maxVal = forecast.predictions.map((p) => p.value).reduce((a, b) => a > b ? a : b);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          NxCard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Predicted Revenue (₹)', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 16),
                  ...forecast.predictions.map((p) {
                    final ratio = maxVal > 0 ? p.value / maxVal : 0.0;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        children: [
                          SizedBox(width: 70, child: Text(_dayLabel(p.date), style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray600))),
                          Expanded(
                            child: Stack(
                              children: [
                                Container(height: 24, decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(4))),
                                FractionallySizedBox(
                                  widthFactor: ratio,
                                  child: Container(
                                    height: 24,
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.7)]),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          SizedBox(width: 70, child: Text('₹${p.value.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600), textAlign: TextAlign.right)),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
          if (forecast.trend != null) ...[
            const SizedBox(height: 16),
            NxCard(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(
                      forecast.trend! >= 0 ? Icons.trending_up : Icons.trending_down,
                      color: forecast.trend! >= 0 ? AppColors.success : AppColors.danger,
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Trend', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                        Text(
                          '${forecast.trend! >= 0 ? '+' : ''}${forecast.trend!.toStringAsFixed(1)}%',
                          style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: forecast.trend! >= 0 ? AppColors.success : AppColors.danger),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
          if (forecast.summary != null) ...[
            const SizedBox(height: 16),
            NxCard(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('AI Summary', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text(forecast.summary!, style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray700, height: 1.5)),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _dayLabel(DateTime date) {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return '${days[date.weekday - 1]} ${date.day}/${date.month}';
  }
}
