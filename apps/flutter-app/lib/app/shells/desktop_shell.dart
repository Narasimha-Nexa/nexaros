import 'package:flutter/material.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/orders/presentation/order_list_screen.dart';
import '../../features/menu/presentation/menu_management_screen.dart';
import '../../features/tables/presentation/table_grid_screen.dart';
import '../../features/pos/presentation/pos_screen.dart';

class DesktopShell extends StatefulWidget {
  const DesktopShell({super.key});

  @override
  State<DesktopShell> createState() => _DesktopShellState();
}

class _DesktopShellState extends State<DesktopShell> {
  int _selectedIndex = 0;

  final _pages = const [
    DashboardScreen(),
    OrderListScreen(),
    MenuManagementScreen(),
    TableGridScreen(),
    POSScreen(),
  ];

  final _navItems = const [
    _NavItem(Icons.dashboard, 'Dashboard'),
    _NavItem(Icons.receipt_long, 'Orders'),
    _NavItem(Icons.restaurant_menu, 'Menu'),
    _NavItem(Icons.table_restaurant, 'Tables'),
    _NavItem(Icons.point_of_sale, 'POS'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
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
                const Divider(height: 1),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _navItems.length,
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
              ],
            ),
          ),
          Expanded(child: _pages[_selectedIndex]),
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
