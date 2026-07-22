import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// Loading spinner — wraps CircularProgressIndicator with theming.
class NxLoadingSpinner extends StatelessWidget {
  final double size;
  final Color? color;
  final String? label;

  const NxLoadingSpinner({
    super.key,
    this.size = 24,
    this.color,
    this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              strokeWidth: size > 30 ? 3 : 2,
              color: color ?? AppColors.primary,
            ),
          ),
          if (label != null) ...[
            const SizedBox(height: 12),
            Text(label!, style: TextStyle(color: AppColors.gray400, fontSize: 13)),
          ],
        ],
      ),
    );
  }
}

/// Full-screen loading overlay (skeleton-like).
class NxFullScreenLoader extends StatelessWidget {
  final String? message;

  const NxFullScreenLoader({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: NxLoadingSpinner(size: 36, label: message ?? 'Loading...'),
    );
  }
}
