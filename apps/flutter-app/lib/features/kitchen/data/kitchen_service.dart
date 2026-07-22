import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import 'kitchen_models.dart';

class KitchenService {
  final ApiClient _api;

  final Map<String, Timer> _orderTimers = {};
  final _timerController = StreamController<Map<String, Duration>>.broadcast();
  final _notificationController = StreamController<KitchenNotification>.broadcast();
  final _auditLog = <KitchenAuditEntry>[];

  KitchenService(this._api);

  Stream<Map<String, Duration>> get timerStream => _timerController.stream;
  Stream<KitchenNotification> get notificationStream => _notificationController.stream;
  List<KitchenAuditEntry> get auditLog => List.unmodifiable(_auditLog);

  // ─── Order Loading ───

  Future<List<KitchenOrder>> loadOrders({String? branchId, KitchenFilter? filter}) async {
    try {
      final raw = await _api.getActiveKitchenOrders(branchId: branchId);
      var orders = raw.map((json) => KitchenOrder.fromJson(json as Map<String, dynamic>)).toList();

      if (filter != null) {
        orders = _applyFilter(orders, filter);
      }

      // Start timers for active orders
      for (final order in orders) {
        if (order.status.isActive && !_orderTimers.containsKey(order.id)) {
          _startTimer(order.id, order.createdAt);
        }
      }

      return orders;
    } catch (e) {
      debugPrint('KitchenService.loadOrders error: $e');
      return [];
    }
  }

  // ─── Status Updates ───

  Future<KitchenOrder?> updateOrderStatus(
    String orderId,
    KitchenOrderStatus newStatus, {
    String? notes,
    String? staffId,
    String? staffName,
  }) async {
    try {
      await _api.updateKitchenOrderStatus(orderId, newStatus.name.toUpperCase());

      _addAudit(KitchenAuditEntry(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        orderId: orderId,
        action: 'STATUS_CHANGE',
        toStatus: newStatus.name,
        staffId: staffId,
        staffName: staffName,
        notes: notes,
        timestamp: DateTime.now(),
      ));

      if (newStatus.isTerminal) {
        _stopTimer(orderId);
      }

      return null; // Caller should reload
    } catch (e) {
      debugPrint('KitchenService.updateOrderStatus error: $e');
      return null;
    }
  }

  Future<KitchenOrder?> updateItemStatus(
    String orderId,
    String itemId,
    KitchenOrderStatus newStatus, {
    String? staffId,
    String? staffName,
  }) async {
    try {
      final url = '${_api.baseUrl}/orders/$orderId/items/$itemId/status';
      await _api.put(url, {'status': newStatus.name.toUpperCase()});

      _addAudit(KitchenAuditEntry(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        orderId: orderId,
        action: 'ITEM_STATUS_CHANGE',
        toStatus: newStatus.name,
        staffId: staffId,
        staffName: staffName,
        timestamp: DateTime.now(),
      ));

      return null;
    } catch (e) {
      debugPrint('KitchenService.updateItemStatus error: $e');
      return null;
    }
  }

  // ─── Chef Assignment ───

  Future<void> assignChef(String orderId, String chefId, String chefName) async {
    try {
      await _api.put('${_api.baseUrl}/orders/$orderId/assign', {
        'chefId': chefId,
        'chefName': chefName,
      });

      _addAudit(KitchenAuditEntry(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        orderId: orderId,
        action: 'CHEF_ASSIGNED',
        staffId: chefId,
        staffName: chefName,
        timestamp: DateTime.now(),
      ));
    } catch (e) {
      debugPrint('KitchenService.assignChef error: $e');
    }
  }

  // ─── Course Management ───

  Future<void> fireCourse(String orderId, CourseType course, {String? staffId, String? staffName}) async {
    try {
      await _api.put('${_api.baseUrl}/orders/$orderId/fire-course', {
        'course': course.name,
      });

      _addAudit(KitchenAuditEntry(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        orderId: orderId,
        action: 'COURSE_FIRED',
        notes: course.label,
        staffId: staffId,
        staffName: staffName,
        timestamp: DateTime.now(),
      ));
    } catch (e) {
      debugPrint('KitchenService.fireCourse error: $e');
    }
  }

  Future<void> holdCourse(String orderId, CourseType course, {String? staffId, String? staffName}) async {
    try {
      await _api.put('${_api.baseUrl}/orders/$orderId/hold-course', {
        'course': course.name,
      });

      _addAudit(KitchenAuditEntry(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        orderId: orderId,
        action: 'COURSE_HELD',
        notes: course.label,
        staffId: staffId,
        staffName: staffName,
        timestamp: DateTime.now(),
      ));
    } catch (e) {
      debugPrint('KitchenService.holdCourse error: $e');
    }
  }

  // ─── Rush / Hold / Recall ───

  Future<void> rushOrder(String orderId, {String? staffId, String? staffName}) async {
    await updateOrderStatus(orderId, KitchenOrderStatus.rush, staffId: staffId, staffName: staffName);
    _sendNotification(KitchenNotification(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      type: KitchenNotificationType.orderRush,
      title: 'Order Rushed',
      message: 'Order has been marked as rush priority',
      orderId: orderId,
      createdAt: DateTime.now(),
    ));
  }

