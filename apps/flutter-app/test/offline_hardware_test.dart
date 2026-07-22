import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexaros_app/core/constants/app_constants.dart';
import 'package:nexaros_app/core/hardware/esc_pos_builder.dart';
import 'package:nexaros_app/core/hardware/printer_service.dart';
import 'package:nexaros_app/core/hardware/receipt_formatter.dart';
import 'package:nexaros_app/core/sync/offline_order_service.dart';
import 'package:nexaros_app/core/sync/offline_payment_service.dart';
import 'package:nexaros_app/core/sync/offline_sync_service.dart';

void main() {
  group('AppConstants - Offline & Sync', () {
    test('sync interval is 30 seconds', () {
      expect(AppConstants.syncInterval, const Duration(seconds: 30));
    });
    test('sync max retries is 5', () {
      expect(AppConstants.syncMaxRetries, 5);
    });
    test('max offline orders is 100', () {
      expect(AppConstants.maxOfflineOrders, 100);
    });
    test('max sync queue size is 500', () {
      expect(AppConstants.maxSyncQueueSize, 500);
    });
    test('lastSyncAt storage key exists', () {
      expect(AppConstants.keyLastSyncAt, 'last_sync_at');
    });
    test('printer timeout is 10 seconds', () {
      expect(AppConstants.printerTimeout, const Duration(seconds: 10));
    });
    test('printer max chars per line is 42', () {
      expect(AppConstants.printerMaxCharsPerLine, 42);
    });
  });

  group('EscPosBuilder', () {
    test('builds basic text receipt', () {
      final bytes = EscPosBuilder()
          .text('Hello World', center: true, bold: true)
          .divider()
          .text('Line 2')
          .build();
      expect(bytes, isNotEmpty);
      expect(bytes, isA<List<int>>());
    });

    test('builds with large font', () {
      final bytes = EscPosBuilder()
          .text('Large', large: true)
          .build();
      expect(bytes, isNotEmpty);
    });

    test('lineItem formats correctly', () {
      final bytes = EscPosBuilder()
          .lineItem('Burger x2', '300.00')
          .build();
      expect(bytes, isNotEmpty);
    });

    test('dashedLine produces output', () {
      final bytes = EscPosBuilder()
          .dashedLine()
          .build();
      expect(bytes, isNotEmpty);
    });

    test('doubleDashedLine produces output', () {
      final bytes = EscPosBuilder()
          .doubleDashedLine()
          .build();
      expect(bytes, isNotEmpty);
    });

    test('buildRaw returns Uint8List', () {
      final bytes = EscPosBuilder()
          .text('Test')
          .buildRaw();
      expect(bytes, isA<List<int>>());
      expect(bytes, isNotEmpty);
    });

    test('empty builder produces minimal output', () {
      final bytes = EscPosBuilder().build();
      // Should at least have init + cut commands
      expect(bytes.length, greaterThan(0));
    });

    test('underline produces output', () {
      final bytes = EscPosBuilder()
          .text('Underlined', underline: true)
          .build();
      expect(bytes, isNotEmpty);
    });

    test('center alignment produces output', () {
      final bytes = EscPosBuilder()
          .text('Center', center: true)
          .build();
      expect(bytes, isNotEmpty);
    });

    test('chain multiple operations', () {
      final bytes = EscPosBuilder()
          .text('Header', center: true, bold: true, large: true)
          .doubleDashedLine()
          .lineItem('Item 1', '100')
          .lineItem('Item 2', '200')
          .dashedLine()
          .text('Total: 300', bold: true)
          .doubleDashedLine()
          .text('Thank you!', center: true)
          .build();
      expect(bytes, isNotEmpty);
      expect(bytes.length, greaterThan(50));
    });
  });

  group('ReceiptFormatter', () {
    test('buildReceipt returns non-empty bytes', () {
      final bytes = ReceiptFormatter.buildReceipt(
        restaurantName: 'Test Restaurant',
        branchName: 'Main Branch',
        gstNumber: '27AABCU9603R1ZM',
        orderNumber: 42,
        orderType: 'DINE_IN',
        items: [
          ReceiptItem(name: 'Burger', quantity: 2, unitPrice: 150.0, totalPrice: 300.0),
          ReceiptItem(name: 'Fries', quantity: 1, unitPrice: 100.0, totalPrice: 100.0, isVeg: true),
        ],
        subtotal: 400.0,
        taxAmount: 20.0,
        discountAmount: 0,
        totalAmount: 420.0,
        paymentMethod: 'Cash',
        amountPaid: 500.0,
        date: DateTime(2025, 7, 16, 10, 30),
      );
      expect(bytes, isNotEmpty);
      expect(bytes, isA<List<int>>());
    });

    test('buildReceipt with discount', () {
      final bytes = ReceiptFormatter.buildReceipt(
        restaurantName: 'Test Restaurant',
        branchName: 'Main',
        gstNumber: null,
        orderNumber: 1,
        orderType: 'TAKEAWAY',
        items: [
          ReceiptItem(name: 'Pizza', quantity: 1, unitPrice: 500.0, totalPrice: 500.0),
        ],
        subtotal: 500.0,
        taxAmount: 25.0,
        discountAmount: 50.0,
        totalAmount: 475.0,
        paymentMethod: 'UPI',
        amountPaid: 475.0,
        date: DateTime(2025, 7, 16),
      );
      expect(bytes, isNotEmpty);
    });

    test('buildKot returns non-empty bytes', () {
      final bytes = ReceiptFormatter.buildKot(
        restaurantName: 'Test Restaurant',
        tableName: 'T5',
        orderNumber: 42,
        items: [
          ReceiptItem(name: 'Burger', quantity: 2, unitPrice: 150, totalPrice: 300, notes: 'No onions'),
          ReceiptItem(name: 'Fries', quantity: 1, unitPrice: 100, totalPrice: 100, isVeg: true),
        ],
        date: DateTime(2025, 7, 16, 10, 30),
      );
      expect(bytes, isNotEmpty);
    });

    test('buildKot without table number', () {
      final bytes = ReceiptFormatter.buildKot(
        restaurantName: 'Test',
        tableName: null,
        orderNumber: 1,
        items: [
          ReceiptItem(name: 'Item', quantity: 1, unitPrice: 100, totalPrice: 100),
        ],
        date: DateTime(2025, 7, 16),
      );
      expect(bytes, isNotEmpty);
    });
  });

  group('OfflineOrderItem', () {
    test('constructs with required fields', () {
      final item = OfflineOrderItem(
        menuItemId: 'm1',
        name: 'Burger',
        quantity: 2,
        unitPrice: 150,
      );
      expect(item.menuItemId, 'm1');
      expect(item.name, 'Burger');
      expect(item.quantity, 2);
      expect(item.unitPrice, 150);
      expect(item.notes, isNull);
    });

    test('constructs with notes', () {
      final item = OfflineOrderItem(
        menuItemId: 'm1',
        name: 'Pizza',
        quantity: 1,
        unitPrice: 500,
        notes: 'Extra cheese',
      );
      expect(item.notes, 'Extra cheese');
    });
  });

  group('OfflineOrderResult', () {
    test('online result', () {
      final result = OfflineOrderResult(
        orderId: 'o123',
        orderNumber: 42,
        isOffline: false,
      );
      expect(result.orderId, 'o123');
      expect(result.orderNumber, 42);
      expect(result.isOffline, false);
    });

    test('offline result', () {
      final result = OfflineOrderResult(
        orderId: 'local-uuid',
        orderNumber: 1,
        isOffline: true,
      );
      expect(result.isOffline, true);
    });
  });

  group('OfflinePaymentResult', () {
    test('constructs correctly', () {
      final result = OfflinePaymentResult(
        paymentId: 'p1',
        isOffline: false,
      );
      expect(result.paymentId, 'p1');
      expect(result.isOffline, false);
    });
  });

  group('OfflineLimitException', () {
    test('has message', () {
      final ex = OfflineLimitException('Max orders reached');
      expect(ex.toString(), 'Max orders reached');
    });
  });

  group('DiscoveredPrinter', () {
    test('toString formats correctly', () {
      final printer = DiscoveredPrinter(
        ip: '192.168.1.100',
        port: 9100,
        responseTimeMs: 45,
      );
      expect(printer.toString(), '192.168.1.100:9100 (45ms)');
    });
  });

  group('Sync queue payload serialization', () {
    test('order payload serializes correctly', () {
      final payload = jsonEncode({
        'localId': 'test-id',
        'branchId': 'b1',
        'type': 'DINE_IN',
        'status': 'PENDING',
        'subtotal': 400.0,
        'totalAmount': 420.0,
        'items': [
          {'menuItemId': 'm1', 'name': 'Burger', 'quantity': 2, 'unitPrice': 150},
        ],
      });
      final decoded = jsonDecode(payload);
      expect(decoded['localId'], 'test-id');
      expect(decoded['items'], isA<List>());
      expect(decoded['items'][0]['name'], 'Burger');
    });

    test('payment payload serializes correctly', () {
      final payload = jsonEncode({
        'localId': 'p1',
        'orderId': 'o1',
        'method': 'CASH',
        'amount': 420.0,
      });
      final decoded = jsonDecode(payload);
      expect(decoded['method'], 'CASH');
      expect(decoded['amount'], 420.0);
    });
  });

  group('SyncStatus enum', () {
    test('has 4 values', () {
      expect(SyncStatus.values.length, 4);
    });
  });

  group('PrinterType enum', () {
    test('has 2 values', () {
      expect(PrinterType.values.length, 2);
    });
    test('network is first', () {
      expect(PrinterType.network.index, 0);
    });
    test('usb is second', () {
      expect(PrinterType.usb.index, 1);
    });
  });
}
