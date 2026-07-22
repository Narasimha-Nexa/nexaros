import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';

class AnalyticsProvider extends ChangeNotifier {
  final ApiClient _api;

  AnalyticsProvider(this._api);

  // ─── Shared State ───
  bool _loading = false;
  String? _error;

  bool get loading => _loading;
  String? get error => _error;

  // ─── Sales Analytics ───
  Map<String, dynamic>? _sales;
  Map<String, dynamic>? _revenue;
  Map<String, dynamic>? _items;
  dynamic _peakHours;

  Map<String, dynamic>? get sales => _sales;
  Map<String, dynamic>? get revenue => _revenue;
  Map<String, dynamic>? get items => _items;
  dynamic get peakHours => _peakHours;

  // ─── Customer Analytics ───
  Map<String, dynamic>? _customers;

  Map<String, dynamic>? get customers => _customers;

  // ─── Inventory Analytics ───
  Map<String, dynamic>? _inventory;

  Map<String, dynamic>? get inventory => _inventory;

  // ─── Staff Analytics ───
  dynamic _staff;

  dynamic get staff => _staff;

  // ─── Kitchen Analytics ───
  Map<String, dynamic>? _kitchen;

  Map<String, dynamic>? get kitchen => _kitchen;

  // ─── Delivery Analytics ───
  Map<String, dynamic>? _delivery;

  Map<String, dynamic>? get delivery => _delivery;

  // ─── Load Methods ───

  Future<void> loadSalesAnalytics({String? startDate, String? endDate, String? branchId}) async {
    _loading = true; _error = null; notifyListeners();
    try {
      final results = await Future.wait([
        _api.getSalesAnalytics(startDate: startDate, endDate: endDate, branchId: branchId),
        _api.getReport('revenue', startDate ?? '', endDate ?? ''),
        _api.getReport('items', startDate ?? '', endDate ?? ''),
        _api.getReport('peak-hours', startDate ?? '', endDate ?? ''),
      ]);
      _sales = results[0] as Map<String, dynamic>?;
      _revenue = results[1] as Map<String, dynamic>?;
      _items = results[2] as Map<String, dynamic>?;
      _peakHours = results[3];
    } catch (e) {
      _error = e.toString();
    }
    _loading = false; notifyListeners();
  }

  Future<void> loadCustomerAnalytics({String? startDate, String? endDate, String? branchId}) async {
    _loading = true; _error = null; notifyListeners();
    try {
      _customers = await _api.getCustomerAnalytics(startDate: startDate, endDate: endDate, branchId: branchId);
    } catch (e) {
      _error = e.toString();
    }
    _loading = false; notifyListeners();
  }

  Future<void> loadInventoryAnalytics({String? startDate, String? endDate, String? branchId}) async {
    _loading = true; _error = null; notifyListeners();
    try {
      _inventory = await _api.getInventoryAnalytics(startDate: startDate, endDate: endDate, branchId: branchId);
    } catch (e) {
      _error = e.toString();
    }
    _loading = false; notifyListeners();
  }

  Future<void> loadStaffAnalytics({String? startDate, String? endDate, String? branchId}) async {
    _loading = true; _error = null; notifyListeners();
    try {
      _staff = await _api.getStaffAnalytics(startDate: startDate, endDate: endDate, branchId: branchId);
    } catch (e) {
      _error = e.toString();
    }
    _loading = false; notifyListeners();
  }

  Future<void> loadKitchenAnalytics({String? startDate, String? endDate, String? branchId}) async {
    _loading = true; _error = null; notifyListeners();
    try {
      _kitchen = await _api.getKitchenAnalytics(startDate: startDate, endDate: endDate, branchId: branchId);
    } catch (e) {
      _error = e.toString();
    }
    _loading = false; notifyListeners();
  }

  Future<void> loadDeliveryAnalytics({String? startDate, String? endDate, String? branchId}) async {
    _loading = true; _error = null; notifyListeners();
    try {
      _delivery = await _api.getDeliveryAnalytics(startDate: startDate, endDate: endDate, branchId: branchId);
    } catch (e) {
      _error = e.toString();
    }
    _loading = false; notifyListeners();
  }
}
