import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/providers/subscription_provider.dart';
class MoreGridScreen extends ConsumerWidget {
  const MoreGridScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {

    return Scaffold(
      appBar: AppBar(title: const Text('More')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppDimens.base),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Account ──
            _sectionTitle('Account'),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.person, 'Profile', AppColors.primary, '/shell/profile', null),
              _TileData(Icons.notifications_outlined, 'Notifications', AppColors.warning, '/shell/notifications', null),
              _TileData(Icons.card_membership, 'Subscription', AppColors.secondary, '/subscription', null),
            ], ref),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.settings, 'Settings', AppColors.gray600, '/shell/settings', null),
            ], ref),
            const SizedBox(height: AppDimens.xl),

            // ── Operations ──
            _sectionTitle('Operations'),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.precision_manufacturing, 'Kitchen', AppColors.orderPreparing, '/shell/kitchen', 'kitchen'),
              _TileData(Icons.people, 'Staff', AppColors.primary, '/shell/staff', 'staff'),
              _TileData(Icons.badge, 'Attendance', AppColors.success, '/shell/staff/attendance', 'attendance'),
            ], ref),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.calendar_month, 'Shifts', AppColors.secondary, '/shell/staff/shifts', 'shifts'),
              _TileData(Icons.inventory_2, 'Inventory', AppColors.info, '/shell/inventory', 'inventory'),
              _TileData(Icons.local_shipping, 'Suppliers', AppColors.warning, '/shell/inventory/suppliers', 'inventory'),
            ], ref),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.receipt, 'Purchases', AppColors.danger, '/shell/inventory/purchase-orders', 'inventory'),
              _TileData(Icons.event, 'Reservations', AppColors.secondary, '/shell/reservations', 'reservations'),
              _TileData(Icons.local_shipping, 'Delivery', AppColors.info, '/shell/delivery', 'delivery'),
            ], ref),
            const SizedBox(height: AppDimens.xl),

            // ── Marketing & CRM ──
            _sectionTitle('Marketing & CRM'),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.local_offer, 'Coupons', AppColors.secondary, '/shell/offers', 'offers'),
              _TileData(Icons.fastfood, 'Combos', AppColors.warning, '/shell/offers/combos', 'offers'),
              _TileData(Icons.star, 'Loyalty', AppColors.success, '/shell/crm/loyalty', 'crm'),
            ], ref),
            const SizedBox(height: AppDimens.xl),

            // ── Finance & Analytics ──
            _sectionTitle('Finance & Analytics'),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.account_balance, 'Finance', AppColors.secondary, '/shell/finance', 'finance'),
              _TileData(Icons.description, 'Invoices', AppColors.info, '/shell/finance/invoices', 'finance'),
              _TileData(Icons.bar_chart, 'Reports', AppColors.primary, '/shell/reports', 'reports'),
            ], ref),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.analytics, 'Sales', AppColors.primary, '/shell/analytics/sales', 'analytics'),
              _TileData(Icons.people, 'Customers', AppColors.secondary, '/shell/analytics/customers', 'analytics'),
              _TileData(Icons.inventory_2, 'Inventory', AppColors.info, '/shell/analytics/inventory', 'analytics'),
            ], ref),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.badge, 'Staff', AppColors.success, '/shell/analytics/staff', 'analytics'),
              _TileData(Icons.precision_manufacturing, 'Kitchen', AppColors.orderPreparing, '/shell/analytics/kitchen', 'analytics'),
              _TileData(Icons.local_shipping, 'Delivery', Colors.teal, '/shell/analytics/delivery', 'analytics'),
            ], ref),
            const SizedBox(height: AppDimens.xl),

            // ── Administration ──
            _sectionTitle('Administration'),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.store, 'Branches', AppColors.info, '/branches', 'multi_branch'),
              _TileData(Icons.assignment_ind, 'Staff Assign', AppColors.secondary, '/branches/assign', 'multi_branch'),
            ], ref),
            const SizedBox(height: AppDimens.xl),

            // ── AI & Tools ──
            _sectionTitle('AI & Tools'),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.dashboard, 'AI Hub', AppColors.primary, '/shell/ai-dashboard', null),
              _TileData(Icons.chat, 'AI Chat', AppColors.secondary, '/shell/ai-chat', null),
              _TileData(Icons.insights, 'Insights', AppColors.info, '/shell/ai-insights', null),
            ], ref),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.analytics, 'Forecast', AppColors.success, '/shell/ai-forecast', null),
              _TileData(Icons.description, 'Reports', AppColors.warning, '/shell/ai-reports', null),
              _TileData(Icons.account_tree, 'Workflows', AppColors.secondary, '/shell/ai-workflows', null),
            ], ref),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.notifications_active, 'Alerts', AppColors.danger, '/shell/ai-alerts', null),
              _TileData(Icons.search, 'AI Search', AppColors.gray600, '/shell/ai-search', null),
              _TileData(Icons.settings, 'AI Settings', AppColors.gray500, '/shell/ai-settings', null),
            ], ref),
            const SizedBox(height: AppDimens.sm),
            _tileRow(context, [
              _TileData(Icons.help_outline, 'Help Center', AppColors.info, '/shell/support/help', null),
              _TileData(Icons.quiz, 'FAQ', AppColors.secondary, '/shell/support/faq', null),
              _TileData(Icons.support_agent, 'Support', AppColors.primary, '/shell/support', null),
            ], ref),
            const SizedBox(height: AppDimens.xxl),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: AppColors.gray400,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _tileRow(BuildContext context, List<_TileData> tiles, WidgetRef ref) {
    return Row(
      children: tiles.map((tile) => Expanded(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: _buildTile(context, tile, ref),
        ),
      )).toList(),
    );
  }

  Widget _buildTile(BuildContext context, _TileData tile, WidgetRef ref) {
    final subProvider = ref.read(subscriptionProvider);
    final isEnabled = tile.moduleKey == null || subProvider.canAccessFeature(tile.moduleKey!);
    final locked = !isEnabled;
    final cs = Theme.of(context).colorScheme;

    return Material(
      color: locked
          ? cs.outlineVariant.withValues(alpha: 0.5)
          : tile.color.withValues(alpha: Theme.of(context).brightness == Brightness.dark ? 0.15 : 0.08),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          if (locked) {
            _showLockedDialog(context, tile.label, tile.moduleKey, subProvider);
          } else {
            context.push(tile.route);
          }
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(tile.icon, size: 28, color: locked ? AppColors.gray400 : tile.color),
                  if (locked)
                    Positioned(
                      right: -6,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(color: AppColors.danger, shape: BoxShape.circle),
                        child: const Icon(Icons.lock, size: 8, color: Colors.white),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                tile.label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: locked ? AppColors.gray400 : cs.onSurface,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLockedDialog(BuildContext context, String feature, String? moduleKey, SubscriptionProvider subProvider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.lock_outline, color: AppColors.danger, size: 36),
        title: Text('$feature Locked', style: const TextStyle(fontWeight: FontWeight.w600)),
        content: Text(subProvider.getModuleLockReason(moduleKey ?? ''), textAlign: TextAlign.center, style: const TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () { Navigator.of(ctx).pop(); context.push('/subscription'); },
            child: const Text('Upgrade Plan', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.primary)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Cancel', style: TextStyle(color: AppColors.gray500)),
          ),
        ],
      ),
    );
  }
}

class _TileData {
  final IconData icon;
  final String label;
  final Color color;
  final String route;
  final String? moduleKey;
  const _TileData(this.icon, this.label, this.color, this.route, this.moduleKey);
}
