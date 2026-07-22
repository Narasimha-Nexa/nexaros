import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/export/export_engine.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/dashboard_models.dart';
import '../data/dashboard_service.dart';
import '../data/dashboard_export_service.dart';
import '../data/dashboard_cache_service.dart';
import 'dashboard_provider.dart';
import 'widgets/widgets.dart';

final dashboardProvider = ChangeNotifierProvider.autoDispose<DashboardProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  final service = DashboardService(api);
  final provider = DashboardProvider(service, eventBus: appState.eventBus);
  SharedPreferences.getInstance().then((prefs) {
    final cache = DashboardCacheService(prefs);
    provider.setCache(cache);
    provider.init();
  });
  ref.onDispose(() => provider.dispose());
  return provider;
});

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});
  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  bool _showDragMode = false;
  ExportFormat _selectedExportFormat = ExportFormat.csv;

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(dashboardProvider);
    final data = provider.data;
    final isDesktop = ResponsiveLayout.isDesktop(context);
    final isTablet = ResponsiveLayout.isTablet(context);

    return DashboardSearchShortcut(
      data: data,
      child: Scaffold(
        floatingActionButton: _buildFab(context, data),
        body: RepaintBoundary(
          child: data.isLoading && data.kpis.isEmpty
              ? _buildLoading(context, isDesktop)
              : data.error != null && data.kpis.isEmpty
                  ? _buildError(context, data.error!, provider)
                  : _buildFullDashboard(context, data, provider, isDesktop, isTablet),
        ),
      ),
    );
  }

  Widget? _buildFab(BuildContext context, DashboardData data) {
    return Column(mainAxisSize: MainAxisSize.min, children: [
      FloatingActionButton.small(
        heroTag: 'search', onPressed: () => DashboardSearchOverlay.show(context, data),
        tooltip: 'Search (Ctrl+K)', child: const Icon(Icons.search, size: 20)),
      const SizedBox(height: 8),
      FloatingActionButton.small(
        heroTag: 'export', onPressed: () => _showExportDialog(context, data),
        tooltip: 'Export Dashboard', child: const Icon(Icons.download, size: 20)),
      const SizedBox(height: 8),
      FloatingActionButton.small(
        heroTag: 'reorder',
        onPressed: () => setState(() => _showDragMode = !_showDragMode),
        tooltip: 'Reorder Widgets',
        backgroundColor: _showDragMode ? AppColors.primary : null,
        child: Icon(_showDragMode ? Icons.check : Icons.drag_handle, size: 20)),
    ]);
  }

  void _showExportDialog(BuildContext context, DashboardData data) {
    showDialog(context: context, builder: (ctx) => _ExportDialog(
      data: data, selectedFormat: _selectedExportFormat,
      onFormatChanged: (f) => setState(() => _selectedExportFormat = f)));
  }

  Widget _buildLoading(BuildContext context, bool isDesktop) {
    return Column(children: [
      Container(height: 56, padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface),
        child: Row(children: [
          const NxSkeleton(width: 120, height: 16),
          const SizedBox(width: 12),
          const NxSkeleton(width: 80, height: 14),
          const Spacer(),
          const NxSkeleton.circle(size: 32),
        ])),
      const SizedBox(height: 8),
      Expanded(child: SingleChildScrollView(
        padding: EdgeInsets.all(AppDimens.responsivePadding(context)),
        child: Column(children: [
          const NxSkeleton(width: double.infinity, height: 40),
          const SizedBox(height: 12),
          KpiCardsSkeleton(isDesktop: isDesktop),
          const SizedBox(height: 16),
          ...List.generate(3, (_) => const Padding(
            padding: EdgeInsets.only(bottom: 12), child: NxSkeleton(height: 200))),
        ]),
      )),
    ]);
  }

  Widget _buildError(BuildContext context, String error, DashboardProvider provider) {
    return Center(child: Semantics(
      label: 'Dashboard error: $error',
      child: NxErrorView(message: 'Failed to load dashboard', details: error, onRetry: () => provider.refresh()),
    ));
  }

  Widget _buildFullDashboard(BuildContext context, DashboardData data, DashboardProvider provider, bool isDesktop, bool isTablet) {
    return Column(children: [
      Semantics(header: true, label: 'Restaurant dashboard header',
        child: ExecutiveHeader(
          header: data.header ?? ExecutiveHeaderData(businessDate: DateTime(2024), lastSync: DateTime(2024)),
          realtimeState: data.realtimeState)),
      Semantics(label: 'Dashboard filters', child: DashboardFilterBar(provider: provider)),
      Expanded(child: RefreshIndicator(
        onRefresh: () => provider.refresh(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.all(AppDimens.responsivePadding(context)),
          child: _buildView(context, data, provider, isDesktop, isTablet),
        ),
      )),
    ]);
  }

  Widget _buildView(BuildContext context, DashboardData data, DashboardProvider provider, bool isDesktop, bool isTablet) {
    switch (provider.filter.view) {
      case DashboardView.overview: return _buildOverview(data, provider, isDesktop, isTablet);
      case DashboardView.sales: return _buildSalesView(data, isDesktop, isTablet);
      case DashboardView.customers: return _buildCustomerView(data, isDesktop, isTablet);
      case DashboardView.menu: return _buildMenuView(data, isDesktop, isTablet);
      case DashboardView.finance: return _buildFinanceView(data, isDesktop, isTablet);
      case DashboardView.staff: return _buildStaffView(data, isDesktop, isTablet);
      case DashboardView.inventory: return _buildInventoryView(data, isDesktop, isTablet);
      case DashboardView.live: return _buildLiveView(data, isDesktop, isTablet);
      case DashboardView.notifications: return _buildNotificationsView(data, isDesktop);
    }
  }

  Widget _buildOverview(DashboardData data, DashboardProvider provider, bool isDesktop, bool isTablet) {
    if (_showDragMode) return _buildDragDropOverview(data, provider, isDesktop, isTablet);
    return _buildStaticOverview(data, provider, isDesktop, isTablet);
  }

  Widget _buildStaticOverview(DashboardData data, DashboardProvider provider, bool isDesktop, bool isTablet) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (provider.isWidgetVisible('kpi_cards'))
        Semantics(label: 'Key Performance Indicators', child: KpiCards(kpis: data.kpis, isDesktop: isDesktop, isTablet: isTablet)),
      const SizedBox(height: AppDimens.xl),
      if (provider.isWidgetVisible('ai_insights') && data.aiInsights.isNotEmpty) ...[
        Semantics(label: 'AI Generated Insights', child: AiInsightsPanel(insights: data.aiInsights)),
        const SizedBox(height: AppDimens.xl),
      ],
      if (provider.isWidgetVisible('live_operations'))
        Semantics(label: 'Live Operations', child: LiveOperationsPanel(
          orderStats: data.activeOrderStats, kitchen: data.kitchenStatus,
          tableStatus: data.tableStatus, delivery: data.deliveryStatus, isDesktop: isDesktop)),
      const SizedBox(height: AppDimens.xl),
      if (isDesktop)
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(flex: 3, child: _buildSalesSection(data, true)),
          const SizedBox(width: AppDimens.base),
          Expanded(flex: 2, child: _buildRightPanel(data)),
        ])
      else ...[
        _buildSalesSection(data, false),
        const SizedBox(height: AppDimens.xl),
        _buildRightPanel(data),
      ],
      const SizedBox(height: AppDimens.xl),
      if (provider.isWidgetVisible('domain_panels'))
        Semantics(label: 'Business Domain Analytics', child: DomainPanel(
          customerStats: data.customerStats, staffOverview: data.staffOverview,
          inventoryOverview: data.inventoryOverview, financeSummary: data.financeSummary,
          menuAnalytics: data.menuAnalytics, isDesktop: isDesktop)),
      const SizedBox(height: AppDimens.xl),
      if (provider.isWidgetVisible('activity_timeline'))
        Semantics(label: 'Activity Timeline', child: ActivityTimelinePanel(events: data.activityTimeline)),
      const SizedBox(height: AppDimens.xl),
      _buildQuickActions(isDesktop),
    ]);
  }

  Widget _buildDragDropOverview(DashboardData data, DashboardProvider provider, bool isDesktop, bool isTablet) {
    final visibleConfigs = provider.widgetConfigs.where((c) => c.isVisible).toList()
      ..sort((a, b) => a.order.compareTo(b.order));
    return ReorderableListView.builder(
      shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      itemCount: visibleConfigs.length,
      onReorderItem: (oldItem, newItem) {
        final oldIndex = visibleConfigs.indexWhere((c) => c.id == oldItem);
        final newIndex = visibleConfigs.indexWhere((c) => c.id == newItem);
        if (oldIndex != -1 && newIndex != -1) {
          provider.reorderWidgets(oldIndex, newIndex);
        }
      },
      proxyDecorator: (child, _, __) => Material(elevation: 4, borderRadius: BorderRadius.circular(AppDimens.cardRadius), child: child),
      itemBuilder: (context, index) {
        final config = visibleConfigs[index];
        return KeyedSubtree(key: ValueKey(config.id), child: Card(
          margin: const EdgeInsets.only(bottom: AppDimens.base),
          child: Stack(children: [
            _buildWidgetContent(config, data, isDesktop, isTablet),
            Positioned(top: 4, right: 4, child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(AppDimens.radiusXs)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.drag_handle, size: 14, color: Colors.white),
                const SizedBox(width: 4),
                Text(WidgetVisibilityService.widgetLabel(config.id),
                  style: GoogleFonts.inter(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w500)),
              ]))),
          ])));
      });
  }

  Widget _buildWidgetContent(DashboardWidgetConfig config, DashboardData data, bool isDesktop, bool isTablet) {
    return switch (config.id) {
      'kpi_cards' => KpiCards(kpis: data.kpis, isDesktop: isDesktop, isTablet: isTablet),
      'ai_insights' => AiInsightsPanel(insights: data.aiInsights),
      'live_operations' => LiveOperationsPanel(orderStats: data.activeOrderStats, kitchen: data.kitchenStatus,
        tableStatus: data.tableStatus, delivery: data.deliveryStatus, isDesktop: isDesktop),
      'reservations' => ReservationsWidget(todayCount: data.activeOrderStats.total, isDesktop: isDesktop),
      'staff_attendance' => StaffAttendanceWidget(overview: data.staffOverview),
      'inventory_alerts' => InventoryAlertsWidget(overview: data.inventoryOverview),
      'revenue_trend' => RevenueTrendChart(salesData: data.salesData, isDesktop: isDesktop),
      'orders_trend' => OrdersTrendChart(salesData: data.salesData, isDesktop: isDesktop),
      'customer_growth' => CustomerGrowthChart(stats: data.customerStats, isDesktop: isDesktop),
      'sales_overview' => SalesOverviewPanel(salesData: data.salesData, categorySales: data.categorySales,
        paymentBreakdown: data.paymentBreakdown, channelData: data.channelData, comparisons: data.comparisons, isDesktop: isDesktop),
      'peak_hours_heatmap' => PeakHoursHeatmap(hourlySales: data.hourlySales, isDesktop: isDesktop),
      'top_selling' => TopSellingPanel(items: data.topSelling),
      'activity_timeline' => ActivityTimelinePanel(events: data.activityTimeline),
      'notifications_panel' => NotificationsPanel(notifications: data.notifications, isDesktop: isDesktop,
        onMarkAllRead: () => ref.read(dashboardProvider).markAllNotificationsRead()),
      _ => DomainPanel(customerStats: data.customerStats, staffOverview: data.staffOverview,
        inventoryOverview: data.inventoryOverview, financeSummary: data.financeSummary,
        menuAnalytics: data.menuAnalytics, isDesktop: isDesktop),
    };
  }

  Widget _buildSalesSection(DashboardData data, bool isDesktop) {
    return Column(children: [
      if (ref.read(dashboardProvider).isWidgetVisible('sales_overview'))
        SalesOverviewPanel(salesData: data.salesData, categorySales: data.categorySales,
          paymentBreakdown: data.paymentBreakdown, channelData: data.channelData,
          comparisons: data.comparisons, isDesktop: isDesktop),
      const SizedBox(height: AppDimens.base),
      if (ref.read(dashboardProvider).isWidgetVisible('peak_hours_heatmap'))
        PeakHoursHeatmap(hourlySales: data.hourlySales, isDesktop: isDesktop),
      const SizedBox(height: AppDimens.base),
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(child: RevenueTrendChart(salesData: data.salesData, isDesktop: isDesktop)),
        const SizedBox(width: AppDimens.base),
        Expanded(child: OrdersTrendChart(salesData: data.salesData, isDesktop: isDesktop)),
      ]),
    ]);
  }

  Widget _buildRightPanel(DashboardData data) {
    return Column(children: [
      if (ref.read(dashboardProvider).isWidgetVisible('top_selling'))
        TopSellingPanel(items: data.topSelling),
      const SizedBox(height: AppDimens.base),
      if (ref.read(dashboardProvider).isWidgetVisible('activity_timeline'))
        ActivityTimelinePanel(events: data.activityTimeline),
    ]);
  }

  Widget _buildSalesView(DashboardData data, bool isDesktop, bool isTablet) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      KpiCards(kpis: data.kpis.where((k) => k.category == 'revenue' || k.category == 'orders').toList(), isDesktop: isDesktop, isTablet: isTablet),
      const SizedBox(height: AppDimens.xl),
      SalesOverviewPanel(salesData: data.salesData, categorySales: data.categorySales,
        paymentBreakdown: data.paymentBreakdown, channelData: data.channelData, comparisons: data.comparisons, isDesktop: isDesktop),
      const SizedBox(height: AppDimens.xl),
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(child: RevenueTrendChart(salesData: data.salesData, isDesktop: isDesktop)),
        const SizedBox(width: AppDimens.base),
        Expanded(child: OrdersTrendChart(salesData: data.salesData, isDesktop: isDesktop)),
      ]),
      const SizedBox(height: AppDimens.xl),
      PeakHoursHeatmap(hourlySales: data.hourlySales, isDesktop: isDesktop),
      const SizedBox(height: AppDimens.xl),
      TopSellingPanel(items: data.topSelling),
    ]);
  }

  Widget _buildCustomerView(DashboardData data, bool isDesktop, bool isTablet) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      KpiCards(kpis: data.kpis.where((k) => k.category == 'customers').toList(), isDesktop: isDesktop, isTablet: isTablet),
      const SizedBox(height: AppDimens.xl),
      CustomerGrowthChart(stats: data.customerStats, isDesktop: isDesktop),
      const SizedBox(height: AppDimens.xl),
      DomainPanel(customerStats: data.customerStats, staffOverview: data.staffOverview,
        inventoryOverview: data.inventoryOverview, financeSummary: data.financeSummary,
        menuAnalytics: data.menuAnalytics, isDesktop: isDesktop),
    ]);
  }

  Widget _buildMenuView(DashboardData data, bool isDesktop, bool isTablet) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      KpiCards(kpis: data.kpis.where((k) => k.category == 'orders').toList(), isDesktop: isDesktop, isTablet: isTablet),
      const SizedBox(height: AppDimens.xl),
      TopSellingPanel(items: data.topSelling),
      const SizedBox(height: AppDimens.xl),
      SalesOverviewPanel(salesData: data.salesData, categorySales: data.categorySales,
        paymentBreakdown: data.paymentBreakdown, isDesktop: isDesktop),
      const SizedBox(height: AppDimens.xl),
      DomainPanel(customerStats: data.customerStats, staffOverview: data.staffOverview,
        inventoryOverview: data.inventoryOverview, financeSummary: data.financeSummary,
        menuAnalytics: data.menuAnalytics, isDesktop: isDesktop),
    ]);
  }

  Widget _buildFinanceView(DashboardData data, bool isDesktop, bool isTablet) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      KpiCards(kpis: data.kpis.where((k) => k.category == 'finance').toList(), isDesktop: isDesktop, isTablet: isTablet),
      const SizedBox(height: AppDimens.xl),
      DomainPanel(customerStats: data.customerStats, staffOverview: data.staffOverview,
        inventoryOverview: data.inventoryOverview, financeSummary: data.financeSummary,
        menuAnalytics: data.menuAnalytics, isDesktop: isDesktop),
    ]);
  }

  Widget _buildStaffView(DashboardData data, bool isDesktop, bool isTablet) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      KpiCards(kpis: data.kpis.where((k) => k.category == 'staff' || k.category == 'operations').toList(), isDesktop: isDesktop, isTablet: isTablet),
      const SizedBox(height: AppDimens.xl),
      DomainPanel(customerStats: data.customerStats, staffOverview: data.staffOverview,
        inventoryOverview: data.inventoryOverview, financeSummary: data.financeSummary,
        menuAnalytics: data.menuAnalytics, isDesktop: isDesktop),
    ]);
  }

  Widget _buildInventoryView(DashboardData data, bool isDesktop, bool isTablet) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      KpiCards(kpis: data.kpis.where((k) => k.category == 'inventory').toList(), isDesktop: isDesktop, isTablet: isTablet),
      const SizedBox(height: AppDimens.xl),
      DomainPanel(customerStats: data.customerStats, staffOverview: data.staffOverview,
        inventoryOverview: data.inventoryOverview, financeSummary: data.financeSummary,
        menuAnalytics: data.menuAnalytics, isDesktop: isDesktop),
    ]);
  }

  Widget _buildLiveView(DashboardData data, bool isDesktop, bool isTablet) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      LiveOperationsPanel(orderStats: data.activeOrderStats, kitchen: data.kitchenStatus,
        tableStatus: data.tableStatus, delivery: data.deliveryStatus, isDesktop: isDesktop),
      const SizedBox(height: AppDimens.xl),
      OrdersListPanel(stats: data.activeOrderStats),
      const SizedBox(height: AppDimens.xl),
      ActivityTimelinePanel(events: data.activityTimeline),
    ]);
  }

  Widget _buildNotificationsView(DashboardData data, bool isDesktop) {
    return NotificationsPanel(notifications: data.notifications, isDesktop: isDesktop,
      onMarkAllRead: () => ref.read(dashboardProvider).markAllNotificationsRead());
  }

  Widget _buildQuickActions(bool isDesktop) {
    return Semantics(label: 'Quick navigation actions',
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        NxSectionHeader(title: 'Quick Actions'),
        const SizedBox(height: AppDimens.sm),
        GridView.count(
          crossAxisCount: isDesktop ? 4 : 2,
          shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: AppDimens.sm, crossAxisSpacing: AppDimens.sm,
          childAspectRatio: isDesktop ? 2.5 : 2.2,
          children: const [
            _ActionCard(title: 'New Order', icon: Icons.add_shopping_cart, route: '/shell/pos', color: AppColors.primary, semanticLabel: 'Create a new order'),
            _ActionCard(title: 'Menu', icon: Icons.restaurant_menu, route: '/shell/menu', color: AppColors.secondary, semanticLabel: 'Manage menu'),
            _ActionCard(title: 'Orders', icon: Icons.receipt, route: '/shell/orders', color: AppColors.success, semanticLabel: 'View orders'),
            _ActionCard(title: 'Tables', icon: Icons.table_restaurant, route: '/shell/tables', color: AppColors.info, semanticLabel: 'Manage tables'),
            _ActionCard(title: 'Kitchen', icon: Icons.precision_manufacturing, route: '/shell/kitchen', color: AppColors.warning, semanticLabel: 'Kitchen display'),
            _ActionCard(title: 'Delivery', icon: Icons.local_shipping, route: '/shell/delivery', color: AppColors.danger, semanticLabel: 'Delivery tracking'),
            _ActionCard(title: 'Finance', icon: Icons.account_balance_wallet, route: '/shell/finance', color: AppColors.success, semanticLabel: 'Finance overview'),
            _ActionCard(title: 'Reports', icon: Icons.analytics, route: '/shell/reports', color: AppColors.primary, semanticLabel: 'View reports'),
          ],
        ),
      ]));
  }
}

