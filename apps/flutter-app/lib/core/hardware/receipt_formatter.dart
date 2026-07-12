import 'dart:typed_data';
import 'esc_pos_builder.dart';

class ReceiptFormatter {
  static Uint8List buildReceipt({
    required String restaurantName,
    required String branchName,
    required String? gstNumber,
    required int orderNumber,
    required String orderType,
    String? tableName,
    required List<ReceiptItem> items,
    required double subtotal,
    required double taxAmount,
    double discountAmount = 0,
    required double totalAmount,
    required String paymentMethod,
    required double amountPaid,
    required DateTime date,
  }) {
    final builder = EscPosBuilder()
      ..text(restaurantName, center: true, bold: true, large: true)
      ..text(branchName, center: true)
      ..dashedLine()
      ..lineItem('Order #', '$orderNumber')
      ..lineItem('Type', orderType)
      ..lineItem('Date', '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}')
      ..lineItem('Table', tableName ?? 'N/A')
      ..dashedLine();

    for (final item in items) {
      final qty = item.quantity.toString().padLeft(2, ' ');
      final price = '₹${item.unitPrice.toStringAsFixed(0)}';
      final total = '₹${item.totalPrice.toStringAsFixed(0)}';
      builder.text('$qty x ${item.name}');
      builder.text('    $price    $total');
      if (item.isVeg) {
        builder.text('    [VEG]');
      }
    }

    builder
      ..dashedLine()
      ..lineItem('Subtotal', '₹${subtotal.toStringAsFixed(0)}')
      ..lineItem('Tax', '₹${taxAmount.toStringAsFixed(0)}');

    if (discountAmount > 0) {
      builder.lineItem('Discount', '-₹${discountAmount.toStringAsFixed(0)}');
    }

    builder
      ..doubleDashedLine()
      ..lineItem('TOTAL', '₹${totalAmount.toStringAsFixed(0)}', bold: true)
      ..divider()
      ..lineItem('Payment', paymentMethod)
      ..lineItem('Amount Paid', '₹${amountPaid.toStringAsFixed(0)}')
      ..dashedLine()
      ..text('Thank you!', center: true, bold: true)
      ..text('Visit us again', center: true);

    if (gstNumber != null && gstNumber.isNotEmpty) {
      builder
        ..divider()
        ..text('GST: $gstNumber', center: true);
    }

    return builder.build();
  }

  static Uint8List buildKot({
    required String restaurantName,
    required String? tableName,
    required int orderNumber,
    required List<ReceiptItem> items,
    required DateTime date,
    String? notes,
  }) {
    final builder = EscPosBuilder()
      ..text(restaurantName, center: true, bold: true)
      ..text('KITCHEN ORDER TICKET', center: true, bold: true)
      ..dashedLine()
      ..lineItem('Order #', '$orderNumber')
      ..lineItem('Table', tableName ?? 'Takeaway')
      ..lineItem('Time', '${date.hour}:${date.minute.toString().padLeft(2, '0')}')
      ..dashedLine();

    for (final item in items) {
      final qty = item.quantity.toString().padLeft(2, ' ');
      builder
        ..text('$qty x ${item.name}', bold: true);
      if (item.notes != null && item.notes!.isNotEmpty) {
        builder.text('  Note: ${item.notes}');
      }
      if (item.isVeg) {
        builder.text('  [VEG]', center: false);
      }
    }

    if (notes != null && notes.isNotEmpty) {
      builder
        ..divider()
        ..text('Notes: $notes');
    }

    builder
      ..dashedLine()
      ..text('--- KITCHEN ---', center: true);

    return builder.build();
  }
}

class ReceiptItem {
  final String name;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final bool isVeg;
  final String? notes;

  ReceiptItem({
    required this.name,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.isVeg = false,
    this.notes,
  });
}
