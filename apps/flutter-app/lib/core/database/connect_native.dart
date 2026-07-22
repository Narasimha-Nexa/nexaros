import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

/// Opens a file-based SQLite database for native platforms (Android/iOS/Linux/macOS/Windows).
/// The database file is stored at `{appDocumentsDir}/nexaros/nexaros.sqlite`.
QueryExecutor connect() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'nexaros', 'nexaros.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
