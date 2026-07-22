import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/network/api_client.dart';
import 'subscription_models.dart';

class SubscriptionService {
  final ApiClient _api;

  SubscriptionService(this._api);

  Future<List<SubscriptionPlan>> getAvailablePlans() async {
    try {
      final response = await _api.requestWithRetry(() async {
        final h = await _api.headers;
        return http.get(Uri.parse('${_api.baseUrl}/entitlements/plans'), headers: h);
      });
      final plans = response is List ? response : (response['plans'] ?? []);
      return (plans as List<dynamic>).map((p) => SubscriptionPlan.fromJson(p as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<SubscriptionRecord?> getActiveSubscription() async {
    try {
      final tenantId = _api.tenantId;
      if (tenantId == null) return null;
      final response = await _api.requestWithRetry(() async {
        final h = await _api.headers;
        return http.get(Uri.parse('${_api.baseUrl}/billing/entitlements/$tenantId'), headers: h);
      });
      if (response == null) return null;
      return SubscriptionRecord.fromJson(response);
    } catch (_) {
      return null;
    }
  }

  Future<List<SubscriptionRecord>> getSubscriptions() async {
    try {
      final response = await _api.requestWithRetry(() async {
        final h = await _api.headers;
        return http.get(Uri.parse('${_api.baseUrl}/subscriptions'), headers: h);
      });
      final data = response is List ? response : (response['data'] ?? []);
      return (data as List<dynamic>).map((s) => SubscriptionRecord.fromJson(s as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<SubscriptionRecord?> getSubscriptionDetail(String id) async {
    try {
      final response = await _api.requestWithRetry(() async {
        final h = await _api.headers;
        return http.get(Uri.parse('${_api.baseUrl}/subscriptions/$id'), headers: h);
      });
      return SubscriptionRecord.fromJson(response);
    } catch (_) {
      return null;
    }
  }

  Future<SubscriptionRecord?> createSubscription(String planId, {String? couponCode}) async {
    try {
      final tenantId = _api.tenantId;
      if (tenantId == null) return null;
      final body = <String, dynamic>{'tenantId': tenantId, 'planId': planId};
      if (couponCode != null) body['couponCode'] = couponCode;
      final response = await _api.requestWithRetry(() async {
        final h = await _api.headers;
        return http.post(Uri.parse('${_api.baseUrl}/subscriptions'), headers: h, body: jsonEncode(body));
      });
      return SubscriptionRecord.fromJson(response);
    } catch (_) {
      return null;
    }
  }

  Future<bool> cancelSubscription(String id) async {
    try {
      await _api.requestWithRetry(() async {
        final h = await _api.headers;
        return http.delete(Uri.parse('${_api.baseUrl}/subscriptions/$id'), headers: h);
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> upgradePlan(String subscriptionId, String newPlanId) async {
    try {
      await _api.requestWithRetry(() async {
        final h = await _api.headers;
        return http.patch(Uri.parse('${_api.baseUrl}/subscriptions/$subscriptionId'), headers: h, body: jsonEncode({'planId': newPlanId}));
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<CouponValidation?> validateCoupon(String code) async {
    try {
      final tenantId = _api.branchId ?? '';
      final response = await _api.requestWithRetry(() async {
        return http.post(
          Uri.parse('${_api.baseUrl}/coupons/validate'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'code': code, 'tenantId': tenantId}),
        );
      });
      return CouponValidation.fromJson(response);
    } catch (_) {
      return null;
    }
  }

  Future<bool> createPaymentPromise(String reason, String expectedDate) async {
    try {
      final tenantId = _api.branchId ?? '';
      if (tenantId.isEmpty) return false;
      await _api.requestWithRetry(() async {
        final h = await _api.headers;
        return http.post(Uri.parse('${_api.baseUrl}/billing/payment-promise'), headers: h, body: jsonEncode({
          'tenantId': tenantId, 'reason': reason, 'expectedDate': expectedDate,
        }));
      });
      return true;
    } catch (_) {
      return false;
    }
  }
}
