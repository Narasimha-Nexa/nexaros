import 'package:intl/intl.dart';

class DateUtils {
  static final _timeFormatter = DateFormat('h:mm a');
  static final _dateFormatter = DateFormat('MMM d, yyyy');
  static final _dateTimeFormatter = DateFormat('MMM d, yyyy h:mm a');
  static final _shortDateFormatter = DateFormat('MMM d');
  static final _dayFormatter = DateFormat('EEEE');
  static final _isoFormatter = DateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
  static final _apiDateFormatter = DateFormat('yyyy-MM-dd');
  static final _apiTimeFormatter = DateFormat('HH:mm');

  /// Format a DateTime to a user-friendly time string (e.g., "2:30 PM")
  static String formatTime(DateTime? date) {
    if (date == null) return '--:--';
    return _timeFormatter.format(date);
  }

  /// Format a DateTime to a user-friendly date string (e.g., "Jul 12, 2026")
  static String formatDate(DateTime? date) {
    if (date == null) return '---';
    return _dateFormatter.format(date);
  }

  /// Format a DateTime to a user-friendly date-time string
  static String formatDateTime(DateTime? date) {
    if (date == null) return '---';
    return _dateTimeFormatter.format(date);
  }

  /// Format a DateTime to a short date (e.g., "Jul 12")
  static String formatShortDate(DateTime? date) {
    if (date == null) return '---';
    return _shortDateFormatter.format(date);
  }

  /// Get the day name (e.g., "Monday")
  static String getDayName(DateTime? date) {
    if (date == null) return '---';
    return _dayFormatter.format(date);
  }

  /// Format to ISO string for API calls
  static String toIsoString(DateTime date) {
    return _isoFormatter.format(date);
  }

  /// Format to API date string (yyyy-MM-dd)
  static String toApiDate(DateTime date) {
    return _apiDateFormatter.format(date);
  }

  /// Format to API time string (HH:mm)
  static String toApiTime(DateTime date) {
    return _apiTimeFormatter.format(date);
  }

  /// Get relative time description (e.g., "2 hours ago", "Just now")
  static String timeAgo(DateTime? date) {
    if (date == null) return '';
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return formatShortDate(date);
  }

  /// Check if a date is today
  static bool isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && date.month == now.month && date.day == now.day;
  }

  /// Check if a date is yesterday
  static bool isYesterday(DateTime date) {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return date.year == yesterday.year && date.month == yesterday.month && date.day == yesterday.day;
  }

  /// Get start of day (midnight)
  static DateTime startOfDay(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }

  /// Get end of day (23:59:59.999)
  static DateTime endOfDay(DateTime date) {
    return DateTime(date.year, date.month, date.day, 23, 59, 59, 999);
  }

  /// Parse API date string
  static DateTime? parseApiDate(String dateStr) {
    try {
      return _apiDateFormatter.parse(dateStr);
    } catch (_) {
      return null;
    }
  }

  /// Get a human-readable duration string
  static String formatDuration(int minutes) {
    if (minutes < 60) return '$minutes min';
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    return mins > 0 ? '${hours}h ${mins}m' : '${hours}h';
  }
}
