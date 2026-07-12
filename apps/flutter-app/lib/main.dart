import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/app.dart';
import 'core/database/local_database.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize local database for offline support
  final database = LocalDatabase();

  runApp(
    ProviderScope(
      overrides: [
        localDatabaseProvider.overrideWithValue(database),
      ],
      child: const NexaROSApp(),
    ),
  );
}

// Database provider
final localDatabaseProvider = Provider<LocalDatabase>((ref) {
  throw UnimplementedError('Database must be overridden at app startup');
});
