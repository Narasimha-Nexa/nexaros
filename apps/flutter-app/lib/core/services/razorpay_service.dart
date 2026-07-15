import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

class RazorpayService {
  late final Razorpay _razorpay;
  final Dio _dio;
  final String _keyId;

  RazorpayService({required String keyId, String baseUrl = 'http://localhost:4000/api/v1'})
      : _keyId = keyId,
        _dio = Dio(BaseOptions(baseUrl: baseUrl, connectTimeout: const Duration(seconds: 30), receiveTimeout: const Duration(seconds: 30))) {
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  Completer<PaymentSuccessResponse?>? _paymentCompleter;

  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    debugPrint('Razorpay payment success: ${response.paymentId}');
    _paymentCompleter?.complete(response);
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    debugPrint('Razorpay payment error: ${response.code} - ${response.message}');
    _paymentCompleter?.completeError(Exception(response.message ?? 'Payment failed'));
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    debugPrint('Razorpay external wallet: ${response.walletName}');
    _paymentCompleter?.complete(null);
  }

  Future<PaymentSuccessResponse?> openCheckout({
    required double amount,
    String currency = 'INR',
    required String name,
    String? description,
    String? orderId,
    String? prefillName,
    String? prefillEmail,
    String? prefillContact,
  }) async {
    _paymentCompleter = Completer();

    final options = {
      'key': _keyId,
      'amount': (amount * 100).toInt(),
      'currency': currency,
      'name': name,
      'description': description ?? 'Payment',
      'order_id': orderId,
      'prefill': {
        'name': prefillName ?? '',
        'email': prefillEmail ?? '',
        'contact': prefillContact ?? '',
      },
      'theme': {'color': '#2563eb'},
    };

    try {
      _razorpay.open(options);
      return await _paymentCompleter!.future;
    } catch (e) {
      debugPrint('Error opening Razorpay: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> checkoutAndVerify({
    required String tenantId,
    required String planId,
    String? couponCode,
    String? prefillName,
    String? prefillEmail,
    String? prefillContact,
  }) async {
    try {
      final checkoutRes = await _post('/billing/checkout', {
        'tenantId': tenantId,
        'planId': planId,
        'couponCode': couponCode,
      });

      if (checkoutRes == null) return null;

      final amount = (checkoutRes['amount'] as num).toDouble();
      final razorpayOrderId = checkoutRes['orderId'] as String?;
      final planSlug = checkoutRes['planSlug'] as String?;

      if (amount == 0) {
        final verifyRes = await _post('/billing/verify', {
          'razorpayOrderId': 'free_trial',
          'razorpayPaymentId': 'free_trial',
          'razorpaySignature': 'free_trial',
          'planId': planId,
          'couponCode': couponCode,
        });
        return verifyRes != null ? {'success': true, 'freeTrial': true} : null;
      }

      final paymentResponse = await openCheckout(
        amount: amount,
        name: 'NexaROS',
        description: 'Subscription — $planSlug',
        orderId: razorpayOrderId,
        prefillName: prefillName,
        prefillEmail: prefillEmail,
        prefillContact: prefillContact,
      );

      if (paymentResponse == null) return null;

      final verifyRes = await _post('/billing/verify', {
        'razorpayOrderId': paymentResponse.orderId,
        'razorpayPaymentId': paymentResponse.paymentId,
        'razorpaySignature': paymentResponse.signature,
        'planId': planId,
        'couponCode': couponCode,
      });

      return verifyRes != null ? {'success': true, 'orderId': paymentResponse.orderId} : null;
    } catch (e) {
      debugPrint('Checkout and verify error: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> _post(String path, Map<String, dynamic> body) async {
    try {
      final response = await _dio.post(path, data: body);
      if (response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300) {
        return Map<String, dynamic>.from(response.data as Map);
      }
      return null;
    } on DioException catch (e) {
      debugPrint('Dio POST error [$path]: ${e.message}');
      return null;
    }
  }

  void dispose() {
    _razorpay.clear();
  }
}
