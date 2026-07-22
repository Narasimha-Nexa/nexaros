import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:nexaros_app/features/dashboard/data/dashboard_cache_service.dart';
import 'package:nexaros_app/features/dashboard/data/dashboard_models.dart';

void main() {
  late SharedPreferences prefs;
  late DashboardCacheService cacheService;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    prefs = await SharedPreferences.getInstance();
    cacheService = DashboardCacheService(prefs);
  });

  const testFilter = DashboardFilter(timeRange: DashboardTimeRange.today, branchId: 'b1');
  const otherFilter = DashboardFilter(timeRange: DashboardTimeRange.thisWeek, branchId: 'b2');

  DashboardData makeData({String? restaurantName}) {
    return DashboardData(
      header: ExecutiveHeaderData(
        restaurantName: restaurantName ?? 'Test Restaurant',
        branchName: 'Main Branch',
        businessDate: DateTime.now(),
        lastSync: DateTime.now(),
      ),
      kpis: const [],
      salesData: const [],
      notifications: const [],
      topSelling: const [],
    );
  }

  group('cacheData / getCachedData', () {
    test('returns null when no cache exists', () {
      final result = cacheService.getCachedData(testFilter);
      expect(result, isNull);
    });

    test('caches and retrieves data within TTL', () async {
      await cacheService.cacheData(testFilter, makeData());
      final result = cacheService.getCachedData(testFilter);
      expect(result, isNotNull);
    });

    test('returns null when TTL expired', () async {
      await cacheService.cacheData(testFilter, makeData());
      final result = cacheService.getCachedData(testFilter, ttl: Duration.zero);
      expect(result, isNull);
    });

    test('different filters use different cache keys', () async {
      await cacheService.cacheData(testFilter, makeData(restaurantName: 'A'));
      await cacheService.cacheData(otherFilter, makeData(restaurantName: 'B'));

      expect(cacheService.getCachedData(testFilter), isNotNull);
      expect(cacheService.getCachedData(otherFilter), isNotNull);
    });
  });

  group('invalidate', () {
    test('removes cached data for specific filter', () async {
      await cacheService.cacheData(testFilter, makeData());
      expect(cacheService.getCachedData(testFilter), isNotNull);

      cacheService.invalidate(testFilter);
      expect(cacheService.getCachedData(testFilter), isNull);
    });

    test('does not affect other filters', () async {
      await cacheService.cacheData(testFilter, makeData());
      await cacheService.cacheData(otherFilter, makeData());

      cacheService.invalidate(testFilter);
      expect(cacheService.getCachedData(otherFilter), isNotNull);
    });
  });

  group('clearAll', () {
    test('removes all dashboard cache entries', () async {
      await cacheService.cacheData(testFilter, makeData());
      await cacheService.cacheData(otherFilter, makeData());

      cacheService.clearAll();
      expect(cacheService.getCachedData(testFilter), isNull);
      expect(cacheService.getCachedData(otherFilter), isNull);
    });
  });

  group('online status', () {
    test('setLastOnline/getLastOnline round-trips', () async {
      expect(cacheService.getLastOnline(), isNull);
      await cacheService.setLastOnline(true);
      expect(cacheService.getLastOnline(), isTrue);
      await cacheService.setLastOnline(false);
      expect(cacheService.getLastOnline(), isFalse);
    });
  });

  group('corrupt cache', () {
    test('returns null for invalid JSON', () async {
      final key = 'dashboard_cache_today_b1_all_all';
      await prefs.setString(key, '{invalid json!!!}');
      final result = cacheService.getCachedData(testFilter);
      expect(result, isNull);
    });
  });
}
