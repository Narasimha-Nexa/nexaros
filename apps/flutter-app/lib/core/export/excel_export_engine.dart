/// Real Excel/XLSX export engine using the `excel` package.
library;

import 'dart:io';
import 'package:excel/excel.dart';
import 'package:path_provider/path_provider.dart';

/// Enterprise Excel export engine generating native XLSX files.
class ExcelExportEngine {
  static Future<File> generate({
    required String title,
    required List<String> columns,
    required List<Map<String, dynamic>> rows,
    Map<String, String>? columnLabels,
    String? sheetName,
  }) async {
    final excel = Excel.createExcel();
    final name = sheetName ?? (title.length > 31 ? title.substring(0, 31) : title);
    final sheet = excel[name];

    // Remove default sheet if different
    if (excel.sheets.keys.contains('Sheet1') && name != 'Sheet1') {
      excel.delete('Sheet1');
    }

    final headers =
        columns.map((col) => columnLabels?[col] ?? col).toList();

    // Header row with styling
    for (int i = 0; i < headers.length; i++) {
      final cell = sheet.cell(CellIndex.indexByColumnRow(columnIndex: i, rowIndex: 0));
      cell.value = TextCellValue(headers[i]);
      cell.cellStyle = CellStyle(
        bold: true,
        backgroundColorHex: ExcelColor.fromHexString('#F3F4F6'),
        fontSize: 10,
      );
    }

    // Data rows
    for (int rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      final row = rows[rowIdx];
      for (int colIdx = 0; colIdx < columns.length; colIdx++) {
        final value = row[columns[colIdx]];
        final cell = sheet.cell(
            CellIndex.indexByColumnRow(columnIndex: colIdx, rowIndex: rowIdx + 1));
        if (value is num) {
          cell.value = DoubleCellValue(value.toDouble());
        } else if (value is bool) {
          cell.value = BoolCellValue(value);
        } else {
          cell.value = TextCellValue(value?.toString() ?? '-');
        }
        cell.cellStyle = CellStyle(fontSize: 10);
      }
    }

    // Auto-fit column widths
    for (int colIdx = 0; colIdx < columns.length; colIdx++) {
      var maxLen = headers[colIdx].length;
      for (final row in rows) {
        final val = row[columns[colIdx]]?.toString() ?? '-';
        if (val.length > maxLen) maxLen = val.length;
      }
      sheet.setColumnWidth(colIdx, (maxLen + 2).toDouble().clamp(8.0, 40.0));
    }

    // Save to file
    final dir = await getApplicationDocumentsDirectory();
    final fileName =
        '${title.replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}.xlsx';
    final file = File('${dir.path}/exports/$fileName');
    await file.parent.create(recursive: true);

    final bytes = excel.save();
    if (bytes != null) {
      await file.writeAsBytes(bytes);
    }

    return file;
  }
}
