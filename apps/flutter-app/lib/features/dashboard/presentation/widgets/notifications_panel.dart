import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/dashboard_models.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../shared/widgets/shared_widgets.dart';
import '../../../../core/utils/date_utils.dart' as app_date_utils;

class NotificationsPanel extends StatelessWidget {
  final List<DashboardNotification> notifications;
  final bool isDesktop;
  final VoidCallback? onMarkAllRead;

  const NotificationsPanel({super.key, required this.notifications, this.isDesktop = false, this.onMarkAllRead});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final unread = notifications.where((n) => !n.isRead).length;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      NxSectionHeader(
        title: 'Notifications',
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
          if (unread > 0)
            NxStatusBadge(label: '$unread unread', color: AppColors.danger, small: true),
          const SizedBox(width: 8),
          TextButton(onPressed: onMarkAllRead, child: Text('Mark All Read', style: GoogleFonts.inter(fontSize: 11))),
        ]),
      ),
      const SizedBox(height: AppDimens.sm),
      if (notifications.isEmpty)
        NxCard(padding: const EdgeInsets.all(AppDimens.xl), child: Center(
          child: Column(children: [
            Icon(Icons.notifications_none, size: 32, color: cs.outline),
            const SizedBox(height: 8),
            Text('No notifications', style: GoogleFonts.inter(color: cs.onSurfaceVariant)),
          ]),
        ))
      else ...[
        _AlertSummary(notifications: notifications),
        const SizedBox(height: AppDimens.sm),
        NxCard(
          padding: const EdgeInsets.all(AppDimens.base),
          child: Column(children: notifications.take(15).map((n) => _NotificationTile(notification: n)).toList()),
        ),
      ],
    ]);
  }
}

class _AlertSummary extends StatelessWidget {
  final List<DashboardNotification> notifications;
  const _AlertSummary({required this.notifications});

  @override
  Widget build(BuildContext context) {
    final critical = notifications.where((n) => n.severity == AlertSeverity.critical).length;
    final warning = notifications.where((n) => n.severity == AlertSeverity.warning).length;
    final info = notifications.where((n) => n.severity == AlertSeverity.info).length;

    return Row(children: [
      if (critical > 0)
        Expanded(child: _AlertCount(label: 'Critical', count: critical, color: AppColors.danger)),
      if (critical > 0 && warning > 0) const SizedBox(width: 6),
      if (warning > 0)
        Expanded(child: _AlertCount(label: 'Warning', count: warning, color: AppColors.warning)),
      if ((critical > 0 || warning > 0) && info > 0) const SizedBox(width: 6),
      if (info > 0)
        Expanded(child: _AlertCount(label: 'Info', count: info, color: AppColors.info)),
    ]);
  }
}

class _AlertCount extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  const _AlertCount({required this.label, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(AppDimens.radiusSm),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text('$count $label', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
      ]),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final DashboardNotification notification;
  const _NotificationTile({required this.notification});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final severityColor = notification.severity == AlertSeverity.critical ? AppColors.danger
      : notification.severity == AlertSeverity.warning ? AppColors.warning : AppColors.info;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: notification.isRead ? Colors.transparent : severityColor.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(AppDimens.radiusSm),
        border: Border(left: BorderSide(color: severityColor, width: 3)),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(_categoryIcon(notification.category), size: 16, color: severityColor),
        const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(notification.title, style: GoogleFonts.inter(fontSize: 12, fontWeight: notification.isRead ? FontWeight.w500 : FontWeight.w700))),
            Text(_timeAgo(notification.timestamp), style: GoogleFonts.inter(fontSize: 9, color: cs.outline)),
          ]),
          if (notification.message.isNotEmpty && notification.message != notification.title)
            Text(notification.message, style: GoogleFonts.inter(fontSize: 11, color: cs.onSurfaceVariant), maxLines: 2, overflow: TextOverflow.ellipsis),
        ])),
      ]),
    );
  }

  IconData _categoryIcon(String cat) {
    switch (cat.toLowerCase()) {
      case 'inventory': return Icons.inventory_2;
      case 'kitchen': return Icons.restaurant;
      case 'payment': return Icons.payment;
      case 'reservation': return Icons.event_seat;
      case 'order': return Icons.receipt_long;
      case 'staff': return Icons.badge;
      case 'system': return Icons.settings;
      default: return Icons.notifications;
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return app_date_utils.DateUtils.formatDate(dt);
  }
}
