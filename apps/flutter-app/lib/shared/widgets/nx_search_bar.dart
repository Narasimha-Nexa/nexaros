import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';

/// Enterprise search bar with icon, clear button, and debounce-friendly.
class NxSearchBar extends StatelessWidget {
  final String? hintText;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onClear;
  final TextEditingController? controller;
  final bool autofocus;

  const NxSearchBar({
    super.key,
    this.hintText,
    this.onChanged,
    this.onClear,
    this.controller,
    this.autofocus = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: cs.outline),
      ),
      child: TextField(
        controller: controller,
        autofocus: autofocus,
        onChanged: onChanged,
        style: GoogleFonts.inter(fontSize: 14, color: cs.onSurface),
        decoration: InputDecoration(
          hintText: hintText ?? 'Search...',
          hintStyle: GoogleFonts.inter(color: AppColors.gray400, fontSize: 14),
          prefixIcon: Icon(Icons.search, color: AppColors.gray400, size: 20),
          suffixIcon: (controller?.text.isNotEmpty == true || onClear != null)
              ? IconButton(
                  icon: const Icon(Icons.close, size: 18),
                  color: AppColors.gray400,
                  onPressed: () {
                    controller?.clear();
                    onClear?.call();
                  },
                )
              : null,
          border: InputBorder.none,
          filled: false,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
      ),
    );
  }
}
