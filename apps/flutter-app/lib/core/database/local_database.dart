import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

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
  int get schemaVersion => 1;

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

  // ─── Table Queries ───

  Future<List<LocalTable>> getAllTables(String branchId) {
    return (select(localTables)
          ..where((t) => t.branchId.equals(branchId))
          ..orderBy([(t) => OrderingTerm.asc(t.number)]))
        .get();
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

  Future markSynced(int id) {
    return (update(localSyncQueue)..where((t) => t.id.equals(id)))
        .write(const LocalSyncQueueCompanion(synced: Value(true)));
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'nexaros', 'nexaros.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
