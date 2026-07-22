/// Enterprise export engine for PDF, Excel, CSV, Print.
library;

import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'pdf_export_engine.dart';
import 'excel_export_engine.dart';

/// Export format options
enum ExportFormat { csv, json, pdf, excel }

/// Export configuration
class ExportConfig {
  final String title;
  final List<String> columns;
  final List<Map<String, dynamic>> rows;
  final ExportFormat format;
  final Map<String, String>? columnLabels;
  final List<int>? Function(Map<String, dynamic>)? columnWidths;

  const ExportConfig({
    required this.title,
    required this.columns,
    required this.rows,
    this.format = ExportFormat.csv,
    this.columnLabels,
    this.columnWidths,
  });
}

/// Export result
class ExportResult {
  final String filePath;
  final ExportFormat format;
  final int rowCount;
  final DateTime exportedAt;

  const ExportResult({
    required this.filePath,
    required this.format,
    required this.rowCount,
    required this.exportedAt,
  });
}

/// Enterprise export engine
class ExportEngine {
  /// Export data to CSV format.
  static Future<ExportResult> exportCsv(ExportConfig config) async {
    final buffer = StringBuffer();

    // Header row
    final headers =
        config.columns.map((col) => config.columnLabels?[col] ?? col).toList();
    buffer.writeln(headers.map((h) => _escapeCsvField(h)).join(','));

    // Data rows
    for (final row in config.rows) {
      final values = config.columns.map((col) {
        final value = row[col];
        return _escapeCsvField(value?.toString() ?? '');
      }).toList();
      buffer.writeln(values.join(','));
    }

    final dir = await getApplicationDocumentsDirectory();
    final fileName =
        '${config.title.replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}.csv';
    final file = File('${dir.path}/exports/$fileName');
    await file.parent.create(recursive: true);
    await file.writeAsString(buffer.toString());

    return ExportResult(
      filePath: file.path,
      format: ExportFormat.csv,
      rowCount: config.rows.length,
      exportedAt: DateTime.now(),
    );
  }

  /// Export data to JSON format.
  static Future<ExportResult> exportJson(ExportConfig config) async {
    final data = {
      'title': config.title,
      'exportedAt': DateTime.now().toIso8601String(),
      'rowCount': config.rows.length,
      'columns': config.columns,
      'rows': config.rows,
    };

    final dir = await getApplicationDocumentsDirectory();
    final fileName =
        '${config.title.replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}.json';
    final file = File('${dir.path}/exports/$fileName');
    await file.parent.create(recursive: true);
    await file.writeAsString(jsonEncode(data));

    return ExportResult(
      filePath: file.path,
      format: ExportFormat.json,
      rowCount: config.rows.length,
      exportedAt: DateTime.now(),
    );
  }

  /// Export data to real PDF format.
  static Future<ExportResult> exportPdf(ExportConfig config) async {
    final file = await PdfExportEngine.generate(
      title: config.title,
      columns: config.columns,
      rows: config.rows,
      columnLabels: config.columnLabels,
    );

    return ExportResult(
      filePath: file.path,
      format: ExportFormat.pdf,
      rowCount: config.rows.length,
      exportedAt: DateTime.now(),
    );
  }

  /// Export data to real Excel XLSX format.
  static Future<ExportResult> exportExcel(ExportConfig config) async {
    final file = await ExcelExportEngine.generate(
      title: config.title,
      columns: config.columns,
      rows: config.rows,
      columnLabels: config.columnLabels,
    );

    return ExportResult(
      filePath: file.path,
      format: ExportFormat.excel,
      rowCount: config.rows.length,
      exportedAt: DateTime.now(),
    );
  }

  /// Generate shareable file path for print preview.
  static Future<ExportResult> exportForPrint(ExportConfig config) async {
    final text = toPlainText(config);
    final dir = await getApplicationDocumentsDirectory();
    final fileName = '${config.title.replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}.txt';
    final file = File('${dir.path}/exports/$fileName');
    await file.parent.create(recursive: true);
    await file.writeAsString(text);

    return ExportResult(filePath: file.path, format: ExportFormat.csv, rowCount: config.rows.length, exportedAt: DateTime.now());
  }

  /// Share exported file using platform share sheet.
  static Future<void> shareFile(ExportResult result) async {
    final file = File(result.filePath);
    if (await file.exists()) {
      await Share.shareXFiles([XFile(result.filePath)]);
    }
  }

  /// Print exported data (generates plain text for printing).
  static String toPlainText(ExportConfig config) {
    final buffer = StringBuffer();
    buffer.writeln('═══ ${config.title} ═══');
    buffer.writeln('Exported: ${DateTime.now()}');
    buffer.writeln('Records: ${config.rows.length}');
    buffer.writeln('─' * 40);

    for (final row in config.rows) {
      for (final col in config.columns) {
        final label = config.columnLabels?[col] ?? col;
        buffer.writeln('$label: ${row[col] ?? '-'}');
      }
      buffer.writeln('─' * 40);
    }

    return buffer.toString();
  }

  static String _escapeCsvField(String field) {
    if (field.contains(',') || field.contains('"') || field.contains('\n')) {
      return '"${field.replaceAll('"', '""')}"';
    }
    return field;
  }
}
