import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/event_bus.dart';

class DeliveryProvider extends ChangeNotifier {
  final ApiClient _api;
  final EventBus _eventBus;
  StreamSubscription<BusEvent>? _assignedSub;
  StreamSubscription<BusEvent>? _statusChangedSub;

  // Stats
  Map<String, dynamic>? _stats;
  bool _statsLoading = false;

  // Partners
  List<Map<String, dynamic>> _partners = [];
  bool _partnersLoading = false;
  String? _partnersError;

  // Active deliveries
  List<Map<String, dynamic>> _activeDeliveries = [];
  bool _activeDeliveriesLoading = false;

  // Delivery history
  List<Map<String, dynamic>> _history = [];
  bool _historyLoading = false;
  int _historyTotal = 0;

  // Pending delivery orders (orders ready for delivery)
  List<Map<String, dynamic>> _pendingOrders = [];
  bool _pendingOrdersLoading = false;

  // Selected delivery for detail/tracking
  Map<String, dynamic>? _selectedDelivery;

  DeliveryProvider(this._api, this._eventBus) {
    _listenToEvents();
  }

  void _listenToEvents() {
    _assignedSub = _eventBus.listen(BusEventType.deliveryAssigned, (_) {
      loadActiveDeliveries();
      loadDashboardData();
    });
    _statusChangedSub = _eventBus.listen(BusEventType.deliveryStatusChanged, (_) {
      loadActiveDeliveries();
    });
  }

  // Getters
  Map<String, dynamic>? get stats => _stats;
  bool get statsLoading => _statsLoading;

  List<Map<String, dynamic>> get partners => _partners;
  bool get partnersLoading => _partnersLoading;
  String? get partnersError => _partnersError;

  List<Map<String, dynamic>> get activeDeliveries => _activeDeliveries;
  bool get activeDeliveriesLoading => _activeDeliveriesLoading;

  List<Map<String, dynamic>> get history => _history;
  bool get historyLoading => _historyLoading;
  int get historyTotal => _historyTotal;

  List<Map<String, dynamic>> get pendingOrders => _pendingOrders;
  bool get pendingOrdersLoading => _pendingOrdersLoading;

  Map<String, dynamic>? get selectedDelivery => _selectedDelivery;

  // ─── Dashboard ───

  Future<void> loadDashboardData({String? branchId}) async {
    _statsLoading = true;
    notifyListeners();
    try {
      final results = await Future.wait([
        _api.getDeliveryStats(branchId: branchId),
        _api.getActiveDeliveries(branchId: branchId),
      ]);
      _stats = results[0] as Map<String, dynamic>?;
      _activeDeliveries = (results[1] as List).cast<Map<String, dynamic>>();
    } catch (_) {
      _stats = {'activeCount': 0, 'pendingCount': 0, 'todayCount': 0, 'availablePartners': 0};
      _activeDeliveries = [];
    }
    _statsLoading = false;
    notifyListeners();
  }

  // ─── Partners ───

  Future<void> loadPartners({String? tenantId, String? branchId}) async {
    _partnersLoading = true;
    _partnersError = null;
    notifyListeners();
    try {
      final partners = await _api.getDeliveryPartners(tenantId: tenantId, branchId: branchId);
      _partners = partners.cast<Map<String, dynamic>>();
    } catch (e) {
      _partnersError = e.toString();
      _partners = [];
    }
    _partnersLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> createPartner(Map<String, dynamic> data) async {
    try {
      final result = await _api.createDeliveryPartner(data);
      await loadPartners();
      return result;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> updatePartner(String id, Map<String, dynamic> data) async {
    try {
      final result = await _api.updateDeliveryPartner(id, data);
      await loadPartners();
      return result;
    } catch (e) {
      return null;
    }
  }

  Future<bool> deletePartner(String id) async {
    try {
      await _api.deleteDeliveryPartner(id);
      await loadPartners();
      return true;
    } catch (_) {
      return false;
    }
  }

  // ─── Active Deliveries ───

  Future<void> loadActiveDeliveries({String? branchId}) async {
    _activeDeliveriesLoading = true;
    notifyListeners();
    try {
      final deliveries = await _api.getActiveDeliveries(branchId: branchId);
      _activeDeliveries = deliveries.cast<Map<String, dynamic>>();
    } catch (_) {
      _activeDeliveries = [];
    }
    _activeDeliveriesLoading = false;
    notifyListeners();
  }

  Future<void> loadPendingOrders(String branchId) async {
    _pendingOrdersLoading = true;
    notifyListeners();
    try {
      final orders = await _api.getPendingDeliveryOrders(branchId);
      _pendingOrders = orders.cast<Map<String, dynamic>>();
    } catch (_) {
      _pendingOrders = [];
    }
    _pendingOrdersLoading = false;
    notifyListeners();
  }

  // ─── Assignments ───

  Future<bool> assignDelivery(String deliveryId, String partnerId) async {
    try {
      await _api.assignDelivery(deliveryId, partnerId);
      await loadActiveDeliveries();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> unassignDelivery(String deliveryId) async {
    try {
      await _api.unassignDelivery(deliveryId);
      await loadActiveDeliveries();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<String?> createDeliveryFromOrder(String orderId, {String? address, double? lat, double? lng}) async {
    try {
      final result = await _api.createDeliveryFromOrder(orderId, address: address, lat: lat, lng: lng);
      return result['id'] as String?;
    } catch (_) {
      return null;
    }
  }

  Future<bool> updateStatus(String id, String status, {double? lat, double? lng}) async {
    try {
      await _api.updateDeliveryStatus(id, status, lat: lat, lng: lng);
      await loadActiveDeliveries();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> autoAssign() async {
    try {
      await _api.autoAssignDelivery();
      await loadActiveDeliveries();
      return true;
    } catch (_) {
      return false;
    }
  }

  // ─── History ───

  Future<void> loadHistory({String? branchId, int? page, int? limit}) async {
    _historyLoading = true;
    notifyListeners();
    try {
      final raw = await _api.getDeliveryHistory(branchId: branchId, page: page, limit: limit);
      _history = (raw['deliveries'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      _historyTotal = raw['total'] as int? ?? _history.length;
    } catch (_) {
      _history = [];
      _historyTotal = 0;
    }
    _historyLoading = false;
    notifyListeners();
  }

  // ─── Selection ───

  void selectDelivery(Map<String, dynamic>? delivery) {
    _selectedDelivery = delivery;
    notifyListeners();
  }

  @override
  void dispose() {
    _assignedSub?.cancel();
    _statusChangedSub?.cancel();
    super.dispose();
  }
}
