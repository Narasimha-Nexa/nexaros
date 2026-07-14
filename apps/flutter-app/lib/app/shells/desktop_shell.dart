import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/providers/app_state.dart';
import '../../core/providers/subscription_provider.dart';
import '../../core/widgets/sync_status_bar.dart';
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
import '../../features/kitchen/presentation/kitchen_display_screen.dart';
import '../../features/staff/presentation/staff_management_screen.dart';
import '../../features/staff/presentation/attendance_screen.dart';
import '../../features/staff/presentation/shift_schedule_screen.dart';
import '../../features/inventory/presentation/inventory_management_screen.dart';
import '../../features/inventory/presentation/supplier_management_screen.dart';
import '../../features/inventory/presentation/purchase_order_screen.dart';
import '../../features/reservations/presentation/reservation_screen.dart';
import '../../features/subscriptions/presentation/subscription_screen.dart';
import '../../features/branches/presentation/branch_management_screen.dart';
import '../../features/branches/presentation/staff_branch_assignment_screen.dart';

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
    const ShiftScheduleScreen(),
    const InventoryManagementScreen(),
    const SupplierManagementScreen(),
    const PurchaseOrderScreen(),
    const ReservationScreen(),
  ];

  final _navItems = [
    const _NavItem(Icons.dashboard, 'Dashboard'),
    const _NavItem(Icons.receipt_long, 'Orders'),
    const _NavItem(Icons.restaurant_menu, 'Menu'),
    const _NavItem(Icons.table_restaurant, 'Tables'),
    const _NavItem(Icons.point_of_sale, 'POS'),
    const _NavItem(Icons.precision_manufacturing, 'Kitchen'),
    const _NavItem(Icons.people, 'Staff'),
    const _NavItem(Icons.badge, 'Attendance'),
    const _NavItem(Icons.calendar_month, 'Shifts'),
    const _NavItem(Icons.inventory_2, 'Inventory'),
    const _NavItem(Icons.local_shipping, 'Suppliers'),
    const _NavItem(Icons.receipt, 'Purchases'),
    const _NavItem(Icons.event, 'Reservations'),
  ];

  int get _pageCount => _pages.length;

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final subProvider = context.watch<SubscriptionProvider>();

    return Scaffold(
      body: Column(
        children: [
          ConnectivityBanner(isOnline: appState.isOnline),
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
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: BranchSwitcher(),
                      ),
                      const SizedBox(height: 4),
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
                      const Divider(height: 1),
                      SyncStatusBar(syncService: appState.sync),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.card_membership, color: Color(0xFF64748B), size: 20),
                        title: const Text('Subscription', style: TextStyle(fontSize: 14, color: Color(0xFF64748B))),
                        dense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const SubscriptionScreen()),
                          );
                        },
                      ),
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
                      ListTile(
                        leading: const Icon(Icons.store, color: Color(0xFF64748B), size: 20),
                        title: const Text('Branches', style: TextStyle(fontSize: 14, color: Color(0xFF64748B))),
                        dense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const BranchManagementScreen()),
                          );
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.assignment_ind, color: Color(0xFF64748B), size: 20),
                        title: const Text('Staff Assignment', style: TextStyle(fontSize: 14, color: Color(0xFF64748B))),
                        dense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const StaffBranchAssignmentScreen()),
                          );
                        },
                      ),
                    ],
                  ),
                ),
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
