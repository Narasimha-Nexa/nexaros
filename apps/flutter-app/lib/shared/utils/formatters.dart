/// Common formatting utilities for display.
library;

import 'package:intl/intl.dart';

class Formatters {
  static String currency(double amount, {String symbol = '₹', int decimalDigits = 2}) {
    return NumberFormat.currency(
      symbol: symbol,
      decimalDigits: decimalDigits,
    ).format(amount);
  }

  static String number(dynamic value) {
    if (value is double) {
      return NumberFormat('#,##0.##').format(value);
    }
    return NumberFormat('#,##0').format(value ?? 0);
  }

  static String compact(dynamic value) {
    return NumberFormat.compact().format(value ?? 0);
  }

  static String percent(double value, {int decimalDigits = 1}) {
    return '${(value * 100).toStringAsFixed(decimalDigits)}%';
  }

  static String formatDate(DateTime date, {String pattern = 'dd MMM yyyy'}) {
    return DateFormat(pattern).format(date);
  }

  static String dateTime(DateTime date) {
    return DateFormat('dd MMM yyyy, hh:mm a').format(date);
  }

  static String time(DateTime date) {
    return DateFormat('hh:mm a').format(date);
  }

  static String relativeTime(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return formatDate(date);
  }

  static String fileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  static String phone(String raw) {
    final digits = raw.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length == 10) {
      return '(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}';
    }
    return raw;
  }
}
