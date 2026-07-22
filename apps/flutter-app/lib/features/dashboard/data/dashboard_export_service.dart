import 'dart:async';
import '../../../core/export/export_engine.dart';
import 'dashboard_models.dart';

class DashboardExportService {
  static Future<ExportResult> exportOverview(DashboardData data) async {
    final config = ExportConfig(
      title: 'Dashboard Overview',
      format: ExportFormat.csv,
      columns: ['metric', 'value'],
      columnLabels: {'metric': 'Metric', 'value': 'Value'},
      rows: data.kpis.map((kpi) => {
        'metric': kpi.label,
        'value': kpi.value,
      }).toList(),
    );
    return ExportEngine.exportCsv(config);
  }

  static Future<ExportResult> exportSales(DashboardData data, ExportFormat format) async {
    final config = ExportConfig(
      title: 'Sales Report', format: format,
      columns: ['date', 'revenue', 'orders', 'avg_order_value'],
      columnLabels: {'date': 'Date', 'revenue': 'Revenue (₹)', 'orders': 'Orders', 'avg_order_value': 'Avg Order (₹)'},
      rows: data.salesData.map((s) => {
        'date': s.date.toIso8601String().split('T').first,
        'revenue': s.revenue.toStringAsFixed(2),
        'orders': s.orderCount.toString(),
        'avg_order_value': s.avgOrderValue.toStringAsFixed(2),
      }).toList(),
    );
    return _exportByFormat(config, format);
  }

  static Future<ExportResult> exportCategorySales(DashboardData data, ExportFormat format) async {
    final config = ExportConfig(
      title: 'Category Sales', format: format,
      columns: ['category', 'revenue', 'percentage', 'orders'],
      columnLabels: {'category': 'Category', 'revenue': 'Revenue (₹)', 'percentage': 'Share (%)', 'orders': 'Orders'},
      rows: data.categorySales.map((c) => {
        'category': c.category,
        'revenue': c.revenue.toStringAsFixed(2),
        'percentage': c.percentage.toStringAsFixed(1),
        'orders': c.orderCount.toString(),
      }).toList(),
    );
    return _exportByFormat(config, format);
  }

  static Future<ExportResult> exportTopSelling(DashboardData data, ExportFormat format) async {
    final config = ExportConfig(
      title: 'Top Selling Items', format: format,
      columns: ['rank', 'item', 'quantity', 'revenue', 'category'],
      columnLabels: {'rank': '#', 'item': 'Item Name', 'quantity': 'Qty Sold', 'revenue': 'Revenue (₹)', 'category': 'Category'},
      rows: data.topSelling.asMap().entries.map((e) => {
        'rank': (e.key + 1).toString(),
        'item': e.value.name,
        'quantity': e.value.quantity.toString(),
        'revenue': e.value.revenue.toStringAsFixed(2),
        'category': e.value.category ?? '-',
      }).toList(),
    );
    return _exportByFormat(config, format);
  }

  static Future<ExportResult> exportKpis(DashboardData data, ExportFormat format) async {
    final config = ExportConfig(
      title: 'KPI Summary', format: format,
      columns: ['category', 'label', 'value', 'trend'],
      columnLabels: {'category': 'Category', 'label': 'KPI', 'value': 'Value', 'trend': 'Trend'},
      rows: data.kpis.map((kpi) => {
        'category': kpi.category,
        'label': kpi.label,
        'value': kpi.value,
        'trend': '${kpi.changePercent?.toStringAsFixed(1) ?? '-'}% ${kpi.isPositiveTrend ? '↑' : '↓'}',
      }).toList(),
    );
    return _exportByFormat(config, format);
  }

