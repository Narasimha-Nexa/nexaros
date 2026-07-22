import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/dashboard_models.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../shared/widgets/shared_widgets.dart';

class DomainPanel extends StatelessWidget {
  final CustomerStats customerStats;
  final StaffOverview staffOverview;
  final InventoryOverview inventoryOverview;
  final FinanceSummary financeSummary;
  final MenuAnalytics menuAnalytics;
  final bool isDesktop;

  const DomainPanel({
    super.key, required this.customerStats, required this.staffOverview,
    required this.inventoryOverview, required this.financeSummary,
    required this.menuAnalytics, this.isDesktop = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isDesktop) {
      return Column(children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(child: _CustomerPanel(stats: customerStats)),
          const SizedBox(width: AppDimens.base),
          Expanded(child: _StaffPanel(overview: staffOverview)),
          const SizedBox(width: AppDimens.base),
          Expanded(child: _FinanceMiniPanel(summary: financeSummary)),
        ]),
        const SizedBox(height: AppDimens.base),
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(child: _InventoryPanel(overview: inventoryOverview)),
          const SizedBox(width: AppDimens.base),
          Expanded(child: _MenuAnalyticsPanel(analytics: menuAnalytics)),
        ]),
      ]);
    }
    return Column(children: [
      _CustomerPanel(stats: customerStats),
      const SizedBox(height: AppDimens.base),
      _StaffPanel(overview: staffOverview),
      const SizedBox(height: AppDimens.base),
      _FinanceMiniPanel(summary: financeSummary),
      const SizedBox(height: AppDimens.base),
      _InventoryPanel(overview: inventoryOverview),
      const SizedBox(height: AppDimens.base),
      _MenuAnalyticsPanel(analytics: menuAnalytics),
    ]);
  }
}

class _CustomerPanel extends StatelessWidget {
  final CustomerStats stats;
  const _CustomerPanel({required this.stats});

  @override
  Widget build(BuildContext context) {
    return NxCard(padding: const EdgeInsets.all(AppDimens.base), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _PanelHeader(icon: Icons.people, label: 'Customers', color: AppColors.info),
      const SizedBox(height: AppDimens.sm),
      Row(children: [
        _MiniStatCol(label: 'Total', value: '${stats.totalCustomers}', color: AppColors.info),
        _MiniStatCol(label: 'New', value: '${stats.newCustomers}', color: AppColors.success),
        _MiniStatCol(label: 'Returning', value: '${stats.returningCustomers}', color: AppColors.primary),
      ]),
      const SizedBox(height: AppDimens.sm),
      Row(children: [
        _MiniStatCol(label: 'Retention', value: '${stats.retentionRate.toStringAsFixed(0)}%', color: AppColors.success),
        _MiniStatCol(label: 'Avg Spend', value: '₹${stats.averageSpend.toStringAsFixed(0)}', color: AppColors.warning),
        if (stats.averageLifetimeValue > 0)
          _MiniStatCol(label: 'CLV', value: '₹${stats.averageLifetimeValue.toStringAsFixed(0)}', color: AppColors.secondary),
      ]),
      if (stats.feedbackScore > 0) ...[
        const SizedBox(height: AppDimens.sm),
        Row(children: [
          Icon(Icons.star, size: 14, color: AppColors.warning),
          const SizedBox(width: 4),
          Text('Feedback: ${stats.feedbackScore.toStringAsFixed(1)}/5', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
        ]),
      ],
      if (stats.topCustomers.isNotEmpty) ...[
        const SizedBox(height: AppDimens.sm),
        Text('Top Customers', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ...stats.topCustomers.take(3).map((c) => Padding(padding: const EdgeInsets.symmetric(vertical: 2), child: Row(children: [
          Icon(Icons.person, size: 12, color: Theme.of(context).colorScheme.outline),
          const SizedBox(width: 6),
          Expanded(child: Text(c.name, style: GoogleFonts.inter(fontSize: 11), overflow: TextOverflow.ellipsis)),
          NxStatusBadge(label: c.tier, color: _tc(c.tier), small: true),
          const SizedBox(width: 4),
          Text('₹${c.totalSpend.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600)),
        ]))),
      ],
    ]));
  }

  Color _tc(String t) {
    switch (t.toLowerCase()) { case 'gold': return AppColors.warning; case 'platinum': return AppColors.secondary; default: return AppColors.info; }
  }
}

class _StaffPanel extends StatelessWidget {
  final StaffOverview overview;
  const _StaffPanel({required this.overview});

