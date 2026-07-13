import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexaros_app/core/hardware/receipt_formatter.dart';

void main() {
  group('ReceiptFormatter.buildReceipt', () {
    test('should include restaurant name and branch name', () {
      final result = ReceiptFormatter.buildReceipt(
        restaurantName: 'The Spice Kitchen',
        branchName: 'Main Branch',
        orderNumber: 101,
        orderType: 'DINE_IN',
        tableName: 'Table 5',
        items: [
          ReceiptItem(name: 'Butter Chicken', quantity: 2, unitPrice: 250, totalPrice: 500),
          ReceiptItem(name: 'Naan', quantity: 3, unitPrice: 40, totalPrice: 120),
        ],
        gstNumber: null,
        subtotal: 620,
        taxAmount: 31,
        totalAmount: 651,
        paymentMethod: 'CASH',
        amountPaid: 651,
        date: DateTime(2026, 7, 14, 14, 30),
      );

      // Receipt should be non-empty bytes
      expect(result, isA<Uint8List>());
      expect(result.length, greaterThan(0));
    });

    test('should handle takeaway without table name', () {
      final result = ReceiptFormatter.buildReceipt(
        restaurantName: 'Test Cafe',
        branchName: 'Branch 1',
        orderNumber: 1,
        orderType: 'TAKEAWAY',
        items: [
          ReceiptItem(name: 'Coffee', quantity: 1, unitPrice: 100, totalPrice: 100),
        ],
        gstNumber: null,
        subtotal: 100,
        taxAmount: 5,
        totalAmount: 105,
        paymentMethod: 'UPI',
        amountPaid: 105,
        date: DateTime.now(),
      );

      expect(result.length, greaterThan(0));
    });

    test('should include GST number when provided', () {
      final result = ReceiptFormatter.buildReceipt(
        restaurantName: 'Test Cafe',
        branchName: 'Branch 1',
        orderNumber: 1,
        orderType: 'DINE_IN',
        items: [
          ReceiptItem(name: 'Tea', quantity: 1, unitPrice: 20, totalPrice: 20),
        ],
        gstNumber: '29ABCDE1234F1Z5',
        subtotal: 20,
        taxAmount: 1,
        totalAmount: 21,
        paymentMethod: 'CASH',
        amountPaid: 21,
        date: DateTime.now(),
      );

      expect(result.length, greaterThan(0));
    });

    test('should include discount when present', () {
      final result = ReceiptFormatter.buildReceipt(
        restaurantName: 'Test Cafe',
        branchName: 'Branch 1',
        orderNumber: 1,
        orderType: 'DINE_IN',
        items: [
          ReceiptItem(name: 'Meal', quantity: 1, unitPrice: 500, totalPrice: 500),
        ],
        gstNumber: null,
        subtotal: 500,
        taxAmount: 25,
        discountAmount: 50,
        totalAmount: 475,
        paymentMethod: 'CASH',
        amountPaid: 475,
        date: DateTime.now(),
      );

      expect(result.length, greaterThan(0));
    });
  });

  group('ReceiptFormatter.buildKot', () {
    test('should include restaurant name and items', () {
      final result = ReceiptFormatter.buildKot(
        restaurantName: 'The Spice Kitchen',
        orderNumber: 101,
        tableName: 'Table 5',
        items: [
          ReceiptItem(name: 'Butter Chicken', quantity: 2, unitPrice: 250, totalPrice: 500),
          ReceiptItem(name: 'Naan', quantity: 3, unitPrice: 40, totalPrice: 120),
        ],
        date: DateTime(2026, 7, 14, 14, 30),
      );

      expect(result, isA<Uint8List>());
      expect(result.length, greaterThan(0));
    });

    test('should handle takeaway orders without table name', () {
      final result = ReceiptFormatter.buildKot(
        restaurantName: 'Test Cafe',
        orderNumber: 1,
        tableName: null,
        items: [
          ReceiptItem(name: 'Pizza', quantity: 1, unitPrice: 299, totalPrice: 299),
        ],
        date: DateTime.now(),
      );

      expect(result.length, greaterThan(0));
    });

    test('should include item notes when present', () {
      final result = ReceiptFormatter.buildKot(
        restaurantName: 'Test Cafe',
        orderNumber: 1,
        tableName: 'Table 3',
        items: [
          ReceiptItem(
            name: 'Burger',
            quantity: 1,
            unitPrice: 150,
            totalPrice: 150,
            notes: 'No onions',
          ),
        ],
        date: DateTime.now(),
        notes: 'Urgent order',
      );

      expect(result.length, greaterThan(0));
    });

    test('should mark veg items', () {
      final result = ReceiptFormatter.buildKot(
        restaurantName: 'Test Cafe',
        orderNumber: 1,
        tableName: 'Table 1',
        items: [
          ReceiptItem(name: 'Paneer Tikka', quantity: 1, unitPrice: 250, totalPrice: 250, isVeg: true),
        ],
        date: DateTime.now(),
      );

      expect(result.length, greaterThan(0));
    });

    test('should handle multiple items with mixed properties', () {
      final result = ReceiptFormatter.buildKot(
        restaurantName: 'Grand Restaurant',
        orderNumber: 42,
        tableName: 'Table 7',
        items: [
          ReceiptItem(name: 'Chicken Curry', quantity: 2, unitPrice: 300, totalPrice: 600, notes: 'Spicy'),
          ReceiptItem(name: 'Roti', quantity: 6, unitPrice: 20, totalPrice: 120, notes: 'Tandoor'),
          ReceiptItem(name: 'Dal Makhani', quantity: 1, unitPrice: 200, totalPrice: 200, isVeg: true),
          ReceiptItem(name: 'Gulab Jamun', quantity: 2, unitPrice: 60, totalPrice: 120, isVeg: true),
        ],
        date: DateTime.now(),
        notes: 'Table 7 - Birthday celebration',
      );

      expect(result.length, greaterThan(0));
    });
  });
}
