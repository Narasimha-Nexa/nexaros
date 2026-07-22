import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class NotificationCenterScreen extends ConsumerStatefulWidget {
  const NotificationCenterScreen({super.key});

  @override
  ConsumerState<NotificationCenterScreen> createState() => _NotificationCenterScreenState();
}

class _NotificationCenterScreenState extends ConsumerState<NotificationCenterScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = ref.read(notificationsProvider.notifier);
      provider.loadNotifications();
      provider.loadUnreadCount();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          Consumer(
            builder: (_, ref, __) {
              final provider = ref.watch(notificationsProvider);
              if (provider.unreadCount == 0) return const SizedBox.shrink();
              return TextButton(
                onPressed: () => ref.read(notificationsProvider.notifier).markAllRead(),
                child: const Text('Mark all read'),
              );
            },
          ),
        ],
      ),
      body: Consumer(
        builder: (_, ref, __) {
          final provider = ref.watch(notificationsProvider);
          if (provider.isLoading && provider.notifications.isEmpty) {
            return const NxFullScreenLoader();
          }
          if (provider.notifications.isEmpty) {
            return const NxEmptyState(
              icon: Icons.notifications_none,
              title: 'No notifications',
              subtitle: 'You\'re all caught up!',
            );
          }
          return RefreshIndicator(
            onRefresh: () async {
              await ref.read(notificationsProvider.notifier).loadNotifications();
              await ref.read(notificationsProvider.notifier).loadUnreadCount();
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(AppDimens.sm),
              itemCount: provider.notifications.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (ctx, i) {
                final notif = provider.notifications[i];
                return _NotificationTile(
                  notification: notif,
                  onTap: () async {
                    if (!notif.isRead) await ref.read(notificationsProvider.notifier).markRead(notif.id);
                    if (notif.orderId != null && mounted) {
                      context.push('/shell/orders');
                    }
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final dynamic notification;
  final VoidCallback onTap;

  const _NotificationTile({required this.notification, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final unread = !notification.isRead;

    return Container(
      color: unread
          ? (isDark ? cs.primary.withValues(alpha: 0.05) : cs.primary.withValues(alpha: 0.03))
          : null,
      child: ListTile(
        onTap: onTap,
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: notification.color.withValues(alpha: isDark ? 0.2 : 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(notification.icon, color: notification.color, size: 20),
        ),
        title: Text(
          notification.title,
          style: TextStyle(
            fontWeight: unread ? FontWeight.w600 : FontWeight.w500,
            fontSize: 14,
            color: cs.onSurface,
          ),
        ),
        subtitle: notification.message != null
            ? Text(
                notification.message!,
                style: TextStyle(fontSize: 12, color: AppColors.gray400),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              )
            : null,
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (notification.timeAgo != null)
              Text(
                notification.timeAgo!,
                style: TextStyle(fontSize: 11, color: AppColors.gray400),
              ),
            if (unread) ...[
              const SizedBox(height: 4),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(color: cs.primary, shape: BoxShape.circle),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
