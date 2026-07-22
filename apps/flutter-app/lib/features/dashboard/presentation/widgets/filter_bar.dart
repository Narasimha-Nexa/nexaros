import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/dashboard_models.dart';
import '../dashboard_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../shared/widgets/shared_widgets.dart';

class DashboardFilterBar extends StatelessWidget {
  final DashboardProvider provider;
  const DashboardFilterBar({super.key, required this.provider});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final filter = provider.filter;
    final isDesktop = MediaQuery.of(context).size.width > 1024;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppDimens.base, vertical: AppDimens.sm),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(bottom: BorderSide(color: cs.outline.withValues(alpha: 0.12))),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isDesktop) _buildDesktopFilters(context, cs, filter) else _buildMobileFilters(context, cs, filter),
          const SizedBox(height: 6),
          _buildAdvancedRow(context, cs, filter),
        ],
      ),
    );
  }

  Widget _buildDesktopFilters(BuildContext context, ColorScheme cs, DashboardFilter filter) {
    return Row(
      children: [
        _buildViewTabs(context, cs, filter.view),
        const SizedBox(width: AppDimens.md),
        Container(width: 1, height: 24, color: cs.outline.withValues(alpha: 0.15)),
        const SizedBox(width: AppDimens.md),
        _buildTimeRangeChips(context, cs, filter.timeRange),
        const Spacer(),
        _buildAutoRefreshToggle(context, cs),
        const SizedBox(width: 8),
        IconButton(
          icon: const Icon(Icons.refresh, size: 18), tooltip: 'Refresh',
          onPressed: () => provider.refresh(),
        ),
        const SizedBox(width: 8),
        IconButton(
          icon: const Icon(Icons.tune, size: 18), tooltip: 'Customize',
          onPressed: () => _showCustomizeSheet(context),
        ),
      ],
    );
  }

  Widget _buildMobileFilters(BuildContext context, ColorScheme cs, DashboardFilter filter) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _buildViewTabs(context, cs, filter.view),
          const SizedBox(width: AppDimens.sm),
          Container(width: 1, height: 24, color: cs.outline.withValues(alpha: 0.15)),
          const SizedBox(width: AppDimens.sm),
          _buildTimeRangeChips(context, cs, filter.timeRange),
        ],
      ),
    );
  }

  Widget _buildAdvancedRow(BuildContext context, ColorScheme cs, DashboardFilter filter) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _buildOrderTypeFilter(context, cs, filter.orderType),
          const SizedBox(width: AppDimens.sm),
          _buildChannelFilter(context, cs, filter.salesChannel),
          const SizedBox(width: AppDimens.sm),
          _buildPaymentFilter(context, cs, filter.paymentMethod),
          const SizedBox(width: AppDimens.sm),
          _buildCategoryFilter(context, cs, filter.category),
          const SizedBox(width: AppDimens.sm),
          NxStatusBadge(label: filter.rangeLabel, color: cs.primary, small: true),
        ],
      ),
    );
  }

  Widget _buildViewTabs(BuildContext context, ColorScheme cs, DashboardView current) {
    final views = [
      (DashboardView.overview, Icons.dashboard, 'Overview'),
      (DashboardView.sales, Icons.analytics, 'Sales'),
      (DashboardView.customers, Icons.people, 'Customers'),
      (DashboardView.menu, Icons.restaurant_menu, 'Menu'),
      (DashboardView.finance, Icons.account_balance_wallet, 'Finance'),
      (DashboardView.staff, Icons.badge, 'Staff'),
      (DashboardView.inventory, Icons.inventory_2, 'Inventory'),
      (DashboardView.live, Icons.live_tv, 'Live'),
      (DashboardView.notifications, Icons.notifications, 'Alerts'),
    ];

    return Row(
      children: views.map((v) {
        final sel = current == v.$1;
        return Padding(
          padding: const EdgeInsets.only(right: 4),
          child: ChoiceChip(
            label: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(v.$2, size: 13, color: sel ? Colors.white : cs.onSurfaceVariant),
              const SizedBox(width: 3),
              Text(v.$3, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500)),
            ]),
            selected: sel, onSelected: (_) => provider.setView(v.$1),
            selectedColor: cs.primary,
            backgroundColor: cs.surfaceContainerHighest.withValues(alpha: 0.5),
            labelStyle: GoogleFonts.inter(fontSize: 11, color: sel ? Colors.white : cs.onSurface),
            visualDensity: VisualDensity.compact,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTimeRangeChips(BuildContext context, ColorScheme cs, DashboardTimeRange current) {
    final ranges = [
      (DashboardTimeRange.today, 'Today'),
      (DashboardTimeRange.yesterday, 'Yesterday'),
      (DashboardTimeRange.thisWeek, 'Week'),
      (DashboardTimeRange.lastWeek, '7 Days'),
      (DashboardTimeRange.thisMonth, 'Month'),
      (DashboardTimeRange.thisQuarter, 'Quarter'),
      (DashboardTimeRange.thisYear, 'Year'),
    ];

    return Row(
      children: ranges.map((r) {
        final sel = current == r.$1;
        return Padding(
          padding: const EdgeInsets.only(right: 4),
          child: FilterChip(
            label: Text(r.$2, style: GoogleFonts.inter(fontSize: 10)),
            selected: sel, onSelected: (_) => provider.setTimeRange(r.$1),
            selectedColor: cs.primaryContainer, checkmarkColor: cs.primary,
            backgroundColor: cs.surfaceContainerHighest.withValues(alpha: 0.3),
            visualDensity: VisualDensity.compact,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildOrderTypeFilter(BuildContext context, ColorScheme cs, OrderType current) {
    final types = [
      (OrderType.all, 'All Types'),
      (OrderType.dineIn, 'Dine-In'),
      (OrderType.takeaway, 'Takeaway'),
      (OrderType.delivery, 'Delivery'),
    ];
    return Row(
      children: types.map((t) {
        return Padding(
          padding: const EdgeInsets.only(right: 4),
          child: FilterChip(
            label: Text(t.$2, style: GoogleFonts.inter(fontSize: 10)),
            selected: current == t.$1, onSelected: (_) => provider.setOrderType(t.$1),
            visualDensity: VisualDensity.compact,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildChannelFilter(BuildContext context, ColorScheme cs, SalesChannel current) {
    final channels = [
      (SalesChannel.all, 'All Channels'),
      (SalesChannel.pos, 'POS'),
      (SalesChannel.online, 'Online'),
      (SalesChannel.aggregator, 'Aggregator'),
    ];
    return Row(
      children: channels.map((ch) {
        return Padding(
          padding: const EdgeInsets.only(right: 4),
          child: FilterChip(
            label: Text(ch.$2, style: GoogleFonts.inter(fontSize: 10)),
            selected: current == ch.$1, onSelected: (_) => provider.setSalesChannel(ch.$1),
            visualDensity: VisualDensity.compact,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPaymentFilter(BuildContext context, ColorScheme cs, String? current) {
    final methods = [null, 'cash', 'card', 'upi', 'online'];
    final labels = ['All Payments', 'Cash', 'Card', 'UPI', 'Online'];
    return Row(
      children: List.generate(methods.length, (i) {
        return Padding(
          padding: const EdgeInsets.only(right: 4),
          child: FilterChip(
            label: Text(labels[i], style: GoogleFonts.inter(fontSize: 10)),
            selected: current == methods[i],
            onSelected: (_) => provider.setPaymentMethod(methods[i]),
            visualDensity: VisualDensity.compact,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        );
      }),
    );
  }

  Widget _buildCategoryFilter(BuildContext context, ColorScheme cs, String? current) {
    final categories = [null, 'starters', 'mains', 'desserts', 'beverages'];
    final labels = ['All Categories', 'Starters', 'Mains', 'Desserts', 'Beverages'];
    return Row(
      children: List.generate(categories.length, (i) {
        return Padding(
          padding: const EdgeInsets.only(right: 4),
          child: FilterChip(
            label: Text(labels[i], style: GoogleFonts.inter(fontSize: 10)),
            selected: current == categories[i],
            onSelected: (_) => provider.setCategory(categories[i]),
            visualDensity: VisualDensity.compact,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        );
      }),
    );
  }

  Widget _buildAutoRefreshToggle(BuildContext context, ColorScheme cs) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Auto', style: GoogleFonts.inter(fontSize: 11, color: cs.onSurfaceVariant)),
        const SizedBox(width: 4),
          Switch(
            value: provider.autoRefresh, onChanged: (_) => provider.toggleAutoRefresh(),
            activeThumbColor: AppColors.success, thumbColor: WidgetStateProperty.all(Colors.white),
          ),
      ],
    );
  }

  void _showCustomizeSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => _CustomizeSheet(provider: provider),
    );
  }
}

class _CustomizeSheet extends StatelessWidget {
  final DashboardProvider provider;
  const _CustomizeSheet({required this.provider});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return DraggableScrollableSheet(
      initialChildSize: 0.6, maxChildSize: 0.9, minChildSize: 0.3,
      expand: false,
      builder: (ctx, scrollCtrl) => Container(
        padding: const EdgeInsets.all(AppDimens.base),
        child: ListView(
          controller: scrollCtrl,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: cs.outline.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: AppDimens.base),
            Text('Customize Dashboard', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: AppDimens.md),
            Text('Toggle widgets visible on your dashboard', style: GoogleFonts.inter(fontSize: 13, color: cs.onSurfaceVariant)),
            const SizedBox(height: AppDimens.base),
            ...provider.widgetConfigs.map((config) => SwitchListTile(
              title: Text(config.widgetType.replaceAll('_', ' ').toUpperCase(), style: GoogleFonts.inter(fontSize: 13)),
              subtitle: Text('Widget ${config.order + 1}', style: GoogleFonts.inter(fontSize: 11, color: cs.onSurfaceVariant)),
              value: config.isVisible,
              onChanged: (_) => provider.toggleWidgetVisibility(config.id),
              activeThumbColor: AppColors.primary,
            )),
          ],
        ),
      ),
    );
  }
}
