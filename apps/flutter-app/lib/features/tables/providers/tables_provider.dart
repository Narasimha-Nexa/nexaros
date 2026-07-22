import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/event_bus.dart';

/// Manages restaurant table state with real-time WebSocket updates
/// for table status changes (FREE → OCCUPIED → BILLING → FREE).
class TablesProvider extends ChangeNotifier {
  final ApiClient _api;
  final EventBus _eventBus;
  List<Map<String, dynamic>> _tables = [];
  Map<String, dynamic> _summary = {};
  bool _isLoading = false;
  String? _error;
  StreamSubscription<BusEvent>? _statusSub;

  TablesProvider(this._api, this._eventBus) {
    _listenToEvents();
  }

  List<Map<String, dynamic>> get tables => _tables;
  Map<String, dynamic> get summary => _summary;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Subscribe to table status change events for real-time updates.
  void _listenToEvents() {
    _statusSub = _eventBus.listen(BusEventType.tableStatusChanged, (_) {
      loadFloorPlan();
    });
  }

  Future<void> loadFloorPlan({String? branchId}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final effectiveBranchId = branchId ?? _api.branchId;
      final result = await _api.getFloorPlan(branchId: effectiveBranchId);
      _tables = (result['tables'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
      _summary = (result['summary'] as Map<String, dynamic>?) ?? {};
      _error = null;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> updateTableStatus(String tableId, String status) async {
    try {
      await _api.updateTableStatus(tableId, status);
      // WebSocket event will trigger refresh via _listenToEvents
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Get a single table by ID from the cached list.
  Map<String, dynamic>? getTable(String tableId) {
    try {
      return _tables.firstWhere((t) => t['id'] == tableId);
    } catch (_) {
      return null;
    }
  }

  /// Count of tables in a specific status.
  int countByStatus(String status) {
    return _tables.where((t) => t['status'] == status).length;
  }

  @override
  void dispose() {
    _statusSub?.cancel();
    super.dispose();
  }
}
