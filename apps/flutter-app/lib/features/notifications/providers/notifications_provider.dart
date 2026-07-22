import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/event_bus.dart';

class NotificationModel {
  final String id;
  final String title;
  final String? message;
  final String type;
  final bool isRead;
  final String? orderId;
  final DateTime? createdAt;

  const NotificationModel({
    required this.id,
    required this.title,
    this.message,
    this.type = 'info',
    this.isRead = false,
    this.orderId,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString(),
      type: json['type']?.toString() ?? 'info',
      isRead: json['isRead'] ?? json['read'] ?? false,
      orderId: json['orderId']?.toString(),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  IconData get icon {
    switch (type) {
      case 'ORDER': return Icons.receipt_long;
      case 'PAYMENT': return Icons.payment;
      case 'DELIVERY': return Icons.local_shipping;
      case 'INVENTORY': return Icons.inventory_2;
      case 'STAFF': return Icons.people;
      case 'WARNING': return Icons.warning;
      case 'ERROR': return Icons.error;
      default: return Icons.info;
    }
  }

  Color get color {
    switch (type) {
      case 'ORDER': return const Color(0xFF3B82F6);
      case 'PAYMENT': return const Color(0xFF10B981);
      case 'DELIVERY': return const Color(0xFF06B6D4);
      case 'INVENTORY': return const Color(0xFFF59E0B);
      case 'STAFF': return const Color(0xFF8B5CF6);
      case 'WARNING': return const Color(0xFFF97316);
      case 'ERROR': return const Color(0xFFEF4444);
      default: return const Color(0xFF64748B);
    }
  }

  String? get timeAgo {
    if (createdAt == null) return null;
    final diff = DateTime.now().difference(createdAt!);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${createdAt!.day}/${createdAt!.month}';
  }
}

class NotificationsProvider extends ChangeNotifier {
  final ApiClient _api;
  final EventBus _eventBus;
  StreamSubscription<BusEvent>? _notifSub;

  List<NotificationModel> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;

  NotificationsProvider(this._api, this._eventBus) {
    _listenToEvents();
  }

  List<NotificationModel> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;

  void _listenToEvents() {
    _notifSub = _eventBus.listen(BusEventType.orderCreated, (_) {
      loadNotifications();
      loadUnreadCount();
    });
  }

  Future<void> loadNotifications() async {
    _isLoading = true;
    notifyListeners();
    try {
      final raw = await _api.getNotifications(limit: 50);
      _notifications = raw.map((n) => NotificationModel.fromJson(n as Map<String, dynamic>)).toList();
    } catch (_) {}
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadUnreadCount() async {
    try {
      _unreadCount = await _api.getUnreadNotificationCount();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> markRead(String id) async {
    try {
      await _api.markNotificationRead(id);
      final idx = _notifications.indexWhere((n) => n.id == id);
      if (idx != -1) {
        _notifications[idx] = NotificationModel(
          id: _notifications[idx].id,
          title: _notifications[idx].title,
          message: _notifications[idx].message,
          type: _notifications[idx].type,
          isRead: true,
          orderId: _notifications[idx].orderId,
          createdAt: _notifications[idx].createdAt,
        );
        _unreadCount = (_unreadCount - 1).clamp(0, 999);
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    try {
      await _api.markAllNotificationsRead();
      _notifications = _notifications.map((n) => NotificationModel(
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: true,
        orderId: n.orderId,
        createdAt: n.createdAt,
      )).toList();
      _unreadCount = 0;
      notifyListeners();
    } catch (_) {}
  }

  @override
  void dispose() {
    _notifSub?.cancel();
    super.dispose();
  }
}
