import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';

/// Standard confirmation dialog (destructive actions).
class NxConfirmationDialog extends StatelessWidget {
  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final Color confirmColor;
  final VoidCallback onConfirm;

  const NxConfirmationDialog({
    super.key,
    required this.title,
    required this.message,
    this.confirmLabel = 'Confirm',
    this.cancelLabel = 'Cancel',
    this.confirmColor = AppColors.danger,
    required this.onConfirm,
  });

  /// Convenience: show as a dialog and return `Future<bool?>`.
  static Future<bool?> show({
    required BuildContext context,
    required String title,
    required String message,
    String confirmLabel = 'Confirm',
    Color confirmColor = AppColors.danger,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (_) => NxConfirmationDialog(
        title: title,
        message: message,
        confirmLabel: confirmLabel,
        confirmColor: confirmColor,
        onConfirm: () => Navigator.of(context).pop(true),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      content: Text(message, style: GoogleFonts.inter(fontSize: 14, color: AppColors.gray500)),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text(cancelLabel),
        ),
        ElevatedButton(
          onPressed: () {
            onConfirm();
            Navigator.of(context).pop(true);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: confirmColor,
            foregroundColor: AppColors.white,
          ),
          child: Text(confirmLabel),
        ),
      ],
    );
  }
}
