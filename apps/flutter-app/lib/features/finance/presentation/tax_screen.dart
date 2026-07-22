import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../data/finance_models.dart';

class TaxScreen extends ConsumerStatefulWidget {
  const TaxScreen({super.key});

  @override
  ConsumerState<TaxScreen> createState() => _TaxScreenState();
}

class _TaxScreenState extends ConsumerState<TaxScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final finance = ref.read(financeProvider.notifier);
      finance.loadTaxSettings();
      finance.loadGstSummary();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Tax & GST', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.warning, foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
          unselectedLabelStyle: GoogleFonts.inter(fontSize: 13),
          indicatorColor: Colors.white, labelColor: Colors.white, unselectedLabelColor: Colors.white70,
          tabs: const [Tab(text: 'Settings'), Tab(text: 'GST Summary'), Tab(text: 'Reports')],
        ),
      ),
      body: TabBarView(controller: _tabController, children: [_SettingsTab(), _GstSummaryTab(), _TaxReportsTab()]),
    );
  }
}

class _SettingsTab extends ConsumerStatefulWidget {
  @override
  ConsumerState<_SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends ConsumerState<_SettingsTab> {
  final _gstCtrl = TextEditingController();
  final _panCtrl = TextEditingController();
  final _cgstCtrl = TextEditingController(text: '2.5');
  final _sgstCtrl = TextEditingController(text: '2.5');
  final _igstCtrl = TextEditingController(text: '5.0');
  bool _taxInclusive = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final settings = ref.read(financeProvider.notifier).taxSettings;
      if (settings != null) {
        _gstCtrl.text = settings.gstNumber ?? '';
        _panCtrl.text = settings.panNumber ?? '';
        _cgstCtrl.text = settings.cgstRate.toString();
        _sgstCtrl.text = settings.sgstRate.toString();
        _igstCtrl.text = settings.igstRate.toString();
        _taxInclusive = settings.taxInclusive;
      }
    });
  }

  @override
  void dispose() {
    _gstCtrl.dispose();
    _panCtrl.dispose();
    _cgstCtrl.dispose();
    _sgstCtrl.dispose();
    _igstCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Business Tax Information', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                TextField(controller: _gstCtrl, decoration: const InputDecoration(labelText: 'GST Number', hintText: '22AAAAA0000A1Z5', prefixIcon: Icon(Icons.badge, size: 20))),
                const SizedBox(height: 12),
                TextField(controller: _panCtrl, decoration: const InputDecoration(labelText: 'PAN Number', hintText: 'ABCDE1234F', prefixIcon: Icon(Icons.fingerprint, size: 20))),
              ]),
            ),
          ),
          const SizedBox(height: 20),
          Text('Tax Rates (%)', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                Row(children: [
                  Expanded(child: TextField(controller: _cgstCtrl, decoration: const InputDecoration(labelText: 'CGST Rate %', prefixIcon: Icon(Icons.percent, size: 18)), keyboardType: TextInputType.number)),
                  const SizedBox(width: 12),
                  Expanded(child: TextField(controller: _sgstCtrl, decoration: const InputDecoration(labelText: 'SGST Rate %', prefixIcon: Icon(Icons.percent, size: 18)), keyboardType: TextInputType.number)),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(child: TextField(controller: _igstCtrl, decoration: const InputDecoration(labelText: 'IGST Rate %', prefixIcon: Icon(Icons.percent, size: 18)), keyboardType: TextInputType.number)),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Tax Inclusive', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    const SizedBox(height: 4),
                    Switch(value: _taxInclusive, onChanged: (v) => setState(() => _taxInclusive = v), activeTrackColor: AppColors.warning),
                  ])),
                ]),
              ]),
            ),
          ),
          const SizedBox(height: 20),
          if (_cgstCtrl.text.isNotEmpty && _sgstCtrl.text.isNotEmpty) ...[
            Text('Quick GST Calculator', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _GstCalculator(cgstRate: double.tryParse(_cgstCtrl.text) ?? 2.5, sgstRate: double.tryParse(_sgstCtrl.text) ?? 2.5),
            const SizedBox(height: 20),
          ],
          SizedBox(
            width: double.infinity, height: 44,
            child: ElevatedButton.icon(
              onPressed: _saving ? null : () async {
                setState(() => _saving = true);
                final snackMessenger = ScaffoldMessenger.of(context);
                final success = await ref.read(financeProvider.notifier).updateTaxSettingsEntry({
                  'gstNumber': _gstCtrl.text, 'panNumber': _panCtrl.text,
                  'cgstRate': double.tryParse(_cgstCtrl.text) ?? 2.5,
                  'sgstRate': double.tryParse(_sgstCtrl.text) ?? 2.5,
                  'igstRate': double.tryParse(_igstCtrl.text) ?? 5.0,
                  'taxInclusive': _taxInclusive,
                });
                setState(() => _saving = false);
                if (!mounted) return;
                snackMessenger.showSnackBar(SnackBar(content: Text(success ? 'Settings saved' : 'Failed to save'), backgroundColor: success ? AppColors.success : AppColors.danger));
              },
              icon: Icon(_saving ? Icons.hourglass_empty : Icons.save),
              label: Text(_saving ? 'Saving...' : 'Save Settings'),
            ),
          ),
        ],
      ),
    );
  }
}

class _GstCalculator extends StatefulWidget {
  final double cgstRate;
  final double sgstRate;
  const _GstCalculator({required this.cgstRate, required this.sgstRate});

  @override
  State<_GstCalculator> createState() => _GstCalculatorState();
}

class _GstCalculatorState extends State<_GstCalculator> {
  final _amountCtrl = TextEditingController();
  double _calculatedGst = 0;
  double _totalWithGst = 0;

