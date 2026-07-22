import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/dashboard_models.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../shared/widgets/shared_widgets.dart';

class LiveOperationsPanel extends StatelessWidget {
  final ActiveOrderStats orderStats;
  final KitchenStatus kitchen;
  final TableStatus tableStatus;
  final DeliveryStatus delivery;
  final bool isDesktop;

  const LiveOperationsPanel({
    super.key, required this.orderStats, required this.kitchen,
    required this.tableStatus, required this.delivery, this.isDesktop = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      NxSectionHeader(
        title: 'Live Operations',
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: AppColors.success50, borderRadius: BorderRadius.circular(AppDimens.radiusFull)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle)),
            const SizedBox(width: 4),
            Text('LIVE', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.success)),
          ]),
        ),
      ),
      const SizedBox(height: AppDimens.sm),
      _QuickStatsRow(orderStats: orderStats, kitchen: kitchen, tableStatus: tableStatus, delivery: delivery),
      const SizedBox(height: AppDimens.base),
      _OrderTypeBreakdown(stats: orderStats),
      const SizedBox(height: AppDimens.base),
      if (isDesktop)
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(child: _KitchenCard(kitchen: kitchen)),
          const SizedBox(width: AppDimens.base),
          Expanded(child: _TableCard(tableStatus: tableStatus)),
          const SizedBox(width: AppDimens.base),
          Expanded(child: _DeliveryCard(delivery: delivery)),
        ])
      else
        Column(children: [
          _KitchenCard(kitchen: kitchen),
          const SizedBox(height: AppDimens.base),
          _TableCard(tableStatus: tableStatus),
          const SizedBox(height: AppDimens.base),
          _DeliveryCard(delivery: delivery),
        ]),
    ]);
  }
}

class _QuickStatsRow extends StatelessWidget {
  final ActiveOrderStats orderStats;
  final KitchenStatus kitchen;
  final TableStatus tableStatus;
  final DeliveryStatus delivery;
  const _QuickStatsRow({required this.orderStats, required this.kitchen, required this.tableStatus, required this.delivery});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      _QuickStat(label: 'Active', value: '${orderStats.total}', color: AppColors.primary),
      const SizedBox(width: AppDimens.sm),
      _QuickStat(label: 'Kitchen', value: '${kitchen.pending + kitchen.preparing}', color: AppColors.warning),
      const SizedBox(width: AppDimens.sm),
      _QuickStat(label: 'Tables Free', value: '${tableStatus.available}/${tableStatus.total}', color: AppColors.success),
      const SizedBox(width: AppDimens.sm),
      _QuickStat(label: 'Delivery', value: '${delivery.inTransit}', color: AppColors.info),
    ]);
  }
}

class _QuickStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _QuickStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(AppDimens.radiusSm),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: color)),
        Text(label, style: GoogleFonts.inter(fontSize: 9, color: Theme.of(context).colorScheme.onSurfaceVariant)),
      ]),
    ));
  }
}

class _OrderTypeBreakdown extends StatelessWidget {
  final ActiveOrderStats stats;
  const _OrderTypeBreakdown({required this.stats});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      _TypePill(label: 'Dine-In', count: stats.dineIn, color: AppColors.primary, icon: Icons.restaurant),
      const SizedBox(width: 6),
      _TypePill(label: 'Takeaway', count: stats.takeaway, color: AppColors.secondary, icon: Icons.takeout_dining),
      const SizedBox(width: 6),
      _TypePill(label: 'Delivery', count: stats.deliveryOrders, color: AppColors.warning, icon: Icons.local_shipping),
      const SizedBox(width: 6),
      if (stats.pendingPayments > 0)
        _TypePill(label: 'Pending ₹${stats.pendingPayments.toStringAsFixed(0)}', count: 0, color: AppColors.danger, icon: Icons.payment),
    ]);
  }
}

class _TypePill extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final IconData icon;
  const _TypePill({required this.label, required this.count, required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Expanded(child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(AppDimens.radiusFull),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 4),
        Expanded(child: Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w500, color: color), overflow: TextOverflow.ellipsis)),
      ]),
    ));
  }
}

class _KitchenCard extends StatelessWidget {
  final KitchenStatus kitchen;
  const _KitchenCard({required this.kitchen});