class _ActionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final String route;
  final Color color;
  final String semanticLabel;
  const _ActionCard({required this.title, required this.icon, required this.route, required this.color, this.semanticLabel = ''});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticLabel.isNotEmpty ? semanticLabel : title,
      button: true,
      child: Card(elevation: 0, shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDimens.cardRadius),
        side: BorderSide(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.1))),
        child: InkWell(onTap: () => context.go(route),
          borderRadius: BorderRadius.circular(AppDimens.cardRadius),
          child: Padding(padding: const EdgeInsets.all(AppDimens.md), child: Row(children: [
            Container(width: 36, height: 36, decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(AppDimens.radiusSm)),
              child: Icon(icon, color: color, size: 20)),
            const SizedBox(width: AppDimens.sm),
            Expanded(child: Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500))),
            Icon(Icons.chevron_right, color: Theme.of(context).colorScheme.outline, size: 16),
          ])))));
  }
}

class _ExportDialog extends StatefulWidget {
  final DashboardData data;
  final ExportFormat selectedFormat;
  final ValueChanged<ExportFormat> onFormatChanged;
  const _ExportDialog({required this.data, required this.selectedFormat, required this.onFormatChanged});

  @override
  State<_ExportDialog> createState() => _ExportDialogState();
}

class _ExportDialogState extends State<_ExportDialog> {
  late ExportFormat _format;
  bool _exporting = false;
  String? _result;

