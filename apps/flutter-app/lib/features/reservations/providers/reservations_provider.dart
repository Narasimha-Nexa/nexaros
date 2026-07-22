import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/event_bus.dart';

/// Manages reservation state with real-time WebSocket updates
/// for reservation:created, reservation:updated, reservation:deleted events.
class ReservationsProvider extends ChangeNotifier {
  final ApiClient _api;
  final EventBus _eventBus;
  List<Map<String, dynamic>> _reservations = [];
  bool _isLoading = false;
  String? _error;
  StreamSubscription<BusEvent>? _createdSub;
  StreamSubscription<BusEvent>? _updatedSub;
  StreamSubscription<BusEvent>? _deletedSub;

  ReservationsProvider(this._api, this._eventBus) {
    _listenToEvents();
  }

  List<Map<String, dynamic>> get reservations => _reservations;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Subscribe to WebSocket events for real-time reservation updates.
  void _listenToEvents() {
    _createdSub = _eventBus.listen(BusEventType.reservationCreated, (_) {
      loadReservations();
    });

    _updatedSub = _eventBus.listen(BusEventType.reservationUpdated, (_) {
      loadReservations();
    });

    _deletedSub = _eventBus.listen(BusEventType.reservationDeleted, (_) {
      loadReservations();
    });
  }

  Future<void> loadReservations({String? date, String? status, String? branchId}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final params = <String, String>{};
      if (date != null) params['date'] = date;
      if (status != null) params['status'] = status;
      if (branchId != null) params['branchId'] = branchId;
      // Use the API client to fetch reservations
      final rawReservations = await _api.getReservations(
        date: date,
        status: status,
        branchId: branchId,
      );
      _reservations = rawReservations.cast<Map<String, dynamic>>();
      _error = null;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> updateStatus(String reservationId, String status) async {
    try {
      await _api.updateReservation(reservationId, {'status': status});
      // WebSocket event will trigger refresh via _listenToEvents
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _createdSub?.cancel();
    _updatedSub?.cancel();
    _deletedSub?.cancel();
    super.dispose();
  }
}
