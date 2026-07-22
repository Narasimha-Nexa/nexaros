import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/riverpod_providers.dart';
import '../../../../shared/widgets/shared_widgets.dart';
import '../../pos/data/pos_models.dart';
import '../../pos/providers/pos_provider.dart';

class PosReportScreen extends ConsumerStatefulWidget {
  const PosReportScreen({super.key});

  @override
  ConsumerState<PosReportScreen> createState() => _PosReportScreenState();
}

class _PosReportScreenState extends ConsumerState<PosReportScreen> {
  int _selectedPeriod = 0; // 0: Today, 1: Week, 2: Month
  String _reportType = 'sales'; // sales, payments, items, shifts

  @override
  Widget build(BuildContext context) {
    final pos = ref.watch(posProvider);
    final cs = Theme.of(context).colorScheme;
    final isWide = MediaQuery.of(context).size.width > 900;

    return Scaffold(
      backgroundColor: cs.surface,
      appBar: AppBar(
        title: Text('POS Reports', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        backgroundColor: cs.surface,
        elevation: 0,
        actions: [
          PopupMenuButton<String>(
            icon: Icon(Icons.filter_list, color: cs.onSurface),
            onSelected: (value) => setState(() => _reportType = value),
            itemBuilder: (ctx) => [
              const PopupMenuItem(value: 'sales', child: Text('Sales Summary')),
              const PopupMenuItem(value: 'payments', child: Text('Payment Methods')),
              const PopupMenuItem(value: 'items', child: Text('Top Items')),
              const PopupMenuItem(value: 'shifts', child: Text('Shifts')),
            ],
          ),
          IconButton(
            icon: Icon(Icons.download, color: cs.onSurface),
            onPressed: _exportReport,
            tooltip: 'Export Report',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterBar(cs),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _buildReportContent(pos, cs, isWide),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(bottom: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.3))),
      ),
      child: Row(
        children: [
          Expanded(
            child: SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 0, label: Text('Today'), icon: Icon(Icons.today, size: 16)),
                ButtonSegment(value: 1, label: Text('Week'), icon: Icon(Icons.date_range, size: 16)),
                ButtonSegment(value: 2, label: Text('Month'), icon: Icon(Icons.calendar_month, size: 16)),
              ],
              selected: {_selectedPeriod},
              onSelectionChanged: (v) => setState(() => _selectedPeriod = v.first),
              style: ButtonStyle(
                visualDensity: VisualDensity.compact,
                padding: WidgetStateProperty.all(const EdgeInsets.symmetric(horizontal: 8, vertical: 6)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReportContent(PosProvider pos, ColorScheme cs, bool isWide) {
    switch (_reportType) {
      case 'sales':
        return _buildSalesReport(pos, cs, isWide);
      case 'payments':
        return _buildPaymentsReport(pos, cs, isWide);
      case 'items':
        return _buildItemsReport(pos, cs, isWide);
      case 'shifts':
        return _buildShiftsReport(pos, cs, isWide);
      default:
        return const NxEmptyState(icon: Icons.bar_chart, title: 'Select Report Type');
    }
  }

  Widget _buildSalesReport(PosProvider pos, ColorScheme cs, bool isWide) {
    final billing = pos.state.billing;
    final orderCount = pos.state.auditLog.where((a) => a.action == 'PLACE_ORDER').length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: NxStatCard(
              title: 'Total Sales',
              value: '₹${billing?.totalAmount.toStringAsFixed(0) ?? '0'}',
              icon: Icons.point_of_sale,
              color: AppColors.primary,
            )),
            const SizedBox(width: 8),
            Expanded(child: NxStatCard(
              title: 'Orders',
              value: '$orderCount',
              icon: Icons.receipt_long,
              color: AppColors.success,
            )),
            const SizedBox(width: 8),
            Expanded(child: NxStatCard(
              title: 'Avg Order',
              value: orderCount > 0 && billing != null
                  ? '₹${(billing.totalAmount / orderCount).toStringAsFixed(0)}'
                  : '₹0',
              icon: Icons.trending_up,
              color: AppColors.warning,
            )),
            const SizedBox(width: 8),
            Expanded(child: NxStatCard(
              title: 'Refunds',
              value: '₹0',
              icon: Icons.money_off,
              color: AppColors.danger,
            )),
          ],
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Sales Overview', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                SizedBox(
                  height: 250,
                  child: LineChart(
                    LineChartData(
                      gridData: FlGridData(show: false),
                      titlesData: FlTitlesData(
                        leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40, getTitlesWidget: (v, _) => Text('₹${v.toInt()}', style: GoogleFonts.inter(fontSize: 10)))),
                        bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, _) => Text(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][v.toInt() % 7], style: GoogleFonts.inter(fontSize: 10)))),
                        topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      borderData: FlBorderData(show: false),
                      lineBarsData: [
                        LineChartBarData(
                          spots: const [FlSpot(0, 12000), FlSpot(1, 15000), FlSpot(2, 13000), FlSpot(3, 18000), FlSpot(4, 22000), FlSpot(5, 25000), FlSpot(6, 20000)],
                          isCurved: true,
                          color: AppColors.primary,
                          barWidth: 3,
                          dotData: FlDotData(show: false),
                          belowBarData: BarAreaData(show: true, color: AppColors.primary.withValues(alpha: 0.1)),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentsReport(PosProvider pos, ColorScheme cs, bool isWide) {
    final payments = pos.state.billing?.payments ?? [];
    final methodTotals = <PosPaymentMethod, double>{};

    for (final p in payments) {
      methodTotals[p.method] = (methodTotals[p.method] ?? 0) + p.amount;
    }

    final sortedMethods = methodTotals.entries.toList()..sort((a, b) => b.value.compareTo(a.value));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Payment Methods', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        if (sortedMethods.isEmpty)
          const NxEmptyState(icon: Icons.payment, title: 'No Payments', subtitle: 'Process payments to see breakdown')
        else
          Column(
            children: sortedMethods.map((e) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(backgroundColor: e.key.color.withValues(alpha: 0.15), child: Icon(e.key.icon, color: e.key.color)),
                title: Text(e.key.label, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                trailing: Text('₹${e.value.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16, color: cs.primary)),
              ),
            )).toList(),
          ),
      ],
    );
  }

  Widget _buildItemsReport(PosProvider pos, ColorScheme cs, bool isWide) {
    final itemSales = <String, _ItemSaleData>{};

    for (final entry in pos.state.auditLog) {
      if (entry.action == 'ADD_ITEM' && entry.newValue != null) {
        final name = entry.newValue!['item'] ?? 'Unknown';
        final qty = entry.newValue!['qty'] ?? 1;
        final price = entry.newValue!['price'] ?? 0.0;
        final existing = itemSales[name] ?? _ItemSaleData();
        itemSales[name] = _ItemSaleData(
          quantity: existing.quantity + (qty as int),
          revenue: existing.revenue + ((price as double) * qty),
        );
      }
    }

    final sortedItems = itemSales.entries.toList()..sort((a, b) => b.value.revenue.compareTo(a.value.revenue));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Top Selling Items', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        if (sortedItems.isEmpty)
          const NxEmptyState(icon: Icons.fastfood, title: 'No Item Data', subtitle: 'Process orders to see top items')
        else
          ...sortedItems.take(10).toList().asMap().entries.map((e) {
            final index = e.key;
            final data = e.value;
            return Card(
              margin: const EdgeInsets.only(bottom: 6),
              child: ListTile(
                leading: Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: index < 3 ? AppColors.primary.withValues(alpha: 0.1) : AppColors.gray100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text('${index + 1}', style: GoogleFonts.inter(
                      fontWeight: FontWeight.bold,
                      color: index < 3 ? AppColors.primary : AppColors.gray500,
                    )),
                  ),
                ),
                title: Text(data.key, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                subtitle: Text('${data.value.quantity} sold', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                trailing: Text('₹${data.value.revenue.toStringAsFixed(0)}', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.primary)),
              ),
            );
          }),
      ],
    );
  }

  Widget _buildShiftsReport(PosProvider pos, ColorScheme cs, bool isWide) {
    final shift = pos.state.currentShift;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Shift Report', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        if (shift == null)
          const NxEmptyState(icon: Icons.schedule, title: 'No Active Shift', subtitle: 'Open a shift to see report')
        else
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _shiftRow('Staff', shift.staffName),
                  _shiftRow('Status', shift.status.name.toUpperCase()),
                  _shiftRow('Opened', '${shift.openedAt.day}/${shift.openedAt.month}/${shift.openedAt.year} ${shift.openedAt.hour}:${shift.openedAt.minute.toString().padLeft(2, '0')}'),
                  _shiftRow('Duration', '${shift.duration.inHours}h ${shift.duration.inMinutes % 60}m'),
                  _shiftRow('Opening Balance', '₹${shift.openingBalance.toStringAsFixed(0)}'),
                  _shiftRow('Cash In', '+₹${shift.cashIn.toStringAsFixed(0)}', valueColor: AppColors.success),
                  _shiftRow('Cash Out', '-₹${shift.cashOut.toStringAsFixed(0)}', valueColor: AppColors.danger),
                  _shiftRow('Expected Cash', '₹${shift.expectedCash.toStringAsFixed(0)}', bold: true),
                  _shiftRow('Total Sales', '₹${shift.totalSales.toStringAsFixed(0)}', bold: true),
                  _shiftRow('Transactions', '${shift.totalTransactions}'),
                  if (shift.status == ShiftStatus.closed) ...[
                    _shiftRow('Actual Cash', '₹${(shift.closingBalance ?? 0).toStringAsFixed(0)}', bold: true),
                    _shiftRow('Variance', '₹${(shift.cashVariance).toStringAsFixed(0)}',
                      valueColor: shift.cashVariance >= 0 ? AppColors.success : AppColors.danger),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _shiftRow(String label, String value, {bool bold = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray600)),
          Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: bold ? FontWeight.w700 : FontWeight.w600, color: valueColor)),
        ],
      ),
    );
  }

  void _exportReport() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Exporting $_reportType report...'), backgroundColor: AppColors.primary),
    );
  }
}

class _ItemSaleData {
  final int quantity;
  final double revenue;
  const _ItemSaleData({this.quantity = 0, this.revenue = 0.0});
}