  @override
  Widget build(BuildContext context) {
    return NxCard(padding: const EdgeInsets.all(AppDimens.base), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(Icons.restaurant, size: 16, color: AppColors.warning),
        const SizedBox(width: 6),
        Text('Kitchen', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        const Spacer(),
        NxStatusBadge(label: '${kitchen.averageTimeMinutes}m avg', color: AppColors.info, small: true),
      ]),
      const SizedBox(height: AppDimens.sm),
      Row(children: [
        _MiniStat(label: 'Pending', value: '${kitchen.pending}', color: AppColors.warning),
        const SizedBox(width: 6),
        _MiniStat(label: 'Cooking', value: '${kitchen.preparing}', color: AppColors.primary),
        const SizedBox(width: 6),
        _MiniStat(label: 'Ready', value: '${kitchen.ready}', color: AppColors.success),
      ]),
      if (kitchen.orders.isNotEmpty) ...[
        const SizedBox(height: AppDimens.sm),
        ...kitchen.orders.take(4).map((o) => Padding(padding: const EdgeInsets.symmetric(vertical: 2), child: Row(children: [
          NxStatusBadge(label: o.status, color: _kitchenColor(o.status), small: true),
          const SizedBox(width: 6),
          Expanded(child: Text(o.orderNumber, style: GoogleFonts.inter(fontSize: 11), overflow: TextOverflow.ellipsis)),
          Text('${o.itemCount} items', style: GoogleFonts.inter(fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          const SizedBox(width: 6),
          Text('${o.elapsedMinutes}m', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600,
            color: o.elapsedMinutes > 15 ? AppColors.danger : Theme.of(context).colorScheme.onSurfaceVariant)),
        ]))),
      ],
    ]));
  }

  Color _kitchenColor(String s) {
    switch (s.toUpperCase()) { case 'PENDING': return AppColors.warning; case 'PREPARING': return AppColors.primary; case 'READY': return AppColors.success; default: return AppColors.gray500; }
  }
}

class _TableCard extends StatelessWidget {
  final TableStatus tableStatus;
  const _TableCard({required this.tableStatus});

  @override
  Widget build(BuildContext context) {
    return NxCard(padding: const EdgeInsets.all(AppDimens.base), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(Icons.table_restaurant, size: 16, color: AppColors.info),
        const SizedBox(width: 6),
        Text('Tables', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        const Spacer(),
        Text('${tableStatus.occupancyRate.toStringAsFixed(0)}%', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.info)),
      ]),
      const SizedBox(height: AppDimens.sm),
      if (tableStatus.total > 0) LinearProgressIndicator(
        value: tableStatus.occupied / tableStatus.total,
        backgroundColor: AppColors.success.withValues(alpha: 0.15), color: AppColors.danger, minHeight: 6, borderRadius: BorderRadius.circular(3)),
      const SizedBox(height: AppDimens.sm),
      Wrap(spacing: 6, runSpacing: 4, children: [
        _LegendDot(label: 'Occupied', value: tableStatus.occupied, color: AppColors.danger),
        _LegendDot(label: 'Reserved', value: tableStatus.reserved, color: AppColors.warning),
        _LegendDot(label: 'Free', value: tableStatus.available, color: AppColors.success),
        _LegendDot(label: 'Cleaning', value: tableStatus.cleaning, color: AppColors.info),
      ]),
      if (tableStatus.tables.isNotEmpty) ...[
        const SizedBox(height: AppDimens.sm),
        SizedBox(height: 70, child: Wrap(spacing: 5, runSpacing: 5, children: tableStatus.tables.take(12).map((t) => Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color: _tc(t.status).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(AppDimens.radiusSm),
            border: Border.all(color: _tc(t.status).withValues(alpha: 0.3)),
          ),
          child: Center(child: Text(t.number, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w600, color: _tc(t.status)))),
        )).toList())),
      ],
    ]));
  }

  Color _tc(String s) {
    switch (s.toUpperCase()) { case 'OCCUPIED': return AppColors.danger; case 'RESERVED': return AppColors.warning; case 'FREE': return AppColors.success; case 'CLEANING': return AppColors.info; default: return AppColors.gray500; }
  }
}

class _DeliveryCard extends StatelessWidget {
  final DeliveryStatus delivery;
  const _DeliveryCard({required this.delivery});

