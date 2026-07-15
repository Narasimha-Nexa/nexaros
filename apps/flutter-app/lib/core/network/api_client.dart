import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String _baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:4000/api/v1');
  /// Root server URL (without /api path) for WebSocket connections
  static const String serverUrl = String.fromEnvironment('SERVER_URL', defaultValue: 'http://localhost:4000');
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  String? _accessToken;
  String? _branchId;

  String get baseUrl => _baseUrl;
  String get socketUrl => serverUrl;
  String? get accessToken => _accessToken;
  String? get branchId => _branchId;

  void setBranchId(String branchId) {
    _branchId = branchId;
  }

  Future<Map<String, String>> get _headers async {
    _accessToken ??= await _storage.read(key: 'access_token');
    return {
      'Content-Type': 'application/json',
      if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
    };
  }

  // ─── Auth ───

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = _handleResponse(response);
    await _storeTokens(data['accessToken'], data['refreshToken']);
    return data;
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phone,
    required String restaurantName,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'phone': phone,
        'restaurantName': restaurantName,
      }),
    );
    final data = _handleResponse(response);
    await _storeTokens(data['accessToken'], data['refreshToken']);
    return data;
  }

  Future<void> refreshAccessToken() async {
    final rt = await _storage.read(key: 'refresh_token');
    if (rt == null) throw Exception('No refresh token');
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/refresh'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refreshToken': rt}),
    );
    final data = _handleResponse(response);
    await _storeTokens(data['accessToken'], data['refreshToken']);
  }

  Future<void> logout() async {
    final rt = await _storage.read(key: 'refresh_token');
    if (rt != null) {
      try {
        await http.post(
          Uri.parse('$_baseUrl/auth/logout'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'refreshToken': rt}),
        );
      } catch (_) {}
    }
    _accessToken = null;
    await _storage.deleteAll();
  }

  Future<Map<String, dynamic>> getProfile() async {
    final response = await _authedGet('$_baseUrl/auth/profile');
    return _handleResponse(response);
  }

  // ─── Password Reset ───

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/forgot-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> resetPassword(String token, String newPassword) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/reset-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'token': token, 'newPassword': newPassword}),
    );
    return _handleResponse(response);
  }

  // ─── Branches ───

  Future<List<dynamic>> getBranches() async {
    final response = await _authedGet('$_baseUrl/branches');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getBranch(String id) async {
    final response = await _authedGet('$_baseUrl/branches/$id');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> createBranch(Map<String, dynamic> data) async {
    final response = await _authedPost('$_baseUrl/branches', data);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> updateBranch(String id, Map<String, dynamic> data) async {
    final response = await _authedPatch('$_baseUrl/branches/$id', data);
    return _handleResponse(response);
  }

  Future<void> deleteBranch(String id) async {
    final response = await _authedDelete('$_baseUrl/branches/$id');
    _handleResponse(response);
  }

  // ─── Menu ───

  Future<List<dynamic>> getCategories() async {
    final response = await _authedGet('$_baseUrl/menu/categories');
    return _handleResponse(response);
  }

  Future<List<dynamic>> getMenuItems({String? categoryId, String? search, int? page, int? limit}) async {
    final params = <String, String>{};
    if (categoryId != null) params['categoryId'] = categoryId;
    if (search != null) params['search'] = search;
    if (page != null) params['page'] = page.toString();
    if (limit != null) params['limit'] = limit.toString();
    final uri = Uri.parse('$_baseUrl/menu/items').replace(queryParameters: params);
    final response = await _authedGet(uri.toString());
    final data = _handleResponse(response);
    // Paginated response: { items: [...], total, skip, take }
    if (data is Map && data.containsKey('items')) return List<dynamic>.from(data['items']);
    return List<dynamic>.from(data);
  }

  Future<Map<String, dynamic>> createMenuItem(Map<String, dynamic> data) async {
    final response = await _authedPost('$_baseUrl/menu/items', data);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> updateMenuItem(String id, Map<String, dynamic> data) async {
    final response = await _authedPatch('$_baseUrl/menu/items/$id', data);
    return _handleResponse(response);
  }

  Future<void> toggleAvailability(String id) async {
    final response = await _authedPatch('$_baseUrl/menu/items/$id/availability', {});
    _handleResponse(response);
  }

  Future<void> deleteMenuItem(String id) async {
    final response = await _authedDelete('$_baseUrl/menu/items/$id');
    _handleResponse(response);
  }

  // ─── Image Upload ───

  Future<List<dynamic>> uploadMenuImages(String itemId, List<String> filePaths) async {
    final uri = Uri.parse('$_baseUrl/menu/items/$itemId/images');
    final request = http.MultipartRequest('POST', uri);
    final headers = await _headers;
    request.headers['Authorization'] = headers['Authorization'] ?? '';
    for (final path in filePaths) {
      request.files.add(await http.MultipartFile.fromPath('images', path));
    }
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    return _handleResponse(response);
  }

  Future<void> deleteMenuItemImage(String itemId, String imageId) async {
    final response = await _authedDelete('$_baseUrl/menu/items/$itemId/images/$imageId');
    _handleResponse(response);
  }

  // ─── Orders ───

  Future<List<dynamic>> getOrders({String? status, String? branchId, int? limit, int? page}) async {
    final effectiveBranchId = branchId ?? _branchId;
    final params = <String, String>{};
    if (status != null) params['status'] = status;
    if (effectiveBranchId != null) params['branchId'] = effectiveBranchId;
    if (limit != null) params['limit'] = limit.toString();
    if (page != null) params['page'] = page.toString();
    final uri = Uri.parse('$_baseUrl/orders').replace(queryParameters: params);
    final response = await _authedGet(uri.toString());
    final data = _handleResponse(response);
    // Paginated response: { orders: [...], total, skip, take }
    if (data is Map && data.containsKey('orders')) return List<dynamic>.from(data['orders']);
    return List<dynamic>.from(data);
  }

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> data) async {
    final branchId = data['branchId'] as String? ?? '';
    final uri = Uri.parse('$_baseUrl/orders').replace(queryParameters: {'branchId': branchId});
    final response = await _authedPost(uri.toString(), data);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getOrder(String id) async {
    final response = await _authedGet('$_baseUrl/orders/$id');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> updateOrderStatus(String id, String status, {String? notes}) async {
    final data = <String, dynamic>{'status': status};
    if (notes != null) data['notes'] = notes;
    final response = await _authedPatch('$_baseUrl/orders/$id/status', data);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> addItemToOrder(String orderId, Map<String, dynamic> data) async {
    final response = await _authedPost('$_baseUrl/orders/$orderId/items', data);
    return _handleResponse(response);
  }

  Future<void> removeItemFromOrder(String orderId, String itemId) async {
    final response = await _authedDelete('$_baseUrl/orders/$orderId/items/$itemId');
    _handleResponse(response);
  }

  Future<void> printKot(String orderId) async {
    final response = await _authedPost('$_baseUrl/orders/$orderId/kot', {});
    _handleResponse(response);
  }

  Future<void> cancelOrder(String orderId) async {
    final response = await _authedPost('$_baseUrl/orders/$orderId/cancel', {});
    _handleResponse(response);
  }

  // ─── Tables ───

  Future<List<dynamic>> getTables({String? branchId}) async {
    final params = <String, String>{};
    if (branchId != null) params['branchId'] = branchId;
    final uri = Uri.parse('$_baseUrl/tables').replace(queryParameters: params);
    final response = await _authedGet(uri.toString());
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getTable(String id) async {
    final response = await _authedGet('$_baseUrl/tables/$id');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> updateTable(String id, Map<String, dynamic> data) async {
    final response = await _authedPatch('$_baseUrl/tables/$id', data);
    return _handleResponse(response);
  }

  Future<void> updateTableStatus(String id, String status) async {
    final response = await _authedPatch('$_baseUrl/tables/$id/status', {'status': status});
    _handleResponse(response);
  }

  Future<Map<String, dynamic>> getFloorPlan({String? branchId}) async {
    final params = <String, String>{};
    if (branchId != null) params['branchId'] = branchId;
    final uri = Uri.parse('$_baseUrl/tables/floor-plan').replace(queryParameters: params);
    final response = await _authedGet(uri.toString());
    return _handleResponse(response);
  }

  // ─── Payments ───

  Future<Map<String, dynamic>> processPayment(String orderId, {required String method, required double amount, String? reference}) async {
    final data = <String, dynamic>{
      'method': method,
      'amount': amount,
    };
    if (reference != null) data['reference'] = reference;
    final response = await _authedPost('$_baseUrl/payments/orders/$orderId', data);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getOrderPayments(String orderId) async {
    final response = await _authedGet('$_baseUrl/payments/orders/$orderId');
    return _handleResponse(response);
  }

  // ─── Invoices ───

  Future<Map<String, dynamic>> generateInvoice(String paymentId) async {
    final response = await _authedPost('$_baseUrl/invoices/payments/$paymentId', {});
    return _handleResponse(response);
  }

  Future<List<dynamic>> getInvoices({String? branchId}) async {
    final params = <String, String>{};
    if (branchId != null) params['branchId'] = branchId;
    final uri = Uri.parse('$_baseUrl/invoices').replace(queryParameters: params);
    final response = await _authedGet(uri.toString());
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getInvoicePdf(String invoiceId) async {
    final response = await _authedGet('$_baseUrl/invoices/$invoiceId/pdf');
    return _handleResponse(response);
  }

  // ─── Sync ───

  Future<Map<String, dynamic>> getSyncStatus() async {
    final response = await _authedGet('$_baseUrl/sync/status');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> pushSyncData(Map<String, dynamic> data) async {
    final response = await _authedPost('$_baseUrl/sync/push', data);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> pullSyncData({String? lastSyncAt}) async {
    final params = <String, String>{};
    if (lastSyncAt != null) params['lastSyncAt'] = lastSyncAt;
    final uri = Uri.parse('$_baseUrl/sync/pull').replace(queryParameters: params);
    final response = await _authedGet(uri.toString());
    return _handleResponse(response);
  }

  // ─── Inventory ───

  Future<List<dynamic>> getInventoryItems() async {
    final response = await _authedGet('$_baseUrl/inventory');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> createInventoryItem(Map<String, dynamic> data) async {
    final response = await _authedPost('$_baseUrl/inventory', data);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> updateInventoryItem(String id, Map<String, dynamic> data) async {
    final response = await _authedPatch('$_baseUrl/inventory/$id', data);
    return _handleResponse(response);
  }

  Future<void> deleteInventoryItem(String id) async {
    final response = await _authedDelete('$_baseUrl/inventory/$id');
    _handleResponse(response);
  }

  Future<Map<String, dynamic>> adjustStock(String id, Map<String, dynamic> data) async {
    final response = await _authedPost('$_baseUrl/inventory/$id/adjust', data);
    return _handleResponse(response);
  }

  Future<List<dynamic>> getLowStock() async {
    final response = await _authedGet('$_baseUrl/inventory/low-stock');
    return _handleResponse(response);
  }

  // ─── Suppliers ───

  Future<List<dynamic>> getSuppliers() async {
    final response = await _authedGet('$_baseUrl/suppliers');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> createSupplier(Map<String, dynamic> data) async {
    final response = await _authedPost('$_baseUrl/suppliers', data);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> updateSupplier(String id, Map<String, dynamic> data) async {
    final response = await _authedPatch('$_baseUrl/suppliers/$id', data);
    return _handleResponse(response);
  }

  Future<void> deleteSupplier(String id) async {
    final response = await _authedDelete('$_baseUrl/suppliers/$id');
    _handleResponse(response);
  }

  // ─── Purchases ───

  Future<List<dynamic>> getPurchases() async {
    final response = await _authedGet('$_baseUrl/purchases');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> createPurchase(Map<String, dynamic> data) async {
    final response = await _authedPost('$_baseUrl/purchases', data);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> updatePurchaseStatus(String id, String status) async {
    final response = await _authedPatch('$_baseUrl/purchases/$id/status', {'status': status});
    return _handleResponse(response);
  }

  Future<void> deletePurchase(String id) async {
    final response = await _authedDelete('$_baseUrl/purchases/$id');
    _handleResponse(response);
  }

  // ─── Roles ───

  Future<List<dynamic>> getRoles() async {
    final response = await _authedGet('$_baseUrl/roles');
    return _handleResponse(response);
  }

  // ─── Staff Management ───

  Future<List<dynamic>> getStaff({required String branchId, int? page, int? limit}) async {
    final params = 'branchId=$branchId';
    final pageParam = page != null ? '&page=$page' : '';
    final limitParam = limit != null ? '&limit=$limit' : '';
    final response = await _authedGet('$_baseUrl/staff?$params$pageParam$limitParam');
    final data = _handleResponse(response);
    // Paginated response: { staff: [...], total, skip, take }
    if (data is Map && data.containsKey('staff')) return List<dynamic>.from(data['staff']);
    return List<dynamic>.from(data);
  }

  Future<Map<String, dynamic>> createStaff(String branchId, Map<String, dynamic> data) async {
    final response = await _authedPost('$_baseUrl/staff?branchId=$branchId', data);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> updateStaff(String id, Map<String, dynamic> data) async {
    final response = await _authedPatch('$_baseUrl/staff/$id', data);
    return _handleResponse(response);
  }

  Future<void> deleteStaff(String id) async {
    final response = await _authedDelete('$_baseUrl/staff/$id');
    _handleResponse(response);
  }

  Future<List<dynamic>> getShifts({required String branchId}) async {
    final response = await _authedGet('$_baseUrl/shifts?branchId=$branchId');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> createShift(String branchId, Map<String, dynamic> data) async {
    final response = await _authedPost('$_baseUrl/shifts?branchId=$branchId', data);
    return _handleResponse(response);
  }

  Future<void> deleteShift(String id) async {
    final response = await _authedDelete('$_baseUrl/shifts/$id');
    _handleResponse(response);
  }

  Future<List<dynamic>> getSchedule(String branchId, String date) async {
    final response = await _authedGet('$_baseUrl/schedule?branchId=$branchId&date=$date');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> assignShift(String staffId, String shiftId, String date) async {
    final response = await _authedPost('$_baseUrl/schedule/assign?staffId=$staffId&shiftId=$shiftId&date=$date', {});
    return _handleResponse(response);
  }

  Future<List<dynamic>> getTodayAttendance({required String branchId}) async {
    final response = await _authedGet('$_baseUrl/attendance?branchId=$branchId');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> clockIn(String staffId) async {
    final response = await _authedPost('$_baseUrl/staff/$staffId/clock-in', {});
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> clockOut(String staffId) async {
    final response = await _authedPost('$_baseUrl/staff/$staffId/clock-out', {});
    return _handleResponse(response);
  }

  Future<List<dynamic>> getAttendanceReport(String staffId, String from, String to) async {
    final response = await _authedGet('$_baseUrl/staff/$staffId/attendance?from=$from&to=$to');
    return _handleResponse(response);
  }

  // ─── Kitchen Display ───

  Future<List<dynamic>> getActiveKitchenOrders({String? branchId}) async {
    final params = <String, String>{};
    if (branchId != null) params['branchId'] = branchId;
    final uri = Uri.parse('$_baseUrl/kitchen/orders').replace(queryParameters: params);
    final response = await _authedGet(uri.toString());
    return _handleResponse(response);
  }

  Future<List<dynamic>> getCompletedKitchenOrders({String? branchId}) async {
    final params = <String, String>{};
    if (branchId != null) params['branchId'] = branchId;
    final uri = Uri.parse('$_baseUrl/kitchen/orders/completed').replace(queryParameters: params);
    final response = await _authedGet(uri.toString());
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> updateKitchenOrderStatus(String id, String status, {String? branchId}) async {
    final params = <String, String>{};
    if (branchId != null) params['branchId'] = branchId;
    final uri = Uri.parse('$_baseUrl/kitchen/orders/$id/status').replace(queryParameters: params);
    final response = await _authedPatch(uri.toString(), {'status': status});
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getKotData(String orderId) async {
    final response = await _authedGet('$_baseUrl/kitchen/orders/$orderId/kot');
    return _handleResponse(response);
  }

  // ─── Reservations ───

  Future<List<dynamic>> getReservations({String? date, String? status, String? branchId}) async {
    final params = <String, String>{};
    if (date != null) params['date'] = date;
    if (status != null) params['status'] = status;
    if (branchId != null) params['branchId'] = branchId;
    final uri = Uri.parse('$_baseUrl/reservations').replace(queryParameters: params);
    final response = await _authedGet(uri.toString());
    return _handleResponse(response);
  }

  Future<List<dynamic>> getTodayReservations() async {
    final response = await _authedGet('$_baseUrl/reservations/today');
    return _handleResponse(response);
  }

  Future<List<dynamic>> getUpcomingReservations({int limit = 10}) async {
    final response = await _authedGet('$_baseUrl/reservations/upcoming?limit=$limit');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> createReservation(Map<String, dynamic> data) async {
    final response = await _authedPost('$_baseUrl/reservations', data);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> updateReservation(String id, Map<String, dynamic> data) async {
    final response = await _authedPatch('$_baseUrl/reservations/$id', data);
    return _handleResponse(response);
  }

  Future<void> deleteReservation(String id) async {
    final response = await _authedDelete('$_baseUrl/reservations/$id');
    _handleResponse(response);
  }

  // ─── Dashboard / Stats ───

  Future<Map<String, dynamic>> getTodayStats() async {
    final branchParam = _branchId != null ? '?branchId=$_branchId' : '';
    final response = await _authedGet('$_baseUrl/orders?limit=100$branchParam');
    final orders = _handleResponse(response) as List;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final todayOrders = orders.where((o) {
      final created = DateTime.parse(o['createdAt']);
      return created.isAfter(today);
    }).toList();
    final totalRevenue = todayOrders.fold<double>(
      0, (sum, o) => sum + (double.tryParse(o['totalAmount'] ?? '0') ?? 0),
    );
    return {
      'totalOrders': todayOrders.length,
      'totalRevenue': totalRevenue,
      'avgOrderValue': todayOrders.isEmpty ? 0.0 : totalRevenue / todayOrders.length,
      'pendingOrders': todayOrders.where((o) => o['status'] == 'PENDING').length,
      'preparingOrders': todayOrders.where((o) => o['status'] == 'PREPARING').length,
      'completedOrders': todayOrders.where((o) => o['status'] == 'COMPLETED').length,
    };
  }

  // ─── Reports ───

  Future<dynamic> getReport(String type, String startDate, String endDate, {String? branchId}) async {
    final params = <String, String>{
      'startDate': startDate,
      'endDate': endDate,
    };
    if (branchId != null) params['branchId'] = branchId;
    final uri = Uri.parse('$_baseUrl/reports/$type').replace(queryParameters: params);
    final response = await _authedGet(uri.toString());
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> exportReport(String type, String format, String startDate, String endDate) async {
    final uri = Uri.parse('$_baseUrl/reports/export/$type').replace(queryParameters: {
      'format': format,
      'startDate': startDate,
      'endDate': endDate,
    });
    final response = await _authedGet(uri.toString());
    return _handleResponse(response);
  }

  // ─── Billing / Entitlements ───

  Future<http.Response> getEntitlements(String tenantId) async {
    final h = await _headers;
    return http.get(Uri.parse('$_baseUrl/billing/entitlements/$tenantId'), headers: h);
  }

  Future<http.Response> getAvailablePlans() async {
    return _authedGet('$_baseUrl/entitlements/plans');
  }

  Future<http.Response> validateCouponRaw(String code, String tenantId, {String? planSlug}) async {
    final body = <String, dynamic>{'code': code, 'tenantId': tenantId};
    if (planSlug != null) body['planSlug'] = planSlug;
    return http.post(
      Uri.parse('$_baseUrl/coupons/validate'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
  }

  Future<http.Response> createSubscriptionCheckoutRaw(String tenantId, String planId, {String? couponCode}) async {
    final body = <String, dynamic>{'tenantId': tenantId, 'planId': planId};
    if (couponCode != null) body['couponCode'] = couponCode;
    return _authedPost('$_baseUrl/billing/checkout', body);
  }

  Future<Map<String, dynamic>> createPaymentPromise(String tenantId, String reason, String expectedDate) async {
    final response = await _authedPost('$_baseUrl/billing/payment-promise', {
      'tenantId': tenantId,
      'reason': reason,
      'expectedDate': expectedDate,
    });
    return _handleResponse(response);
  }

  // ─── HTTP Helpers ───

  Future<http.Response> _authedGet(String url) async {
    final h = await _headers;
    return http.get(Uri.parse(url), headers: h);
  }

  Future<http.Response> _authedPost(String url, Map<String, dynamic> body) async {
    final h = await _headers;
    return http.post(Uri.parse(url), headers: h, body: jsonEncode(body));
  }

  Future<http.Response> _authedPatch(String url, Map<String, dynamic> body) async {
    final h = await _headers;
    return http.patch(Uri.parse(url), headers: h, body: jsonEncode(body));
  }

  Future<http.Response> _authedDelete(String url) async {
    final h = await _headers;
    return http.delete(Uri.parse(url), headers: h);
  }

  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    }
    if (response.statusCode == 401 && _accessToken != null) {
      throw AuthException('Session expired');
    }
    final body = jsonDecode(response.body);
    throw Exception(body['message'] ?? 'Request failed (${response.statusCode})');
  }

  Future<dynamic> requestWithRetry(Future<http.Response> Function() request) async {
    var response = await request();
    if (response.statusCode == 401) {
      try {
        await refreshAccessToken();
        response = await request();
      } catch (_) {}
    }
    return _handleResponse(response);
  }

  Future<void> _storeTokens(String access, String refresh) async {
    _accessToken = access;
    await _storage.write(key: 'access_token', value: access);
    await _storage.write(key: 'refresh_token', value: refresh);
  }

  Future<bool> hasValidSession() async {
    final token = await _storage.read(key: 'access_token');
    return token != null;
  }
}

class AuthException implements Exception {
  final String message;
  AuthException(this.message);
  @override
  String toString() => message;
}
