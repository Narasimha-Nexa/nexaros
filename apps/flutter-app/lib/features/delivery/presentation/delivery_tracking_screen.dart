import 'dart:math';
import 'dart:async';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../providers/delivery_provider.dart';
import '../../../core/theme/app_colors.dart';

class DeliveryTrackingScreen extends ConsumerStatefulWidget {
  const DeliveryTrackingScreen({super.key});

  @override
  ConsumerState<DeliveryTrackingScreen> createState() => _DeliveryTrackingScreenState();
}

class _DeliveryTrackingScreenState extends ConsumerState<DeliveryTrackingScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(deliveryProvider.notifier).loadActiveDeliveries();
    });
    // Auto-refresh every 15 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (mounted) {
        ref.read(deliveryProvider.notifier).loadActiveDeliveries();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final delivery = ref.watch(deliveryProvider);
    final activeDeliveries = delivery.activeDeliveries;
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      appBar: AppBar(
        title: Text('Live Tracking', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.success,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: [
            Tab(text: 'Map (${activeDeliveries.length})'),
            const Tab(text: 'List'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => delivery.loadActiveDeliveries(),
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Map View Tab
          _buildMapView(context, delivery, activeDeliveries, isMobile),
          // List View Tab
          _buildListView(context, delivery, activeDeliveries, isMobile),
        ],
      ),
    );
  }

  Widget _buildMapView(BuildContext context, DeliveryProvider delivery, List<Map<String, dynamic>> deliveries, bool isMobile) {
    if (delivery.activeDeliveriesLoading && deliveries.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (deliveries.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.map, size: 64, color: AppColors.gray300),
            const SizedBox(height: 16),
            Text('No active deliveries', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w500, color: AppColors.gray500)),
            const SizedBox(height: 8),
            Text('Active deliveries will appear on the map', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray400)),
          ],
        ),
      );
    }

    return Stack(
      children: [
        // Simulated map background
        Positioned.fill(
          child: CustomPaint(
            painter: _MapPainter(deliveries),
          ),
        ),
        // Delivery list overlay
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          height: isMobile ? 260 : 200,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, -2))],
            ),
            child: Column(
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 8),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: AppColors.gray300, borderRadius: BorderRadius.circular(2)),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      Text('Live Deliveries', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                        child: Text('${deliveries.length}', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.success)),
                      ),
                      const Spacer(),
                      Text('Auto-refresh 15s', style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray400)),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: deliveries.length,
                    itemBuilder: (ctx, i) {
                      final d = deliveries[i];
                      final partner = d['partner'] as Map<String, dynamic>?;
                      final order = d['order'] as Map<String, dynamic>?;
                      final status = d['status'] as String? ?? 'PENDING';
                      final orderNumber = order?['orderNumber'] ?? '-';
                      final customerName = order?['customerName'] ?? 'Guest';
                      final partnerName = partner?['name'] ?? 'Unassigned';

                      return ListTile(
                        dense: true,
                        leading: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: _statusColor(status).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Icon(_statusIcon(status), color: _statusColor(status), size: 18),
                        ),
                        title: Text('Order #$orderNumber · $customerName', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                        subtitle: Text('$partnerName · ${_statusLabel(status)}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
                        trailing: PopupMenuButton<String>(
                          icon: Icon(Icons.more_vert, size: 18, color: AppColors.gray500),
                          onSelected: (value) async {
                            if (value == 'dispatched') {
                              await delivery.updateStatus(d['id'] ?? '', 'DISPATCHED');
                            } else if (value == 'in_transit') {
                              await delivery.updateStatus(d['id'] ?? '', 'IN_TRANSIT');
                            } else if (value == 'delivered') {
                              await delivery.updateStatus(d['id'] ?? '', 'DELIVERED');
                            }
                          },
                          itemBuilder: (ctx) => [
                            const PopupMenuItem(value: 'dispatched', child: Text('Mark Dispatched')),
                            const PopupMenuItem(value: 'in_transit', child: Text('Mark In Transit')),
                            const PopupMenuItem(value: 'delivered', child: Text('Mark Delivered')),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => context.push('/shell/delivery'),
                      icon: const Icon(Icons.dashboard, size: 16),
                      label: Text('Back to Dashboard', style: GoogleFonts.inter(fontSize: 12)),
                      style: OutlinedButton.styleFrom(foregroundColor: AppColors.gray600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        // Map legend
        Positioned(
          top: 12,
          left: 12,
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.9),
              borderRadius: BorderRadius.circular(8),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 4)],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Legend', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.gray600)),
                const SizedBox(height: 4),
                _legendItem(Icons.local_shipping, 'Partner', AppColors.primary),
                _legendItem(Icons.location_on, 'Customer', AppColors.danger),
                _legendItem(Icons.store, 'Restaurant', AppColors.success),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _legendItem(IconData icon, String label, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
        ],
      ),
    );
  }

  Widget _buildListView(BuildContext context, DeliveryProvider delivery, List<Map<String, dynamic>> deliveries, bool isMobile) {
    if (delivery.activeDeliveriesLoading && deliveries.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (deliveries.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.local_shipping, size: 48, color: AppColors.gray300),
            const SizedBox(height: 12),
            Text('No active deliveries', style: GoogleFonts.inter(fontSize: 16, color: AppColors.gray500)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => delivery.loadActiveDeliveries(),
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: deliveries.length,
        itemBuilder: (ctx, i) {
          final d = deliveries[i];
          final partner = d['partner'] as Map<String, dynamic>?;
          final order = d['order'] as Map<String, dynamic>?;
          final status = d['status'] as String? ?? 'PENDING';
          final orderNumber = order?['orderNumber'] ?? '-';
          final customerName = order?['customerName'] ?? 'Guest';
          final partnerName = partner?['name'] ?? 'Unassigned';
          final partnerPhone = partner?['phone'] ?? '-';
          final createdAt = DateTime.tryParse(d['createdAt'] ?? '');
          final timeStr = createdAt != null ? DateFormat('HH:mm').format(createdAt) : '';

          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
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
                            Row(
                              children: [
                                Text(customerName, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                                const SizedBox(width: 8),
                                Text(timeStr, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                              ],
                            ),
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
                  const SizedBox(height: 10),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.person, size: 14, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Text('$partnerName', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                      const SizedBox(width: 12),
                      Text(partnerPhone, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      OutlinedButton.icon(
                        onPressed: () async {
                          await delivery.updateStatus(d['id'] ?? '', 'DISPATCHED');
                        },
                        icon: const Icon(Icons.navigation, size: 14),
                        label: Text('Dispatch', style: GoogleFonts.inter(fontSize: 11)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.info,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: () async {
                          await delivery.updateStatus(d['id'] ?? '', 'DELIVERED');
                        },
                        icon: const Icon(Icons.check_circle, size: 14),
                        label: Text('Deliver', style: GoogleFonts.inter(fontSize: 11)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.success,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: () async {
                          final confirmed = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: Text('Unassign Delivery?', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                              content: const Text('This will remove the partner assignment.'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                                TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('Unassign', style: GoogleFonts.inter(color: AppColors.danger))),
                              ],
                            ),
                          );
                          if (confirmed == true) {
                            await delivery.unassignDelivery(d['id'] ?? '');
                          }
                        },
                        icon: const Icon(Icons.link_off, size: 14),
                        label: Text('Unassign', style: GoogleFonts.inter(fontSize: 11)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.danger,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return AppColors.warning;
      case 'ASSIGNED':
        return AppColors.info;
      case 'DISPATCHED':
        return AppColors.primary;
      case 'IN_TRANSIT':
        return AppColors.secondary;
      case 'DELIVERED':
        return AppColors.success;
      case 'FAILED':
        return AppColors.danger;
      case 'CANCELLED':
        return AppColors.gray500;
      default:
        return AppColors.gray500;
    }
  }

  IconData _statusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return Icons.hourglass_bottom;
      case 'ASSIGNED':
        return Icons.person_pin;
      case 'DISPATCHED':
        return Icons.navigation;
      case 'IN_TRANSIT':
        return Icons.local_shipping;
      case 'DELIVERED':
        return Icons.check_circle;
      case 'FAILED':
        return Icons.error;
      case 'CANCELLED':
        return Icons.cancel;
      default:
        return Icons.circle;
    }
  }

  String _statusLabel(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Pending';
      case 'ASSIGNED':
        return 'Assigned';
      case 'DISPATCHED':
        return 'Dispatched';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Delivered';
      case 'FAILED':
        return 'Failed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }
}

// ── Simulated Map Painter ──

class _MapPainter extends CustomPainter {
  final List<Map<String, dynamic>> deliveries;

  _MapPainter(this.deliveries);

  @override
  void paint(Canvas canvas, Size size) {
    final random = Random(deliveries.length);

    // Grid roads
    final gridPaint = Paint()
      ..color = const Color(0xFFE8E8E8)
      ..strokeWidth = 1;

    for (double x = 0; x < size.width; x += 40) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += 40) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Draw restaurant marker (always at top-left area)
    final restaurantPos = Offset(size.width * 0.15, size.height * 0.15);
    _drawMarker(canvas, restaurantPos, 'R', const Color(0xFF22C55E), Icons.store);

    // Draw delivery points
    for (int i = 0; i < deliveries.length; i++) {
      // Simulate position based on index
      final angle = (2 * pi / deliveries.length) * i + 0.5;
      final radius = min(size.width, size.height) * 0.25;
      final centerX = size.width * 0.55;
      final centerY = size.height * 0.55;
      final pos = Offset(
        centerX + cos(angle) * radius + random.nextDouble() * 20,
        centerY + sin(angle) * radius + random.nextDouble() * 20,
      );

      // Draw route line from restaurant to delivery point
      final routePaint = Paint()
        ..color = AppColors.info.withValues(alpha: 0.3)
        ..strokeWidth = 2
        ..style = PaintingStyle.stroke;

      final path = Path()
        ..moveTo(restaurantPos.dx, restaurantPos.dy)
        ..lineTo(pos.dx, pos.dy);
      canvas.drawPath(path, routePaint);

      // Draw partner position (moving along route)
      final progress = (DateTime.now().millisecondsSinceEpoch % 10000) / 10000;
      final partnerPos = Offset(
        restaurantPos.dx + (pos.dx - restaurantPos.dx) * progress,
        restaurantPos.dy + (pos.dy - restaurantPos.dy) * progress,
      );

      _drawMarker(canvas, partnerPos, '${i + 1}', AppColors.primary, Icons.local_shipping);
    }
  }

  void _drawMarker(Canvas canvas, Offset pos, String label, Color color, IconData icon) {
    // Shadow
    final shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.1)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
    canvas.drawCircle(pos + const Offset(0, 2), 16, shadowPaint);

    // Circle
    final bgPaint = Paint()..color = color;
    canvas.drawCircle(pos, 16, bgPaint);

    // White inner
    final innerPaint = Paint()..color = Colors.white;
    canvas.drawCircle(pos, 12, innerPaint);

    // Icon
    final iconText = TextPainter(
      text: TextSpan(
        text: label,
        style: TextStyle(
          color: color,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: ui.TextDirection.ltr,
    );
    iconText.layout();
    iconText.paint(canvas, Offset(pos.dx - iconText.width / 2, pos.dy - iconText.height / 2));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
