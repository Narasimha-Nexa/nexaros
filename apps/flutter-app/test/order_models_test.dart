import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexaros_app/features/orders/data/order_models.dart';

void main() {
  group('OrderStatus', () {
    test('has correct count', () {
      expect(OrderStatus.values.length, 15);
    });
    test('label returns capitalized name', () {
      expect(OrderStatus.pending.label, 'Pending');
      expect(OrderStatus.outForDelivery.label, 'Out For Delivery');
    });
    test('isActive returns true for active statuses', () {
      expect(OrderStatus.pending.isActive, true);
      expect(OrderStatus.preparing.isActive, true);
      expect(OrderStatus.ready.isActive, true);
      expect(OrderStatus.completed.isActive, false);
      expect(OrderStatus.cancelled.isActive, false);
    });
    test('isTerminal returns true for terminal statuses', () {
      expect(OrderStatus.completed.isTerminal, true);
      expect(OrderStatus.cancelled.isTerminal, true);
      expect(OrderStatus.rejected.isTerminal, true);
      expect(OrderStatus.refunded.isTerminal, true);
      expect(OrderStatus.pending.isTerminal, false);
    });
    test('canCancel returns true for cancellable statuses', () {
      expect(OrderStatus.pending.canCancel, true);
      expect(OrderStatus.confirmed.canCancel, true);
      expect(OrderStatus.preparing.canCancel, true);
      expect(OrderStatus.ready.canCancel, false);
      expect(OrderStatus.completed.canCancel, false);
    });
    test('canRefund returns true for refundable statuses', () {
      expect(OrderStatus.completed.canRefund, true);
      expect(OrderStatus.delivered.canRefund, true);
      expect(OrderStatus.pending.canRefund, false);
    });
    test('color returns non-null', () {
      for (final s in OrderStatus.values) {
        expect(s.color, isA<Color>());
      }
    });
    test('icon returns non-null', () {
      for (final s in OrderStatus.values) {
        expect(s.icon, isA<IconData>());
      }
    });
  });

  group('OrderType', () {
    test('has 13 order types', () {
      expect(OrderType.values.length, 13);
    });
    test('label returns readable string', () {
      expect(OrderType.dineIn.label, 'Dine-In');
      expect(OrderType.qrOrder.label, 'QR Order');
      expect(OrderType.driveThrough.label, 'Drive Through');
    });
  });

  group('OrderChannel', () {
    test('has 9 channels', () {
      expect(OrderChannel.values.length, 9);
    });
    test('color returns non-null', () {
      for (final c in OrderChannel.values) {
        expect(c.color, isA<Color>());
      }
    });
  });

  group('OrderItemStatus', () {
    test('has 5 statuses', () {
      expect(OrderItemStatus.values.length, 5);
    });
    test('color returns non-null', () {
      for (final s in OrderItemStatus.values) {
        expect(s.color, isA<Color>());
      }
    });
  });

  group('PaymentMethod', () {
    test('has 7 methods', () {
      expect(PaymentMethod.values.length, 7);
    });
    test('icon returns non-null', () {
      for (final m in PaymentMethod.values) {
        expect(m.icon, isA<IconData>());
      }
    });
  });

  group('PaymentStatus', () {
    test('has 5 statuses', () {
      expect(PaymentStatus.values.length, 5);
    });
    test('color returns non-null', () {
      for (final s in PaymentStatus.values) {
        expect(s.color, isA<Color>());
      }
    });
  });

  group('OrderItemAddOn', () {
    test('fromJson parses correctly', () {
      final addon = OrderItemAddOn.fromJson({'id': 'a1', 'name': 'Extra Cheese', 'price': 50.0});
      expect(addon.id, 'a1');
      expect(addon.name, 'Extra Cheese');
      expect(addon.price, 50.0);
    });
    test('fromJson handles nulls', () {
      final addon = OrderItemAddOn.fromJson({});
      expect(addon.id, isNull);
      expect(addon.name, '');
      expect(addon.price, 0);
    });
  });

  group('OrderStatusHistory', () {
    test('fromJson parses correctly', () {
      final history = OrderStatusHistory.fromJson({
        'id': 'h1', 'status': 'PREPARING', 'notes': 'Started cooking',
        'userName': 'Chef Raj', 'createdAt': '2025-07-16T10:30:00Z',
      });
      expect(history.status, OrderStatus.preparing);
      expect(history.notes, 'Started cooking');
      expect(history.createdBy, 'Chef Raj');
    });
  });

  group('OrderItemModel', () {
    test('fromJson parses correctly', () {
      final item = OrderItemModel.fromJson({
        'id': 'i1', 'menuItemId': 'm1', 'name': 'Paneer Tikka',
        'quantity': 2, 'unitPrice': 250.0, 'totalPrice': 500.0,
        'notes': 'Extra spicy', 'status': 'PREPARING',
        'addOns': [{'name': 'Cheese', 'price': 50}],
        'isVeg': true,
      });
      expect(item.id, 'i1');
      expect(item.name, 'Paneer Tikka');
      expect(item.quantity, 2);
      expect(item.unitPrice, 250.0);
      expect(item.computedTotal, 500.0);
      expect(item.notes, 'Extra spicy');
      expect(item.status, OrderItemStatus.preparing);
      expect(item.addOns.length, 1);
      expect(item.isVeg, true);
    });

    test('computedTotal includes addOns', () {
      final item = OrderItemModel(
        name: 'Pizza', quantity: 1, unitPrice: 300,
        addOns: [OrderItemAddOn(name: 'Cheese', price: 50), OrderItemAddOn(name: 'Olives', price: 30)],
      );
      expect(item.computedTotal, 380.0);
    });

    test('computedTotal uses totalPrice when set', () {
      final item = OrderItemModel(
        name: 'Pizza', quantity: 2, unitPrice: 300, totalPrice: 500,
      );
      expect(item.computedTotal, 500);
    });
  });

  group('OrderModel', () {
    test('fromJson parses correctly', () {
      final order = OrderModel.fromJson({
        'id': 'o1', 'orderNumber': 42, 'status': 'PREPARING',
        'type': 'DINE_IN', 'channel': 'DINE_IN',
        'totalAmount': 850.0, 'subtotal': 750.0, 'taxAmount': 75.0,
        'discountAmount': 25.0, 'notes': 'No onions',
        'customerName': 'John', 'customerPhone': '9876543210',
        'guestCount': 4, 'tableId': 't1', 'branchId': 'b1',
        'kotPrinted': true, 'version': 2,
        'createdAt': '2025-07-16T10:00:00Z', 'updatedAt': '2025-07-16T10:30:00Z',
        'table': {'number': 5, 'id': 't1'},
        'items': [
          {'id': 'i1', 'name': 'Burger', 'quantity': 2, 'unitPrice': 150},
          {'id': 'i2', 'name': 'Fries', 'quantity': 1, 'unitPrice': 100, 'isVeg': true},
        ],
        'statusHistory': [
          {'status': 'PENDING', 'createdAt': '2025-07-16T10:00:00Z'},
          {'status': 'PREPARING', 'createdAt': '2025-07-16T10:15:00Z', 'userName': 'Chef'},
        ],
      });
      expect(order.id, 'o1');
      expect(order.orderNumber, 42);
      expect(order.parsedStatus, OrderStatus.preparing);
      expect(order.type, OrderType.dineIn);
      expect(order.totalAmount, 850.0);
      expect(order.displayTable, 'T5');
      expect(order.customerName, 'John');
      expect(order.items.length, 2);
      expect(order.statusHistory.length, 2);
      expect(order.kotPrinted, true);
      expect(order.version, 2);
    });

    test('orderNumberDisplay formats correctly', () {
      final order = OrderModel(id: 'o1', orderNumber: 7, totalAmount: 0, createdAt: DateTime.now(), updatedAt: DateTime.now());
      expect(order.orderNumberDisplay, '#0007');
    });

    test('canModify for active statuses', () {
      final pending = OrderModel(id: 'o1', orderNumber: 1, status: 'PENDING', totalAmount: 0, createdAt: DateTime.now(), updatedAt: DateTime.now());
      final preparing = OrderModel(id: 'o1', orderNumber: 1, status: 'PREPARING', totalAmount: 0, createdAt: DateTime.now(), updatedAt: DateTime.now());
      final completed = OrderModel(id: 'o1', orderNumber: 1, status: 'COMPLETED', totalAmount: 0, createdAt: DateTime.now(), updatedAt: DateTime.now());
      expect(pending.canModify, true);
      expect(preparing.canModify, false);
      expect(completed.canModify, false);
    });

    test('copyWith preserves unchanged fields', () {
      final original = OrderModel(
        id: 'o1', orderNumber: 42, totalAmount: 100, subtotal: 90,
        taxAmount: 10, createdAt: DateTime(2025, 1, 1), updatedAt: DateTime(2025, 1, 1),
      );
      final updated = original.copyWith(totalAmount: 150);
      expect(updated.totalAmount, 150);
      expect(updated.subtotal, 90);
      expect(updated.orderNumber, 42);
    });
  });

  group('OrderFilter', () {
    test('default has no active filters', () {
      const filter = OrderFilter();
      expect(filter.hasActiveFilters, false);
      expect(filter.activeCount, 0);
    });

    test('copyWith adds statuses', () {
      const filter = OrderFilter();
      final updated = filter.copyWith(statuses: [OrderStatus.pending, OrderStatus.preparing]);
      expect(updated.statuses.length, 2);
      expect(updated.hasActiveFilters, true);
    });

    test('clearAll resets everything', () {
      const filter = OrderFilter(statuses: [OrderStatus.pending], searchQuery: 'test');
      final cleared = filter.clearAll();
      expect(cleared.hasActiveFilters, false);
      expect(cleared.statuses, isEmpty);
      expect(cleared.searchQuery, isNull);
    });

    test('activeCount counts non-null fields', () {
      const filter = OrderFilter(
        statuses: [OrderStatus.pending],
        types: [OrderType.dineIn],
        branchId: 'b1',
        searchQuery: 'test',
      );
      expect(filter.activeCount, 4);
    });
  });

  group('BulkActionRequest', () {
    test('constructs correctly', () {
      final req = BulkActionRequest(
        action: BulkActionType.cancel,
        orderIds: ['o1', 'o2', 'o3'],
        notes: 'Cancelled due to system error',
      );
      expect(req.action, BulkActionType.cancel);
      expect(req.orderIds.length, 3);
      expect(req.notes, 'Cancelled due to system error');
    });
  });

  group('BulkActionResult', () {
    test('allSucceeded when no failures', () {
      const result = BulkActionResult(succeeded: 5, failed: 0);
      expect(result.allSucceeded, true);
    });
    test('not allSucceeded when failures exist', () {
      const result = BulkActionResult(succeeded: 3, failed: 2, failedIds: ['o4', 'o5']);
      expect(result.allSucceeded, false);
      expect(result.failedIds.length, 2);
    });
  });

  group('OrderSearchResult', () {
    test('constructs correctly', () {
      const result = OrderSearchResult(orders: [], totalCount: 0);
      expect(result.orders, isEmpty);
      expect(result.hasMore, false);
    });
  });

  group('SortOrder', () {
    test('has 8 sort options', () {
      expect(SortOrder.values.length, 8);
    });
    test('label returns readable string', () {
      expect(SortOrder.newest.label, 'Newest First');
      expect(SortOrder.orderValue.label, 'Order Value');
    });
  });

  group('BulkActionType', () {
    test('has 9 action types', () {
      expect(BulkActionType.values.length, 9);
    });
    test('label returns readable string', () {
      expect(BulkActionType.accept.label, 'Accept');
      expect(BulkActionType.notifyCustomer.label, 'Notify Customer');
    });
    test('icon returns non-null', () {
      for (final a in BulkActionType.values) {
        expect(a.icon, isA<IconData>());
      }
    });
  });

  group('KitchenStation', () {
    test('has 6 stations', () {
      expect(KitchenStation.values.length, 6);
    });
    test('icon returns non-null', () {
      for (final s in KitchenStation.values) {
        expect(s.icon, isA<IconData>());
      }
    });
  });
}
