class CurrencyUtils {
  /// Default currency symbol mapping
  static const Map<String, String> _currencySymbols = {
    'INR': '₹',
    'USD': '\$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A\$',
    'CAD': 'C\$',
    'SGD': 'S\$',
    'AED': 'د.إ',
    'SAR': '﷼',
  };

  /// Format an amount with currency symbol
  static String format(dynamic amount, [String currency = 'INR']) {
    final num value;
    if (amount is String) {
      value = double.tryParse(amount) ?? 0;
    } else if (amount is int) {
      value = amount.toDouble();
    } else if (amount is double) {
      value = amount;
    } else {
      value = 0;
    }

    final symbol = _currencySymbols[currency] ?? '₹';
    final formatter = _getFormatter(currency);
    return '$symbol${formatter.format(value)}';
  }

  /// Format amount without currency symbol
  static String formatNumber(dynamic amount) {
    final num value;
    if (amount is String) {
      value = double.tryParse(amount) ?? 0;
    } else if (amount is int) {
      value = amount.toDouble();
    } else if (amount is double) {
      value = amount;
    } else {
      value = 0;
    }
    return _getFormatter('INR').format(value);
  }

  /// Get formatter based on currency
  static _CurrencyFormatter _getFormatter(String currency) {
    switch (currency) {
      case 'INR':
      case 'NPR':
      case 'BDT':
      case 'LKR':
        return _IndianFormatter();
      case 'JPY':
        return _NoDecimalFormatter();
      default:
        return _DefaultFormatter();
    }
  }

  /// Parse a currency string back to a number
  static double parse(String? amountStr) {
    if (amountStr == null || amountStr.isEmpty) return 0;
    final cleaned = amountStr.replaceAll(RegExp(r'[^0-9.]'), '');
    return double.tryParse(cleaned) ?? 0;
  }

  /// Calculate GST (India)
  static Map<String, double> calculateGst(double amount, {double cgstRate = 2.5, double sgstRate = 2.5}) {
    final cgst = (amount * cgstRate / 100);
    final sgst = (amount * sgstRate / 100);
    final totalGst = cgst + sgst;
    return {
      'cgst': double.parse(cgst.toStringAsFixed(2)),
      'sgst': double.parse(sgst.toStringAsFixed(2)),
      'totalGst': double.parse(totalGst.toStringAsFixed(2)),
      'totalWithGst': double.parse((amount + totalGst).toStringAsFixed(2)),
    };
  }

  /// Calculate tip amount
  static double calculateTip(double amount, double percentage) {
    return double.parse((amount * percentage / 100).toStringAsFixed(2));
  }

  /// Split bill among people
  static double splitBill(double totalAmount, int people) {
    if (people <= 0) return totalAmount;
    return double.parse((totalAmount / people).toStringAsFixed(2));
  }
}

// Abstract formatter
abstract class _CurrencyFormatter {
  String format(num value);
}

// Default formatter (comma-separated thousands)
class _DefaultFormatter extends _CurrencyFormatter {
  @override
  String format(num value) {
    final parts = value.toStringAsFixed(2).split('.');
    final intPart = parts[0];
    final decimalPart = parts[1];
    final formatted = intPart.replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (match) => '${match.group(1)},',
    );
    return '$formatted.$decimalPart';
  }
}

// Indian numbering system (lakhs, crores)
class _IndianFormatter extends _CurrencyFormatter {
  @override
  String format(num value) {
    final parts = value.toStringAsFixed(2).split('.');
    final intPart = parts[0];
    final decimalPart = parts[1];

    if (intPart.length <= 3) {
      return '$intPart.$decimalPart';
    }

    final lastThree = intPart.substring(intPart.length - 3);
    final remaining = intPart.substring(0, intPart.length - 3);

    final formattedRemaining = remaining.replaceAllMapped(
      RegExp(r'(\d)(?=(\d{2})+(?!\d))'),
      (match) => '${match.group(1)},',
    );

    final formatted = formattedRemaining.isEmpty
        ? lastThree
        : '$formattedRemaining,$lastThree';
    return '$formatted.$decimalPart';
  }
}

// No decimal places (for JPY, etc.)
class _NoDecimalFormatter extends _CurrencyFormatter {
  @override
  String format(num value) {
    return value.toStringAsFixed(0);
  }
}
