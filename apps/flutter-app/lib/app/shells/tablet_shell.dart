import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/providers/subscription_provider.dart';
import '../../core/widgets/subscription_status_bar.dart';
import '../../core/widgets/grace_period_banner.dart';
import '../../core/widgets/branch_switcher.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/orders/presentation/order_list_screen.dart';
import '../../features/menu/presentation/menu_management_screen.dart';
import '../../features/tables/presentation/table_grid_screen.dart';
import '../../features/pos/presentation/pos_screen.dart';
import '../../features/kitchen/presentation/kitchen_display_screen.dart';
import '../../features/staff/presentation/staff_management_screen.dart';
import '../../features/more/presentation/more_grid_screen.dart';
import '../../features/subscriptions/presentation/subscription_screen.dart';

class TabletShell extends StatefulWidget {
  const TabletShell({super.key});

  @override
  State<TabletShell> createState() => _TabletShellState();
}

class _TabletShellState extends State<TabletShell> {
  int _currentIndex = 0;

  final _pages = const [
    DashboardScreen(),
    OrderListScreen(),
    MenuManagementScreen(),
    TableGridScreen(),
    POSScreen(),
    KitchenDisplayScreen(),
    StaffManagementScreen(),
    MoreGridScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final subProvider = context.watch<SubscriptionProvider>();

    return Scaffold(
      body: Column(
        children: [
          SubscriptionStatusBar(
            info: subProvider.info,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SubscriptionScreen()),
            ),
          ),
          GracePeriodBanner(
            info: subProvider.info,
            onUpgrade: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SubscriptionScreen()),
            ),
          ),
          Expanded(
            child: Row(
              children: [
                NavigationRail(
                  selectedIndex: _currentIndex,
                  onDestinationSelected: (i) => setState(() => _currentIndex = i),
                  labelType: NavigationRailLabelType.selected,
                  backgroundColor: Colors.white,
                  leading: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Column(
                      children: [
                        Icon(Icons.restaurant, color: AppColors.primary, size: 32),
                        const SizedBox(height: 4),
                        Text('NexaROS', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w600, color: AppColors.primary)),
                        const SizedBox(height: 8),
                        const BranchSwitcher(),
                      ],
                    ),
                  ),
                  trailing: Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: IconButton(
                      icon: Icon(Icons.card_membership, color: AppColors.primary, size: 22),
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const SubscriptionScreen()),
                      ),
                      tooltip: 'Subscription',
                    ),
                  ),
                  destinations: const [
                    NavigationRailDestination(icon: Icon(Icons.dashboard), label: Text('Dashboard')),
                    NavigationRailDestination(icon: Icon(Icons.receipt_long), label: Text('Orders')),
                    NavigationRailDestination(icon: Icon(Icons.restaurant_menu), label: Text('Menu')),
                    NavigationRailDestination(icon: Icon(Icons.table_restaurant), label: Text('Tables')),
                    NavigationRailDestination(icon: Icon(Icons.point_of_sale), label: Text('POS')),
                    NavigationRailDestination(icon: Icon(Icons.precision_manufacturing), label: Text('Kitchen')),
                    NavigationRailDestination(icon: Icon(Icons.people), label: Text('Staff')),
                    NavigationRailDestination(icon: Icon(Icons.apps), label: Text('More')),
                  ],
                ),
                const VerticalDivider(width: 1),
                Expanded(child: _pages[_currentIndex]),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
