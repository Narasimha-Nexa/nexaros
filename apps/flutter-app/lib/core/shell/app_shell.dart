/// Unified enterprise AppShell — single entry-point for all shell-wrapped screens.
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../shared/widgets/responsive_layout.dart';
import '../providers/riverpod_providers.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import '../widgets/connectivity_banner.dart';
import '../widgets/subscription_status_bar.dart';
import '../widgets/grace_period_banner.dart';
import '../widgets/branch_switcher.dart';
import '../../shared/widgets/nx_avatar.dart';
import 'command_palette.dart';
import 'enterprise_sidebar.dart';
import 'enterprise_app_bar.dart';
import 'bottom_status_bar.dart';
import 'quick_actions_fab.dart';
import 'right_context_panel.dart';
import 'navigation_config.dart';
import '../../features/settings/presentation/keyboard_shortcuts_help.dart';

/// The main enterprise shell that wraps every authenticated screen.
///
/// Picks the correct adaptive layout (mobile / tablet / desktop) via
/// [ResponsiveLayout] and composes all shell chrome: sidebar, app bar,
/// right-context panel, status bar, command palette overlay, and quick-action FAB.
class AppShell extends ConsumerWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accessibility = ref.watch(accessibilityProvider);

    final rawMediaQuery = MediaQuery.of(context);
    final adaptedData = accessibility.applyTo(rawMediaQuery);

    return Semantics(
      label: 'NexaROS Restaurant Operating System',
      child: MediaQuery(
        data: adaptedData,
        child: Focus(
          autofocus: true,
          onKeyEvent: (node, event) {
            if (event is! KeyDownEvent && event is! KeyRepeatEvent) {
              return KeyEventResult.ignored;
            }
            final ctrl = HardwareKeyboard.instance.isControlPressed ||
                HardwareKeyboard.instance.isMetaPressed;
            final alt = HardwareKeyboard.instance.isAltPressed;
            final shift = HardwareKeyboard.instance.isShiftPressed;
            final registry = ref.read(keyboardShortcutsProvider);
            final match = registry.findMatch(
              event.logicalKey,
              ctrl: ctrl,
              alt: alt,
              shift: shift,
            );
            if (match != null) {
              if (match.id == 'cmd_palette') {
                ref.read(shellProvider.notifier).openSearch();
              } else if (match.id == 'help') {
                registry.toggleHelp();
              } else if (match.id == 'escape') {
                registry.closeHelp();
                ref.read(shellProvider.notifier).closeSearch();
              } else if (match.route != null) {
                context.go(match.route!);
              } else if (match.action != null) {
                match.action!.call();
              }
              return KeyEventResult.handled;
            }
            return KeyEventResult.ignored;
          },
          child: Stack(
            children: [
              ResponsiveLayout(
                mobile: _MobileShell(child: child),
                tablet: _TabletShell(child: child),
                desktop: _DesktopShell(child: child),
              ),
              const KeyboardShortcutsHelp(),
              const CommandPaletteOverlay(),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop shell — full sidebar + app bar + status bar + right panel
// ─────────────────────────────────────────────────────────────────────────────

class _DesktopShell extends ConsumerWidget {
  final Widget child;
  const _DesktopShell({required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shell = ref.watch(shellProvider);
    final appState = ref.watch(appStateProvider);
    final subInfo = ref.watch(subscriptionProvider).info;
    final location = GoRouterState.of(context).matchedLocation;

    return CommandPaletteShortcut(
      child: Scaffold(
        body: Column(
          children: [
            ConnectivityBanner(isOnline: appState.isOnline),
            SubscriptionStatusBar(
              info: subInfo,
              onTap: () => context.push('/subscription'),
            ),
            GracePeriodBanner(
              info: subInfo,
              onUpgrade: () => context.push('/subscription'),
            ),
            Expanded(
              child: Row(
                children: [
                  EnterpriseSidebar(
                    isCollapsed: shell.state.isSidebarCollapsed,
                    onToggleCollapse: () =>
                        ref.read(shellProvider.notifier).toggleSidebar(),
                    currentRoute: location,
                    favoriteIds: ref.read(shellProvider).favoriteIds,
                    recentRoutes: ref.read(shellProvider).recentRoutes,
                  ),
                  Expanded(
                    child: Column(
                      children: [
                        EnterpriseAppBar(
                          currentRoute: location,
                          onMenuTap: () =>
                              ref.read(shellProvider.notifier).toggleSidebar(),
                          onSearchTap: () =>
                              ref.read(shellProvider.notifier).openSearch(),
                          onNotificationTap: () =>
                              context.push('/shell/notifications'),
                          onProfileTap: () =>
                              context.push('/shell/profile'),
                          unreadCount: ref
                              .watch(notificationsProvider)
                              .unreadCount,
                        ),
                        Expanded(child: child),
                      ],
                    ),
                  ),
                  RightContextPanel(
                    child: const SizedBox.shrink(),
                  ),
                ],
              ),
            ),
            BottomStatusBar(
              isOnline: appState.isOnline,
              isConnected: appState.isConnected,
            ),
          ],
        ),
        floatingActionButton: const QuickActionsFab(),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tablet shell — NavigationRail + collapsible sidebar
// ─────────────────────────────────────────────────────────────────────────────

class _TabletShell extends ConsumerWidget {
  final Widget child;
  const _TabletShell({required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shell = ref.watch(shellProvider);
    final subInfo = ref.watch(subscriptionProvider).info;
    final location = GoRouterState.of(context).matchedLocation;
    final isCollapsed = shell.state.isSidebarCollapsed;

    final railItems = NavigationConfig.railItems;
    final selectedIndex = _resolveRailIndex(railItems, location);

    return CommandPaletteShortcut(
      child: Scaffold(
        body: Column(
          children: [
            SubscriptionStatusBar(
              info: subInfo,
              onTap: () => context.push('/subscription'),
            ),
            GracePeriodBanner(
              info: subInfo,
              onUpgrade: () => context.push('/subscription'),
            ),
            Expanded(
              child: Row(
                children: [
                  if (isCollapsed)
                    _buildCompactRail(
                      context,
                      ref,
                      railItems,
                      selectedIndex,
                    )
                  else
                    EnterpriseSidebar(
                      isCollapsed: false,
                      onToggleCollapse: () =>
                          ref.read(shellProvider.notifier).toggleSidebar(),
                      currentRoute: location,
                      favoriteIds: shell.favoriteIds,
                      recentRoutes: shell.recentRoutes,
                    ),
                  const VerticalDivider(width: 1),
                  Expanded(
                    child: Column(
                      children: [
                        EnterpriseAppBar(
                          currentRoute: location,
                          onMenuTap: () =>
                              ref.read(shellProvider.notifier).toggleSidebar(),
                          onSearchTap: () =>
                              ref.read(shellProvider.notifier).openSearch(),
                          onNotificationTap: () =>
                              context.push('/shell/notifications'),
                          onProfileTap: () =>
                              context.push('/shell/profile'),
                          unreadCount: ref
                              .watch(notificationsProvider)
                              .unreadCount,
                        ),
                        Expanded(child: child),
                      ],
                    ),
                  ),
                  RightContextPanel(
                    child: const SizedBox.shrink(),
                  ),
                ],
              ),
            ),
          ],
        ),
        floatingActionButton: const QuickActionsFab(),
      ),
    );
  }

  Widget _buildCompactRail(
    BuildContext context,
    WidgetRef ref,
    List<NavItem> items,
    int selectedIndex,
  ) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      width: AppDimens.railWidth,
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(
          right: BorderSide(color: cs.outline.withValues(alpha: 0.3)),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: cs.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(Icons.restaurant_rounded, color: cs.primary, size: 20),
          ),
          const SizedBox(height: 8),
          const BranchSwitcher(),
          const SizedBox(height: 8),
          const Divider(indent: 12, endIndent: 12),
          Expanded(
            child: NavigationRail(
              selectedIndex: selectedIndex,
              onDestinationSelected: (i) => context.go(items[i].route),
              labelType: NavigationRailLabelType.selected,
              backgroundColor: Colors.transparent,
              leading: const SizedBox.shrink(),
              trailing: const Expanded(child: SizedBox.shrink()),
              destinations: items
                  .map(
                    (item) => NavigationRailDestination(
                      icon: Icon(item.icon),
                      label: Text(item.label),
                    ),
                  )
                  .toList(),
            ),
          ),
          const Divider(indent: 12, endIndent: 12),
          IconButton(
            icon: const Icon(Icons.card_membership_rounded, size: 20),
            onPressed: () => context.push('/subscription'),
            tooltip: 'Subscription',
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile shell — bottom navigation + drawer sidebar
// ─────────────────────────────────────────────────────────────────────────────

class _MobileShell extends ConsumerStatefulWidget {
  final Widget child;
  const _MobileShell({required this.child});

  @override
  ConsumerState<_MobileShell> createState() => _MobileShellState();
}

class _MobileShellState extends ConsumerState<_MobileShell> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  static const _bottomNavItems = [
    _BottomNavItem(Icons.dashboard_rounded, 'Dashboard', '/shell/dashboard'),
    _BottomNavItem(Icons.receipt_long_rounded, 'Orders', '/shell/orders'),
    _BottomNavItem(Icons.point_of_sale_rounded, 'POS', '/shell/pos'),
    _BottomNavItem(Icons.precision_manufacturing_rounded, 'Kitchen', '/shell/kitchen'),
    _BottomNavItem(Icons.grid_view_rounded, 'More', '/shell/more'),
  ];

  @override
  Widget build(BuildContext context) {
    final appState = ref.watch(appStateProvider);
    final subInfo = ref.watch(subscriptionProvider).info;
    final location = GoRouterState.of(context).matchedLocation;
    final selectedIndex = _resolveMobileIndex(_bottomNavItems, location);

    return CommandPaletteShortcut(
      child: Scaffold(
        key: _scaffoldKey,
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.menu_rounded, size: 22),
            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          ),
          title: const BranchSwitcher(),
          actions: [
            IconButton(
              icon: const Icon(Icons.search_rounded, size: 22),
              onPressed: () =>
                  ref.read(shellProvider.notifier).openSearch(),
              tooltip: 'Search (Ctrl+K)',
            ),
            _buildNotificationButton(context, ref),
            GestureDetector(
              onTap: () => context.push('/shell/profile'),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: NxAvatar(name: '', size: 30),
              ),
            ),
            const SizedBox(width: 4),
          ],
        ),
        drawer: _buildDrawer(context),
        body: Column(
          children: [
            ConnectivityBanner(isOnline: appState.isOnline),
            SubscriptionStatusBar(info: subInfo),
            GracePeriodBanner(
              info: subInfo,
              onUpgrade: () => context.push('/subscription'),
            ),
            Expanded(child: widget.child),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: selectedIndex,
          onDestinationSelected: (i) {
            final item = _bottomNavItems[i];
            if (item.label == 'More') {
              _scaffoldKey.currentState?.openDrawer();
            } else {
              context.go(item.route);
            }
          },
          destinations: _bottomNavItems
              .map(
                (item) => NavigationDestination(
                  icon: Icon(item.icon),
                  label: item.label,
                ),
              )
              .toList(),
        ),
        floatingActionButton: const QuickActionsFab(),
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(AppDimens.lg),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Theme.of(context)
                          .colorScheme
                          .primary
                          .withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.restaurant_rounded,
                      color: Theme.of(context).colorScheme.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'NexaROS',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: AppDimens.md),
              child: BranchSwitcher(),
            ),
            const SizedBox(height: AppDimens.sm),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppDimens.sm,
                  vertical: AppDimens.xs,
                ),
                children: NavigationConfig.sidebarGroups.map((group) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (group.label.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                          child: Text(
                            group.label.toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppColors.gray400,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                      ...group.items.map((item) {
                        final isActive = location.startsWith(item.route);
                        final cs = Theme.of(context).colorScheme;
                        final isDark =
                            Theme.of(context).brightness == Brightness.dark;

                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 1),
                          decoration: BoxDecoration(
                            color: isActive
                                ? cs.primary.withValues(
                                    alpha: isDark ? 0.15 : 0.08,
                                  )
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: ListTile(
                            leading: Icon(
                              item.icon,
                              color:
                                  isActive ? cs.primary : AppColors.gray500,
                              size: 20,
                            ),
                            title: Text(
                              item.label,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isActive
                                    ? FontWeight.w600
                                    : FontWeight.w400,
                                color: isActive
                                    ? cs.primary
                                    : AppColors.gray600,
                              ),
                            ),
                            dense: true,
                            contentPadding:
                                const EdgeInsets.symmetric(horizontal: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            onTap: () {
                              Navigator.pop(context);
                              context.go(item.route);
                            },
                          ),
                        );
                      }),
                    ],
                  );
                }).toList(),
              ),
            ),
            const Divider(height: 1),
            _drawerFooterLink(
              context,
              Icons.notifications_outlined,
              'Notifications',
              '/shell/notifications',
            ),
            _drawerFooterLink(
              context,
              Icons.person_outline,
              'Profile',
              '/shell/profile',
            ),
            _drawerFooterLink(
              context,
              Icons.settings_outlined,
              'Settings',
              '/shell/settings',
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _drawerFooterLink(
    BuildContext context,
    IconData icon,
    String label,
    String route,
  ) {
    return ListTile(
      leading: Icon(icon, color: AppColors.gray500, size: 20),
      title: Text(
        label,
        style: const TextStyle(fontSize: 13, color: AppColors.gray600),
      ),
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12),
      onTap: () {
        Navigator.pop(context);
        context.go(route);
      },
    );
  }

  Widget _buildNotificationButton(BuildContext context, WidgetRef ref) {
    final notifState = ref.watch(notificationsProvider);
    return Stack(
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
              decoration: const BoxDecoration(
                color: AppColors.danger,
                shape: BoxShape.circle,
              ),
              child: Text(
                notifState.unreadCount > 99
                    ? '99+'
                    : '${notifState.unreadCount}',
                style: const TextStyle(
                  fontSize: 9,
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

class _BottomNavItem {
  final IconData icon;
  final String label;
  final String route;
  const _BottomNavItem(this.icon, this.label, this.route);
}

int _resolveRailIndex(List<NavItem> items, String location) {
  final path = location.split('?').first;
  for (int i = 0; i < items.length; i++) {
    if (path == items[i].route || path.startsWith('${items[i].route}/')) {
      return i;
    }
  }
  return 0;
}

int _resolveMobileIndex(List<_BottomNavItem> items, String location) {
  final path = location.split('?').first;
  for (int i = 0; i < items.length; i++) {
    if (path == items[i].route || path.startsWith('${items[i].route}/')) {
      return i;
    }
  }
  return 0;
}
