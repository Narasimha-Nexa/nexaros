import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/finance_models.dart';
import '../data/finance_service.dart';

class SettlementScreen extends ConsumerStatefulWidget {
  const SettlementScreen({super.key});
  @override
  ConsumerState<SettlementScreen> createState() => _SettlementScreenState();
}

class _SettlementScreenState extends ConsumerState<SettlementScreen> {
  List<Settlement> _settlements = [];
  bool _isLoading = true;
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final service = FinanceService(ref.read(apiClientProvider));
      _settlements = await service.getSettlements();
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _settlements.where((s) => _statusFilter == 'all' || s.status.name == _statusFilter).toList();
    final totalGross = filtered.fold(0.0, (sum, s) => sum + s.grossAmount);
    final totalFees = filtered.fold(0.0, (sum, s) => sum + s.fees);
    final totalNet = filtered.fold(0.0, (sum, s) => sum + s.netAmount);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(title: const Text('Settlement Management')),
      body: _isLoading
          ? const NxFullScreenLoader(message: 'Loading settlements...')
          : Column(
              children: [
                _buildSummary(totalGross, totalFees, totalNet),
                _buildFilterChips(),
                Expanded(
                  child: filtered.isEmpty
                      ? const NxEmptyState(icon: Icons.receipt_long, title: 'No Settlements', subtitle: 'Settlements will appear here')
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filtered.length,
                          itemBuilder: (context, i) => _buildSettlementCard(filtered[i]),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildSummary(double gross, double fees, double net) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: AppColors.primary.withValues(alpha: 0.05),
      child: Row(children: [
        _summaryItem('Gross', FinanceStatusHelpers.formatCurrency(gross), AppColors.primary),
        _summaryItem('Fees', FinanceStatusHelpers.formatCurrency(fees), AppColors.danger),
        _summaryItem('Net', FinanceStatusHelpers.formatCurrency(net), AppColors.success),
      ]),
    );
  }

  Widget _summaryItem(String label, String value, Color color) {
    return Expanded(child: Column(children: [
      Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
      Text(label, style: const TextStyle(fontSize: 11, color: AppColors.gray500)),
    ]));
  }

  Widget _buildFilterChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Row(
        children: ['all', 'pending', 'completed', 'reconciled'].map((f) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: FilterChip(
            label: Text(f.toUpperCase(), style: TextStyle(fontSize: 11, color: _statusFilter == f ? Colors.white : AppColors.gray700)),
            selected: _statusFilter == f,
            onSelected: (_) => setState(() => _statusFilter = f),
            selectedColor: AppColors.primary,
            backgroundColor: AppColors.gray100,
            checkmarkColor: Colors.white,
          ),
        )).toList(),
      ),
    );
  }

  Widget _buildSettlementCard(Settlement s) {
    final statusColor = FinanceStatusHelpers.settlementStatusColor(s.status);
    final providerLabel = FinanceStatusHelpers.settlementProviderLabel(s.provider);
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Text(providerLabel, style: const TextStyle(fontWeight: FontWeight.w600)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                child: Text(FinanceStatusHelpers.settlementStatusLabel(s.status), style: TextStyle(fontSize: 10, color: statusColor, fontWeight: FontWeight.w600)),
              ),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              _settlementStat('Gross', FinanceStatusHelpers.formatCurrency(s.grossAmount)),
              _settlementStat('Fees', FinanceStatusHelpers.formatCurrency(s.fees)),
              _settlementStat('Net', FinanceStatusHelpers.formatCurrency(s.netAmount)),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              Icon(Icons.receipt, size: 14, color: AppColors.gray500),
              const SizedBox(width: 4),
              Text('${s.transactionCount} transactions', style: const TextStyle(fontSize: 11, color: AppColors.gray500)),
              const Spacer(),
              if (s.status == SettlementStatus.pending)
                ElevatedButton(
                  onPressed: () async {
                    final service = FinanceService(ref.read(apiClientProvider));
                    await service.reconcileSettlement(s.id);
                    _loadData();
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.success, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6)),
                  child: const Text('Reconcile', style: TextStyle(fontSize: 11)),
                ),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _settlementStat(String label, String value) {
    return Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      Text(label, style: const TextStyle(fontSize: 10, color: AppColors.gray500)),
    ]));
  }
}
