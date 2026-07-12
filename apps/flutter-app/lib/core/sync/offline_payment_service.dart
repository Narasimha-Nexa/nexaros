import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';
import '../database/local_database.dart';
import '../network/api_client.dart';

class OfflinePaymentService {
  final LocalDatabase _db;
  final ApiClient _api;
  static const _uuid = Uuid();

  OfflinePaymentService(this._db, this._api);

  Future<OfflinePaymentResult> recordPayment({
    required String orderId,
    required String branchId,
    required String method,
    required double amount,
    String? reference,
  }) async {
    // Try online first
    try {
      final result = await _api.processPayment(orderId, method: method, amount: amount, reference: reference);

      // Save locally as synced
      final paymentId = result['id'] as String;
      await _savePaymentLocally(paymentId, orderId, branchId, method, amount, true);

      return OfflinePaymentResult(
        paymentId: paymentId,
        isOffline: false,
      );
    } catch (_) {
      // Offline fallback
      return _recordPaymentOffline(orderId, branchId, method, amount, reference);
    }
  }

  Future<OfflinePaymentResult> _recordPaymentOffline(
    String orderId,
    String branchId,
    String method,
    double amount,
    String? reference,
  ) async {
    final localId = _uuid.v4();

    await _savePaymentLocally(localId, orderId, branchId, method, amount, false);

    // Add to sync queue
    await _db.addToSyncQueue(LocalSyncQueueCompanion(
      entityType: const Value('payment'),
      entityId: Value(localId),
      action: const Value('create'),
      payload: Value(''),
    ));

    return OfflinePaymentResult(
      paymentId: localId,
      isOffline: true,
    );
  }

  Future<void> _savePaymentLocally(
    String id,
    String orderId,
    String branchId,
    String method,
    double amount,
    bool synced,
  ) async {
    await _db.into(_db.localPayments).insertOnConflictUpdate(
      LocalPaymentsCompanion(
        id: Value(id),
        orderId: Value(orderId),
        branchId: Value(branchId),
        method: Value(method),
        amount: Value(amount),
        status: const Value('COMPLETED'),
        synced: Value(synced),
      ),
    );
  }

  Future<List<LocalPayment>> getPaymentsForOrder(String orderId) async {
    return (_db.select(_db.localPayments)
          ..where((t) => t.orderId.equals(orderId))
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .get();
  }
}

class OfflinePaymentResult {
  final String paymentId;
  final bool isOffline;

  OfflinePaymentResult({
    required this.paymentId,
    required this.isOffline,
  });
}