  static Future<ExportResult> exportFinance(DashboardData data, ExportFormat format) async {
    final f = data.financeSummary;
    final config = ExportConfig(
      title: 'Finance Summary', format: format,
      columns: ['metric', 'value'],
      columnLabels: {'metric': 'Metric', 'value': 'Amount (₹)'},
      rows: [
        {'metric': 'Total Revenue', 'value': f.totalRevenue.toStringAsFixed(2)},
        {'metric': 'Total Expenses', 'value': f.totalExpenses.toStringAsFixed(2)},
        {'metric': 'Net Profit', 'value': f.netProfit.toStringAsFixed(2)},
        {'metric': 'Profit Margin', 'value': '${f.profitMargin.toStringAsFixed(1)}%'},
        {'metric': 'Tax Collected', 'value': f.totalTax.toStringAsFixed(2)},
        {'metric': 'Outstanding', 'value': f.outstandingPayments.toStringAsFixed(2)},
        {'metric': 'Refunds', 'value': f.totalRefunds.toStringAsFixed(2)},
      ],
    );
    return _exportByFormat(config, format);
  }

  static Future<ExportResult> exportStaff(DashboardData data, ExportFormat format) async {
    final s = data.staffOverview;
    final config = ExportConfig(
      title: 'Staff Overview', format: format,
      columns: ['metric', 'value'],
      columnLabels: {'metric': 'Metric', 'value': 'Value'},
      rows: [
        {'metric': 'Total Staff', 'value': s.totalStaff.toString()},
        {'metric': 'On Duty', 'value': s.onDuty.toString()},
        {'metric': 'Absent', 'value': s.absent.toString()},
        {'metric': 'Labor Cost %', 'value': '${s.laborCostPercentage.toStringAsFixed(1)}%'},
        {'metric': 'Tips Collected', 'value': '₹${s.totalTips.toStringAsFixed(2)}'},
      ],
    );
    return _exportByFormat(config, format);
  }

  static Future<ExportResult> exportInventory(DashboardData data, ExportFormat format) async {
    final inv = data.inventoryOverview;
    final config = ExportConfig(
      title: 'Inventory Overview', format: format,
      columns: ['metric', 'value'],
      columnLabels: {'metric': 'Metric', 'value': 'Value'},
      rows: [
        {'metric': 'Total Value', 'value': '₹${inv.totalValue.toStringAsFixed(2)}'},
        {'metric': 'Low Stock Items', 'value': inv.lowStockCount.toString()},
        {'metric': 'Out of Stock', 'value': inv.outOfStockCount.toString()},
        {'metric': 'Waste %', 'value': '${inv.wastePercentage.toStringAsFixed(1)}%'},
        {'metric': 'Pending POs', 'value': inv.pendingPurchaseOrders.toString()},
      ],
    );
    return _exportByFormat(config, format);
  }

  static Future<ExportResult> exportNotifications(DashboardData data, ExportFormat format) async {
    final config = ExportConfig(
      title: 'Notifications', format: format,
      columns: ['time', 'title', 'message', 'severity'],
      columnLabels: {'time': 'Time', 'title': 'Title', 'message': 'Message', 'severity': 'Severity'},
      rows: data.notifications.map((n) => {
        'time': n.timestamp.toString(),
        'title': n.title,
        'message': n.message,
        'severity': n.severity,
      }).toList(),
    );
    return _exportByFormat(config, format);
  }

  static Future<void> share(ExportResult result) => ExportEngine.shareFile(result);

  static String exportSummary(ExportResult result) {
    final ext = switch (result.format) {
      ExportFormat.csv => '.csv', ExportFormat.json => '.json',
      ExportFormat.pdf => '.pdf', ExportFormat.excel => '.xlsx',
    };
    return '${result.rowCount} rows exported as $ext at ${result.exportedAt}';
  }

  static Future<ExportResult> _exportByFormat(ExportConfig config, ExportFormat format) async {
    return switch (format) {
      ExportFormat.csv => ExportEngine.exportCsv(config),
      ExportFormat.json => ExportEngine.exportJson(config),
      ExportFormat.pdf => ExportEngine.exportPdf(config),
      ExportFormat.excel => ExportEngine.exportExcel(config),
    };
  }
}
