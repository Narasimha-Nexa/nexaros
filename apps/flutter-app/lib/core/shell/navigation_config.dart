library;

import 'package:flutter/material.dart';

/// A navigation item definition
class NavItem {
  final String id;
  final String label;
  final IconData icon;
  final IconData? activeIcon;
  final String route;
  final String? parentGroup;
  final int order;
  final bool isDivider;
  final String? badge;
  final bool requiresPermission;
  final String? permission;
  final List<String> allowedRoles;
  final bool isFavorite;
  final bool showInSidebar;
  final bool showInRail;
  final bool showInBottomNav;
  final bool showInCommandPalette;
  final String? tooltip;
  final List<NavItem> children;

  const NavItem({
    required this.id,
    required this.label,
    required this.icon,
    this.activeIcon,
    required this.route,
    this.parentGroup,
    this.order = 0,
    this.isDivider = false,
    this.badge,
    this.requiresPermission = false,
    this.permission,
    this.allowedRoles = const [],
    this.isFavorite = false,
    this.showInSidebar = true,
    this.showInRail = true,
    this.showInBottomNav = false,
    this.showInCommandPalette = true,
    this.tooltip,
    this.children = const [],
  });

  NavItem copyWith({
    String? badge,
    bool? isFavorite,
  }) {
    return NavItem(
      id: id,
      label: label,
      icon: icon,
      activeIcon: activeIcon,
      route: route,
      parentGroup: parentGroup,
      order: order,
      isDivider: isDivider,
      badge: badge ?? this.badge,
      requiresPermission: requiresPermission,
      permission: permission,
      allowedRoles: allowedRoles,
      isFavorite: isFavorite ?? this.isFavorite,
      showInSidebar: showInSidebar,
      showInRail: showInRail,
      showInBottomNav: showInBottomNav,
      showInCommandPalette: showInCommandPalette,
      tooltip: tooltip,
      children: children,
    );
  }
}

/// Navigation group for sidebar sections
class NavGroup {
  final String id;
  final String label;
  final IconData? icon;
  final List<NavItem> items;
  final bool collapsible;
  final bool isExpanded;

  const NavGroup({
    required this.id,
    required this.label,
    this.icon,
    this.items = const [],
    this.collapsible = true,
    this.isExpanded = true,
  });
}

/// Divider item
const navDivider = NavItem(
  id: '__divider__',
  label: '',
  icon: Icons.minimize,
  route: '',
  isDivider: true,
  showInSidebar: false,
  showInRail: false,
  showInBottomNav: false,
  showInCommandPalette: false,
);