  void _calculate() {
    final amount = double.tryParse(_amountCtrl.text) ?? 0;
    final cgst = amount * widget.cgstRate / 100;
    final sgst = amount * widget.sgstRate / 100;
    setState(() { _calculatedGst = cgst + sgst; _totalWithGst = amount + _calculatedGst; });
  }

  @override
  void dispose() { _amountCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          Row(children: [
            Expanded(child: TextField(controller: _amountCtrl, decoration: const InputDecoration(labelText: 'Amount (₹)', prefixIcon: Icon(Icons.currency_rupee, size: 18)), keyboardType: TextInputType.number, onChanged: (_) => _calculate())),
          ]),
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
            _calcItem('CGST (${widget.cgstRate}%)', '₹${(_calculatedGst / 2).toStringAsFixed(2)}', AppColors.primary),
            _calcItem('SGST (${widget.sgstRate}%)', '₹${(_calculatedGst / 2).toStringAsFixed(2)}', AppColors.secondary),
            _calcItem('Total GST', '₹${_calculatedGst.toStringAsFixed(2)}', AppColors.warning),
            _calcItem('Total', '₹${_totalWithGst.toStringAsFixed(2)}', AppColors.success),
          ]),
        ]),
      ),
    );
  }

  Widget _calcItem(String label, String value, Color color) {
    return Column(children: [
      Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
      Text(label, style: GoogleFonts.inter(fontSize: 9, color: AppColors.gray500)),
    ]);
  }
}

class _GstSummaryTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final finance = ref.watch(financeProvider);
    final summary = finance.gstSummary;

    if (finance.taxLoading) return const Center(child: CircularProgressIndicator());

    if (summary == null) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.account_balance, size: 48, color: Colors.grey),
        const SizedBox(height: 12), Text('No GST data available', style: GoogleFonts.inter(color: AppColors.gray500)),
        const SizedBox(height: 12),
        ElevatedButton(onPressed: () => finance.loadGstSummary(), child: const Text('Refresh')),
      ]));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('GST Breakdown', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 1.6,
            children: [
              _gstCard('Total GST', '₹${summary.totalTax.toStringAsFixed(2)}', Icons.account_balance, AppColors.warning),
              _gstCard('CGST', '₹${summary.totalCgst.toStringAsFixed(2)}', Icons.pie_chart, AppColors.primary),
              _gstCard('SGST', '₹${summary.totalSgst.toStringAsFixed(2)}', Icons.pie_chart_outline, AppColors.secondary),
              _gstCard('IGST', '₹${summary.totalIgst.toStringAsFixed(2)}', Icons.public, AppColors.info),
            ],
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Additional Details', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  _detailRow('Taxable Transactions', '${summary.taxableTransactions}'),
                  _detailRow('Average GST per Invoice', '₹${summary.avgPerInvoice.toStringAsFixed(2)}'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _gstCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.gray200)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Icon(icon, color: color, size: 22),
        Text(value, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.gray800)),
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
      ]),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray600)),
        Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

class _TaxReportsTab extends ConsumerStatefulWidget {
  @override
  ConsumerState<_TaxReportsTab> createState() => _TaxReportsTabState();
}

class _TaxReportsTabState extends ConsumerState<_TaxReportsTab> {
  DateTimeRange? _dateRange;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadReport());
  }

  Future<void> _loadReport() async {
    final start = _dateRange != null ? DateFormat('yyyy-MM-dd').format(_dateRange!.start) : null;
    final end = _dateRange != null ? DateFormat('yyyy-MM-dd').format(_dateRange!.end) : null;
    await ref.read(financeProvider.notifier).loadFinancialReport('tax', startDate: start, endDate: end);
  }

  @override
  Widget build(BuildContext context) {
    final finance = ref.watch(financeProvider);
    final report = finance.financialReport;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text('Tax Reports', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
            const Spacer(),
            InkWell(
              onTap: () async {
                final picked = await showDateRangePicker(context: context, firstDate: DateTime(2020), lastDate: DateTime.now(), initialDateRange: _dateRange);
                if (picked != null) { setState(() => _dateRange = picked); _loadReport(); }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(border: Border.all(color: AppColors.gray200), borderRadius: BorderRadius.circular(6)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.date_range, size: 16, color: AppColors.warning), const SizedBox(width: 4),
                  Text(_dateRange != null ? '${DateFormat('dd/MM').format(_dateRange!.start)}-${DateFormat('dd/MM').format(_dateRange!.end)}' : 'Select Period',
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.warning, fontWeight: FontWeight.w500)),
                ]),
              ),
            ),
          ]),
          const SizedBox(height: 16),
          if (finance.reportLoading)
            const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
          else if (report != null) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  _reportRow('Total Revenue', '₹${report.totalIncome.toStringAsFixed(2)}', AppColors.success),
                  const Divider(),
                  _reportRow('Total Expenses', '₹${report.totalExpenses.toStringAsFixed(2)}', AppColors.danger),
                  const Divider(),
                  _reportRow('Net Profit', '₹${report.netProfit.toStringAsFixed(2)}', report.netProfit >= 0 ? AppColors.primary : AppColors.danger),
                  const Divider(),
                  _reportRow('Profit Margin', '${report.profitMargin.toStringAsFixed(1)}%', AppColors.info),
                ]),
              ),
            ),
          ] else ...[
            Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.bar_chart, size: 48, color: AppColors.gray300),
              const SizedBox(height: 8), Text('No tax report data', style: GoogleFonts.inter(color: AppColors.gray400)),
            ])),
          ],
        ],
      ),
    );
  }

  Widget _reportRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: GoogleFonts.inter(fontSize: 14, color: AppColors.gray600)),
        Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
      ]),
    );
  }
}
