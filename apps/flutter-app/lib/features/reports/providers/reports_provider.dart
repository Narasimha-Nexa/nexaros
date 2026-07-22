import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';

class ReportsProvider extends ChangeNotifier {
  final ApiClient _api;

  Map<String, dynamic> _dailySales = {};
  Map<String, dynamic> _revenue = {};
  Map<String, dynamic> _items = {};
  Map<String, dynamic> _peakHours = {};

  bool _dailySalesLoading = false;
  bool _revenueLoading = false;
  bool _itemsLoading = false;
  bool _peakHoursLoading = false;

  ReportsProvider(this._api);

  Map<String, dynamic> get dailySales => _dailySales;
  Map<String, dynamic> get revenue => _revenue;
  Map<String, dynamic> get items => _items;
  Map<String, dynamic> get peakHours => _peakHours;

  bool get dailySalesLoading => _dailySalesLoading;
  bool get revenueLoading => _revenueLoading;
  bool get itemsLoading => _itemsLoading;
  bool get peakHoursLoading => _peakHoursLoading;

  Future<void> loadDailySales(String startDate, String endDate, {String? branchId}) async {
    _dailySalesLoading = true;
    notifyListeners();
    try {
      _dailySales = await _api.getSalesAnalytics(
        startDate: startDate,
        endDate: endDate,
        branchId: branchId,
      );
    } catch (_) {}
    _dailySalesLoading = false;
    notifyListeners();
  }

  Future<void> loadRevenue(String startDate, String endDate, {String? branchId}) async {
    _revenueLoading = true;
    notifyListeners();
    try {
      _revenue = await _api.getReport('revenue', startDate, endDate, branchId: branchId);
    } catch (_) {}
    _revenueLoading = false;
    notifyListeners();
  }

  Future<void> loadItemPerformance(String startDate, String endDate, {String? branchId}) async {
    _itemsLoading = true;
    notifyListeners();
    try {
      _items = await _api.getReport('item-performance', startDate, endDate, branchId: branchId);
    } catch (_) {}
    _itemsLoading = false;
    notifyListeners();
  }

  Future<void> loadPeakHours(String startDate, String endDate, {String? branchId}) async {
    _peakHoursLoading = true;
    notifyListeners();
    try {
      _peakHours = await _api.getReport('peak-hours', startDate, endDate, branchId: branchId);
    } catch (_) {}
    _peakHoursLoading = false;
    notifyListeners();
  }
}
