import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/event_bus.dart';

/// Manages restaurant table state with real-time WebSocket updates
/// for table status changes (FREE → OCCUPIED → BILLING → FREE).
///
/// Uses incremental socket updates for instant UI feedback instead of
/// full refetch on every status change.
class TablesProvider extends ChangeNotifier {
  final ApiClient _api;
  final EventBus _eventBus;
  List<Map<String, dynamic>> _tables = [];
  Map<String, dynamic> _summary = {};
  bool _isLoading = false;
  String? _error;
  String? _currentBranchId;
  StreamSubscription<BusEvent>? _statusSub;
  StreamSubscription<BusEvent>? _mergedSub;
  StreamSubscription<BusEvent>? _splitSub;

  TablesProvider(this._api, this._eventBus) {
    _listenToEvents();
  }

  List<Map<String, dynamic>> get tables => _tables;
  Map<String, dynamic> get summary => _summary;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Subscribe to table events for real-time updates.
  /// Uses incremental state updates — no full refetch needed.
  void _listenToEvents() {
    _statusSub = _eventBus.listen(BusEventType.tableStatusChanged, (event) {
      _applyTableStatusChange(event.data);
    });
    _mergedSub = _eventBus.listen(BusEventType.tableMerged, (_) => loadFloorPlan());
    _splitSub = _eventBus.listen(BusEventType.tableSplit, (_) => loadFloorPlan());
  }

  /// Apply incremental table status change from WebSocket event.
  /// Updates only the affected table and recalculates summary — no API call.
  void _applyTableStatusChange(Map<String, dynamic> data) {
    final tableId = data['tableId'] as String?;
    final newStatus = data['status'] as String?;
    if (tableId == null || newStatus == null) return;

    final idx = _tables.indexWhere((t) => t['id'] == tableId);
    if (idx < 0) return; // Table not in current view, ignore

    _tables[idx] = {..._tables[idx], 'status': newStatus};
    _recalculateSummary();
    notifyListeners();
  }

  /// Recalculate summary counts from current table list.
  void _recalculateSummary() {
    _summary = {
      'total': _tables.length,
      'free': _tables.where((t) => t['status'] == 'FREE').length,
      'occupied': _tables.where((t) => t['status'] == 'OCCUPIED').length,
      'reserved': _tables.where((t) => t['status'] == 'RESERVED').length,
      'cleaning': _tables.where((t) => t['status'] == 'CLEANING').length,
      'orderReady': _tables.where((t) => t['status'] == 'ORDER_READY').length,
      'billing': _tables.where((t) => t['status'] == 'BILLING').length,
    };
  }

  Future<void> loadFloorPlan({String? branchId}) async {
    _isLoading = true;
    notifyListeners();

    try {
      _currentBranchId = branchId ?? _currentBranchId ?? _api.branchId;
      final result = await _api.getFloorPlan(branchId: _currentBranchId);
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
      // WebSocket event will trigger incremental update via _listenToEvents
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Merge multiple tables into one. Creates a combined table and
  /// deactivates the source tables.
  Future<void> mergeTables(List<String> tableIds, {String? name, int? capacity}) async {
    try {
      await _api.mergeTables(tableIds, name: name, capacity: capacity);
      // WebSocket event will trigger full refresh via _listenToEvents
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Split a merged table back into individual tables.
  Future<void> splitTable(String tableId) async {
    try {
      await _api.splitTable(tableId);
      // WebSocket event will trigger full refresh via _listenToEvents
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Batch update status for multiple tables.
  Future<void> batchUpdateStatus(List<String> tableIds, String status) async {
    try {
      await _api.batchUpdateTableStatus(tableIds, status);
      // Each table status change will trigger incremental updates
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

  /// Get tables grouped by section (indoor, outdoor, patio, etc).
  Map<String, List<Map<String, dynamic>>> get tablesBySection {
    final grouped = <String, List<Map<String, dynamic>>>{};
    for (final table in _tables) {
      final section = (table['section'] as String?) ?? 'Main';
      grouped.putIfAbsent(section, () => []).add(table);
    }
    return grouped;
  }

  /// Get free tables suitable for a given party size.
  List<Map<String, dynamic>> findAvailableTables(int partySize) {
    return _tables.where((t) =>
      t['status'] == 'FREE' &&
      (t['capacity'] as int? ?? 0) >= partySize
    ).toList()
      ..sort((a, b) => (a['capacity'] as int).compareTo(b['capacity'] as int));
  }

  @override
  void dispose() {
    _statusSub?.cancel();
    _mergedSub?.cancel();
    _splitSub?.cancel();
    super.dispose();
  }
}
