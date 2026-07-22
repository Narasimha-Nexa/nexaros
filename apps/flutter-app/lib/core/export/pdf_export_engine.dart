/// Real PDF export engine using the `pdf` package.
library;

import 'dart:io';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';

/// Enterprise PDF export engine generating native PDF files.
class PdfExportEngine {
  static Future<File> generate({
    required String title,
    required List<String> columns,
    required List<Map<String, dynamic>> rows,
    Map<String, String>? columnLabels,
    String? subtitle,
    PdfPageFormat pageFormat = PdfPageFormat.a4,
  }) async {
    final pdf = pw.Document();

    final headers =
        columns.map((col) => columnLabels?[col] ?? col).toList();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: pageFormat,
        header: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(
              title,
              style: pw.TextStyle(
                fontSize: 18,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
            if (subtitle != null) pw.SizedBox(height: 4),
            if (subtitle != null)
              pw.Text(
                subtitle,
                style: const pw.TextStyle(
                  fontSize: 10,
                  color: PdfColors.grey700,
                ),
              ),
            pw.SizedBox(height: 2),
            pw.Text(
              'Generated: ${DateTime.now().toString().substring(0, 19)}  |  Records: ${rows.length}',
              style: const pw.TextStyle(
                fontSize: 8,
                color: PdfColors.grey600,
              ),
            ),
            pw.Divider(),
          ],
        ),
        footer: (context) => pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(
              'NexaROS — AI-Powered Restaurant Operating System',
              style: const pw.TextStyle(
                fontSize: 7,
                color: PdfColors.grey500,
              ),
            ),
            pw.Text(
              'Page ${context.pageNumber} of ${context.pagesCount}',
              style: const pw.TextStyle(
                fontSize: 7,
                color: PdfColors.grey500,
              ),
            ),
          ],
        ),
        build: (context) => [
          pw.TableHelper.fromTextArray(
            headers: headers,
            data: rows.map((row) {
              return columns.map((col) {
                final value = row[col];
                return value?.toString() ?? '-';
              }).toList();
            }).toList(),
            headerStyle: pw.TextStyle(
              fontSize: 9,
              fontWeight: pw.FontWeight.bold,
            ),
            cellStyle: const pw.TextStyle(fontSize: 8),
            headerDecoration: const pw.BoxDecoration(
              color: PdfColors.grey200,
            ),
            cellAlignment: pw.Alignment.centerLeft,
            headerAlignment: pw.Alignment.centerLeft,
            cellHeight: 24,
          ),
        ],
      ),
    );

    final dir = await getApplicationDocumentsDirectory();
    final fileName =
        '${title.replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}.pdf';
    final file = File('${dir.path}/exports/$fileName');
    await file.parent.create(recursive: true);
    await file.writeAsBytes(await pdf.save());

    return file;
  }
}
