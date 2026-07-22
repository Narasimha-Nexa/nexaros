import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'local_database.dart';
import '../network/api_client.dart';

class DatabaseSeedingService {
  final LocalDatabase _db;
  final ApiClient _api;
  static const _seededKey = 'local_db_seeded_v1';

  DatabaseSeedingService(this._db, this._api);

  /// Seed local database on first launch or after schema upgrade.
  /// Fetches categories, menu items, and tables from server and caches locally.
  Future<bool> seedIfNeeded({String? tenantId, String? branchId}) async {
    final prefs = await SharedPreferences.getInstance();
    final alreadySeeded = prefs.getBool(_seededKey) ?? false;
    if (alreadySeeded) return false;

    return _performSeed(tenantId: tenantId, branchId: branchId);
  }

  /// Force re-seed (e.g., after logout/login with different tenant)
  Future<bool> forceSeed({String? tenantId, String? branchId}) async {
    return _performSeed(tenantId: tenantId, branchId: branchId);
  }

  Future<bool> _performSeed({String? tenantId, String? branchId}) async {
    if (tenantId == null || branchId == null) return false;

    try {
      debugPrint('DatabaseSeeding: Starting seed for tenant=$tenantId branch=$branchId');

      // Pull all data from server
      final serverData = await _api.pullSyncData();

      // Seed categories
      if (serverData['categories'] != null) {
        final categories = serverData['categories'] as List;
        for (final cat in categories) {
          await _db.into(_db.localCategories).insertOnConflictUpdate(
            LocalCategoriesCompanion(
              id: Value(cat['id'] as String),
              tenantId: Value(cat['tenantId'] as String? ?? tenantId),
              name: Value(cat['name'] as String? ?? ''),
              description: Value(cat['description'] as String?),
              sortOrder: Value(cat['sortOrder'] as int? ?? 0),
              isActive: Value(cat['isActive'] as bool? ?? true),
            ),
          );
        }
        debugPrint('DatabaseSeeding: Seeded ${categories.length} categories');
      }

      // Seed menu items
      if (serverData['menuItems'] != null) {
        final items = serverData['menuItems'] as List;
        for (final item in items) {
          await _db.into(_db.localMenuItems).insertOnConflictUpdate(
            LocalMenuItemsCompanion(
              id: Value(item['id'] as String),
              tenantId: Value(item['tenantId'] as String? ?? tenantId),
              categoryId: Value(item['categoryId'] as String? ?? ''),
              name: Value(item['name'] as String? ?? ''),
              description: Value(item['description'] as String?),
              price: Value(double.tryParse(item['price'].toString()) ?? 0),
              isVeg: Value(item['isVeg'] as bool? ?? false),
              isAvailable: Value(item['isAvailable'] as bool? ?? true),
              image: Value(item['image'] as String?),
            ),
          );
        }
        debugPrint('DatabaseSeeding: Seeded ${items.length} menu items');
      }

      // Seed tables
      if (serverData['tables'] != null) {
        final tables = serverData['tables'] as List;
        for (final table in tables) {
          await _db.into(_db.localTables).insertOnConflictUpdate(
            LocalTablesCompanion(
              id: Value(table['id'] as String),
              branchId: Value(table['branchId'] as String? ?? branchId),
              number: Value(table['number'] as int? ?? 0),
              name: Value(table['name'] as String?),
              capacity: Value(table['capacity'] as int? ?? 4),
              status: Value(table['status'] as String? ?? 'FREE'),
            ),
          );
        }
        debugPrint('DatabaseSeeding: Seeded ${tables.length} tables');
      }

      // Mark as seeded
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_seededKey, true);
      debugPrint('DatabaseSeeding: Seed completed successfully');
      return true;
    } catch (e) {
      debugPrint('DatabaseSeeding: Seed failed: $e');
      return false;
    }
  }

  /// Reset seeding flag (for logout/re-login)
  Future<void> resetSeedFlag() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_seededKey);
  }

  /// Check if database has been seeded
  Future<bool> isSeeded() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_seededKey) ?? false;
  }
}
