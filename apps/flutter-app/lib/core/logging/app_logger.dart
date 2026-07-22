/// Enterprise structured logging framework.
library;

import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';

/// Log levels
enum LogLevel { debug, info, warning, error, critical }

/// Structured log entry
class LogEntry {
  final LogLevel level;
  final String message;
  final String? tag;
  final Map<String, dynamic>? data;
  final StackTrace? stackTrace;
  final DateTime timestamp;

  const LogEntry({
    required this.level,
    required this.message,
    this.tag,
    this.data,
    this.stackTrace,
    required this.timestamp,
  });

  @override
  String toString() {
    final tagStr = tag != null ? '[$tag]' : '';
    final dataStr = data != null ? ' $data' : '';
    return '${level.name.toUpperCase()} $tagStr $message$dataStr';
  }
}

/// Enterprise structured logger singleton.
class AppLogger {
  static final AppLogger _instance = AppLogger._();
  factory AppLogger() => _instance;
  AppLogger._();

  final List<LogEntry> _buffer = [];
  LogLevel _minLevel = kDebugMode ? LogLevel.debug : LogLevel.info;
  int _maxBufferSize = 500;

  /// In-memory log buffer for crash reporting / debugging.
  List<LogEntry> get buffer => List.unmodifiable(_buffer);
  LogLevel get minLevel => _minLevel;
  set minLevel(LogLevel level) => _minLevel = level;

  /// Log a debug message.
  void debug(String message, {String? tag, Map<String, dynamic>? data}) {
    _log(LogLevel.debug, message, tag: tag, data: data);
  }

  /// Log an info message.
  void info(String message, {String? tag, Map<String, dynamic>? data}) {
    _log(LogLevel.info, message, tag: tag, data: data);
  }

  /// Log a warning.
  void warning(String message, {String? tag, Map<String, dynamic>? data}) {
    _log(LogLevel.warning, message, tag: tag, data: data);
  }

  /// Log an error.
  void error(String message,
      {String? tag, Map<String, dynamic>? data, StackTrace? stackTrace}) {
    _log(LogLevel.error, message, tag: tag, data: data, stackTrace: stackTrace);
  }

  /// Log a critical error.
  void critical(String message,
      {String? tag, Map<String, dynamic>? data, StackTrace? stackTrace}) {
    _log(LogLevel.critical, message,
        tag: tag, data: data, stackTrace: stackTrace);
  }

  /// Log an API call.
  void apiCall(String method, String url, {Map<String, dynamic>? params}) {
    _log(LogLevel.info, '$method $url', tag: 'API', data: params);
  }

  /// Log an API response.
  void apiResponse(String url, int statusCode, {Duration? duration}) {
    _log(
      statusCode >= 400 ? LogLevel.error : LogLevel.debug,
      'Response $statusCode from $url',
      tag: 'API',
      data: {'statusCode': statusCode, 'duration': duration?.inMilliseconds},
    );
  }

  /// Log performance metric.
  void performance(String operation, Duration duration,
      {Map<String, dynamic>? extra}) {
    _log(LogLevel.info, '$operation took ${duration.inMilliseconds}ms',
        tag: 'PERF', data: extra);
  }

  /// Clear the log buffer.
  void clearBuffer() => _buffer.clear();

  /// Get buffer as exportable text.
  String exportBuffer() {
    return _buffer.map((e) => e.toString()).join('\n');
  }

  void _log(LogLevel level, String message,
      {String? tag, Map<String, dynamic>? data, StackTrace? stackTrace}) {
    if (level.index < _minLevel.index) return;

    final entry = LogEntry(
      level: level,
      message: message,
      tag: tag,
      data: data,
      stackTrace: stackTrace,
      timestamp: DateTime.now(),
    );

    _buffer.add(entry);
    if (_buffer.length > _maxBufferSize) {
      _buffer.removeAt(0);
    }

    if (kDebugMode) {
      developer.log(
        entry.toString(),
        name: tag ?? 'NexaROS',
        level: level.index * 200,
        error: level.index >= LogLevel.error.index ? message : null,
        stackTrace: stackTrace,
      );
    }
  }
}

/// Global logger instance
final logger = AppLogger();
