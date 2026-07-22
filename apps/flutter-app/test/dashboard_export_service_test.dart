import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexaros_app/core/export/export_engine.dart';
import 'package:nexaros_app/features/dashboard/data/dashboard_models.dart';
import 'package:nexaros_app/features/dashboard/data/dashboard_export_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final testData = DashboardData(
    header: ExecutiveHeaderData(
      restaurantName: 'Test Resto',
      branchName: 'Main',
      businessDate: DateTime.now(),
      lastSync: DateTime.now(),
    ),
    kpis: const [
      DashboardKpi(id: '1', label: 'Revenue', value: '₹50K', icon: Icons.attach_money, color: Colors.green, changePercent: 12.5, isPositiveTrend: true, category: 'finance', sparklineData: [10.0, 15.0, 12.0, 18.0, 22.0]),
      DashboardKpi(id: '2', label: 'Orders', value: '84', icon: Icons.receipt, color: Colors.blue, changePercent: -3.2, isPositiveTrend: false, category: 'orders'),
      DashboardKpi(id: '3', label: 'Avg', value: '₹595', icon: Icons.analytics, color: Colors.orange, category: 'general'),
    ],
    salesData: [
      SalesDataPoint(date: DateTime(2025, 7, 15), revenue: 45000, orderCount: 60, avgOrderValue: 750),
      SalesDataPoint(date: DateTime(2025, 7, 16), revenue: 52000, orderCount: 72, avgOrderValue: 722),
    ],
    categorySales: const [
      CategorySales(category: 'Starters', revenue: 35000, orderCount: 50, percentage: 40.2),
      CategorySales(category: 'Mains', revenue: 45000, orderCount: 60, percentage: 51.4),
      CategorySales(category: 'Desserts', revenue: 8000, orderCount: 15, percentage: 8.4),
    ],
    topSelling: const [
      TopSellingItem(id: '1', name: 'Paneer Tikka', quantity: 42, revenue: 12600, category: 'Starters'),
      TopSellingItem(id: '2', name: 'Veg Biryani', quantity: 30, revenue: 9000),
    ],
    financeSummary: const FinanceSummary(
      totalRevenue: 500000, totalExpenses: 300000, netProfit: 200000,
      profitMargin: 40.0, totalTax: 50000, expenseBreakdown: [],
      outstandingPayments: 15000, totalRefunds: 2000,
    ),
    staffOverview: const StaffOverview(
      totalStaff: 15, onDuty: 10, clockedIn: 10, onBreak: 2,
      laborCostPercentage: 28.5, totalTips: 3500, recentActivity: [],
    ),
    inventoryOverview: const InventoryOverview(
      totalValue: 120000, lowStockCount: 5, outOfStockCount: 2,
      wastePercentage: 3.2, pendingPurchaseOrders: 3,
    ),
    notifications: [
      DashboardNotification(
        id: 'n1', title: 'Stock Alert', message: 'Paneer low',
        severity: AlertSeverity.warning, category: 'inventory',
        timestamp: DateTime(2025, 7, 16, 10, 30),
      ),
      DashboardNotification(
        id: 'n2', title: 'Order Ready', message: 'Table 5 order complete',
        severity: AlertSeverity.info, category: 'orders',
        timestamp: DateTime(2025, 7, 16, 10, 35),
      ),
    ],
  );

  group('DashboardExportService.exportSummary', () {
    test('formats result correctly with row count and extension', () {
      final result = ExportResult(
        filePath: '/tmp/test.csv', format: ExportFormat.csv,
        rowCount: 25, exportedAt: DateTime(2025, 7, 16),
      );
      final summary = DashboardExportService.exportSummary(result);
      expect(summary, contains('25'));
      expect(summary, contains('.csv'));
    });

    test('shows correct extension for each format', () {
      final csvResult = ExportResult(filePath: '/tmp/a', format: ExportFormat.csv, rowCount: 1, exportedAt: DateTime.now());
      final jsonResult = ExportResult(filePath: '/tmp/a', format: ExportFormat.json, rowCount: 1, exportedAt: DateTime.now());
      final pdfResult = ExportResult(filePath: '/tmp/a', format: ExportFormat.pdf, rowCount: 1, exportedAt: DateTime.now());
      final excelResult = ExportResult(filePath: '/tmp/a', format: ExportFormat.excel, rowCount: 1, exportedAt: DateTime.now());

      expect(DashboardExportService.exportSummary(csvResult), contains('.csv'));
      expect(DashboardExportService.exportSummary(jsonResult), contains('.json'));
      expect(DashboardExportService.exportSummary(pdfResult), contains('.pdf'));
      expect(DashboardExportService.exportSummary(excelResult), contains('.xlsx'));
    });

    test('includes timestamp in output', () {
      final dt = DateTime(2025, 7, 16, 14, 30);
      final result = ExportResult(filePath: '/tmp/a', format: ExportFormat.csv, rowCount: 10, exportedAt: dt);
      final summary = DashboardExportService.exportSummary(result);
      expect(summary, contains('10'));
      expect(summary, contains('2025'));
    });

    test('handles zero row count', () {
      final result = ExportResult(filePath: '/tmp/a', format: ExportFormat.csv, rowCount: 0, exportedAt: DateTime.now());
      final summary = DashboardExportService.exportSummary(result);
      expect(summary, contains('0'));
    });

    test('handles large row count', () {
      final result = ExportResult(filePath: '/tmp/a', format: ExportFormat.json, rowCount: 999999, exportedAt: DateTime.now());
      final summary = DashboardExportService.exportSummary(result);
      expect(summary, contains('999999'));
    });
  });

  group('DashboardExportService data transformation', () {
    test('test data has expected KPI count', () {
      expect(testData.kpis.length, 3);
    });

    test('test data KPIs have sparkline data', () {
      expect(testData.kpis[0].sparklineData, isNotNull);
      expect(testData.kpis[0].sparklineData!.length, 5);
      expect(testData.kpis[2].sparklineData, isNull);
    });

    test('test data has expected sales data points', () {
      expect(testData.salesData.length, 2);
      expect(testData.salesData[0].revenue, 45000);
      expect(testData.salesData[0].orderCount, 60);
    });

    test('test data has expected category sales', () {
      expect(testData.categorySales.length, 3);
      final totalPercentage = testData.categorySales.fold<double>(0, (sum, c) => sum + c.percentage);
      expect(totalPercentage.toStringAsFixed(1), '100.0');
    });

    test('test data has expected top selling items', () {
      expect(testData.topSelling.length, 2);
      expect(testData.topSelling[0].name, 'Paneer Tikka');
      expect(testData.topSelling[0].quantity, 42);
    });

    test('test data has expected finance summary', () {
      expect(testData.financeSummary.totalRevenue, 500000);
      expect(testData.financeSummary.netProfit, 200000);
      expect(testData.financeSummary.profitMargin, 40.0);
    });

    test('test data has expected notifications', () {
      expect(testData.notifications.length, 2);
      expect(testData.notifications[0].severity, AlertSeverity.warning);
      expect(testData.notifications[1].severity, AlertSeverity.info);
    });

    test('test data KPI categories are correct', () {
      final financeKpis = testData.kpis.where((k) => k.category == 'finance').toList();
      final orderKpis = testData.kpis.where((k) => k.category == 'orders').toList();
      expect(financeKpis.length, 1);
      expect(orderKpis.length, 1);
    });

    test('test data staff overview values', () {
      expect(testData.staffOverview.totalStaff, 15);
      expect(testData.staffOverview.clockedIn, 10);
      expect(testData.staffOverview.onBreak, 2);
    });

    test('test data inventory overview values', () {
      expect(testData.inventoryOverview.totalValue, 120000);
      expect(testData.inventoryOverview.lowStockCount, 5);
      expect(testData.inventoryOverview.outOfStockCount, 2);
    });
  });

  group('DashboardExportService config building', () {
    test('ExportConfig can be built from test data KPIs', () {
      final config = ExportConfig(
        title: 'KPI Export', format: ExportFormat.csv,
        columns: ['label', 'value'],
        rows: testData.kpis.map((k) => {'label': k.label, 'value': k.value}).toList(),
      );
      expect(config.title, 'KPI Export');
      expect(config.rows.length, 3);
      expect(config.rows[0]['label'], 'Revenue');
      expect(config.rows[1]['label'], 'Orders');
    });

    test('ExportConfig can be built from test data sales', () {
      final config = ExportConfig(
        title: 'Sales Export', format: ExportFormat.json,
        columns: ['date', 'revenue', 'orders'],
        rows: testData.salesData.map((s) => {
          'date': s.date.toIso8601String().split('T').first,
          'revenue': s.revenue.toStringAsFixed(2),
          'orders': s.orderCount.toString(),
        }).toList(),
      );
      expect(config.rows.length, 2);
      expect(config.rows[0]['revenue'], '45000.00');
      expect(config.rows[1]['orders'], '72');
    });

    test('ExportConfig can be built from test data category sales', () {
      final config = ExportConfig(
        title: 'Category Export', format: ExportFormat.csv,
        columns: ['category', 'revenue', 'percentage'],
        rows: testData.categorySales.map((c) => {
          'category': c.category,
          'revenue': c.revenue.toStringAsFixed(2),
          'percentage': c.percentage.toStringAsFixed(1),
        }).toList(),
      );
      expect(config.rows.length, 3);
      expect(config.rows[2]['category'], 'Desserts');
      expect(config.rows[2]['percentage'], '8.4');
    });

    test('ExportConfig can be built from test data notifications', () {
      final config = ExportConfig(
        title: 'Notifications Export', format: ExportFormat.csv,
        columns: ['title', 'message', 'severity'],
        rows: testData.notifications.map((n) => {
          'title': n.title, 'message': n.message, 'severity': '${n.severity}',
        }).toList(),
      );
      expect(config.rows.length, 2);
      expect(config.rows[0]['severity'], 'AlertSeverity.warning');
    });
  });
}
