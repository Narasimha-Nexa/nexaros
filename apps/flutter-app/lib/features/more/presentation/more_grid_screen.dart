import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../kitchen/presentation/kitchen_display_screen.dart';
import '../../staff/presentation/staff_management_screen.dart';
import '../../staff/presentation/attendance_screen.dart';
import '../../staff/presentation/shift_schedule_screen.dart';
import '../../inventory/presentation/inventory_management_screen.dart';
import '../../inventory/presentation/supplier_management_screen.dart';
import '../../inventory/presentation/purchase_order_screen.dart';
import '../../reservations/presentation/reservation_screen.dart';
import '../../reports/presentation/reports_screen.dart';

class MoreGridScreen extends StatelessWidget {
  const MoreGridScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('More', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: GridView.count(
        padding: const EdgeInsets.all(16),
        crossAxisCount: 3,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 0.9,
        children: [
          _buildTile(context, Icons.precision_manufacturing, 'Kitchen', AppColors.orderPreparing, const KitchenDisplayScreen()),
          _buildTile(context, Icons.people, 'Staff', AppColors.primary, const StaffManagementScreen()),
          _buildTile(context, Icons.badge, 'Attendance', AppColors.success, const AttendanceScreen()),
          _buildTile(context, Icons.calendar_month, 'Shifts', AppColors.secondary, const ShiftScheduleScreen()),
          _buildTile(context, Icons.inventory_2, 'Inventory', AppColors.info, const InventoryManagementScreen()),
          _buildTile(context, Icons.local_shipping, 'Suppliers', AppColors.warning, const SupplierManagementScreen()),
          _buildTile(context, Icons.receipt, 'Purchases', AppColors.danger, const PurchaseOrderScreen()),
          _buildTile(context, Icons.event, 'Reservations', AppColors.secondary, const ReservationScreen()),
          _buildTile(context, Icons.bar_chart, 'Reports', AppColors.primary, const ReportsScreen()),
        ],
      ),
    );
  }

  Widget _buildTile(BuildContext context, IconData icon, String label, Color color, Widget screen) {
    return Material(
      color: color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => screen)),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.gray700), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
