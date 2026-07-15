/// Application-wide constants for NexaROS
class AppConstants {
  AppConstants._();

  // ─── App Info ───
  static const String appName = 'NexaROS';
  static const String appVersion = '0.1.0';
  static const String appTagline = 'The Complete Restaurant Operating System';

  // ─── API ───
  static const String defaultApiUrl = 'http://localhost:4000/api/v1';
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration apiRetryDelay = Duration(seconds: 2);
  static const int apiMaxRetries = 3;

  // ─── Pagination ───
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // ─── Sync ───
  static const Duration syncInterval = Duration(seconds: 30);
  static const Duration syncRetryInterval = Duration(seconds: 10);
  static const int syncMaxRetries = 5;

  // ─── Orders ───
  static const int maxOrderItems = 50;
  static const int minOrderValue = 1;
  static const double defaultTaxRate = 5.0;
  static const String defaultCurrency = 'INR';

  // ─── Tables ───
  static const int defaultTableCapacity = 4;
  static const int minTableNumber = 1;
  static const int maxTableNumber = 999;

  // ─── Staff ───
  static const int minPinLength = 4;
  static const int maxPinLength = 6;
  static const int defaultShiftDurationMinutes = 480; // 8 hours

  // ─── Inventory ───
  static const double defaultMinimumStock = 10;
  static const int lowStockAlertThreshold = 5;

  // ─── Printers (ESC/POS) ───
  static const int defaultPrinterPort = 9100;
  static const Duration printerTimeout = Duration(seconds: 10);
  static const int printerMaxCharsPerLine = 42;

  // ─── UI ───
  static const Duration debounceDuration = Duration(milliseconds: 300);
  static const Duration searchDelay = Duration(milliseconds: 500);
  static const Duration toastDuration = Duration(seconds: 4);
  static const Duration animationDuration = Duration(milliseconds: 200);

  // ─── Offline ───
  static const int maxOfflineOrders = 100;
  static const int maxSyncQueueSize = 500;
  static const String offlineDbName = 'nexaros_local.db';

  // ─── Date/Time ───
  static const String defaultTimezone = 'Asia/Kolkata';
  static const String dateFormat = 'yyyy-MM-dd';
  static const String timeFormat = 'HH:mm';
  static const String dateTimeFormat = 'yyyy-MM-dd HH:mm:ss';

  // ─── Storage Keys ───
  static const String keyAccessToken = 'access_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyTenantId = 'tenant_id';
  static const String keyBranchId = 'branch_id';
  static const String keyUserId = 'user_id';
  static const String keyLastSyncAt = 'last_sync_at';
  static const String keyPrinterSettings = 'printer_settings';
  static const String keyThemeMode = 'theme_mode';
  static const String keyLanguage = 'language';

  // ─── Business Hours ───
  static const int defaultOpenHour = 9;
  static const int defaultCloseHour = 23;
  static const List<String> weekDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];
}
