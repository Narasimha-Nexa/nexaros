import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';

/// Theme-aware status badge for order / table / delivery statuses.
class NxStatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final bool small;
  final bool outlined;

  const NxStatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.small = false,
    this.outlined = false,
  });

  /// Factory: build from status string using semantic color map.
  factory NxStatusBadge.order(String status, {bool small = false}) {
    return NxStatusBadge(
      label: _formatLabel(status),
      color: AppColors.orderStatusColor(status),
      small: small,
    );
  }

  factory NxStatusBadge.table(String status, {bool small = false}) {
    return NxStatusBadge(
      label: _formatLabel(status),
      color: AppColors.tableStatusColor(status),
      small: small,
    );
  }

  static String _formatLabel(String status) {
    return status[0] + status.substring(1).toLowerCase().replaceAll('_', ' ');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = outlined
        ? Colors.transparent
        : isDark
            ? color.withValues(alpha: 0.2)
            : color.withValues(alpha: 0.1);
    final textColor = isDark
        ? color.withValues(alpha: 0.9)
        : color;
    final borderColor = outlined ? color.withValues(alpha: 0.4) : Colors.transparent;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 6 : 10,
        vertical: small ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: small ? 10 : 11,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}
