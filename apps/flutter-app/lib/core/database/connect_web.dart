import 'package:drift/drift.dart';
import 'package:drift/web.dart';

/// Opens a SQLite database for web platforms using sql.js compiled to WASM.
/// The database is persisted in IndexedDB automatically by the drift web runtime.
/// No additional WASM file setup is required — drift bundles sql.js internally.
QueryExecutor connect() => WebDatabase('nexaros');
