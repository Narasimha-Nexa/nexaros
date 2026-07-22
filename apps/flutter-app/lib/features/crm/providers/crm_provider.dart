import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/event_bus.dart';

/// Central provider for the CRM module — manages customers, loyalty,
/// wallet, reviews, and feedback with real-time WebSocket sync via EventBus.
class CrmProvider extends ChangeNotifier {
  final ApiClient _api;
  final EventBus _eventBus;

  // Customers
  List<Map<String, dynamic>> _customers = [];
  Map<String, dynamic>? _selectedCustomer;
  int _customerTotal = 0;
  int _customerPage = 1;
  bool _customersLoading = false;
  String? _customerError;

  // Loyalty
  Map<String, dynamic> _loyaltySummary = {};
  List<Map<String, dynamic>> _tiers = [];
  bool _loyaltyLoading = false;

  // Reviews
  List<Map<String, dynamic>> _reviews = [];
  int _reviewTotal = 0;
  bool _reviewsLoading = false;

  // Feedback
  List<Map<String, dynamic>> _feedback = [];
  bool _feedbackLoading = false;

  // Subscriptions
  StreamSubscription<BusEvent>? _customerCreatedSub;
  StreamSubscription<BusEvent>? _customerUpdatedSub;
  StreamSubscription<BusEvent>? _loyaltyUpdatedSub;
  StreamSubscription<BusEvent>? _walletUpdatedSub;

  CrmProvider(this._api, this._eventBus) {
    _listenToEvents();
  }

  // ── Getters ──

  List<Map<String, dynamic>> get customers => _customers;
  Map<String, dynamic>? get selectedCustomer => _selectedCustomer;
  int get customerTotal => _customerTotal;
  int get customerPage => _customerPage;
  bool get customersLoading => _customersLoading;
  String? get customerError => _customerError;

  Map<String, dynamic> get loyaltySummary => _loyaltySummary;
  List<Map<String, dynamic>> get tiers => _tiers;
  bool get loyaltyLoading => _loyaltyLoading;

  List<Map<String, dynamic>> get reviews => _reviews;
  int get reviewTotal => _reviewTotal;
  bool get reviewsLoading => _reviewsLoading;

  List<Map<String, dynamic>> get feedback => _feedback;
  bool get feedbackLoading => _feedbackLoading;

  // ── EventBus ──

  void _listenToEvents() {
    _customerCreatedSub = _eventBus.listen(BusEventType.customerCreated, (_) => loadCustomers());
    _customerUpdatedSub = _eventBus.listen(BusEventType.customerUpdated, (_) => loadCustomers());
    _loyaltyUpdatedSub = _eventBus.listen(BusEventType.loyaltyUpdated, (_) { loadCustomers(); loadLoyaltySummary(); });
    _walletUpdatedSub = _eventBus.listen(BusEventType.walletUpdated, (_) { loadCustomers(); });
  }

  // ── Customers ──

  Future<void> loadCustomers({String? search, bool refresh = false}) async {
    if (refresh) _customerPage = 1;
    _customersLoading = true;
    notifyListeners();
    try {
      final result = await _api.getCustomers(search: search, page: _customerPage);
      final list = (result['customers'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
      if (_customerPage == 1) {
        _customers = list;
      } else {
        _customers.addAll(list);
      }
      _customerTotal = result['total'] as int? ?? 0;
      _customerError = null;
    } catch (e) { _customerError = e.toString(); }
    _customersLoading = false;
    notifyListeners();
  }

  Future<void> loadNextCustomers({String? search}) async {
    _customerPage++;
    await loadCustomers(search: search);
  }

  Future<void> selectCustomer(String id) async {
    try {
      _selectedCustomer = await _api.getCustomer(id);
      notifyListeners();
    } catch (e) { _customerError = e.toString(); notifyListeners(); }
  }

  Future<void> createCustomer(Map<String, dynamic> data) async {
    await _api.createCustomer(data);
    await loadCustomers();
  }

  Future<void> updateCustomer(String id, Map<String, dynamic> data) async {
    await _api.updateCustomer(id, data);
    await selectCustomer(id);
    await loadCustomers();
  }

  Future<void> deleteCustomer(String id) async {
    await _api.deleteCustomer(id);
    _selectedCustomer = null;
    await loadCustomers();
  }

  // ── Loyalty ──

  Future<void> loadLoyaltySummary() async {
    _loyaltyLoading = true;
    notifyListeners();
    try {
      _loyaltySummary = await _api.getLoyaltySummary();
      final raw = await _api.getMembershipTiers();
      _tiers = raw.cast<Map<String, dynamic>>();
    } catch (_) {}
    _loyaltyLoading = false;
    notifyListeners();
  }

  Future<void> adjustPoints(String customerId, int points, String description) async {
    await _api.adjustLoyaltyPoints(customerId, points, description);
    if (_selectedCustomer?['id'] == customerId) await selectCustomer(customerId);
    await loadLoyaltySummary();
  }

  Future<void> createTier(Map<String, dynamic> data) async {
    await _api.createMembershipTier(data);
    await loadLoyaltySummary();
  }

  Future<void> updateTier(String id, Map<String, dynamic> data) async {
    await _api.updateMembershipTier(id, data);
    await loadLoyaltySummary();
  }

  // ── Reviews ──

  Future<void> loadReviews({int? page, int? rating, bool? published}) async {
    _reviewsLoading = true;
    notifyListeners();
    try {
      final result = await _api.getReviews(page: page, rating: rating, published: published);
      _reviews = (result['reviews'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
      _reviewTotal = result['total'] as int? ?? 0;
    } catch (_) {}
    _reviewsLoading = false;
    notifyListeners();
  }

  Future<void> replyToReview(String id, String reply) async {
    await _api.replyToReview(id, reply);
    await loadReviews();
  }

  Future<void> toggleReviewPublish(String id) async {
    await _api.toggleReviewPublish(id);
    await loadReviews();
  }

  // ── Feedback ──

  Future<void> loadFeedback({int? page, bool? resolved}) async {
    _feedbackLoading = true;
    notifyListeners();
    try {
      final result = await _api.getFeedback(page: page, resolved: resolved);
      _feedback = (result['feedback'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
    } catch (_) {}
    _feedbackLoading = false;
    notifyListeners();
  }

  Future<void> resolveFeedback(String id) async {
    await _api.resolveFeedback(id);
    await loadFeedback();
  }

  @override
  void dispose() {
    _customerCreatedSub?.cancel();
    _customerUpdatedSub?.cancel();
    _loyaltyUpdatedSub?.cancel();
    _walletUpdatedSub?.cancel();
    super.dispose();
  }
}
