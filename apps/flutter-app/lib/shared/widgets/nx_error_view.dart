import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimens.dart';

/// Error view with icon, message, and retry button.
class NxErrorView extends StatelessWidget {
  final String message;
  final String? details;
  final String retryLabel;
  final VoidCallback? onRetry;

  const NxErrorView({
    super.key,
    required this.message,
    this.details,
    this.retryLabel = 'Retry',
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppDimens.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: AppColors.danger),
            const SizedBox(height: AppDimens.base),
            Text(
              message,
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
            if (details != null) ...[
              const SizedBox(height: AppDimens.xs),
              Text(
                details!,
                style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray400),
                textAlign: TextAlign.center,
              ),
            ],
            if (onRetry != null) ...[
              const SizedBox(height: AppDimens.lg),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                label: Text(retryLabel),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
