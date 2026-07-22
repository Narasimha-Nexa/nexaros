/// Base repository abstraction for clean architecture.
///
/// All repositories should extend [BaseRepository] to ensure consistent
/// error handling, caching, and offline support patterns.
library;

import 'dart:async';
import '../network/api_client.dart';

/// Global logger instance.
import '../logging/app_logger.dart' show logger;

/// Base repository providing common data access patterns.
///
/// Repositories abstract the data source (API, local DB, cache) behind
/// a clean interface, keeping business logic decoupled from infrastructure.
abstract class BaseRepository {
  final ApiClient apiClient;

  BaseRepository(this.apiClient);

  /// Execute an API call with standard error handling.
  Future<T> apiCall<T>(
    Future<T> Function() call, {
    String? context,
    bool retry = true,
    int maxRetries = 2,
  }) async {
    int attempts = 0;
    while (true) {
      try {
        return await call();
      } catch (e, st) {
        attempts++;
        logger.error(
          'API call failed${context != null ? ' ($context)' : ''} '
          '(attempt $attempts): $e',
          tag: 'Repository',
          stackTrace: st,
        );
        if (retry && attempts <= maxRetries) {
          await Future.delayed(Duration(seconds: attempts));
          continue;
        }
        rethrow;
      }
    }
  }

  /// Get the current tenant ID from headers.
  Future<String?> get currentTenantId async {
    final h = await apiClient.headers;
    return h['x-tenant-id'];
  }

  /// Get the current branch ID from headers.
  Future<String?> get currentBranchId async {
    final h = await apiClient.headers;
    return h['x-branch-id'];
  }
}

/// Pagination parameters for list queries.
class PaginationParams {
  final int page;
  final int limit;
  final String? sortBy;
  final String? sortOrder;
  final Map<String, String>? filters;

  const PaginationParams({
    this.page = 1,
    this.limit = 20,
    this.sortBy,
    this.sortOrder,
    this.filters,
  });

  PaginationParams copyWith({
    int? page,
    int? limit,
    String? sortBy,
    String? sortOrder,
    Map<String, String>? filters,
  }) {
    return PaginationParams(
      page: page ?? this.page,
      limit: limit ?? this.limit,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
      filters: filters ?? this.filters,
    );
  }

  Map<String, String> toQueryParams() {
    final params = <String, String>{
      'skip': ((page - 1) * limit).toString(),
      'take': limit.toString(),
    };
    if (sortBy != null) params['sortBy'] = sortBy!;
    if (sortOrder != null) params['sortOrder'] = sortOrder!;
    if (filters != null) params.addAll(filters!);
    return params;
  }
}

/// Paginated response wrapper.
class PaginatedResult<T> {
  final List<T> items;
  final int total;
  final int page;
  final int limit;
  final bool hasMore;

  const PaginatedResult({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
  }) : hasMore = (page * limit) < total;

  factory PaginatedResult.empty() => const PaginatedResult(
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      );
}

/// Offline-capable repository mixin.
///
/// Repositories that support offline mode should mix this in and override
/// [getCached], [saveToCache], and [clearCache].
mixin OfflineCapableRepository {
  /// Get data from local cache.
  Future<List<Map<String, dynamic>>?> getCached(String key) async => null;

  /// Save data to local cache.
  Future<void> saveToCache(String key, List<Map<String, dynamic>> data) async {}

  /// Clear cache for a specific key.
  Future<void> clearCache(String key) async {}

  /// Clear all caches.
  Future<void> clearAllCache() async {}
}
