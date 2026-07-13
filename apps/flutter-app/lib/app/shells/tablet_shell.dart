import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/orders/presentation/order_list_screen.dart';
import '../../features/menu/presentation/menu_management_screen.dart';
import '../../features/tables/presentation/table_grid_screen.dart';
import '../../features/pos/presentation/pos_screen.dart';
import '../../features/kitchen/presentation/kitchen_display_screen.dart';
import '../../features/staff/presentation/staff_management_screen.dart';
import '../../features/more/presentation/more_grid_screen.dart';

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
    return Scaffold(
      body: Row(
        children: [
          // Navigation Rail
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
                ],
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
          // Content area
          Expanded(child: _pages[_currentIndex]),
        ],
      ),
    );
  }
}
