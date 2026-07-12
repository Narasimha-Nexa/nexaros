import 'package:flutter/material.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';

class DesktopShell extends StatelessWidget {
  const DesktopShell({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
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
                // Logo
                const Padding(
                  padding: EdgeInsets.all(20),
                  child: Text(
                    'NexaROS',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                ),
                const Divider(height: 1),
                // Nav Items
                _buildNavItem(Icons.dashboard, 'Dashboard', true),
                _buildNavItem(Icons.receipt_long, 'Orders', false),
                _buildNavItem(Icons.restaurant_menu, 'Menu', false),
                _buildNavItem(Icons.table_restaurant, 'Tables', false),
                _buildNavItem(Icons.kitchen, 'Kitchen', false),
                _buildNavItem(Icons.inventory_2, 'Inventory', false),
                _buildNavItem(Icons.analytics, 'Reports', false),
                _buildNavItem(Icons.people, 'Staff', false),
                const Spacer(),
                _buildNavItem(Icons.settings, 'Settings', false),
              ],
            ),
          ),
          // Main Content
          const Expanded(child: DashboardScreen()),
        ],
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, bool isActive) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFFEFF6FF) : Colors.transparent,
        borderRadius: BorderRadius.circular(6),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: isActive ? const Color(0xFF2563EB) : const Color(0xFF64748B),
          size: 20,
        ),
        title: Text(
          label,
          style: TextStyle(
            color: isActive ? const Color(0xFF2563EB) : const Color(0xFF64748B),
            fontSize: 14,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
      ),
    );
  }
}
