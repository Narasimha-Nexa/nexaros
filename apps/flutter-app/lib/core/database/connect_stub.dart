import 'package:drift/drift.dart';

/// Fallback stub — throws if no platform-specific implementation matches.
/// On native (Android/iOS/Linux/macOS/Windows), [connect_native] is used.
/// On web, [connect_web] is used.
QueryExecutor connect() => throw UnimplementedError(
    'No drift database backend available for this platform');
