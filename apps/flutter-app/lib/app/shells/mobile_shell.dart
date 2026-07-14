import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/providers/app_state.dart';
import '../../core/providers/subscription_provider.dart';
import '../../core/widgets/connectivity_banner.dart';
import '../../core/widgets/subscription_status_bar.dart';
import '../../core/widgets/grace_period_banner.dart';
import '../../core/widgets/branch_switcher.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/orders/presentation/order_list_screen.dart';
import '../../features/menu/presentation/menu_management_screen.dart';
import '../../features/tables/presentation/table_grid_screen.dart';
import '../../features/pos/presentation/pos_screen.dart';
import '../../features/settings/presentation/printer_settings_screen.dart';
import '../../features/more/presentation/more_grid_screen.dart';

class MobileShell extends StatefulWidget {
  const MobileShell({super.key});

  @override
  State<MobileShell> createState() => _MobileShellState();
}

class _MobileShellState extends State<MobileShell> {
  int _selectedIndex = 0;

  final _pages = [
    const DashboardScreen(),
    const OrderListScreen(),
    const MenuManagementScreen(),
    const TableGridScreen(),
    const POSScreen(),
    const MoreGridScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final subProvider = context.watch<SubscriptionProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const BranchSwitcher(),
        actions: [
          IconButton(
            icon: const Icon(Icons.print, size: 20),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const PrinterSettingsScreen()),
            ),
            tooltip: 'Printer Settings',
          ),
        ],
      ),
      body: Column(
        children: [
          ConnectivityBanner(isOnline: appState.isOnline),
          SubscriptionStatusBar(info: subProvider.info),
          GracePeriodBanner(
            info: subProvider.info,
            onUpgrade: () => _selectedIndex == 5
                ? null
                : setState(() => _selectedIndex = 5),
          ),
          Expanded(child: _pages[_selectedIndex]),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) => setState(() => _selectedIndex = index),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          const NavigationDestination(icon: Icon(Icons.receipt_long), label: 'Orders'),
          const NavigationDestination(icon: Icon(Icons.restaurant_menu), label: 'Menu'),
          const NavigationDestination(icon: Icon(Icons.table_restaurant), label: 'Tables'),
          const NavigationDestination(icon: Icon(Icons.point_of_sale), label: 'POS'),
          const NavigationDestination(icon: Icon(Icons.apps), label: 'More'),
        ],
      ),
    );
  }
}
