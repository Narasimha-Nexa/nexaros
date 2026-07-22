import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimens.dart';
import '../../core/providers/riverpod_providers.dart';
import '../../core/widgets/connectivity_banner.dart';
import '../../core/widgets/subscription_status_bar.dart';
import '../../core/widgets/grace_period_banner.dart';
import '../../core/widgets/branch_switcher.dart';
import '../../core/widgets/sync_status_bar.dart';
import '../../shared/widgets/nx_avatar.dart';

class _NavItem {
  final IconData icon;
  final String label;
  final String route;
  const _NavItem(this.icon, this.label, this.route);
}

const _desktopNavItems = [
  _NavItem(Icons.dashboard, 'Dashboard', '/shell/dashboard'),
  _NavItem(Icons.receipt_long, 'Orders', '/shell/orders'),
  _NavItem(Icons.restaurant_menu, 'Menu', '/shell/menu'),
  _NavItem(Icons.table_restaurant, 'Tables', '/shell/tables'),
  _NavItem(Icons.point_of_sale, 'POS', '/shell/pos'),
  _NavItem(Icons.precision_manufacturing, 'Kitchen', '/shell/kitchen'),
  _NavItem(Icons.people, 'Staff', '/shell/staff'),
  _NavItem(Icons.badge, 'Attendance', '/shell/staff/attendance'),
  _NavItem(Icons.calendar_month, 'Shifts', '/shell/staff/shifts'),
  _NavItem(Icons.inventory_2, 'Inventory', '/shell/inventory'),
  _NavItem(Icons.local_shipping, 'Suppliers', '/shell/inventory/suppliers'),
  _NavItem(Icons.receipt, 'Purchases', '/shell/inventory/purchase-orders'),
  _NavItem(Icons.event, 'Reservations', '/shell/reservations'),
  _NavItem(Icons.people_outline, 'CRM', '/shell/crm'),
  _NavItem(Icons.star, 'Loyalty', '/shell/crm/loyalty'),
  _NavItem(Icons.rate_review, 'Reviews', '/shell/crm/reviews'),
  _NavItem(Icons.local_shipping, 'Delivery', '/shell/delivery'),
  _NavItem(Icons.local_offer, 'Offers', '/shell/offers'),
  _NavItem(Icons.account_balance, 'Finance', '/shell/finance'),
  _NavItem(Icons.analytics, 'Analytics', '/shell/analytics'),
  _NavItem(Icons.bar_chart, 'Reports', '/shell/reports'),
];

const _tabletNavItems = [
  _NavItem(Icons.dashboard, 'Dashboard', '/shell/dashboard'),
  _NavItem(Icons.receipt_long, 'Orders', '/shell/orders'),
  _NavItem(Icons.restaurant_menu, 'Menu', '/shell/menu'),
  _NavItem(Icons.table_restaurant, 'Tables', '/shell/tables'),
  _NavItem(Icons.point_of_sale, 'POS', '/shell/pos'),
  _NavItem(Icons.precision_manufacturing, 'Kitchen', '/shell/kitchen'),
  _NavItem(Icons.people, 'Staff', '/shell/staff'),
  _NavItem(Icons.local_shipping, 'Delivery', '/shell/delivery'),
  _NavItem(Icons.apps, 'More', '/shell/more'),
];

const _mobileNavItems = [
  _NavItem(Icons.dashboard, 'Dashboard', '/shell/dashboard'),
  _NavItem(Icons.receipt_long, 'Orders', '/shell/orders'),
  _NavItem(Icons.restaurant_menu, 'Menu', '/shell/menu'),
  _NavItem(Icons.table_restaurant, 'Tables', '/shell/tables'),
  _NavItem(Icons.point_of_sale, 'POS', '/shell/pos'),
  _NavItem(Icons.local_shipping, 'Delivery', '/shell/delivery'),
  _NavItem(Icons.apps, 'More', '/shell/more'),
];

int _activeIndex(List<_NavItem> items, String location) {
  final path = location.split('?').first;
  for (int i = 0; i < items.length; i++) {
    if (path == items[i].route || path.startsWith('${items[i].route}/')) {
      return i;
    }
  }
  final idx = items.indexWhere((item) => path.startsWith(item.route));
  return idx >= 0 ? idx : 0;
}

