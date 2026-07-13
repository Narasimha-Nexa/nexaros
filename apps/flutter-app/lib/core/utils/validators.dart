class Validators {
  /// Validate email address
  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(value.trim())) {
      return 'Enter a valid email address';
    }
    return null;
  }

  /// Validate password
  static String? password(String? value, {int minLength = 6}) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < minLength) {
      return 'Password must be at least $minLength characters';
    }
    return null;
  }

  /// Validate confirm password matches
  static String? confirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    if (value != password) {
      return 'Passwords do not match';
    }
    return null;
  }

  /// Validate phone number (Indian format)
  static String? phone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Phone number is required';
    }
    final cleaned = value.trim().replaceAll(RegExp(r'[\s\-()]'), '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      return 'Enter a valid phone number';
    }
    if (!RegExp(r'^\+?\d+$').hasMatch(cleaned)) {
      return 'Phone number can only contain digits';
    }
    return null;
  }

  /// Validate required field
  static String? required(String? value, [String fieldName = 'This field']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  /// Validate minimum length
  static String? minLength(String? value, int minLen, [String fieldName = 'This field']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    if (value.trim().length < minLen) {
      return '$fieldName must be at least $minLen characters';
    }
    return null;
  }

  /// Validate maximum length
  static String? maxLength(String? value, int maxLen, [String fieldName = 'This field']) {
    if (value == null || value.trim().isEmpty) {
      return null;
    }
    if (value.trim().length > maxLen) {
      return '$fieldName must not exceed $maxLen characters';
    }
    return null;
  }

  /// Validate numeric input
  static String? numeric(String? value, [String fieldName = 'Value']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    if (!RegExp(r'^\d+(\.\d+)?$').hasMatch(value.trim())) {
      return 'Enter a valid number';
    }
    return null;
  }

  /// Validate positive number
  static String? positiveNumber(String? value, [String fieldName = 'Value']) {
    final numError = numeric(value, fieldName);
    if (numError != null) return numError;
    if (double.tryParse(value!.trim())! <= 0) {
      return '$fieldName must be greater than 0';
    }
    return null;
  }

  /// Validate integer input
  static String? integer(String? value, [String fieldName = 'Value']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    if (!RegExp(r'^\d+$').hasMatch(value.trim())) {
      return 'Enter a valid whole number';
    }
    return null;
  }

  /// Validate GST number (Indian format)
  static String? gstNumber(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // GST is optional
    }
    final gstRegex = RegExp(r'^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$');
    if (!gstRegex.hasMatch(value.trim().toUpperCase())) {
      return 'Enter a valid GST number (e.g., 29ABCDE1234F1Z5)';
    }
    return null;
  }

  /// Validate PIN code (Indian format)
  static String? pinCode(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // PIN is optional
    }
    if (!RegExp(r'^\d{6}$').hasMatch(value.trim())) {
      return 'Enter a valid 6-digit PIN code';
    }
    return null;
  }

  /// Validate IFSC code (Indian bank format)
  static String? ifscCode(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // IFSC is optional
    }
    if (!RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$').hasMatch(value.trim().toUpperCase())) {
      return 'Enter a valid IFSC code';
    }
    return null;
  }

  /// Validate URL
  static String? url(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // URL is optional
    }
    final urlRegex = RegExp(
      r'^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-\.~:/?#[\]@!$&()*+,;=]*)?$',
    );
    if (!urlRegex.hasMatch(value.trim())) {
      return 'Enter a valid URL';
    }
    return null;
  }

  /// Validate UPI ID (Indian format)
  static String? upiId(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // UPI ID is optional
    }
    if (!RegExp(r'^[\w\.\-]+@[\w\.\-]+$').hasMatch(value.trim())) {
      return 'Enter a valid UPI ID (e.g., name@bank)';
    }
    return null;
  }
}