  @override
  Widget build(BuildContext context) {
    return NxCard(padding: const EdgeInsets.all(AppDimens.base), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(Icons.local_shipping, size: 16, color: AppColors.primary),
        const SizedBox(width: 6),
        Text('Delivery', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        const Spacer(),
        NxStatusBadge(label: '${delivery.averageDeliveryTime.toStringAsFixed(0)}m avg', color: AppColors.info, small: true),
      ]),
      const SizedBox(height: AppDimens.sm),
      Row(children: [
        _MiniStat(label: 'Pending', value: '${delivery.pending}', color: AppColors.warning),
        const SizedBox(width: 6),
        _MiniStat(label: 'In Transit', value: '${delivery.inTransit}', color: AppColors.primary),
        const SizedBox(width: 6),
        _MiniStat(label: 'Delivered', value: '${delivery.delivered}', color: AppColors.success),
      ]),
      if (delivery.activeDeliveries.isNotEmpty) ...[
        const SizedBox(height: AppDimens.sm),
        ...delivery.activeDeliveries.take(3).map((d) => Padding(padding: const EdgeInsets.symmetric(vertical: 2), child: Row(children: [
          NxStatusBadge(label: d.status, color: _dc(d.status), small: true),
          const SizedBox(width: 6),
          Expanded(child: Text(d.orderNumber, style: GoogleFonts.inter(fontSize: 11), overflow: TextOverflow.ellipsis)),
          Text(d.partnerName, style: GoogleFonts.inter(fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ]))),
      ],
    ]));
  }

  Color _dc(String s) {
    switch (s.toUpperCase()) { case 'PENDING': return AppColors.warning; case 'PICKED_UP': case 'IN_TRANSIT': return AppColors.primary; case 'DELIVERED': return AppColors.success; default: return AppColors.gray500; }
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _MiniStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(child: Container(
      padding: const EdgeInsets.symmetric(vertical: 5),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(AppDimens.radiusXs)),
      child: Column(children: [
        Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
        Text(label, style: GoogleFonts.inter(fontSize: 9, color: Theme.of(context).colorScheme.onSurfaceVariant)),
      ]),
    ));
  }
}

class _LegendDot extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  const _LegendDot({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Container(width: 7, height: 7, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
      const SizedBox(width: 3),
      Text('$label ($value)', style: GoogleFonts.inter(fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant)),
    ]);
  }
}

class OrdersListPanel extends StatelessWidget {
  final ActiveOrderStats stats;
  const OrdersListPanel({super.key, required this.stats});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return NxCard(padding: const EdgeInsets.all(AppDimens.base), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(Icons.receipt_long, size: 16, color: AppColors.primary),
        const SizedBox(width: 6),
        Text('Active Orders', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        const Spacer(),
        NxStatusBadge(label: '${stats.total} total', color: AppColors.primary, small: true),
      ]),
      const SizedBox(height: AppDimens.sm),
      if (stats.orders.isEmpty)
        Center(child: Padding(padding: const EdgeInsets.all(AppDimens.xl),
          child: Text('No active orders', style: GoogleFonts.inter(color: cs.onSurfaceVariant))))
      else
        ...stats.orders.take(10).map((o) => _OrderTile(order: o)),
    ]));
  }
}

class _OrderTile extends StatelessWidget {
  final ActiveOrder order;
  const _OrderTile({required this.order});

  @override
  Widget build(BuildContext context) {
    final age = DateTime.now().difference(order.createdAt);
    return Container(
      margin: const EdgeInsets.only(bottom: 4), padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(AppDimens.radiusSm)),
      child: Row(children: [
        NxStatusBadge(label: order.status, color: AppColors.orderStatusColor(order.status), small: true),
        const SizedBox(width: 6),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(order.orderNumber, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
          Text('${order.type.replaceAll('_', ' ')} • ${order.items} items${order.tableNumber != null ? ' • T${order.tableNumber}' : ''}',
            style: GoogleFonts.inter(fontSize: 9, color: Theme.of(context).colorScheme.onSurfaceVariant), overflow: TextOverflow.ellipsis),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('₹${order.totalAmount.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
          Text('${age.inMinutes}m ago', style: GoogleFonts.inter(fontSize: 9, color: age.inMinutes > 20 ? AppColors.danger : Theme.of(context).colorScheme.onSurfaceVariant)),
        ]),
      ]),
    );
  }
}