  Future<void> holdOrder(String orderId, {String? staffId, String? staffName}) async {
    await updateOrderStatus(orderId, KitchenOrderStatus.held, staffId: staffId, staffName: staffName);
  }

  Future<void> recallOrder(String orderId, {String? staffId, String? staffName}) async {
    await updateOrderStatus(orderId, KitchenOrderStatus.recalled, staffId: staffId, staffName: staffName);
  }

  // ─── Timer Management ───

  void _startTimer(String orderId, DateTime createdAt) {
    _orderTimers[orderId]?.cancel();
    _orderTimers[orderId] = Timer.periodic(const Duration(seconds: 1), (_) {
      _tickTimers();
    });
  }

  void _stopTimer(String orderId) {
    _orderTimers[orderId]?.cancel();
    _orderTimers.remove(orderId);
  }

  void _tickTimers() {
    final durations = <String, Duration>{};
    for (final entry in _orderTimers.entries) {
      // Timer is running, emit elapsed
      durations[entry.key] = Duration(seconds: entry.value.tick);
    }
    if (durations.isNotEmpty) {
      _timerController.add(durations);
    }
  }

  // ─── Notifications ───

  void _sendNotification(KitchenNotification notification) {
    _notificationController.add(notification);
  }

  // ─── Audit ───

  void _addAudit(KitchenAuditEntry entry) {
    _auditLog.insert(0, entry);
    if (_auditLog.length > 500) _auditLog.removeLast();
  }

  // ─── Metrics ───

  KitchenMetrics calculateMetrics(List<KitchenOrder> orders) {
    if (orders.isEmpty) return const KitchenMetrics();

    final completed = orders.where((o) => o.status == KitchenOrderStatus.completed || o.status == KitchenOrderStatus.served).toList();
    final delayed = orders.where((o) => o.isDelayed).toList();
    final active = orders.where((o) => o.status.isActive).toList();

    double avgTicketTime = 0;
    if (completed.isNotEmpty) {
      final totalMinutes = completed.fold<int>(0, (sum, o) => sum + o.age.inMinutes);
      avgTicketTime = totalMinutes / completed.length;
    }

    final avgItems = orders.isEmpty ? 0.0 : orders.fold<int>(0, (sum, o) => sum + o.items.length) / orders.length;

    // Station utilization
    final stationCounts = <String, int>{};
    for (final order in active) {
      for (final item in order.items) {
        final station = item.station?.label ?? 'Main Kitchen';
        stationCounts[station] = (stationCounts[station] ?? 0) + 1;
      }
    }
    final maxStation = stationCounts.values.fold<int>(0, max);
    final stationUtilization = <String, double>{};
    for (final entry in stationCounts.entries) {
      stationUtilization[entry.key] = maxStation > 0 ? entry.value / maxStation * 100 : 0;
    }

    // Chef productivity
    final chefCounts = <String, int>{};
    for (final order in completed) {
      if (order.assignedChefName != null) {
        chefCounts[order.assignedChefName!] = (chefCounts[order.assignedChefName!] ?? 0) + 1;
      }
    }

    return KitchenMetrics(
      avgTicketTimeMinutes: avgTicketTime,
      totalOrdersToday: orders.length,
      completedOrders: completed.length,
      delayedOrders: delayed.length,
      activeOrders: active.length,
      avgItemsPerOrder: avgItems.round(),
      stationUtilization: stationUtilization,
      chefProductivity: chefCounts,
    );
  }

  // ─── Filter ───

  List<KitchenOrder> _applyFilter(List<KitchenOrder> orders, KitchenFilter filter) {
    var result = orders;

    if (filter.statuses.isNotEmpty) {
      result = result.where((o) => filter.statuses.contains(o.status)).toList();
    }
    if (filter.stations.isNotEmpty) {
      result = result.where((o) =>
        o.items.any((i) => filter.stations.contains(i.station))
      ).toList();
    }
    if (filter.chefIds.isNotEmpty) {
      result = result.where((o) => filter.chefIds.contains(o.assignedChefId)).toList();
    }
    if (filter.priorities.isNotEmpty) {
      result = result.where((o) => filter.priorities.contains(o.priority)).toList();
    }
    if (filter.searchQuery != null && filter.searchQuery!.isNotEmpty) {
      final q = filter.searchQuery!.toLowerCase();
      result = result.where((o) =>
        o.displayOrderNumber.toLowerCase().contains(q) ||
        (o.tableName?.toLowerCase().contains(q) ?? false) ||
        (o.customerName?.toLowerCase().contains(q) ?? false) ||
        o.items.any((i) => i.name.toLowerCase().contains(q))
      ).toList();
    }
    if (filter.showDelayedOnly) {
      result = result.where((o) => o.isDelayed).toList();
    }
    if (filter.showRushOnly) {
      result = result.where((o) => o.isRush || o.priority.level >= KitchenPriority.urgent.level).toList();
    }

    return result;
  }

  // ─── Cleanup ───

  void dispose() {
    for (final timer in _orderTimers.values) {
      timer.cancel();
    }
    _orderTimers.clear();
    _timerController.close();
    _notificationController.close();
  }
}
