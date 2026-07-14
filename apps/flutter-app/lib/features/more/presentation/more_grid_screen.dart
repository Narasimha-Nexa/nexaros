import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/subscription_provider.dart';
import '../../kitchen/presentation/kitchen_display_screen.dart';
import '../../staff/presentation/staff_management_screen.dart';
import '../../staff/presentation/attendance_screen.dart';
import '../../staff/presentation/shift_schedule_screen.dart';
import '../../inventory/presentation/inventory_management_screen.dart';
import '../../inventory/presentation/supplier_management_screen.dart';
import '../../inventory/presentation/purchase_order_screen.dart';
import '../../reservations/presentation/reservation_screen.dart';
import '../../reports/presentation/reports_screen.dart';
import '../../subscriptions/presentation/subscription_screen.dart';
import '../../branches/presentation/branch_management_screen.dart';
import '../../branches/presentation/staff_branch_assignment_screen.dart';

class MoreGridScreen extends StatelessWidget {
  const MoreGridScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final subProvider = context.watch<SubscriptionProvider>();

    return Scaffold(
      appBar: AppBar(title: Text('More', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: GridView.count(
        padding: const EdgeInsets.all(16),
        crossAxisCount: 3,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 0.9,
        children: [
          _buildTile(context, Icons.precision_manufacturing, 'Kitchen', AppColors.orderPreparing, const KitchenDisplayScreen(), 'kitchen', subProvider),
          _buildTile(context, Icons.people, 'Staff', AppColors.primary, const StaffManagementScreen(), 'staff', subProvider),
          _buildTile(context, Icons.badge, 'Attendance', AppColors.success, const AttendanceScreen(), 'attendance', subProvider),
          _buildTile(context, Icons.calendar_month, 'Shifts', AppColors.secondary, const ShiftScheduleScreen(), 'shifts', subProvider),
          _buildTile(context, Icons.inventory_2, 'Inventory', AppColors.info, const InventoryManagementScreen(), 'inventory', subProvider),
          _buildTile(context, Icons.local_shipping, 'Suppliers', AppColors.warning, const SupplierManagementScreen(), 'inventory', subProvider),
          _buildTile(context, Icons.receipt, 'Purchases', AppColors.danger, const PurchaseOrderScreen(), 'inventory', subProvider),
          _buildTile(context, Icons.event, 'Reservations', AppColors.secondary, const ReservationScreen(), 'reservations', subProvider),
          _buildTile(context, Icons.bar_chart, 'Reports', AppColors.primary, const ReportsScreen(), 'reports', subProvider),
          _buildTile(context, Icons.store, 'Branches', AppColors.info, const BranchManagementScreen(), 'multi_branch', subProvider),
          _buildTile(context, Icons.assignment_ind, 'Staff Assign', AppColors.secondary, const StaffBranchAssignmentScreen(), 'multi_branch', subProvider),
          _buildTile(context, Icons.card_membership, 'Subscription', AppColors.secondary, const SubscriptionScreen(), null, subProvider),
        ],
      ),
    );
  }

  Widget _buildTile(BuildContext context, IconData icon, String label, Color color, Widget screen, String? moduleKey, SubscriptionProvider subProvider) {
    final isEnabled = moduleKey == null || subProvider.canAccessFeature(moduleKey);
    final locked = !isEnabled;

    return Material(
      color: locked ? AppColors.gray100 : color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          if (locked) {
            _showLockedDialog(context, label, subProvider.getModuleLockReason(moduleKey));
          } else {
            Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
          }
        },
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(icon, size: 32, color: locked ? AppColors.gray400 : color),
                if (locked)
                  Positioned(
                    right: -8,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: AppColors.danger,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.lock, size: 10, color: Colors.white),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: locked ? AppColors.gray400 : AppColors.gray700,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  void _showLockedDialog(BuildContext context, String feature, String reason) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.lock_outline, color: AppColors.danger, size: 36),
        title: Text('$feature Locked', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        content: Text(reason, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.push(context, MaterialPageRoute(builder: (_) => const SubscriptionScreen()));
            },
            child: Text('Upgrade Plan', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.primary)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.gray500)),
          ),
        ],
      ),
    );
  }
}
