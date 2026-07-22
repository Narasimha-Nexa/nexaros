import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/event_bus.dart';

/// Manages payment state with real-time WebSocket updates
/// for payment:received and payment:refunded events.
class PaymentsProvider extends ChangeNotifier {
  final ApiClient _api;
  final EventBus _eventBus;
  List<Map<String, dynamic>> _payments = [];
  Map<String, dynamic>? _currentPayment;
  bool _isLoading = false;
  String? _error;
  StreamSubscription<BusEvent>? _receivedSub;
  StreamSubscription<BusEvent>? _refundedSub;

  PaymentsProvider(this._api, this._eventBus) {
    _listenToEvents();
  }

  List<Map<String, dynamic>> get payments => _payments;
  Map<String, dynamic>? get currentPayment => _currentPayment;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Subscribe to WebSocket events for real-time payment updates.
  void _listenToEvents() {
    _receivedSub = _eventBus.listen(BusEventType.paymentReceived, (_) {
      loadPayments();
    });

    _refundedSub = _eventBus.listen(BusEventType.paymentRefunded, (_) {
      loadPayments();
    });
  }

  Future<void> loadPayments({String? branchId}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final params = <String, String>{};
      if (branchId != null) params['branchId'] = branchId;
      final rawPayments = await _api.getPayments(branchId: branchId);
      _payments = rawPayments.cast<Map<String, dynamic>>();
      _error = null;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> processPayment(
    String orderId, {
    required String method,
    required double amount,
    String? reference,
  }) async {
    try {
      _currentPayment = await _api.processPayment(
        orderId,
        method: method,
        amount: amount,
        reference: reference,
      );
      // WebSocket event will trigger refresh via _listenToEvents
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> generateInvoice(String paymentId) async {
    try {
      final invoice = await _api.generateInvoice(paymentId);
      return invoice;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  @override
  void dispose() {
    _receivedSub?.cancel();
    _refundedSub?.cancel();
    super.dispose();
  }
}
