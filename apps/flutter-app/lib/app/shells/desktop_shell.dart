import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/providers/app_state.dart';
import '../../core/widgets/sync_status_bar.dart';
import '../../core/widgets/connectivity_banner.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/orders/presentation/order_list_screen.dart';
import '../../features/menu/presentation/menu_management_screen.dart';
import '../../features/tables/presentation/table_grid_screen.dart';
import '../../features/pos/presentation/pos_screen.dart';
import '../../features/settings/presentation/printer_settings_screen.dart';
import '../../features/kitchen/presentation/kitchen_display_screen.dart';
import '../../features/staff/presentation/staff_management_screen.dart';
import '../../features/staff/presentation/attendance_screen.dart';

class DesktopShell extends StatefulWidget {
  const DesktopShell({super.key});

  @override
  State<DesktopShell> createState() => _DesktopShellState();
}

class _DesktopShellState extends State<DesktopShell> {
  int _selectedIndex = 0;

  final _pages = [
    const DashboardScreen(),
    const OrderListScreen(),
    const MenuManagementScreen(),
    const TableGridScreen(),
    const POSScreen(),
    const KitchenDisplayScreen(),
    const StaffManagementScreen(),
    const AttendanceScreen(),
  ];

  final _navItems = const [
    _NavItem(Icons.dashboard, 'Dashboard'),
    _NavItem(Icons.receipt_long, 'Orders'),
    _NavItem(Icons.restaurant_menu, 'Menu'),
    _NavItem(Icons.table_restaurant, 'Tables'),
    _NavItem(Icons.point_of_sale, 'POS'),
    _NavItem(Icons.precision_manufacturing, 'Kitchen'),
    _NavItem(Icons.people, 'Staff'),
    _NavItem(Icons.badge, 'Attendance'),
  ];

  int get _pageCount => _pages.length;

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Scaffold(
      body: Column(
        children: [
          // Offline banner at very top
          ConnectivityBanner(isOnline: appState.isOnline),
          Expanded(
            child: Row(
              children: [
                // Sidebar
                Container(
                  width: 240,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(right: BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                  child: Column(
                    children: [
                      const Padding(
                        padding: EdgeInsets.all(20),
                        child: Text(
                          'NexaROS',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF2563EB)),
                        ),
                      ),
                      const Divider(height: 1),
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemCount: _pageCount,
                          itemBuilder: (ctx, i) {
                            final item = _navItems[i];
                            final isActive = _selectedIndex == i;
                            return Container(
                              margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: isActive ? const Color(0xFFEFF6FF) : Colors.transparent,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: ListTile(
                                leading: Icon(item.icon, color: isActive ? const Color(0xFF2563EB) : const Color(0xFF64748B), size: 20),
                                title: Text(
                                  item.label,
                                  style: TextStyle(
                                    color: isActive ? const Color(0xFF2563EB) : const Color(0xFF64748B),
                                    fontSize: 14,
                                    fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                ),
                                dense: true,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                                onTap: () => setState(() => _selectedIndex = i),
                              ),
                            );
                          },
                        ),
                      ),
                      // Sync status bar
                      const Divider(height: 1),
                      SyncStatusBar(syncService: appState.sync),
                      const Divider(height: 1),
                      // Settings button at bottom
                      ListTile(
                        leading: const Icon(Icons.settings, color: Color(0xFF64748B), size: 20),
                        title: const Text('Settings', style: TextStyle(fontSize: 14, color: Color(0xFF64748B))),
                        dense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const PrinterSettingsScreen()),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                // Content area
                Expanded(child: _pages[_selectedIndex]),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  const _NavItem(this.icon, this.label);
}
