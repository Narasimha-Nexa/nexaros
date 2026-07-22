import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/pos_models.dart';
import '../../providers/pos_provider.dart';
import '../../../../shared/widgets/shared_widgets.dart';

class AiUpsellSheet extends ConsumerWidget {
  final PosProvider pos;
  const AiUpsellSheet({super.key, required this.pos});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final suggestions = pos.getUpsellSuggestions();
    final cs = Theme.of(context).colorScheme;

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (ctx, scrollController) => Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          controller: scrollController,
          children: [
            Center(
              child: Container(width: 40, height: 4,
                decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Icon(Icons.psychology, size: 20, color: AppColors.primary),
                const SizedBox(width: 8),
                Text('AI Suggestions', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
                const Spacer(),
                if (suggestions.isEmpty)
                  Text('No suggestions', style: GoogleFonts.inter(fontSize: 13, color: cs.outline)),
              ],
            ),
            const SizedBox(height: 4),
            Text('Tap to add to order', style: GoogleFonts.inter(fontSize: 13, color: cs.outline)),
            const SizedBox(height: 16),

            if (suggestions.isEmpty)
              const NxEmptyState(
                icon: Icons.psychology,
                title: 'No AI Suggestions',
                subtitle: 'Add items to your cart to see personalized recommendations',
              )
            else
              ...suggestions.map((s) => _buildSuggestionTile(s, cs)),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestionTile(PosUpsellSuggestion s, ColorScheme cs) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => pos.addToCart(
          {'id': s.id, 'name': s.name, 'price': s.price, 'isVeg': true},
          quantity: 1,
        ),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              if (s.image != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(s.image!, width: 56, height: 56, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___)
                      => Container(width: 56, height: 56, color: cs.surfaceContainerHighest, child: Icon(Icons.fastfood, color: cs.outline)),
                  ),
                )
              else
                Container(
                  width: 56, height: 56,
                  decoration: BoxDecoration(color: cs.surfaceContainerHighest, borderRadius: BorderRadius.circular(8)),
                  child: Icon(Icons.fastfood, color: cs.outline, size: 28),
                ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface)),
                    const SizedBox(height: 2),
                    Text(s.reason.replaceAll('_', ' '), style: GoogleFonts.inter(fontSize: 12, color: cs.outline), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 4,
                      children: [
                        _AiUpsellChip(label: s.reason.replaceAll('_', ' '), color: _getConfidenceColor(s.confidence)),
                        _AiUpsellChip(label: '${(s.confidence * 100).toInt()}% match', color: AppColors.primary),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('₹${s.price.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: cs.primary)),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
                    child: Text('Add', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.success)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getConfidenceColor(double confidence) {
    if (confidence >= 0.8) return AppColors.success;
    if (confidence >= 0.5) return AppColors.warning;
    return AppColors.danger;
  }
}

class _AiUpsellChip extends StatelessWidget {
  final String label;
  final Color color;
  const _AiUpsellChip({required this.label, required this.color});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
    child: Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
  );
}