class ReservationsWidget extends StatelessWidget {
  final int todayCount;
  final int upcomingCount;
  final bool isDesktop;
  const ReservationsWidget({super.key, this.todayCount = 0, this.upcomingCount = 0, this.isDesktop = false});

  @override
  Widget build(BuildContext context) {
    return NxCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.event_seat, size: 16, color: AppColors.primary),
          const SizedBox(width: 6),
          Text('Reservations', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
          const Spacer(),
          NxStatusBadge(label: 'LIVE', color: AppColors.success, small: true),
        ]),
        const SizedBox(height: AppDimens.base),
        Row(children: [
          _MiniStat(value: '$todayCount', label: 'Today', color: AppColors.primary),
          const SizedBox(width: AppDimens.md),
          _MiniStat(value: '$upcomingCount', label: 'Upcoming', color: AppColors.info),
        ]),
      ]),
    );
  }
}

class StaffAttendanceWidget extends StatelessWidget {
  final StaffOverview overview;
  const StaffAttendanceWidget({super.key, required this.overview});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final attendanceRate = overview.totalStaff > 0
        ? (overview.clockedIn / overview.totalStaff * 100).toStringAsFixed(0)
        : '0';
    return NxCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.badge, size: 16, color: AppColors.primary),
          const SizedBox(width: 6),
          Text('Staff Attendance', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
          const Spacer(),
          NxStatusBadge(label: '$attendanceRate%', color: AppColors.success, small: true),
        ]),
        const SizedBox(height: AppDimens.base),
        Row(children: [
          _MiniStat(value: '${overview.clockedIn}', label: 'Clocked In', color: AppColors.success),
          const SizedBox(width: AppDimens.md),
          _MiniStat(value: '${overview.onBreak}', label: 'On Break', color: AppColors.warning),
          const SizedBox(width: AppDimens.md),
          _MiniStat(value: '${overview.absent}', label: 'Absent', color: AppColors.danger),
        ]),
        const SizedBox(height: AppDimens.sm),
        LinearProgressIndicator(
          value: overview.totalStaff > 0 ? overview.clockedIn / overview.totalStaff : 0,
          backgroundColor: cs.surfaceContainerHighest,
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.success),
          minHeight: 4,
          borderRadius: BorderRadius.circular(2),
        ),
      ]),
    );
  }
}

class InventoryAlertsWidget extends StatelessWidget {
  final InventoryOverview overview;
  const InventoryAlertsWidget({super.key, required this.overview});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return NxCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.warning_amber, size: 16, color: AppColors.warning),
          const SizedBox(width: 6),
          Text('Inventory Alerts', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
          const Spacer(),
          if (overview.lowStockCount + overview.outOfStockCount > 0)
            NxStatusBadge(label: '${overview.lowStockCount + overview.outOfStockCount} alerts', color: AppColors.danger, small: true),
        ]),
        const SizedBox(height: AppDimens.base),
        Row(children: [
          _MiniStat(value: '${overview.lowStockCount}', label: 'Low Stock', color: AppColors.warning),
          const SizedBox(width: AppDimens.md),
          _MiniStat(value: '${overview.outOfStockCount}', label: 'Out of Stock', color: AppColors.danger),
          const SizedBox(width: AppDimens.md),
          _MiniStat(value: '${overview.expiringItems}', label: 'Expiring', color: AppColors.info),
        ]),
        if (overview.alerts.isNotEmpty) ...[
          const SizedBox(height: AppDimens.sm),
          ...overview.alerts.take(3).map((alert) => Container(
            margin: const EdgeInsets.only(bottom: 4),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: alert.severity == 'critical' ? AppColors.danger.withValues(alpha: 0.08)
                : alert.severity == 'warning' ? AppColors.warning.withValues(alpha: 0.08)
                : cs.surfaceContainerHighest.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(AppDimens.radiusSm),
            ),
            child: Row(children: [
              Icon(Icons.circle, size: 6, color: alert.severity == 'critical' ? AppColors.danger
                : alert.severity == 'warning' ? AppColors.warning : AppColors.info),
              const SizedBox(width: 6),
              Expanded(child: Text('${alert.itemName} (${alert.currentStock}/${alert.minStock} ${alert.unit})',
                style: GoogleFonts.inter(fontSize: 10), maxLines: 1, overflow: TextOverflow.ellipsis)),
            ]),
          )),
        ],
      ]),
    );
  }
}
