import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/subscription_provider.dart';

class GracePeriodBanner extends StatelessWidget {
  final SubscriptionInfo info;
  final VoidCallback? onUpgrade;

  const GracePeriodBanner({super.key, required this.info, this.onUpgrade});

  @override
  Widget build(BuildContext context) {
    if (!info.isGracePeriod && !info.isPaymentPending) return const SizedBox.shrink();

    final isUrgent = info.graceDaysRemaining != null && info.graceDaysRemaining! <= 2;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isUrgent
              ? [const Color(0xFFEF4444), const Color(0xFFDC2626)]
              : [const Color(0xFFF97316), const Color(0xFFF59E0B)],
        ),
        boxShadow: [
          BoxShadow(
            color: (isUrgent ? const Color(0xFFEF4444) : const Color(0xFFF97316)).withValues(alpha: 0.3),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Row(
              children: [
                Icon(
                  isUrgent ? Icons.error_outline : Icons.warning_amber_rounded,
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isUrgent ? 'Urgent: Grace Period Ending' : info.isPaymentPending ? 'Payment Pending' : 'Grace Period Active',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        info.gracePeriodMessage.isNotEmpty ? info.gracePeriodMessage : 'Complete payment to keep full access',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                if (onUpgrade != null) ...[
                  const SizedBox(width: 10),
                  TextButton(
                    onPressed: onUpgrade,
                    style: TextButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: isUrgent ? const Color(0xFFEF4444) : const Color(0xFFF97316),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Text(
                      'Renew Now',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ],
            ),
            if (info.hasPromise && info.promiseUntil != null) ...[
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Payment promise until ${_formatDate(info.promiseUntil!)}',
                  style: GoogleFonts.inter(fontSize: 10, color: Colors.white.withValues(alpha: 0.9)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}
