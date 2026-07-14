import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/subscription_provider.dart';

class FeatureLockedOverlay extends StatelessWidget {
  final String moduleKey;
  final SubscriptionInfo subscription;
  final VoidCallback? onUpgrade;

  const FeatureLockedOverlay({
    super.key,
    required this.moduleKey,
    required this.subscription,
    this.onUpgrade,
  });

  static Widget wrap({
    required BuildContext context,
    required String moduleKey,
    required SubscriptionProvider provider,
    VoidCallback? onUpgrade,
    required Widget child,
  }) {
    if (provider.canAccessFeature(moduleKey)) return child;

    return Stack(
      children: [
        Opacity(opacity: 0.3, child: IgnorePointer(child: child)),
        Positioned.fill(
          child: FeatureLockedOverlay(
            moduleKey: moduleKey,
            subscription: provider.info,
            onUpgrade: onUpgrade,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final reason = subscription.isNone
        ? 'No active subscription. Sign up to access this feature.'
        : subscription.isSuspended
            ? 'Subscription suspended. Contact support to reactivate.'
            : subscription.isRestricted && !subscription.isModuleEnabled(moduleKey)
                ? 'This feature requires an active subscription. Upgrade to unlock.'
                : 'Feature locked. Upgrade your subscription to access.';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      padding: const EdgeInsets.all(20),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.lock_outline, color: Color(0xFF3B82F6), size: 28),
            ),
            const SizedBox(height: 12),
            Text(
              'Feature Locked',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              reason,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: const Color(0xFF64748B),
                height: 1.4,
              ),
            ),
            if (onUpgrade != null) ...[
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: onUpgrade,
                icon: const Icon(Icons.upgrade, size: 16),
                label: Text('Upgrade Plan', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
