import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';

class DeliveryDashboardScreen extends ConsumerStatefulWidget {
  const DeliveryDashboardScreen({super.key});

  @override
  ConsumerState<DeliveryDashboardScreen> createState() => _DeliveryDashboardScreenState();
}

class _DeliveryDashboardScreenState extends ConsumerState<DeliveryDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(deliveryProvider.notifier).loadDashboardData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final delivery = ref.watch(deliveryProvider);
    final stats = delivery.stats;
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      appBar: AppBar(
        title: Text('Delivery Dashboard', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.info,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => delivery.loadDashboardData(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => delivery.loadDashboardData(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Stats grid
              if (stats != null) ...[
                GridView.count(
                  crossAxisCount: isMobile ? 2 : 4,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: isMobile ? 1.3 : 1.6,
                  children: [
                    _statCard('Active', '${stats['activeCount'] ?? 0}', Icons.local_shipping, AppColors.info, Colors.cyan.shade50),
                    _statCard('Pending', '${stats['pendingCount'] ?? 0}', Icons.hourglass_bottom, AppColors.warning, Colors.orange.shade50),
                    _statCard('Today', '${stats['todayCount'] ?? 0}', Icons.today, AppColors.success, Colors.green.shade50),
                    _statCard('Partners', '${stats['availablePartners'] ?? 0}', Icons.people, AppColors.primary, Colors.blue.shade50),
                  ],
                ),
                const SizedBox(height: 20),
              ],

              // Quick actions
              Text('Quick Actions', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: isMobile ? 2 : 4,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 2.5,
                children: [
                  _actionCard('Partners', Icons.people, AppColors.primary, () => context.push('/shell/delivery/partners')),
                  _actionCard('Assign Orders', Icons.assignment, AppColors.warning, () => context.push('/shell/delivery/assign')),
                  _actionCard('Live Tracking', Icons.gps_fixed, AppColors.success, () => context.push('/shell/delivery/tracking')),
                  _actionCard('History', Icons.history, AppColors.info, () => context.push('/shell/delivery/history')),
                ],
              ),

              const SizedBox(height: 20),

              // Active deliveries
              Text('Active Deliveries', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),

              if (delivery.activeDeliveriesLoading && delivery.activeDeliveries.isEmpty)
                const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
              else if (delivery.activeDeliveries.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.check_circle, size: 40, color: AppColors.success),
                          const SizedBox(height: 8),
                          Text('No active deliveries', style: GoogleFonts.inter(color: AppColors.gray500)),
                          const SizedBox(height: 4),
                          Text('New delivery orders will appear here',
                              style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray400)),
                        ],
                      ),
                    ),
                  ),
                )
              else
                ...delivery.activeDeliveries.take(5).map((d) => _buildDeliveryCard(d)),

              if (delivery.activeDeliveries.length > 5) ...[
                const SizedBox(height: 8),
                Center(
                  child: TextButton(
                    onPressed: () => context.push('/shell/delivery/history'),
                    child: Text('View all ${delivery.activeDeliveries.length} deliveries'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color, Color bgColor) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
        boxShadow: [BoxShadow(color: color.withValues(alpha: 0.06), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: color, size: 20),
          ),
          Text(value, style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.gray800)),
          Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
        ],
      ),
    );
  }

  Widget _actionCard(String label, IconData icon, Color color, VoidCallback onTap) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDeliveryCard(Map<String, dynamic> delivery) {
    final partner = delivery['partner'] as Map<String, dynamic>?;
    final order = delivery['order'] as Map<String, dynamic>?;
    final status = delivery['status'] as String? ?? 'PENDING';
    final orderNumber = order?['orderNumber'] ?? '-';
    final customerName = order?['customerName'] ?? 'Guest';
    final createdAt = DateTime.tryParse(delivery['createdAt'] ?? '');
    final timeStr = createdAt != null ? DateFormat('HH:mm').format(createdAt) : '';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _statusColor(status).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(_statusIcon(status), color: _statusColor(status), size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Order #$orderNumber', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text(customerName, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                      if (timeStr.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Text(timeStr, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                      ],
                    ],
                  ),
                  if (partner != null)
                    Text('Partner: ${partner['name'] ?? 'Unassigned'}',
                        style: GoogleFonts.inter(fontSize: 11, color: AppColors.info, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _statusColor(status).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(_statusLabel(status), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: _statusColor(status))),
            ),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'PENDING': return AppColors.warning;
      case 'ASSIGNED': return AppColors.primary;
      case 'PICKED_UP': return AppColors.info;
      case 'IN_TRANSIT': return AppColors.secondary;
      case 'DELIVERED': return AppColors.success;
      case 'FAILED': return AppColors.danger;
      default: return AppColors.gray400;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'PENDING': return Icons.hourglass_bottom;
      case 'ASSIGNED': return Icons.person_pin;
      case 'PICKED_UP': return Icons.shopping_bag;
      case 'IN_TRANSIT': return Icons.local_shipping;
      case 'DELIVERED': return Icons.check_circle;
      case 'FAILED': return Icons.error;
      default: return Icons.help_outline;
    }
  }

  String _statusLabel(String status) {
    return status.replaceAll('_', ' ');
  }
}
