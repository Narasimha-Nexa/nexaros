import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../data/pos_models.dart';
import '../providers/pos_provider.dart';

class ShiftManagementScreen extends ConsumerStatefulWidget {
  const ShiftManagementScreen({super.key});
  @override
  ConsumerState<ShiftManagementScreen> createState() => _ShiftManagementScreenState();
}

class _ShiftManagementScreenState extends ConsumerState<ShiftManagementScreen> {
  final _openingBalanceController = TextEditingController(text: '0');
  final _closingBalanceController = TextEditingController();
  final _cashInAmountController = TextEditingController();
  final _cashInReasonController = TextEditingController();
  final _cashOutAmountController = TextEditingController();
  final _cashOutReasonController = TextEditingController();

  @override
  void dispose() {
    _openingBalanceController.dispose();
    _closingBalanceController.dispose();
    _cashInAmountController.dispose();
    _cashInReasonController.dispose();
    _cashOutAmountController.dispose();
    _cashOutReasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pos = ref.watch(posProvider);
    final shift = pos.state.currentShift;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text('Shift Management', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        backgroundColor: cs.surface,
        elevation: 0,
      ),
      body: shift == null || shift.status == ShiftStatus.closed
          ? _buildOpenShiftView(context, pos, cs)
          : _buildActiveShiftView(context, pos, shift, cs),
    );
  }

  Widget _buildOpenShiftView(BuildContext context, PosProvider pos, ColorScheme cs) {
    return Center(
      child: Card(
        margin: const EdgeInsets.all(24),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.lock_open, size: 48, color: AppColors.primary),
              const SizedBox(height: 16),
              Text('Open Shift', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text('Enter opening cash drawer balance to start your shift',
                style: GoogleFonts.inter(color: cs.outline), textAlign: TextAlign.center),
              const SizedBox(height: 24),
              SizedBox(
                width: 250,
                child: TextField(
                  controller: _openingBalanceController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Opening Balance',
                    prefixText: '₹ ',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: 250,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    final amount = double.tryParse(_openingBalanceController.text) ?? 0;
                    await pos.openShift('current', 'Current User', amount);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Shift opened'), backgroundColor: AppColors.success),
                      );
                    }
                  },
                  icon: const Icon(Icons.play_arrow, size: 18),
                  label: Text('Open Shift', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActiveShiftView(BuildContext context, PosProvider pos, ShiftModel shift, ColorScheme cs) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Shift Status Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle)),
                        const SizedBox(width: 6),
                        Text('ACTIVE', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.success)),
                      ]),
                    ),
                    const Spacer(),
                    Text(shift.staffName, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 16),
                _infoRow('Opened At', '${shift.openedAt.day}/${shift.openedAt.month}/${shift.openedAt.year} ${shift.openedAt.hour}:${shift.openedAt.minute.toString().padLeft(2, '0')}', cs),
                _infoRow('Duration', _formatDuration(shift.duration), cs),
                const Divider(height: 20),
                _infoRow('Opening Balance', '₹${shift.openingBalance.toStringAsFixed(0)}', cs, bold: true),
                _infoRow('Cash In', '+₹${shift.cashIn.toStringAsFixed(0)}', cs, valueColor: AppColors.success),
                _infoRow('Cash Out', '-₹${shift.cashOut.toStringAsFixed(0)}', cs, valueColor: AppColors.danger),
                _infoRow('Expected Cash', '₹${shift.expectedCash.toStringAsFixed(0)}', cs, bold: true),
                _infoRow('Total Sales', '₹${shift.totalSales.toStringAsFixed(0)}', cs),
                _infoRow('Transactions', '${shift.totalTransactions}', cs),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Cash In/Out
        Row(
          children: [
            Expanded(child: _cashActionCard('Cash In', Icons.arrow_downward, AppColors.success, _cashInAmountController, _cashInReasonController, cs, isCashIn: true)),
            const SizedBox(width: 12),
            Expanded(child: _cashActionCard('Cash Out', Icons.arrow_upward, AppColors.danger, _cashOutAmountController, _cashOutReasonController, cs, isCashIn: false)),
          ],
        ),
        const SizedBox(height: 24),

        // Close Shift
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Close Shift', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                TextField(
                  controller: _closingBalanceController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Actual Cash in Drawer',
                    prefixText: '₹ ',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      final actualCash = double.tryParse(_closingBalanceController.text) ?? 0;
                      pos.closeShift(actualCash);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Shift closed'), backgroundColor: AppColors.success),
                      );
                    },
                    icon: const Icon(Icons.stop, size: 18),
                    label: Text('Close Shift', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: AppColors.danger,
                      foregroundColor: Colors.white,
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

  Widget _cashActionCard(String title, IconData icon, Color color,
      TextEditingController amountCtrl, TextEditingController reasonCtrl, ColorScheme cs, {required bool isCashIn}) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
            ]),
            const SizedBox(height: 10),
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                prefixText: '₹ ',
                hintText: 'Amount',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                isDense: true,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: reasonCtrl,
              decoration: InputDecoration(
                hintText: 'Reason',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                isDense: true,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value, ColorScheme cs, {bool bold = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 13, color: cs.outline)),
          Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: bold ? FontWeight.w700 : FontWeight.w600,
            color: valueColor ?? cs.onSurface)),
        ],
      ),
    );
  }

  String _formatDuration(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes % 60;
    return '${h}h ${m}m';
  }
}
