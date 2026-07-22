/// Enterprise analytics and event tracking foundation with remote delivery.
library;

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Analytics event
class AnalyticsEvent {
  final String name;
  final Map<String, dynamic> properties;
  final DateTime timestamp;

  const AnalyticsEvent({
    required this.name,
    this.properties = const {},
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'properties': properties,
        'timestamp': timestamp.toIso8601String(),
      };
}

/// Screen view event
class ScreenView {
  final String screenName;
  final String? screenClass;
  final DateTime timestamp;

  const ScreenView({
    required this.screenName,
    this.screenClass,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'screenName': screenName,
        if (screenClass != null) 'screenClass': screenClass,
        'timestamp': timestamp.toIso8601String(),
      };
}

/// Enterprise analytics service with optional remote delivery.
class AnalyticsService extends ChangeNotifier {
  final List<AnalyticsEvent> _eventBuffer = [];
  final List<ScreenView> _screenViews = [];
  bool _enabled = true;
  int _flushInterval = 30;
  int _maxBufferSize = 100;
  String? _endpoint;
  String? _authToken;

  Timer? _flushTimer;

  bool get enabled => _enabled;
  List<AnalyticsEvent> get eventBuffer => List.unmodifiable(_eventBuffer);

  /// Initialize analytics with optional remote endpoint.
  void init({
    String? endpoint,
    String? authToken,
    int flushIntervalSeconds = 30,
  }) {
    _endpoint = endpoint;
    _authToken = authToken;
    _flushInterval = flushIntervalSeconds;
    if (_enabled) {
      _startFlushTimer();
    }
  }

  /// Track a custom event.
  void trackEvent(String name, {Map<String, dynamic> properties = const {}}) {
    if (!_enabled) return;

    final event = AnalyticsEvent(
      name: name,
      properties: properties,
      timestamp: DateTime.now(),
    );

    _eventBuffer.add(event);
    if (_eventBuffer.length >= _maxBufferSize) {
      _flushEvents();
    }
    notifyListeners();
  }

  /// Track a screen view.
  void trackScreenView(String screenName, {String? screenClass}) {
    if (!_enabled) return;

    _screenViews.add(ScreenView(
      screenName: screenName,
      screenClass: screenClass,
      timestamp: DateTime.now(),
    ));
    notifyListeners();
  }

  /// Track user action (convenience method).
  void trackAction(String action,
      {String? category, String? label, dynamic value}) {
    trackEvent('user_action', properties: {
      'action': action,
      if (category != null) 'category': category,
      if (label != null) 'label': label,
      if (value != null) 'value': value,
    });
  }

  /// Track performance metric.
  void trackPerformance(String metric, double value, {String? unit}) {
    trackEvent('performance', properties: {
      'metric': metric,
      'value': value,
      if (unit != null) 'unit': unit,
    });
  }

  /// Track errors for crash analytics.
  void trackError(String error, {String? context, StackTrace? stackTrace}) {
    trackEvent('error', properties: {
      'error': error,
      if (context != null) 'context': context,
      if (stackTrace != null) 'stackTrace': stackTrace.toString(),
    });
  }

  /// Enable/disable analytics.
  void setEnabled(bool enabled) {
    _enabled = enabled;
    if (enabled) {
      _startFlushTimer();
    } else {
      _flushTimer?.cancel();
    }
    notifyListeners();
  }

  void _startFlushTimer() {
    _flushTimer?.cancel();
    _flushTimer = Timer.periodic(
        Duration(seconds: _flushInterval), (_) => _flushEvents());
  }

  Future<void> _flushEvents() async {
    if (_eventBuffer.isEmpty) return;

    final eventsToSend = List<AnalyticsEvent>.from(_eventBuffer);
    final screenViewsToSend = List<ScreenView>.from(_screenViews);
    _eventBuffer.clear();
    _screenViews.clear();

    // Remote delivery if endpoint configured
    if (_endpoint != null && eventsToSend.isNotEmpty) {
      try {
        final payload = {
          'events': eventsToSend.map((e) => e.toJson()).toList(),
          'screenViews': screenViewsToSend.map((sv) => sv.toJson()).toList(),
          'batchTimestamp': DateTime.now().toIso8601String(),
        };

        final headers = <String, String>{
          'Content-Type': 'application/json',
        };
        if (_authToken != null) {
          headers['Authorization'] = 'Bearer $_authToken';
        }

        await http.post(
          Uri.parse('$_endpoint/analytics/batch'),
          headers: headers,
          body: jsonEncode(payload),
        ).timeout(const Duration(seconds: 10));
      } catch (e) {
        // Silently fail — re-add to buffer for next flush
        _eventBuffer.addAll(eventsToSend);
        _screenViews.addAll(screenViewsToSend);
      }
    }

    notifyListeners();
  }

  @override
  void dispose() {
    _flushTimer?.cancel();
    _flushEvents();
    super.dispose();
  }
}
