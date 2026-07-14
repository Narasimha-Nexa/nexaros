import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/subscription_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/network/api_client.dart';
import 'coupon_redemption_screen.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  List<dynamic> _plans = [];
  bool _isLoadingPlans = true;
  String? _planError;

  @override
  void initState() {
    super.initState();
    _loadPlans();
  }

  Future<void> _loadPlans() async {
    try {
      final api = context.read<ApiClient>();
      final data = await api.requestWithRetry(() => api.getAvailablePlans());
      if (mounted) {
        setState(() {
          _plans = data is List ? data : (data['plans'] ?? []);
          _isLoadingPlans = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _planError = e.toString(); _isLoadingPlans = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SubscriptionProvider>();
    final info = provider.info;

    return Scaffold(
      appBar: AppBar(
        title: Text('Subscription', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await provider.loadEntitlements();
          await _loadPlans();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildCurrentStatus(info),
              const SizedBox(height: 24),
              _buildEntitlementsGrid(info),
              const SizedBox(height: 24),
              _buildPlansSection(),
              if (info.isGracePeriod || info.isPaymentPending) ...[
                const SizedBox(height: 24),
                _buildPaymentPromiseCard(provider),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentStatus(SubscriptionInfo info) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: info.statusColor.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(info.statusIcon, color: info.statusColor, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(info.statusLabel, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                      if (info.plan != null)
                        Text('Plan: ${info.plan}', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray500)),
                    ],
                  ),
                ),
              ],
            ),
            if (info.daysUntilExpiry != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: info.daysUntilExpiry! <= 3 ? const Color(0xFFFEF2F2) : const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      info.daysUntilExpiry! <= 3 ? Icons.warning : Icons.schedule,
                      size: 14,
                      color: info.daysUntilExpiry! <= 3 ? const Color(0xFFEF4444) : const Color(0xFF3B82F6),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      info.isTrial ? 'Trial ends in ${info.daysUntilExpiry} days' : 'Renews in ${info.daysUntilExpiry} days',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: info.daysUntilExpiry! <= 3 ? const Color(0xFFEF4444) : const Color(0xFF3B82F6),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (info.hasPromise && info.promiseUntil != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.handshake, size: 14, color: Color(0xFFF97316)),
                    const SizedBox(width: 6),
                    Text(
                      'Payment promise until ${_formatDate(info.promiseUntil!)}',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFF97316)),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEntitlementsGrid(SubscriptionInfo info) {
    final modules = <MapEntry<String, bool>>[];
    final moduleLabels = {
      'pos': 'Point of Sale',
      'kitchen': 'Kitchen Display',
      'orders': 'Orders',
      'tables': 'Tables',
      'inventory': 'Inventory',
      'staff': 'Staff',
      'shifts': 'Shifts',
      'attendance': 'Attendance',
      'payments': 'Payments',
      'invoices': 'Invoices',
      'reports': 'Reports',
      'ai_analytics': 'AI Analytics',
      'crm': 'CRM',
      'loyalty': 'Loyalty',
      'qr_ordering': 'QR Ordering',
      'customer_website': 'Customer Website',
      'reservations': 'Reservations',
      'multi_branch': 'Multi-Branch',
    };

    for (final entry in moduleLabels.entries) {
      modules.add(MapEntry(entry.value, info.isModuleEnabled(entry.key)));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Features', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: modules.map((m) {
            final enabled = m.value;
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: enabled ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: enabled ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    enabled ? Icons.check_circle : Icons.cancel,
                    size: 14,
                    color: enabled ? const Color(0xFF16A34A) : AppColors.gray400,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    m.key,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: enabled ? const Color(0xFF16A34A) : AppColors.gray500,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildPlansSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Available Plans', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        if (_isLoadingPlans)
          const Center(child: CircularProgressIndicator())
        else if (_planError != null)
          Center(child: Text(_planError!, style: GoogleFonts.inter(color: AppColors.danger)))
        else if (_plans.isEmpty)
          Center(child: Text('No plans available', style: GoogleFonts.inter(color: AppColors.gray500)))
        else
          ..._plans.map((plan) => _buildPlanCard(plan)),
      ],
    );
  }

  Widget _buildPlanCard(dynamic plan) {
    final price = plan['price'] ?? 0;
    final cycle = plan['billingCycle'] ?? 'MONTHLY';
    final features = <String>[];

    if (plan['entitlements'] != null) {
      for (final e in (plan['entitlements'] as List)) {
        if (e['enabled'] == true) features.add(e['moduleKey'] ?? '');
      }
    }

    return Card(
      elevation: 1,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(plan['name'] ?? '', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                      if (plan['description'] != null)
                        Text(plan['description']!, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('₹${price.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    Text('/${cycle == 'MONTHLY' ? 'mo' : 'yr'}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: features.take(8).map((f) => Chip(
                label: Text(f, style: GoogleFonts.inter(fontSize: 10)),
                backgroundColor: const Color(0xFFEFF6FF),
                padding: EdgeInsets.zero,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
              )).toList(),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _showUpgradeDialog(plan),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                child: Text('Upgrade to ${plan['name']}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showUpgradeDialog(dynamic plan) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CouponRedemptionScreen(
          planId: plan['id'] ?? '',
          planName: plan['name'] ?? '',
          planPrice: (plan['price'] ?? 0).toDouble(),
        ),
      ),
    );
  }

  Widget _buildPaymentPromiseCard(SubscriptionProvider provider) {
    final reasonController = TextEditingController();
    final dateController = TextEditingController();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.handshake, color: Color(0xFFF97316)),
                const SizedBox(width: 8),
                Text('Need more time?', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Request a payment promise to extend your access while you arrange payment.',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray600),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(labelText: 'Reason for delay', border: OutlineInputBorder()),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: dateController,
              decoration: const InputDecoration(
                labelText: 'Expected payment date',
                border: OutlineInputBorder(),
                suffixIcon: Icon(Icons.calendar_today),
              ),
              readOnly: true,
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now().add(const Duration(days: 7)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 90)),
                );
                if (date != null) {
                  dateController.text = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
                }
              },
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (reasonController.text.isEmpty || dateController.text.isEmpty) return;
                  try {
                    final api = context.read<ApiClient>();
                    final tenantId = api.branchId ?? '';
                    await api.createPaymentPromise(tenantId, reasonController.text, dateController.text);
                    await provider.loadEntitlements();
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Payment promise submitted')),
                      );
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error: $e')),
                      );
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF97316),
                  foregroundColor: Colors.white,
                ),
                child: Text('Submit Promise', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}
