import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/providers/subscription_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/subscription_models.dart';
import '../data/subscription_service.dart';
import 'coupon_redemption_screen.dart';

final subscriptionServiceProvider = Provider<SubscriptionService>((ref) {
  return SubscriptionService(ref.watch(apiClientProvider));
});

final subscriptionPlansProvider = FutureProvider<List<SubscriptionPlan>>((ref) async {
  final service = ref.watch(subscriptionServiceProvider);
  return service.getAvailablePlans();
});

final subscriptionRecordProvider = FutureProvider<SubscriptionRecord?>((ref) async {
  final service = ref.watch(subscriptionServiceProvider);
  return service.getActiveSubscription();
});

class SubscriptionScreen extends ConsumerStatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  ConsumerState<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends ConsumerState<SubscriptionScreen> {
  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(subscriptionProvider);
    final info = provider.info;
    final plansAsync = ref.watch(subscriptionPlansProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Subscription', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await provider.loadEntitlements();
          ref.invalidate(subscriptionPlansProvider);
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
              _buildPlansSection(plansAsync),
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
    return NxCard(
      elevated: true,
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

  Widget _buildPlansSection(AsyncValue<List<SubscriptionPlan>> plansAsync) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Available Plans', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        plansAsync.when(
          loading: () => const NxFullScreenLoader(),
          error: (e, _) => Center(child: Text('Failed to load plans', style: GoogleFonts.inter(color: AppColors.danger))),
          data: (plans) => plans.isEmpty
              ? const NxEmptyState(icon: Icons.card_giftcard, title: 'No plans available')
              : Column(children: plans.map((plan) => _buildPlanCard(plan)).toList()),
        ),
      ],
    );
  }

  Widget _buildPlanCard(SubscriptionPlan plan) {
    return NxCard(
      margin: const EdgeInsets.only(bottom: 12),
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
                      Text(plan.name, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                      if (plan.description != null)
                        Text(plan.description!, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('₹${plan.price.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    Text('/${billingCycleLabel(plan.billingCycle).toLowerCase()}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: plan.enabledModuleKeys.take(8).map((f) => Chip(
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
                  foregroundColor: AppColors.white,
                ),
                child: Text('Upgrade to ${plan.name}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showUpgradeDialog(SubscriptionPlan plan) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CouponRedemptionScreen(
          planId: plan.id,
          planName: plan.name,
          planPrice: plan.price,
        ),
      ),
    );
  }

  Widget _buildPaymentPromiseCard(SubscriptionProvider provider) {
    final reasonController = TextEditingController();
    final dateController = TextEditingController();

    return NxCard(
      elevated: true,
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
                    final api = ref.read(apiClientProvider);
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
                  foregroundColor: AppColors.white,
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
