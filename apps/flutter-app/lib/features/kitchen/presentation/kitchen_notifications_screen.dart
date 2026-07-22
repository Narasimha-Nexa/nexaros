import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/kitchen_models.dart';
import '../providers/kitchen_provider.dart';

class KitchenNotificationsScreen extends ConsumerStatefulWidget {
  const KitchenNotificationsScreen({super.key});

  @override
  ConsumerState<KitchenNotificationsScreen> createState() => _KitchenNotificationsScreenState();
}

class _KitchenNotificationsScreenState extends ConsumerState<KitchenNotificationsScreen> {
  String _filterType = 'all';
  bool _showUnreadOnly = false;

  @override
  Widget build(BuildContext context) {
    final kitchen = ref.watch(kitchenProvider);
    final notifications = kitchen.state.notifications;
    final filtered = _filterNotifications(notifications);
    final unreadCount = notifications.where((n) => !n.isRead).length;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.notifications_active, color: Colors.amber),
            const SizedBox(width: 8),
            Text('Kitchen Alerts', style: AppTextStyles.h2),
            if (unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$unreadCount',
                  style: AppTextStyles.labelSmall.copyWith(color: Colors.white),
                ),
              ),
            ],
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: () => kitchen.markNotificationsRead(),
              child: const Text('Mark all read'),
            ),
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() {
                if (value == 'unread') {
                  _showUnreadOnly = !_showUnreadOnly;
                } else {
                  _filterType = value;
                }
              });
            },
            itemBuilder: (context) => [
              CheckedPopupMenuItem(
                value: 'unread',
                checked: _showUnreadOnly,
                child: const Text('Unread only'),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(value: 'all', child: Text('All types')),
              const PopupMenuItem(value: 'newOrder', child: Text('New Orders')),
              const PopupMenuItem(value: 'orderReady', child: Text('Ready Orders')),
              const PopupMenuItem(value: 'orderDelayed', child: Text('Delayed')),
              const PopupMenuItem(value: 'orderRush', child: Text('Rush')),
              const PopupMenuItem(value: 'courseFired', child: Text('Course Fired')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          _buildAlertSummary(notifications),
          Expanded(
            child: filtered.isEmpty
                ? NxEmptyState(
                    icon: Icons.notifications_off,
                    title: 'No notifications',
                    subtitle: 'Kitchen alerts will appear here',
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final notification = filtered[index];
                      return _buildNotificationCard(notification, kitchen);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertSummary(List<KitchenNotification> notifications) {
    final newOrderCount = notifications.where((n) => n.type == KitchenNotificationType.newOrder && !n.isRead).length;
    final readyCount = notifications.where((n) => n.type == KitchenNotificationType.orderReady && !n.isRead).length;
    final delayedCount = notifications.where((n) => n.type == KitchenNotificationType.orderDelayed && !n.isRead).length;
    final rushCount = notifications.where((n) => n.type == KitchenNotificationType.orderRush && !n.isRead).length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          _buildSummaryChip(Icons.receipt_long, 'New', newOrderCount, Colors.blue),
          const SizedBox(width: 8),
          _buildSummaryChip(Icons.check_circle, 'Ready', readyCount, Colors.green),
          const SizedBox(width: 8),
          _buildSummaryChip(Icons.warning, 'Delayed', delayedCount, Colors.orange),
          const SizedBox(width: 8),
          _buildSummaryChip(Icons.bolt, 'Rush', rushCount, Colors.red),
        ],
      ),
    );
  }

  Widget _buildSummaryChip(IconData icon, String label, int count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: count > 0 ? color.withAlpha(30) : Colors.grey.withAlpha(20),
          borderRadius: BorderRadius.circular(8),
          border: count > 0 ? Border.all(color: color.withAlpha(50)) : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 14, color: count > 0 ? color : Colors.grey),
            const SizedBox(width: 4),
            Text(
              '$count',
              style: AppTextStyles.labelMedium.copyWith(
                color: count > 0 ? color : Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationCard(KitchenNotification notification, KitchenProvider kitchen) {
    final icon = _getNotificationIcon(notification.type);
    final color = _getNotificationColor(notification.type);

    return NxCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withAlpha(30),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        notification.title,
                        style: AppTextStyles.h4.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    if (!notification.isRead)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Colors.blue,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(notification.message, style: AppTextStyles.bodySmall),
                const SizedBox(height: 4),
                Text(
                  _formatTime(notification.createdAt),
                  style: AppTextStyles.labelSmall,
                ),
              ],
            ),
          ),
          if (notification.orderId != null)
            IconButton(
              icon: const Icon(Icons.open_in_new, size: 16),
              onPressed: () {
                kitchen.selectOrder(notification.orderId);
                context.push('/shell/kitchen');
              },
            ),
        ],
      ),
    );
  }

  IconData _getNotificationIcon(KitchenNotificationType type) {
    return switch (type) {
      KitchenNotificationType.newOrder => Icons.receipt_long,
      KitchenNotificationType.orderReady => Icons.check_circle,
      KitchenNotificationType.orderDelayed => Icons.warning,
      KitchenNotificationType.orderRush => Icons.bolt,
      KitchenNotificationType.lowStock => Icons.inventory,
      KitchenNotificationType.chefAssigned => Icons.person_add,
      KitchenNotificationType.statusChange => Icons.sync,
      KitchenNotificationType.courseFired => Icons.restaurant_menu,
    };
  }

  Color _getNotificationColor(KitchenNotificationType type) {
    return switch (type) {
      KitchenNotificationType.newOrder => Colors.blue,
      KitchenNotificationType.orderReady => Colors.green,
      KitchenNotificationType.orderDelayed => Colors.orange,
      KitchenNotificationType.orderRush => Colors.red,
      KitchenNotificationType.lowStock => Colors.amber,
      KitchenNotificationType.chefAssigned => Colors.purple,
      KitchenNotificationType.statusChange => Colors.teal,
      KitchenNotificationType.courseFired => Colors.deepOrange,
    };
  }

  String _formatTime(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  List<KitchenNotification> _filterNotifications(List<KitchenNotification> notifications) {
    var result = notifications;

    if (_showUnreadOnly) {
      result = result.where((n) => !n.isRead).toList();
    }

    if (_filterType != 'all') {
      final type = KitchenNotificationType.values.firstWhere(
        (t) => t.name == _filterType,
        orElse: () => KitchenNotificationType.newOrder,
      );
      result = result.where((n) => n.type == type).toList();
    }

    return result;
  }
}
