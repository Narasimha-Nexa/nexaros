import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';

/// Manages state for coupons, offers, combos, and order-level discounts.
class OffersProvider extends ChangeNotifier {
  final ApiClient _api;

  // Coupons
  List<Map<String, dynamic>> _coupons = [];
  bool _couponsLoading = false;
  String? _couponsError;
  Map<String, dynamic>? _selectedCoupon;
  Map<String, dynamic>? _couponStats;

  // Combos
  List<Map<String, dynamic>> _combos = [];
  bool _combosLoading = false;
  String? _combosError;

  // Order discount state
  Map<String, dynamic>? _validatedDiscount;
  String? _discountError;

  OffersProvider(this._api);

  // Getters
  List<Map<String, dynamic>> get coupons => _coupons;
  bool get couponsLoading => _couponsLoading;
  String? get couponsError => _couponsError;
  Map<String, dynamic>? get selectedCoupon => _selectedCoupon;
  Map<String, dynamic>? get couponStats => _couponStats;

  List<Map<String, dynamic>> get combos => _combos;
  bool get combosLoading => _combosLoading;
  String? get combosError => _combosError;

  Map<String, dynamic>? get validatedDiscount => _validatedDiscount;
  String? get discountError => _discountError;

  // ─── Coupons ───

  Future<void> loadCoupons() async {
    _couponsLoading = true;
    _couponsError = null;
    notifyListeners();
    try {
      final coupons = await _api.getCoupons();
      _coupons = coupons.cast<Map<String, dynamic>>();
    } catch (e) {
      _couponsError = e.toString();
      _coupons = [];
    }
    _couponsLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> createCoupon(Map<String, dynamic> data) async {
    try {
      final result = await _api.createCoupon(data);
      await loadCoupons();
      return result;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> updateCoupon(String id, Map<String, dynamic> data) async {
    try {
      final result = await _api.updateCoupon(id, data);
      await loadCoupons();
      return result;
    } catch (e) {
      return null;
    }
  }

  Future<bool> deleteCoupon(String id) async {
    try {
      await _api.deleteCoupon(id);
      await loadCoupons();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> loadCouponStats(String id) async {
    try {
      _couponStats = await _api.getCouponStats(id);
      notifyListeners();
    } catch (_) {
      _couponStats = null;
    }
  }

  void selectCoupon(Map<String, dynamic>? coupon) {
    _selectedCoupon = coupon;
    notifyListeners();
  }

  // ─── Combos ───

  Future<void> loadCombos() async {
    _combosLoading = true;
    _combosError = null;
    notifyListeners();
    try {
      final combos = await _api.getCombos();
      _combos = combos.cast<Map<String, dynamic>>();
    } catch (e) {
      _combosError = e.toString();
      _combos = [];
    }
    _combosLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> createCombo(Map<String, dynamic> data) async {
    try {
      final result = await _api.createCombo(data);
      await loadCombos();
      return result;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> updateCombo(String id, Map<String, dynamic> data) async {
    try {
      final result = await _api.updateCombo(id, data);
      await loadCombos();
      return result;
    } catch (e) {
      return null;
    }
  }

  Future<bool> deleteCombo(String id) async {
    try {
      await _api.deleteCombo(id);
      await loadCombos();
      return true;
    } catch (_) {
      return false;
    }
  }

  // ─── Discount Validation ───

  Future<bool> validateCoupon(String code, {double? orderAmount, String? tenantId}) async {
    _discountError = null;
    try {
      _validatedDiscount = await _api.validateOrderCoupon(
        code,
        tenantId: tenantId,
        orderAmount: orderAmount,
      );
      notifyListeners();
      return _validatedDiscount?['valid'] == true;
    } catch (e) {
      _discountError = e.toString().replaceAll('Exception: ', '');
      _validatedDiscount = null;
      notifyListeners();
      return false;
    }
  }

  void clearDiscount() {
    _validatedDiscount = null;
    _discountError = null;
    notifyListeners();
  }

  /// Calculate discount amount for a given order total based on the validated coupon
  double calculateDiscount(double orderTotal) {
    if (_validatedDiscount == null) return 0;
    final type = _validatedDiscount!['type'];
    final value = double.tryParse(_validatedDiscount!['value']?.toString() ?? '0') ?? 0;
    final maxDiscount = double.tryParse(_validatedDiscount!['maxDiscount']?.toString() ?? '0') ?? 0;

    if (type == 'PERCENTAGE') {
      final calculated = orderTotal * value / 100;
      if (maxDiscount > 0 && calculated > maxDiscount) return maxDiscount;
      return calculated;
    }
    // FIXED_AMOUNT
    return value > orderTotal ? orderTotal : value;
  }
}