  @override
  Widget build(BuildContext context) {
    return NxCard(padding: const EdgeInsets.all(AppDimens.base), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _PanelHeader(icon: Icons.badge, label: 'Staff', color: AppColors.secondary),
      const SizedBox(height: AppDimens.sm),
      Row(children: [
        _MiniStatCol(label: 'Total', value: '${overview.totalStaff}', color: AppColors.secondary),
        _MiniStatCol(label: 'On Duty', value: '${overview.onDuty}', color: AppColors.success),
        _MiniStatCol(label: 'Absent', value: '${overview.absent}', color: AppColors.danger),
      ]),
      const SizedBox(height: AppDimens.sm),
      Row(children: [
        Text('Labor Cost:', style: GoogleFonts.inter(fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant)),
        const SizedBox(width: 4),
        Text('${overview.laborCostPercentage.toStringAsFixed(1)}%', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600,
          color: overview.laborCostPercentage > 30 ? AppColors.danger : AppColors.success)),
        const Spacer(),
        if (overview.totalStaff > 0) SizedBox(width: 70, child: LinearProgressIndicator(
          value: overview.onDuty / overview.totalStaff, backgroundColor: AppColors.success.withValues(alpha: 0.12),
          color: AppColors.success, minHeight: 4, borderRadius: BorderRadius.circular(2))),
      ]),
      if (overview.totalTips > 0) ...[
        const SizedBox(height: 4),
        Row(children: [
          Icon(Icons.volunteer_activism, size: 12, color: AppColors.warning),
          const SizedBox(width: 4),
          Text('Tips: ₹${overview.totalTips.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.warning)),
        ]),
      ],
      if (overview.topPerformers.isNotEmpty) ...[
        const SizedBox(height: AppDimens.sm),
        Text('Top Performers', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ...overview.topPerformers.take(3).map((p) => Padding(padding: const EdgeInsets.symmetric(vertical: 2), child: Row(children: [
          Icon(Icons.person, size: 12, color: AppColors.secondary),
          const SizedBox(width: 6),
          Expanded(child: Text(p.name, style: GoogleFonts.inter(fontSize: 11), overflow: TextOverflow.ellipsis)),
          Text('₹${p.salesAmount.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600)),
        ]))),
      ],
      if (overview.recentActivity.isNotEmpty) ...[
        const SizedBox(height: AppDimens.sm),
        ...overview.recentActivity.take(3).map((s) => Padding(padding: const EdgeInsets.symmetric(vertical: 1), child: Row(children: [
          Container(width: 5, height: 5, decoration: BoxDecoration(color: s.status == 'ON_DUTY' ? AppColors.success : AppColors.warning, shape: BoxShape.circle)),
          const SizedBox(width: 5),
          Expanded(child: Text(s.name, style: GoogleFonts.inter(fontSize: 10), overflow: TextOverflow.ellipsis)),
          Text(s.role, style: GoogleFonts.inter(fontSize: 9, color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ]))),
      ],
    ]));
  }
}

class _FinanceMiniPanel extends StatelessWidget {
  final FinanceSummary summary;
  const _FinanceMiniPanel({required this.summary});

  @override
  Widget build(BuildContext context) {
    return NxCard(padding: const EdgeInsets.all(AppDimens.base), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _PanelHeader(icon: Icons.account_balance_wallet, label: 'Finance', color: AppColors.success),
      const SizedBox(height: AppDimens.sm),
      _FinRow(label: 'Revenue', value: summary.totalRevenue, color: AppColors.success),
      _FinRow(label: 'Expenses', value: summary.totalExpenses, color: AppColors.danger),
      const Divider(height: 12),
      _FinRow(label: 'Net Profit', value: summary.netProfit, color: summary.netProfit >= 0 ? AppColors.success : AppColors.danger, bold: true),
      _FinRow(label: 'Margin', displayText: '${summary.profitMargin.toStringAsFixed(1)}%', color: summary.profitMargin > 0 ? AppColors.success : AppColors.danger),
      _FinRow(label: 'Tax', value: summary.totalTax, color: AppColors.info),
      if (summary.cashFlow > 0) _FinRow(label: 'Cash Flow', value: summary.cashFlow, color: AppColors.success),
      if (summary.outstandingPayments > 0) _FinRow(label: 'Outstanding', value: summary.outstandingPayments, color: AppColors.warning),
      if (summary.bankSettlement > 0) _FinRow(label: 'Bank Settlement', value: summary.bankSettlement, color: AppColors.primary),
      if (summary.upiSettlement > 0) _FinRow(label: 'UPI Settlement', value: summary.upiSettlement, color: AppColors.secondary),
      if (summary.totalRefunds > 0) _FinRow(label: 'Refunds', value: summary.totalRefunds, color: AppColors.danger),
      if (summary.expenseBreakdown.isNotEmpty) ...[
        const SizedBox(height: AppDimens.sm),
        ...summary.expenseBreakdown.take(4).map((e) => Padding(padding: const EdgeInsets.symmetric(vertical: 1), child: Row(children: [
          Expanded(child: Text(e.category, style: GoogleFonts.inter(fontSize: 10), overflow: TextOverflow.ellipsis)),
          Text('₹${e.amount.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w500)),
          const SizedBox(width: 4),
          Text('${e.percentage.toStringAsFixed(0)}%', style: GoogleFonts.inter(fontSize: 9, color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ]))),
      ],
    ]));
  }
}

class _InventoryPanel extends StatelessWidget {
  final InventoryOverview overview;
  const _InventoryPanel({required this.overview});

  @override
  Widget build(BuildContext context) {
    return NxCard(padding: const EdgeInsets.all(AppDimens.base), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(Icons.inventory_2, size: 16, color: AppColors.warning),
        const SizedBox(width: 6),
        Text('Inventory', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        if (overview.alerts.isNotEmpty) ...[
          const Spacer(),
          NxStatusBadge(label: '${overview.alerts.length} alerts', color: AppColors.danger, small: true),
        ],
      ]),
      const SizedBox(height: AppDimens.sm),
      Row(children: [
        _MiniStatCol(label: 'Value', value: '₹${overview.totalValue.toStringAsFixed(0)}', color: AppColors.warning),
        _MiniStatCol(label: 'Food Cost', value: '₹${overview.foodCost.toStringAsFixed(0)}', color: AppColors.danger),
        _MiniStatCol(label: 'Waste', value: '${overview.wastePercentage.toStringAsFixed(1)}%', color: AppColors.danger),
      ]),
      const SizedBox(height: AppDimens.sm),
      Row(children: [
        _MiniStatCol(label: 'Low Stock', value: '${overview.lowStockCount}', color: AppColors.warning),
        _MiniStatCol(label: 'Out of Stock', value: '${overview.outOfStockCount}', color: AppColors.danger),
        _MiniStatCol(label: 'Expiring', value: '${overview.expiringItems}', color: AppColors.info),
        _MiniStatCol(label: 'PO Pending', value: '${overview.pendingPurchaseOrders}', color: AppColors.secondary),
      ]),
      if (overview.alerts.isNotEmpty) ...[
        const SizedBox(height: AppDimens.sm),
        ...overview.alerts.take(4).map((a) => Padding(padding: const EdgeInsets.symmetric(vertical: 2), child: Row(children: [
          Icon(a.severity == 'out_of_stock' ? Icons.error : Icons.warning_amber, size: 12,
            color: a.severity == 'out_of_stock' ? AppColors.danger : AppColors.warning),
          const SizedBox(width: 5),
          Expanded(child: Text(a.itemName, style: GoogleFonts.inter(fontSize: 11), overflow: TextOverflow.ellipsis)),
          Text('${a.currentStock}/${a.minStock} ${a.unit}', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600,
            color: a.currentStock == 0 ? AppColors.danger : AppColors.warning)),
        ]))),
      ],
      if (overview.wasteItems.isNotEmpty) ...[
        const SizedBox(height: AppDimens.sm),
        Text('Recent Waste', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ...overview.wasteItems.take(3).map((w) => Padding(padding: const EdgeInsets.symmetric(vertical: 1), child: Row(children: [
          Expanded(child: Text(w.name, style: GoogleFonts.inter(fontSize: 10), overflow: TextOverflow.ellipsis)),
          Text('₹${w.cost.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 10, color: AppColors.danger)),
        ]))),
      ],
    ]));
  }
}

class _MenuAnalyticsPanel extends StatelessWidget {
  final MenuAnalytics analytics;
  const _MenuAnalyticsPanel({required this.analytics});

