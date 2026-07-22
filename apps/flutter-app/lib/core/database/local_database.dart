import 'dart:convert';
import 'package:drift/drift.dart';
import '../constants/app_constants.dart';

/// Platform-compatible database executor.
/// Resolved at compile time via conditional imports:
///   - dart.library.js  → WebDatabase (sql.js/IndexedDB)
///   - dart.library.io  → NativeDatabase (file-based SQLite)
import 'connect_stub.dart'
  if (dart.library.io) 'connect_native.dart'
  if (dart.library.js) 'connect_web.dart';

part 'local_database.g.dart';

// ─── Local Tables (Mirror of Prisma schema for offline support) ───

class LocalCategories extends Table {
  TextColumn get id => text()();
  TextColumn get tenantId => text()();
  TextColumn get name => text()();
  TextColumn get description => text().nullable()();
  IntColumn get sortOrder => integer().withDefault(const Constant(0))();
  BoolColumn get isActive => boolean().withDefault(const Constant(true))();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalMenuItems extends Table {
  TextColumn get id => text()();
  TextColumn get tenantId => text()();
  TextColumn get categoryId => text()();
  TextColumn get name => text()();
  TextColumn get description => text().nullable()();
  RealColumn get price => real()();
  BoolColumn get isVeg => boolean().withDefault(const Constant(false))();
  BoolColumn get isAvailable => boolean().withDefault(const Constant(true))();
  TextColumn get image => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalTables extends Table {
  TextColumn get id => text()();
  TextColumn get branchId => text()();
  IntColumn get number => integer()();
  TextColumn get name => text().nullable()();
  IntColumn get capacity => integer().withDefault(const Constant(4))();
  TextColumn get status => text().withDefault(const Constant('FREE'))();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalOrders extends Table {
  TextColumn get id => text()();
  TextColumn get localId => text().nullable()();
  TextColumn get branchId => text()();
  TextColumn get tableId => text().nullable()();
  IntColumn get orderNumber => integer()();
  TextColumn get type => text().withDefault(const Constant('DINE_IN'))();
  TextColumn get status => text().withDefault(const Constant('PENDING'))();
  TextColumn get customerName => text().nullable()();
  RealColumn get subtotal => real()();
  RealColumn get taxAmount => real().withDefault(const Constant(0))();
  RealColumn get totalAmount => real()();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalOrderItems extends Table {
  TextColumn get id => text()();
  TextColumn get orderId => text()();
  TextColumn get menuItemId => text()();
  TextColumn get name => text()();
  IntColumn get quantity => integer()();
  RealColumn get unitPrice => real()();
  RealColumn get totalPrice => real()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalPayments extends Table {
  TextColumn get id => text()();
  TextColumn get orderId => text()();
  TextColumn get branchId => text()();
  TextColumn get method => text()();
  RealColumn get amount => real()();
  TextColumn get status => text().withDefault(const Constant('COMPLETED'))();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalSyncQueue extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get entityType => text()();
  TextColumn get entityId => text()();
  TextColumn get action => text()();
  TextColumn get payload => text()();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();
}

// ─── Database ───

@DriftDatabase(tables: [
  LocalCategories,
  LocalMenuItems,
  LocalTables,
  LocalOrders,
  LocalOrderItems,
  LocalPayments,
  LocalSyncQueue,
])
class LocalDatabase extends _$LocalDatabase {
  LocalDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    onUpgrade: (m, from, to) async {
      if (from < 2) {
        await m.addColumn(localSyncQueue, localSyncQueue.retryCount);
      }
    },
  );

  // ─── Menu Queries ───

  Future<List<LocalCategory>> getAllCategories(String tenantId) {
    return (select(localCategories)
          ..where((t) => t.tenantId.equals(tenantId))
          ..orderBy([(t) => OrderingTerm.asc(t.sortOrder)]))
        .get();
  }

  Future<List<LocalMenuItem>> getAllMenuItems(String tenantId) {
    return (select(localMenuItems)
          ..where((t) => t.tenantId.equals(tenantId)))
        .get();
  }

  Future<void> updateMenuAvailability(String itemId, bool isAvailable) {
    return (update(localMenuItems)..where((t) => t.id.equals(itemId)))
        .write(LocalMenuItemsCompanion(isAvailable: Value(isAvailable)));
  }

  Future<void> bulkUpsertMenuItems(List<Map<String, dynamic>> items) async {
    for (final item in items) {
      await into(localMenuItems).insertOnConflictUpdate(
        LocalMenuItemsCompanion(
          id: Value(item['id'] as String),
          tenantId: Value(item['tenantId'] as String? ?? ''),
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
  }

  // ─── Table Queries ───

  Future<List<LocalTable>> getAllTables(String branchId) {
    return (select(localTables)
          ..where((t) => t.branchId.equals(branchId))
          ..orderBy([(t) => OrderingTerm.asc(t.number)]))
        .get();
  }

  Future<void> updateTableStatus(String tableId, String status) {
    return (update(localTables)..where((t) => t.id.equals(tableId)))
        .write(LocalTablesCompanion(status: Value(status)));
  }

  Future<void> bulkUpsertTables(List<Map<String, dynamic>> tables) async {
    for (final table in tables) {
      await into(localTables).insertOnConflictUpdate(
        LocalTablesCompanion(
          id: Value(table['id'] as String),
          branchId: Value(table['branchId'] as String? ?? ''),
          number: Value(table['number'] as int? ?? 0),
          name: Value(table['name'] as String?),
          capacity: Value(table['capacity'] as int? ?? 4),
          status: Value(table['status'] as String? ?? 'FREE'),
        ),
      );
    }
  }

  // ─── Order Queries ───

  Future<int> createLocalOrder(LocalOrdersCompanion order) {
    return into(localOrders).insert(order);
  }

  Future<List<LocalOrder>> getUnsyncedOrders() {
    return (select(localOrders)
          ..where((t) => t.synced.equals(false))
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .get();
  }

  Future<LocalOrder?> getOrderById(String id) {
    return (select(localOrders)..where((t) => t.id.equals(id))).getSingleOrNull();
  }

  Future<void> updateOrderStatus(String orderId, String status) {
    return (update(localOrders)..where((t) => t.id.equals(orderId)))
        .write(LocalOrdersCompanion(status: Value(status)));
  }

  Future<void> deleteLocalOrder(String orderId) async {
    await (delete(localOrderItems)..where((t) => t.orderId.equals(orderId))).go();
    await (delete(localOrders)..where((t) => t.id.equals(orderId))).go();
  }

  Future<List<LocalOrder>> getOrdersByBranch(String branchId, {String? status}) {
    final query = select(localOrders)
      ..where((t) => t.branchId.equals(branchId))
      ..orderBy([(t) => OrderingTerm.desc(t.createdAt)]);
    if (status != null) {
      query.where((t) => t.status.equals(status));
    }
    return query.get();
  }

  Future<int> getOfflineOrderCount() async {
    final result = await customSelect(
      'SELECT COUNT(*) as cnt FROM local_orders WHERE synced = 0',
    ).getSingle();
    return result.data['cnt'] as int;
  }

  // ─── Payment Queries ───

  Future<List<LocalPayment>> getPaymentsForOrder(String orderId) {
    return (select(localPayments)
          ..where((t) => t.orderId.equals(orderId))
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .get();
  }

  Future<List<LocalPayment>> getUnsyncedPayments() {
    return (select(localPayments)
          ..where((t) => t.synced.equals(false))
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .get();
  }

  // ─── Sync Queue ───

  Future<int> addToSyncQueue(LocalSyncQueueCompanion entry) {
    return into(localSyncQueue).insert(entry);
  }

  Future<List<LocalSyncQueueData>> getPendingSync() {
    return (select(localSyncQueue)
          ..where((t) => t.synced.equals(false))
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .get();
  }

  Future<void> markSynced(int id) {
    return (update(localSyncQueue)..where((t) => t.id.equals(id)))
        .write(const LocalSyncQueueCompanion(synced: Value(true)));
  }

  Future<void> incrementRetryCount(int id) {
    return (update(localSyncQueue)..where((t) => t.id.equals(id)))
        .write(const LocalSyncQueueCompanion(retryCount: Value(1)));
  }

  Future<void> removeSyncQueueEntry(int id) {
    return (delete(localSyncQueue)..where((t) => t.id.equals(id))).go();
  }

  Future<int> getSyncQueueCount() async {
    final result = await customSelect(
      'SELECT COUNT(*) as cnt FROM local_sync_queue WHERE synced = 0',
    ).getSingle();
    return result.data['cnt'] as int;
  }

  Future<void> clearSyncedEntries() {
    return (delete(localSyncQueue)..where((t) => t.synced.equals(true))).go();
  }

  // ─── Menu Availability Toggle (synced via queue) ───

  Future<void> toggleMenuAvailabilityOffline(String itemId, bool isAvailable) async {
    await updateMenuAvailability(itemId, isAvailable);
    await addToSyncQueue(LocalSyncQueueCompanion(
      entityType: const Value('menu_item'),
      entityId: Value(itemId),
      action: const Value('update_availability'),
      payload: Value(jsonEncode({'isAvailable': isAvailable})),
    ));
  }

  // ─── Generic Sync Helper ───

  Future<void> addToSyncQueueWithPayload({
    required String entityType,
    required String entityId,
    required String action,
    required Map<String, dynamic> payload,
  }) {
    final queueCount = getSyncQueueCount();
    return queueCount.then((count) {
      if (count >= AppConstants.maxSyncQueueSize) return Future.value();
      return addToSyncQueue(LocalSyncQueueCompanion(
        entityType: Value(entityType),
        entityId: Value(entityId),
        action: Value(action),
        payload: Value(jsonEncode(payload)),
      ));
    });
  }
}

/// Opens the platform-appropriate database connection.
/// - Native: file-based SQLite at {appDocDir}/nexaros/nexaros.sqlite
/// - Web: IndexedDB-backed SQLite via sql.js WASM
QueryExecutor _openConnection() => connect();
