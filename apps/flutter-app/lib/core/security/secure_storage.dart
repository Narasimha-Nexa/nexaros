/// Centralized encrypted storage wrapper for enterprise security.
library;

import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Enterprise secure storage wrapper.
class SecureStorage {
  static final SecureStorage _instance = SecureStorage._();
  factory SecureStorage() => _instance;
  SecureStorage._();

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  Future<void> write({required String key, required String value}) async {
    await _storage.write(key: key, value: value);
  }

  Future<String?> read({required String key}) async {
    return await _storage.read(key: key);
  }

  Future<void> delete({required String key}) async {
    await _storage.delete(key: key);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  Future<bool> containsKey({required String key}) async {
    return await _storage.containsKey(key: key);
  }

  Future<void> writeJson({
    required String key,
    required Map<String, dynamic> value,
  }) async {
    await _storage.write(key: key, value: jsonEncode(value));
  }

  Future<Map<String, dynamic>?> readJson({required String key}) async {
    final data = await _storage.read(key: key);
    if (data == null) return null;
    return jsonDecode(data) as Map<String, dynamic>;
  }

  Future<void> writeList({
    required String key,
    required List<String> value,
  }) async {
    await _storage.write(key: key, value: jsonEncode(value));
  }

  Future<List<String>> readList({required String key}) async {
    final data = await _storage.read(key: key);
    if (data == null) return [];
    return (jsonDecode(data) as List).cast<String>();
  }

  Future<void> saveAccessToken(String token) =>
      write(key: 'access_token', value: token);

  Future<String?> getAccessToken() => read(key: 'access_token');

  Future<void> saveRefreshToken(String token) =>
      write(key: 'refresh_token', value: token);

  Future<String?> getRefreshToken() => read(key: 'refresh_token');

  Future<void> saveUserId(String id) => write(key: 'user_id', value: id);

  Future<String?> getUserId() => read(key: 'user_id');

  Future<void> saveTenantId(String id) => write(key: 'tenant_id', value: id);

  Future<String?> getTenantId() => read(key: 'tenant_id');

  Future<void> saveBranchId(String id) => write(key: 'branch_id', value: id);

  Future<String?> getBranchId() => read(key: 'branch_id');
}