/// Complete navigation configuration for NexaROS.
/// This is the single source of truth.
class NavigationConfig {
  static final List<NavGroup> groups = [
    NavGroup(
      id: 'main',
      label: 'Main',
      items: [
        const NavItem(id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard_rounded, route: '/shell/dashboard', order: 0, showInBottomNav: true),
        const NavItem(id: 'orders', label: 'Orders', icon: Icons.receipt_long_rounded, activeIcon: Icons.receipt, route: '/shell/orders', order: 1, showInBottomNav: true),
        const NavItem(id: 'pos', label: 'POS', icon: Icons.point_of_sale_rounded, route: '/shell/pos', order: 2, showInBottomNav: true),
        const NavItem(id: 'kitchen', label: 'Kitchen', icon: Icons.precision_manufacturing_rounded, route: '/shell/kitchen', order: 3, showInBottomNav: true),
      ],
    ),

    NavGroup(
      id: 'menu',
      label: 'Menu',
      items: [
        const NavItem(id: 'menu', label: 'Menu', icon: Icons.restaurant_menu_rounded, route: '/shell/menu', order: 10),
      ],
    ),

    NavGroup(
      id: 'floor',
      label: 'Floor',
      items: [
        const NavItem(id: 'tables', label: 'Tables', icon: Icons.table_restaurant_rounded, route: '/shell/tables', order: 20),
        const NavItem(id: 'floor-plan', label: 'Floor Plan', icon: Icons.map_rounded, route: '/shell/floor-plan', order: 21),
        const NavItem(id: 'reservations', label: 'Reservations', icon: Icons.event_rounded, route: '/shell/reservations', order: 22),
      ],
    ),

    NavGroup(
      id: 'delivery',
      label: 'Delivery',
      items: [
        const NavItem(id: 'delivery', label: 'Delivery', icon: Icons.local_shipping_rounded, route: '/shell/delivery', order: 25),
      ],
    ),

    NavGroup(
      id: 'staff',
      label: 'Staff',
      items: [
        const NavItem(id: 'staff', label: 'Staff', icon: Icons.people_rounded, route: '/shell/staff', order: 30),
        const NavItem(id: 'attendance', label: 'Attendance', icon: Icons.badge_rounded, route: '/shell/staff/attendance', order: 31, parentGroup: 'staff'),
        const NavItem(id: 'shifts', label: 'Shifts', icon: Icons.calendar_month_rounded, route: '/shell/staff/shifts', order: 32, parentGroup: 'staff'),
      ],
    ),

    NavGroup(
      id: 'inventory',
      label: 'Inventory',
      items: [
        const NavItem(id: 'inventory', label: 'Inventory', icon: Icons.inventory_2_rounded, route: '/shell/inventory', order: 40),
        const NavItem(id: 'suppliers', label: 'Suppliers', icon: Icons.local_shipping_rounded, route: '/shell/inventory/suppliers', order: 41, parentGroup: 'inventory'),
        const NavItem(id: 'purchases', label: 'Purchases', icon: Icons.receipt_rounded, route: '/shell/inventory/purchase-orders', order: 42, parentGroup: 'inventory'),
      ],
    ),

    NavGroup(
      id: 'crm',
      label: 'CRM',
      items: [
        const NavItem(id: 'customers', label: 'Customers', icon: Icons.people_outline_rounded, route: '/shell/crm', order: 50),
        const NavItem(id: 'loyalty', label: 'Loyalty', icon: Icons.star_rounded, route: '/shell/crm/loyalty', order: 51, parentGroup: 'crm'),
        const NavItem(id: 'reviews', label: 'Reviews', icon: Icons.rate_review_rounded, route: '/shell/crm/reviews', order: 52, parentGroup: 'crm'),
      ],
    ),

    NavGroup(
      id: 'finance',
      label: 'Finance',
      items: [
        const NavItem(id: 'finance', label: 'Finance', icon: Icons.account_balance_rounded, route: '/shell/finance', order: 60),
        const NavItem(id: 'invoices', label: 'Invoices', icon: Icons.description_rounded, route: '/shell/finance/invoices', order: 61, parentGroup: 'finance'),
      ],
    ),

    NavGroup(
      id: 'analytics',
      label: 'Analytics',
      items: [
        const NavItem(id: 'analytics', label: 'Analytics', icon: Icons.analytics_rounded, route: '/shell/analytics', order: 70),
        const NavItem(id: 'reports', label: 'Reports', icon: Icons.bar_chart_rounded, route: '/shell/reports', order: 71),
      ],
    ),

    NavGroup(
      id: 'marketing',
      label: 'Marketing',
      items: [
        const NavItem(id: 'offers', label: 'Offers', icon: Icons.local_offer_rounded, route: '/shell/offers', order: 80),
        const NavItem(id: 'combos', label: 'Combos', icon: Icons.fastfood_rounded, route: '/shell/offers/combos', order: 81, parentGroup: 'marketing'),
      ],
    ),

    NavGroup(
      id: 'admin',
      label: 'Administration',
      items: [
        const NavItem(id: 'branches', label: 'Branches', icon: Icons.store_rounded, route: '/branches', order: 90),
        const NavItem(id: 'staff_assign', label: 'Staff Assign', icon: Icons.assignment_ind_rounded, route: '/branches/assign', order: 91, parentGroup: 'admin'),
      ],
    ),

    NavGroup(
      id: 'bottom',
      label: '',
      items: [
        const NavItem(id: 'notifications', label: 'Notifications', icon: Icons.notifications_outlined, route: '/shell/notifications', order: 100, showInSidebar: false, showInRail: false, showInBottomNav: false, showInCommandPalette: true),
        const NavItem(id: 'profile', label: 'Profile', icon: Icons.person_outline_rounded, route: '/shell/profile', order: 101, showInSidebar: false, showInRail: false, showInBottomNav: false, showInCommandPalette: true),
        const NavItem(id: 'settings', label: 'Settings', icon: Icons.settings_rounded, route: '/shell/settings', order: 102, showInSidebar: false, showInRail: false, showInBottomNav: false, showInCommandPalette: true),
        const NavItem(id: 'more', label: 'More', icon: Icons.grid_view_rounded, route: '/shell/more', order: 103, showInSidebar: false, showInRail: false, showInBottomNav: false, showInCommandPalette: false),
      ],
    ),
  ];

  static List<NavItem> get allItems => groups.expand((g) => g.items).toList();

  static List<NavItem> get sidebarItems =>
      allItems.where((i) => i.showInSidebar && !i.isDivider).toList();

  static List<NavItem> get railItems =>
      allItems.where((i) => i.showInRail && !i.isDivider).toList();

  static List<NavItem> get bottomNavItems =>
      allItems.where((i) => i.showInBottomNav).toList();

  static List<NavItem> get commandPaletteItems =>
      allItems.where((i) => i.showInCommandPalette && !i.isDivider).toList();

  static NavItem? getItemById(String id) {
    try {
      return allItems.firstWhere((i) => i.id == id);
    } catch (_) {
      return null;
    }
  }

  static NavItem? getItemByRoute(String route) {
    try {
      return allItems.firstWhere((i) => route.startsWith(i.route));
    } catch (_) {
      return null;
    }
  }

  static List<NavItem> filterByRole(List<NavItem> items, String role) {
    return items.where((item) {
      if (item.allowedRoles.isEmpty) return true;
      return item.allowedRoles.contains(role);
    }).toList();
  }

  static List<NavGroup> get sidebarGroups =>
      groups.where((g) => g.id != 'bottom').toList();

  static const quickActions = [
    _QuickAction('New Order', Icons.add_shopping_cart, '/shell/pos'),
    _QuickAction('New Reservation', Icons.event, '/shell/reservations'),
    _QuickAction('New Customer', Icons.person_add, '/shell/crm'),
    _QuickAction('New Expense', Icons.money, '/shell/finance'),
    _QuickAction('AI Assistant', Icons.psychology, '/shell/more'),
  ];
}

class _QuickAction {
  final String label;
  final IconData icon;
  final String route;
  const _QuickAction(this.label, this.icon, this.route);
}


