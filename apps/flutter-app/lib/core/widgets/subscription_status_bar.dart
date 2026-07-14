import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/subscription_provider.dart';

class SubscriptionStatusBar extends StatelessWidget {
  final SubscriptionInfo info;
  final VoidCallback? onTap;

  const SubscriptionStatusBar({super.key, required this.info, this.onTap});

  @override
  Widget build(BuildContext context) {
    if (info.isNone || info.isActive) return const SizedBox.shrink();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        color: info.statusColor,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(info.statusIcon, size: 14, color: Colors.white),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                _buildMessage(),
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 6),
            Icon(Icons.chevron_right, size: 16, color: Colors.white.withValues(alpha: 0.8)),
          ],
        ),
      ),
    );
  }

  String _buildMessage() {
    switch (info.status) {
      case 'PAYMENT_PENDING':
        return 'Payment pending — complete payment to avoid service interruption';
      case 'GRACE_PERIOD':
        final days = info.graceDaysRemaining;
        if (days != null && days <= 2) {
          return 'Grace period ending in $days day${days == 1 ? '' : 's'} — renew now!';
        }
        return 'In grace period — renew to keep full access';
      case 'RESTRICTED':
        return 'Limited access — upgrade to unlock all features';
      case 'SUSPENDED':
        return 'Subscription suspended — contact support to reactivate';
      default:
        return 'Subscription: ${info.status}';
    }
  }
}
