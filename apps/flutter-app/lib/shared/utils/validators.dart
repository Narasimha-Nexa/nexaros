/// Common validation utilities for forms and input.
library;

class Validators {
  static String? email(String? value) {
    if (value == null || value.isEmpty) return 'Email is required';
    final regex = RegExp(r'^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$');
    if (!regex.hasMatch(value)) return 'Enter a valid email';
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.isEmpty) return 'Phone number is required';
    final regex = RegExp(r'^\+?[0-9]{10,15}$');
    if (!regex.hasMatch(value.replaceAll(RegExp(r'[\s\-()]'), ''))) {
      return 'Enter a valid phone number';
    }
    return null;
  }

  static String? required(String? value, {String? fieldName}) {
    if (value == null || value.trim().isEmpty) {
      return '${fieldName ?? 'This field'} is required';
    }
    return null;
  }

  static String? minLength(String? value, int min, {String? fieldName}) {
    if (value == null || value.length < min) {
      return '${fieldName ?? 'Field'} must be at least $min characters';
    }
    return null;
  }

  static String? maxLength(String? value, int max, {String? fieldName}) {
    if (value != null && value.length > max) {
      return '${fieldName ?? 'Field'} must be at most $max characters';
    }
    return null;
  }

  static String? number(String? value, {String? fieldName}) {
    if (value == null || value.isEmpty) return '${fieldName ?? 'Value'} is required';
    if (double.tryParse(value) == null) return 'Enter a valid number';
    return null;
  }

  static String? price(String? value) {
    if (value == null || value.isEmpty) return 'Price is required';
    final parsed = double.tryParse(value);
    if (parsed == null || parsed < 0) return 'Enter a valid price';
    return null;
  }
}