  @override
  void initState() { super.initState(); _format = widget.selectedFormat; }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return AlertDialog(
      title: Text('Export Dashboard', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        Text('Select format:', style: GoogleFonts.inter(fontSize: 14, color: cs.onSurfaceVariant)),
        const SizedBox(height: AppDimens.base),
        ...ExportFormat.values.map((f) => RadioListTile<ExportFormat>(
          title: Text(f.name.toUpperCase(), style: GoogleFonts.inter(fontSize: 14)),
          value: f, groupValue: _format,
          onChanged: (v) => setState(() { _format = v!; widget.onFormatChanged(v); }),
          dense: true)),
        if (_result != null) ...[
          const SizedBox(height: AppDimens.sm),
          Container(padding: const EdgeInsets.all(AppDimens.sm),
            decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(AppDimens.radiusSm)),
            child: Row(children: [
              const Icon(Icons.check_circle, color: AppColors.success, size: 16),
              const SizedBox(width: 8),
              Expanded(child: Text(_result!, style: GoogleFonts.inter(fontSize: 12, color: AppColors.success))),
            ])),
        ],
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        FilledButton(
          onPressed: _exporting ? null : _doExport,
          child: _exporting ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Export'),
        ),
      ]);
  }

  Future<void> _doExport() async {
    setState(() { _exporting = true; _result = null; });
    try {
      final result = await switch (_format) {
        ExportFormat.csv => DashboardExportService.exportOverview(widget.data),
        ExportFormat.json => DashboardExportService.exportSales(widget.data, ExportFormat.json),
        ExportFormat.pdf => DashboardExportService.exportKpis(widget.data, ExportFormat.pdf),
        ExportFormat.excel => DashboardExportService.exportSales(widget.data, ExportFormat.excel),
      };
      setState(() { _result = DashboardExportService.exportSummary(result); _exporting = false; });
    } catch (e) {
      setState(() { _result = 'Export failed: $e'; _exporting = false; });
    }
  }
}
