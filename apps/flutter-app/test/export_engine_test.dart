import 'package:flutter_test/flutter_test.dart';
import 'package:nexaros_app/core/export/export_engine.dart';

void main() {
  group('ExportConfig', () {
    test('constructs with required fields', () {
      const config = ExportConfig(
        title: 'Test Report',
        columns: ['name', 'value'],
        rows: [{'name': 'A', 'value': 10}],
      );
      expect(config.title, 'Test Report');
      expect(config.columns.length, 2);
      expect(config.rows.length, 1);
      expect(config.format, ExportFormat.csv);
    });

    test('optional fields default correctly', () {
      const config = ExportConfig(
        title: 'T', columns: [], rows: [],
      );
      expect(config.columnLabels, isNull);
      expect(config.columnWidths, isNull);
    });
  });

  group('ExportResult', () {
    test('constructs correctly', () {
      final r = ExportResult(
        filePath: '/tmp/test.csv',
        format: ExportFormat.csv,
        rowCount: 5,
        exportedAt: DateTime(2025, 1, 1),
      );
      expect(r.filePath, '/tmp/test.csv');
      expect(r.rowCount, 5);
      expect(r.format, ExportFormat.csv);
    });
  });

  group('ExportEngine.toPlainText', () {
    test('includes title and record count', () {
      const config = ExportConfig(
        title: 'Sales Report',
        columns: ['item', 'qty'],
        rows: [
          {'item': 'Burger', 'qty': 12},
          {'item': 'Fries', 'qty': 25},
        ],
      );
      final text = ExportEngine.toPlainText(config);
      expect(text, contains('Sales Report'));
      expect(text, contains('Records: 2'));
      expect(text, contains('Burger'));
      expect(text, contains('Fries'));
    });

    test('uses columnLabels when provided', () {
      const config = ExportConfig(
        title: 'T',
        columns: ['rev'],
        columnLabels: {'rev': 'Revenue'},
        rows: [{'rev': 500}],
      );
      final text = ExportEngine.toPlainText(config);
      expect(text, contains('Revenue: 500'));
    });

    test('shows dash for null values', () {
      const config = ExportConfig(
        title: 'T',
        columns: ['a'],
        rows: [{'a': null}],
      );
      final text = ExportEngine.toPlainText(config);
      expect(text, contains('a: -'));
    });

    test('empty rows produces zero record count', () {
      const config = ExportConfig(title: 'Empty', columns: ['x'], rows: []);
      final text = ExportEngine.toPlainText(config);
      expect(text, contains('Records: 0'));
    });
  });

  group('ExportFormat enum', () {
    test('has all four formats', () {
      expect(ExportFormat.values.length, 4);
      expect(ExportFormat.values, contains(ExportFormat.csv));
      expect(ExportFormat.values, contains(ExportFormat.json));
      expect(ExportFormat.values, contains(ExportFormat.pdf));
      expect(ExportFormat.values, contains(ExportFormat.excel));
    });
  });
}
