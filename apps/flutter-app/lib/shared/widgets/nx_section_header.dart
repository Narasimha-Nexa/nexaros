import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_dimens.dart';

/// Section header with title and optional trailing action.
class NxSectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;
  final EdgeInsetsGeometry padding;

  const NxSectionHeader({
    super.key,
    required this.title,
    this.trailing,
    this.padding = const EdgeInsets.symmetric(
      horizontal: AppDimens.base,
      vertical: AppDimens.md,
    ),
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: GoogleFonts.inter(
                fontSize: AppDimens.responsiveSubtitle(context),
                fontWeight: FontWeight.w700,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}
