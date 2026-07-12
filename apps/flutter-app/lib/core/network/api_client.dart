import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String _baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:4000/api');
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  String? _accessToken;

  String get baseUrl => _baseUrl;
  String? get accessToken => _accessToken;

  Future<Map<String, String>> get _headers async {
    if (_accessToken == null) {
      _accessToken = await _storage.read(key: 'access_token');
    }
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
      body: jsonEncode({'token': rt}),
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

  // ─── Menu ───

  Future<List<dynamic>> getCategories() async {
    final response = await _authedGet('$_baseUrl/menu/categories');
    return _handleResponse(response);
  }

  Future<List<dynamic>> getMenuItems({String? categoryId, String? search}) async {
    final params = <String, String>{};
    if (categoryId != null) params['categoryId'] = categoryId;
    if (search != null) params['search'] = search;
    final uri = Uri.parse('$_baseUrl/menu/items').replace(queryParameters: params);
    final response = await _authedGet(uri.toString());
    return _handleResponse(response);
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

  Future<List<dynamic>> getOrders({String? status, String? branchId, int? limit}) async {
    final params = <String, String>{};
    if (status != null) params['status'] = status;
    if (branchId != null) params['branchId'] = branchId;
    if (limit != null) params['limit'] = limit.toString();
    final uri = Uri.parse('$_baseUrl/orders').replace(queryParameters: params);
    final response = await _authedGet(uri.toString());
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> data) async {
    final response = await _authedPost('$_baseUrl/orders', data);
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

  // ─── Staff Management ───

  Future<List<dynamic>> getStaff({required String branchId}) async {
    final response = await _authedGet('$_baseUrl/staff?branchId=$branchId');
    return _handleResponse(response);
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

  // ─── Dashboard / Stats ───

  Future<Map<String, dynamic>> getTodayStats() async {
    final response = await _authedGet('$_baseUrl/orders?limit=100');
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