/// ──────────────────────────────────────────────────
/// Desktop Shell (sidebar navigation) — dark-mode-safe
/// ──────────────────────────────────────────────────
class DesktopShellBuilder extends ConsumerWidget {
  final Widget child;
  const DesktopShellBuilder({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appState = ref.watch(appStateProvider);
    final subInfo = ref.watch(subscriptionProvider).info;
    final location = GoRouterState.of(context).matchedLocation;
    final selectedIndex = _activeIndex(_desktopNavItems, location);
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Column(
        children: [
          ConnectivityBanner(isOnline: appState.isOnline),
          SubscriptionStatusBar(info: subInfo, onTap: () => context.push('/subscription')),
          GracePeriodBanner(info: subInfo, onUpgrade: () => context.push('/subscription')),
          Expanded(
            child: Row(
              children: [
                Container(
                  width: AppDimens.sidebarWidth,
                  decoration: BoxDecoration(
                    color: cs.surface,
                    border: Border(right: BorderSide(color: cs.outline)),
                  ),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(AppDimens.lg),
                        child: Text(
                          'NexaROS',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: cs.primary,
                          ),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: AppDimens.md),
                        child: BranchSwitcher(),
                      ),
                      const SizedBox(height: AppDimens.xs),
                      const Divider(height: 1),
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(vertical: AppDimens.sm),
                          itemCount: _desktopNavItems.length,
                          itemBuilder: (ctx, i) {
                            final item = _desktopNavItems[i];
                            final isActive = selectedIndex == i;
                            return Container(
                              margin: const EdgeInsets.symmetric(horizontal: AppDimens.sm, vertical: 2),
                              decoration: BoxDecoration(
                                color: isActive
                                    ? cs.primary.withValues(alpha: isDark ? 0.15 : 0.08)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(AppDimens.radiusSm),
                              ),
                              child: ListTile(
                                leading: Icon(
                                  item.icon,
                                  color: isActive ? cs.primary : AppColors.gray500,
                                  size: 20,
                                ),
                                title: Text(
                                  item.label,
                                  style: TextStyle(
                                    color: isActive ? cs.primary : AppColors.gray500,
                                    fontSize: 13,
                                    fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                ),
                                dense: true,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                                onTap: () => context.go(item.route),
                              ),
                            );
                          },
                        ),
                      ),
                      const Divider(height: 1),
                      SyncStatusBar(syncService: appState.sync),
                      const Divider(height: 1),
                      _SidebarLink(icon: Icons.card_membership, label: 'Subscription', onTap: () => context.push('/subscription')),
                      _SidebarLink(icon: Icons.notifications_outlined, label: 'Notifications', onTap: () => context.push('/shell/notifications')),
                      _SidebarLink(icon: Icons.person_outline, label: 'Profile', onTap: () => context.push('/shell/profile')),
                      _SidebarLink(icon: Icons.settings, label: 'Settings', onTap: () => context.push('/shell/settings')),
                      _SidebarLink(icon: Icons.store, label: 'Branches', onTap: () => context.push('/branches')),
                      _SidebarLink(icon: Icons.assignment_ind, label: 'Staff Assignment', onTap: () => context.push('/branches/assign')),
                    ],
                  ),
                ),
                Expanded(child: child),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// ──────────────────────────────────────────────────
/// Tablet Shell (NavigationRail) — dark-mode-safe
/// ──────────────────────────────────────────────────
class TabletShellBuilder extends ConsumerWidget {
  final Widget child;
  const TabletShellBuilder({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subInfo = ref.watch(subscriptionProvider).info;
    final location = GoRouterState.of(context).matchedLocation;
    final selectedIndex = _activeIndex(_tabletNavItems, location);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: Column(
        children: [
          SubscriptionStatusBar(info: subInfo, onTap: () => context.push('/subscription')),
          GracePeriodBanner(info: subInfo, onUpgrade: () => context.push('/subscription')),
          Expanded(
            child: Row(
              children: [
                NavigationRail(
                  selectedIndex: selectedIndex,
                  onDestinationSelected: (i) => context.go(_tabletNavItems[i].route),
                  labelType: NavigationRailLabelType.selected,
                  backgroundColor: cs.surface,
                  leading: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Column(
                      children: [
                        Icon(Icons.restaurant, color: cs.primary, size: 32),
                        const SizedBox(height: 4),
                        Text(
                          'NexaROS',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: cs.primary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const BranchSwitcher(),
                      ],
                    ),
                  ),
                  trailing: Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: IconButton(
                      icon: Icon(Icons.card_membership, color: cs.primary, size: 22),
                      onPressed: () => context.push('/subscription'),
                      tooltip: 'Subscription',
                    ),
                  ),
                  destinations: _tabletNavItems
                      .map((item) => NavigationRailDestination(
                            icon: Icon(item.icon),
                            label: Text(item.label),
                          ))
                      .toList(),
                ),
                const VerticalDivider(width: 1),
                Expanded(child: child),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// ──────────────────────────────────────────────────
/// Mobile Shell (bottom navigation) — dark-mode-safe
/// ──────────────────────────────────────────────────
class MobileShellBuilder extends ConsumerWidget {
  final Widget child;
  const MobileShellBuilder({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appState = ref.watch(appStateProvider);
    final subInfo = ref.watch(subscriptionProvider).info;
    final notifState = ref.watch(notificationsProvider);
    final location = GoRouterState.of(context).matchedLocation;
    final selectedIndex = _activeIndex(_mobileNavItems, location);

    return Scaffold(
      appBar: AppBar(
        title: const BranchSwitcher(),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined, size: 22),
                onPressed: () {
                  ref.read(notificationsProvider.notifier).loadUnreadCount();
                  context.push('/shell/notifications');
                },
                tooltip: 'Notifications',
              ),
              if (notifState.unreadCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: AppColors.danger, shape: BoxShape.circle),
                    child: Text(
                      notifState.unreadCount > 99 ? '99+' : '${notifState.unreadCount}',
                      style: const TextStyle(fontSize: 9, color: Colors.white, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
            ],
          ),
          GestureDetector(
            onTap: () => context.push('/shell/profile'),
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 12),
              child: NxAvatar(name: '', size: 32),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.print, size: 20),
            onPressed: () => context.push('/printer-settings'),
            tooltip: 'Printer Settings',
          ),
        ],
      ),
      body: Column(
        children: [
          ConnectivityBanner(isOnline: appState.isOnline),
          SubscriptionStatusBar(info: subInfo),
          GracePeriodBanner(info: subInfo, onUpgrade: () => context.push('/subscription')),
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: (i) => context.go(_mobileNavItems[i].route),
        destinations: _mobileNavItems
            .map((item) => NavigationDestination(
                  icon: Icon(item.icon),
                  label: item.label,
                ))
            .toList(),
      ),
    );
  }
}

/// ──────────────────────────────────────────────────
/// Sidebar link widget (for DesktopShell) — theme-aware
/// ──────────────────────────────────────────────────
class _SidebarLink extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _SidebarLink({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.gray500, size: 20),
      title: Text(label, style: const TextStyle(fontSize: 14, color: AppColors.gray500)),
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12),
      onTap: onTap,
    );
  }
}
