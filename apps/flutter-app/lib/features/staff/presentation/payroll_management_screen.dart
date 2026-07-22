import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/staff_models.dart';

class PayrollManagementScreen extends ConsumerStatefulWidget {
  const PayrollManagementScreen({super.key});
  @override
  ConsumerState<PayrollManagementScreen> createState() => _PayrollManagementScreenState();
}

class _PayrollManagementScreenState extends ConsumerState<PayrollManagementScreen> {
  PayrollStatus? _statusFilter;
  String _selectedPeriod = '2026-07';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(staffProvider).loadPayroll(period: _selectedPeriod);
    });
  }

  @override
  Widget build(BuildContext context) {
    final staffProv = ref.watch(staffProvider);
    final payroll = staffProv.state.payrollRecords.where((p) => _statusFilter == null || p.status == _statusFilter).toList();

    final totalNet = payroll.fold(0.0, (sum, p) => sum + p.netPay);
    final totalPaid = payroll.where((p) => p.status == PayrollStatus.paid).fold(0.0, (sum, p) => sum + p.netPay);
    final pending = payroll.where((p) => p.status == PayrollStatus.pending || p.status == PayrollStatus.draft).length;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Payroll Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calculate),
            onPressed: () => _showGeneratePayrollDialog(context),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSummaryBar(totalNet, totalPaid, pending),
          _buildPeriodSelector(),
          _buildFilterChips(),
          Expanded(
            child: staffProv.state.isLoading
                ? const NxFullScreenLoader(message: 'Loading payroll...')
                : payroll.isEmpty
                    ? const NxEmptyState(icon: Icons.payments, title: 'No Payroll Records', subtitle: 'Generate payroll for this period')
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: payroll.length,
                        itemBuilder: (context, i) => _buildPayrollCard(context, payroll[i]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryBar(double totalNet, double totalPaid, int pending) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: AppColors.primary.withOpacity(0.05),
      child: Row(
        children: [
          _summaryItem('Total', '₹${(totalNet / 1000).toStringAsFixed(0)}K', AppColors.primary),
          _summaryItem('Paid', '₹${(totalPaid / 1000).toStringAsFixed(0)}K', AppColors.success),
          _summaryItem('Pending', '$pending', AppColors.warning),
        ],
      ),
    );
  }

  Widget _summaryItem(String label, String value, Color color) {
    return Expanded(
      child: Column(children: [
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
      ]),
    );
  }

  Widget _buildPeriodSelector() {
    final periods = ['2026-07', '2026-06', '2026-05', '2026-04'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: periods.map((p) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: ChoiceChip(
            label: Text(p, style: TextStyle(fontSize: 12, color: _selectedPeriod == p ? Colors.white : AppColors.gray700)),
            selected: _selectedPeriod == p,
            onSelected: (_) {
              setState(() => _selectedPeriod = p);
              ref.read(staffProvider).loadPayroll(period: p);
            },
            selectedColor: AppColors.primary,
            backgroundColor: AppColors.gray100,
          ),
        )).toList(),
      ),
    );
  }

  Widget _buildFilterChips() {
    final filters = [
      (null as PayrollStatus?, 'All'),
      (PayrollStatus.draft, 'Draft'),
      (PayrollStatus.pending, 'Pending'),
      (PayrollStatus.processing, 'Processing'),
      (PayrollStatus.paid, 'Paid'),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Row(
        children: filters.map((f) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: FilterChip(
            label: Text(f.$2, style: TextStyle(fontSize: 11, color: _statusFilter == f.$1 ? Colors.white : AppColors.gray700)),
            selected: _statusFilter == f.$1,
            onSelected: (_) => setState(() => _statusFilter = f.$1),
            selectedColor: AppColors.primary,
            backgroundColor: AppColors.gray100,
            checkmarkColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 2),
          ),
        )).toList(),
      ),
    );
  }

  Widget _buildPayrollCard(BuildContext context, PayrollRecord p) {
    final statusColor = StatusHelpers.payrollStatusColor(p.status);
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                NxAvatar(name: p.employeeName, size: 40),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.employeeName, style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text(p.period, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('₹${p.netPay.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                      child: Text(StatusHelpers.payrollStatusLabel(p.status), style: TextStyle(fontSize: 10, color: statusColor, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                _payrollDetail('Basic', '₹${p.basicSalary.toStringAsFixed(0)}'),
                _payrollDetail('Allowances', '₹${p.allowances.toStringAsFixed(0)}'),
                _payrollDetail('Deductions', '₹${p.deductions.toStringAsFixed(0)}', isNegative: true),
              ],
            ),
            if (p.status == PayrollStatus.pending || p.status == PayrollStatus.draft) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => ref.read(staffProvider).approvePayroll(p.id),
                      child: const Text('Approve'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                      child: const Text('Process'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _payrollDetail(String label, String value, {bool isNegative = false}) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isNegative ? AppColors.danger : AppColors.gray700)),
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.gray500)),
        ],
      ),
    );
  }

  void _showGeneratePayrollDialog(BuildContext context) {
    String period = _selectedPeriod;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Generate Payroll'),
        content: DropdownButtonFormField<String>(
          value: period,
          decoration: const InputDecoration(labelText: 'Period'),
          items: ['2026-07', '2026-06', '2026-05'].map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
          onChanged: (v) => period = v!,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final branchId = ref.read(appStateProvider).branchId ?? '';
              await ref.read(staffProvider).generatePayroll(branchId, period);
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: const Text('Generate'),
          ),
        ],
      ),
    );
  }
}