  @override
  Widget build(BuildContext context) {
    return NxCard(padding: const EdgeInsets.all(AppDimens.base), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _PanelHeader(icon: Icons.restaurant_menu, label: 'Menu Analytics', color: AppColors.primary),
      const SizedBox(height: AppDimens.sm),
      Row(children: [
        _MiniStatCol(label: 'Avg Prep Time', value: '${analytics.averagePreparationTime.toStringAsFixed(0)}m', color: AppColors.primary),
        _MiniStatCol(label: 'Low Margin', value: '${analytics.lowMarginItems.length}', color: AppColors.danger),
      ]),
      if (analytics.highMarginItems.isNotEmpty) ...[
        const SizedBox(height: AppDimens.sm),
        Text('High Margin Items', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.success)),
        ...analytics.highMarginItems.take(3).map((m) => Padding(padding: const EdgeInsets.symmetric(vertical: 1), child: Row(children: [
          Expanded(child: Text(m.name, style: GoogleFonts.inter(fontSize: 11), overflow: TextOverflow.ellipsis)),
          Text('${m.margin.toStringAsFixed(0)}%', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.success)),
        ]))),
      ],
      if (analytics.frequentlyOrderedTogether.isNotEmpty) ...[
        const SizedBox(height: AppDimens.sm),
        Text('Frequently Ordered Together', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600)),
        ...analytics.frequentlyOrderedTogether.take(3).map((f) => Padding(padding: const EdgeInsets.symmetric(vertical: 1), child: Row(children: [
          Expanded(child: Text('${f.item1} + ${f.item2}', style: GoogleFonts.inter(fontSize: 10), overflow: TextOverflow.ellipsis)),
          Text('${f.timesOrdered}x', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600)),
        ]))),
      ],
    ]));
  }
}

class _PanelHeader extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _PanelHeader({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(width: 6),
      Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
    ]);
  }
}

class _MiniStatCol extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _MiniStatCol({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
      Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
      Text(label, style: GoogleFonts.inter(fontSize: 9, color: Theme.of(context).colorScheme.onSurfaceVariant)),
    ]));
  }
}

class _FinRow extends StatelessWidget {
  final String label;
  final double? value;
  final Color color;
  final bool bold;
  final String? displayText;
  const _FinRow({required this.label, this.value, required this.color, this.bold = false, this.displayText});

  @override
  Widget build(BuildContext context) {
    final display = displayText ?? (value != null ? '₹${value!.toStringAsFixed(0)}' : '₹0');
    return Padding(padding: const EdgeInsets.symmetric(vertical: 1), child: Row(children: [
      Text(label, style: GoogleFonts.inter(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant)),
      const Spacer(),
      Text(display, style: GoogleFonts.inter(fontSize: 11, fontWeight: bold ? FontWeight.w700 : FontWeight.w600, color: color)),
    ]));
  }
}
