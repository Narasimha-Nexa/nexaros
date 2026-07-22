import 'package:flutter/material.dart';
import '../../core/theme/app_dimens.dart';

/// Horizontal scrollable filter chip row — common in list screens.
class NxFilterChipRow extends StatelessWidget {
  final List<NxFilterChipData> chips;
  final String selectedValue;
  final ValueChanged<String> onSelected;

  const NxFilterChipRow({
    super.key,
    required this.chips,
    required this.selectedValue,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppDimens.base),
        itemCount: chips.length,
        separatorBuilder: (_, __) => const SizedBox(width: AppDimens.sm),
        itemBuilder: (ctx, i) {
          final chip = chips[i];
          final isSelected = selectedValue == chip.value;
          return FilterChip(
            label: Text(chip.label),
            selected: isSelected,
            onSelected: (_) => onSelected(chip.value),
            selectedColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
            checkmarkColor: Theme.of(context).colorScheme.primary,
          );
        },
      ),
    );
  }
}

class NxFilterChipData {
  final String label;
  final String value;
  const NxFilterChipData(this.label, this.value);
}
