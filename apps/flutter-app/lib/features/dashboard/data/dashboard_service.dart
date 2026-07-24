import 'package:flutter/material.dart';
import '../data/dashboard_models.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/date_utils.dart' as app_date_utils;

class DashboardService {
  final ApiClient _api;
  DashboardService(this._api);

  String _d(DateTime d) => app_date_utils.DateUtils.toApiDate(d);

  Future<DashboardData> loadDashboard(DashboardFilter filter) async {
    try {
      final s = _d(filter.effectiveStart);
      final e = _d(filter.effectiveEnd);
      final b = filter.branchId;

      final r = await Future.wait<dynamic>([
        _api.getTodayStats(),
        _api.getReport('daily-sales', s, e, branchId: b),
        _api.getReport('items', s, e, branchId: b),
        _api.getOrders(limit: 100, branchId: b),
        _api.getKitchenAnalytics(startDate: s, endDate: e, branchId: b),
        _api.getTables(branchId: b),
        _api.getDeliveryAnalytics(startDate: s, endDate: e, branchId: b),
        _api.getCustomerAnalytics(startDate: s, endDate: e, branchId: b),
        _api.getStaffAnalytics(startDate: s, endDate: e, branchId: b),
        _api.getInventoryAnalytics(startDate: s, endDate: e, branchId: b),
        _api.getFinanceOverview(startDate: s, endDate: e),
        _api.getNotifications(limit: 20),
        _api.getProfile(),
        _api.getExecutiveSummary(branchId: b).catchError((_) => <String, dynamic>{}),
        _api.getProfitability(branchId: b).catchError((_) => <String, dynamic>{}),
      ]);

      return _build(
        stats: r[0] as Map<String, dynamic>,
        dailySales: r[1] as Map<String, dynamic>,
        itemPerf: r[2] as Map<String, dynamic>,
        orders: r[3] as List,
        kitchenAnalytics: r[4] as Map<String, dynamic>,
        tables: r[5] as List,
        deliveryAnalytics: r[6] as Map<String, dynamic>,
        customerAnalytics: r[7] as Map<String, dynamic>,
        staffAnalytics: r[8] as Map<String, dynamic>,
        inventoryAnalytics: r[9] as Map<String, dynamic>,
        financeOverview: r[10] as Map<String, dynamic>,
        notifications: r[11] as List,
        profile: r[12] as Map<String, dynamic>,
        executiveSummary: r[13] as Map<String, dynamic>,
        profitability: r[14] as Map<String, dynamic>,
        filter: filter,
      );
    } catch (e) {
      return DashboardData(isLoading: false, error: e.toString());
    }
  }

  DashboardData _build({
    required Map<String, dynamic> stats,
    required Map<String, dynamic> dailySales,
    required Map<String, dynamic> itemPerf,
    required List orders,
    required Map<String, dynamic> kitchenAnalytics,
    required List tables,
    required Map<String, dynamic> deliveryAnalytics,
    required Map<String, dynamic> customerAnalytics,
    required Map<String, dynamic> staffAnalytics,
    required Map<String, dynamic> inventoryAnalytics,
    required Map<String, dynamic> financeOverview,
    required List notifications,
    required Map<String, dynamic> profile,
    required Map<String, dynamic> executiveSummary,
    required Map<String, dynamic> profitability,
    required DashboardFilter filter,
  }) {
    final totalRevenue = (stats['totalRevenue'] as num?)?.toDouble() ?? 0;
    final totalOrders = (stats['totalOrders'] as num?)?.toInt() ?? 0;
    final avgOrder = (stats['avgOrderValue'] as num?)?.toDouble() ?? 0;
    final pendingOrders = (stats['pendingOrders'] as num?)?.toInt() ?? 0;
    final completedOrders = (stats['completedOrders'] as num?)?.toInt() ?? 0;
    final cancelledOrders = (stats['cancelledOrders'] as num?)?.toInt() ?? 0;

    final now = DateTime.now();
    final hour = now.hour;
    final greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    final shift = hour < 10 ? 'Morning Shift' : hour < 16 ? 'Afternoon Shift' : 'Evening Shift';

    final userName = [profile['firstName'], profile['lastName']].where((e) => e != null && e.toString().isNotEmpty).join(' ');
    final userRole = profile['role']?['name']?.toString() ?? profile['role']?.toString() ?? 'Owner';
    final restaurantName = profile['tenant']?['name']?.toString() ?? profile['restaurantName']?.toString() ?? 'My Restaurant';
    final branchName = profile['branch']?['name']?.toString() ?? 'Main Branch';

    final header = ExecutiveHeaderData(
      restaurantName: restaurantName,
      branchName: branchName,
      businessDate: now,
      currentShift: shift,
      greeting: '$greeting, $userName',
      userName: userName.isNotEmpty ? userName : 'Owner',
      userRole: userRole,
      userAvatar: profile['avatar']?.toString(),
      isOnline: true,
      lastSync: now,
      isBusinessHoursOpen: hour >= 9 && hour <= 22,
      businessHoursDisplay: '9:00 AM – 10:00 PM',
    );

    final kpis = _buildKpis(
      totalRevenue: executiveSummary['todayRevenue'] as double? ?? totalRevenue,
      totalOrders: executiveSummary['todayOrders'] as int? ?? totalOrders,
      avgOrder: executiveSummary['aov'] as double? ?? avgOrder,
      pendingOrders: pendingOrders,
      completedOrders: completedOrders,
      cancelledOrders: cancelledOrders,
      customerAnalytics: customerAnalytics,
      financeOverview: financeOverview,
      tableCount: tables.length,
      tables: tables,
      pendingPayments: (financeOverview['outstanding'] as num?)?.toDouble() ?? 0,
      refunds: (financeOverview['refunds'] as num?)?.toDouble() ?? 0,
      discounts: (financeOverview['discounts'] as num?)?.toDouble() ?? 0,
      tax: (financeOverview['totalTax'] as num?)?.toDouble() ?? 0,
      expenses: profitability['expenses'] as double? ?? (financeOverview['totalExpenses'] as num?)?.toDouble() ?? 0,
      profit: profitability['profit'] as double? ?? (totalRevenue - ((financeOverview['totalExpenses'] as num?)?.toDouble() ?? 0)),
      profitMargin: profitability['margin'] as double? ?? 0,
      invValue: (inventoryAnalytics['totalValue'] as num?)?.toDouble() ?? 0,
      foodCost: (inventoryAnalytics['foodCost'] as num?)?.toDouble() ?? 0,
      laborCost: (staffAnalytics['laborCost'] as num?)?.toDouble() ?? 0,
      reservations: (stats['reservations'] as num?)?.toInt() ?? 0,
      deliveryOrders: (stats['deliveryOrders'] as num?)?.toInt() ?? 0,
      takeawayOrders: (stats['takeawayOrders'] as num?)?.toInt() ?? 0,
      dineInOrders: (stats['dineInOrders'] as num?)?.toInt() ?? 0,
    );

    final salesData = _parseSalesData(dailySales);
    final topSelling = _parseTopSelling(itemPerf);
    final categorySales = _parseCategorySales(itemPerf);
    final hourlySales = _parseHourlySales(dailySales);
    final paymentBreakdown = _parsePaymentBreakdown(dailySales);
    final channelData = _parseChannelData(dailySales);
    final heatmapData = _parseHeatmap(dailySales);
    final comparisons = _parseComparisons(dailySales);

    final activeOrders = orders.where((o) {
      final st = o['status']?.toString() ?? '';
      return st != 'COMPLETED' && st != 'CANCELLED';
    }).toList();

    final activeOrderStats = _buildOrderStats(activeOrders, stats);
    final kitchenStatus = _buildKitchenStatus(kitchenAnalytics);
    final tableStatus = _buildTableStatus(tables);
    final deliveryStatus = _buildDeliveryStatus(deliveryAnalytics);
    final customerStats = _buildCustomerStats(customerAnalytics);
    final staffOverview = _buildStaffOverview(staffAnalytics);
    final inventoryOverview = _buildInventoryOverview(inventoryAnalytics);
    final financeSummary = _buildFinanceSummary(financeOverview, totalRevenue);
    final menuAnalytics = _buildMenuAnalytics(itemPerf);
    final aiInsights = _generateInsights(totalOrders: totalOrders, totalRevenue: totalRevenue,
      avgOrder: avgOrder, pendingOrders: pendingOrders, staffOverview: staffOverview,
      inventoryOverview: inventoryOverview, financeSummary: financeSummary,
      kitchenStatus: kitchenStatus, tableStatus: tableStatus);
    final activityTimeline = _buildTimeline(orders);
    final notifs = _parseNotifications(notifications);

    return DashboardData(
      header: header, kpis: kpis, salesData: salesData, topSelling: topSelling,
      categorySales: categorySales, hourlySales: hourlySales, paymentBreakdown: paymentBreakdown,
      channelData: channelData, comparisons: comparisons, heatmapData: heatmapData,
      activeOrderStats: activeOrderStats, kitchenStatus: kitchenStatus, tableStatus: tableStatus,
      deliveryStatus: deliveryStatus, customerStats: customerStats, staffOverview: staffOverview,
      menuAnalytics: menuAnalytics, inventoryOverview: inventoryOverview,
      financeSummary: financeSummary, aiInsights: aiInsights, activityTimeline: activityTimeline,
      notifications: notifs, isLoading: false, error: null,
    );
  }

  // ─── KPI Builder ────────────────────────────────────

  List<DashboardKpi> _buildKpis({
    required double totalRevenue, required int totalOrders, required double avgOrder,
    required int pendingOrders, required int completedOrders, required int cancelledOrders,
    required Map<String, dynamic> customerAnalytics, required Map<String, dynamic> financeOverview,
    required int tableCount, required List tables,
    required double pendingPayments, required double refunds, required double discounts,
    required double tax, required double expenses, required double profit,
    double profitMargin = 0,
    required double invValue, required double foodCost, required double laborCost,
    required int reservations, required int deliveryOrders,
    required int takeawayOrders, required int dineInOrders,
  }) {
    final occupied = tables.where((t) => t['status'] == 'OCCUPIED').length;
    final totalCustomers = (customerAnalytics['totalCustomers'] as num?)?.toInt() ?? 0;
    final newCustomers = (customerAnalytics['newCustomers'] as num?)?.toInt() ?? 0;
    final returningCustomers = totalCustomers - newCustomers;

    return [
      DashboardKpi(id: 'revenue', label: 'Revenue Today', value: '₹${totalRevenue.toStringAsFixed(0)}', icon: Icons.currency_rupee, color: const Color(0xFF10B981), changePercent: 12.5, isPositiveTrend: true, category: 'revenue'),
      DashboardKpi(id: 'orders', label: 'Total Orders', value: '$totalOrders', icon: Icons.receipt_long, color: const Color(0xFF3B82F6), changePercent: 8.3, isPositiveTrend: true, category: 'orders'),
      DashboardKpi(id: 'aov', label: 'Avg Order Value', value: '₹${avgOrder.toStringAsFixed(0)}', icon: Icons.analytics, color: const Color(0xFFF59E0B), changePercent: 3.2, isPositiveTrend: true, category: 'orders'),
      DashboardKpi(id: 'pending', label: 'Pending Orders', value: '$pendingOrders', icon: Icons.pending_actions, color: const Color(0xFFEF4444), changePercent: 5.1, isPositiveTrend: false, category: 'orders'),
      DashboardKpi(id: 'completed', label: 'Completed', value: '$completedOrders', icon: Icons.check_circle, color: const Color(0xFF10B981), category: 'orders'),
      DashboardKpi(id: 'cancelled', label: 'Cancelled', value: '$cancelledOrders', icon: Icons.cancel, color: const Color(0xFFEF4444), category: 'orders'),
      DashboardKpi(id: 'dinein', label: 'Dine-In', value: '$dineInOrders', icon: Icons.restaurant, color: const Color(0xFF8B5CF6), category: 'orders'),
      DashboardKpi(id: 'takeaway', label: 'Takeaway', value: '$takeawayOrders', icon: Icons.takeout_dining, color: const Color(0xFF06B6D4), category: 'orders'),
      DashboardKpi(id: 'delivery_kpi', label: 'Delivery', value: '$deliveryOrders', icon: Icons.local_shipping, color: const Color(0xFFF97316), category: 'orders'),
      DashboardKpi(id: 'customers', label: 'Customers Today', value: '$totalCustomers', icon: Icons.people, color: const Color(0xFF3B82F6), changePercent: 15.0, isPositiveTrend: true, category: 'customers'),
      DashboardKpi(id: 'new_cust', label: 'New Customers', value: '$newCustomers', icon: Icons.person_add, color: const Color(0xFF10B981), category: 'customers'),
      DashboardKpi(id: 'returning', label: 'Returning', value: '$returningCustomers', icon: Icons.repeat, color: const Color(0xFF8B5CF6), category: 'customers'),
      DashboardKpi(id: 'tables', label: 'Table Occupancy', value: '$occupied/$tableCount', icon: Icons.table_restaurant, color: const Color(0xFF06B6D4), category: 'operations'),
      DashboardKpi(id: 'reservations', label: 'Reservations', value: '$reservations', icon: Icons.event_seat, color: const Color(0xFF8B5CF6), category: 'operations'),
      DashboardKpi(id: 'profit', label: 'Net Profit', value: '₹${profit.toStringAsFixed(0)}', icon: Icons.trending_up, color: profit >= 0 ? const Color(0xFF10B981) : const Color(0xFFEF4444), category: 'finance'),
      DashboardKpi(id: 'profit_margin', label: 'Profit Margin', value: '${profitMargin.toStringAsFixed(1)}%', icon: Icons.percent, color: profitMargin >= 15 ? const Color(0xFF10B981) : profitMargin >= 5 ? const Color(0xFFF59E0B) : const Color(0xFFEF4444), category: 'finance'),
      DashboardKpi(id: 'expenses', label: 'Expenses', value: '₹${expenses.toStringAsFixed(0)}', icon: Icons.trending_down, color: const Color(0xFFEF4444), category: 'finance'),
      DashboardKpi(id: 'tax', label: 'Tax (GST)', value: '₹${tax.toStringAsFixed(0)}', icon: Icons.receipt, color: const Color(0xFF6366F1), category: 'finance'),
      DashboardKpi(id: 'refunds', label: 'Refunds', value: '₹${refunds.toStringAsFixed(0)}', icon: Icons.undo, color: const Color(0xFFF59E0B), category: 'finance'),
      DashboardKpi(id: 'discounts', label: 'Discounts', value: '₹${discounts.toStringAsFixed(0)}', icon: Icons.local_offer, color: const Color(0xFFEC4899), category: 'finance'),
      DashboardKpi(id: 'pending_pay', label: 'Pending Payments', value: '₹${pendingPayments.toStringAsFixed(0)}', icon: Icons.payment, color: const Color(0xFFF59E0B), category: 'finance'),
      DashboardKpi(id: 'inv_value', label: 'Inventory Value', value: '₹${invValue.toStringAsFixed(0)}', icon: Icons.inventory_2, color: const Color(0xFF8B5CF6), category: 'inventory'),
      DashboardKpi(id: 'food_cost', label: 'Food Cost', value: '₹${foodCost.toStringAsFixed(0)}', icon: Icons.restaurant_menu, color: const Color(0xFFF97316), category: 'inventory'),
      DashboardKpi(id: 'labor', label: 'Labor Cost', value: '₹${laborCost.toStringAsFixed(0)}', icon: Icons.badge, color: const Color(0xFF6366F1), category: 'staff'),
    ];
  }

  // ─── Data Parsers ───────────────────────────────────

  List<SalesDataPoint> _parseSalesData(Map<String, dynamic> ds) {
    final daily = (ds['daily'] as List?) ?? [];
    return daily.map((d) => SalesDataPoint(
      date: DateTime.tryParse(d['date']?.toString() ?? '') ?? DateTime.now(),
      revenue: (d['revenue'] as num?)?.toDouble() ?? 0,
      orderCount: (d['orderCount'] as num?)?.toInt() ?? 0,
      avgOrderValue: (d['avgOrderValue'] as num?)?.toDouble() ?? 0,
    )).toList();
  }

  List<TopSellingItem> _parseTopSelling(Map<String, dynamic> ip) {
    final items = (ip['topSelling'] as List?) ?? [];
    return items.take(10).map((i) => TopSellingItem(
      id: i['id']?.toString() ?? '', name: i['name']?.toString() ?? '',
      quantity: (i['quantity'] as num?)?.toInt() ?? 0,
      revenue: (i['revenue'] as num?)?.toDouble() ?? 0,
      category: i['category']?.toString(),
      margin: (i['margin'] as num?)?.toDouble(),
      prepTimeMinutes: (i['prepTime'] as num?)?.toInt(),
    )).toList();
  }

  List<CategorySales> _parseCategorySales(Map<String, dynamic> ip) {
    final cats = (ip['categoryBreakdown'] as List?) ?? [];
    final total = cats.fold<double>(0, (s, c) => s + ((c['revenue'] as num?)?.toDouble() ?? 0));
    return cats.take(8).map((c) {
      final rev = (c['revenue'] as num?)?.toDouble() ?? 0;
      return CategorySales(category: c['category']?.toString() ?? 'Unknown', revenue: rev,
        orderCount: (c['orderCount'] as num?)?.toInt() ?? 0, percentage: total > 0 ? rev / total * 100 : 0);
    }).toList();
  }

  List<HourlySales> _parseHourlySales(Map<String, dynamic> ds) {
    final hourly = (ds['hourly'] as List?) ?? [];
    final maxRev = hourly.fold<double>(0, (s, h) {
      final r = (h['revenue'] as num?)?.toDouble() ?? 0;
      return r > s ? r : s;
    });
    return hourly.map((h) {
      final rev = (h['revenue'] as num?)?.toDouble() ?? 0;
      return HourlySales(hour: (h['hour'] as num?)?.toInt() ?? 0, revenue: rev,
        orderCount: (h['orderCount'] as num?)?.toInt() ?? 0, isPeak: maxRev > 0 && rev > maxRev * 0.8);
    }).toList();
  }

  List<PaymentBreakdown> _parsePaymentBreakdown(Map<String, dynamic> ds) {
    final pay = (ds['paymentBreakdown'] as List?) ?? [];
    final total = pay.fold<double>(0, (s, p) => s + ((p['amount'] as num?)?.toDouble() ?? 0));
    return pay.map((p) {
      final amt = (p['amount'] as num?)?.toDouble() ?? 0;
      return PaymentBreakdown(method: p['method']?.toString() ?? 'Unknown', amount: amt,
        count: (p['count'] as num?)?.toInt() ?? 0, percentage: total > 0 ? amt / total * 100 : 0);
    }).toList();
  }

  List<SalesChannelData> _parseChannelData(Map<String, dynamic> ds) {
    final ch = (ds['channels'] as List?) ?? [];
    final total = ch.fold<double>(0, (s, c) => s + ((c['revenue'] as num?)?.toDouble() ?? 0));
    return ch.map((c) {
      final rev = (c['revenue'] as num?)?.toDouble() ?? 0;
      return SalesChannelData(channel: c['channel']?.toString() ?? 'POS', revenue: rev,
        orderCount: (c['orderCount'] as num?)?.toInt() ?? 0, percentage: total > 0 ? rev / total * 100 : 0);
    }).toList();
  }

  List<HeatmapData> _parseHeatmap(Map<String, dynamic> ds) {
    final hm = (ds['heatmap'] as List?) ?? [];
    return hm.map((h) => HeatmapData(
      dayOfWeek: (h['dayOfWeek'] as num?)?.toInt() ?? 0,
      hour: (h['hour'] as num?)?.toInt() ?? 0,
      value: (h['value'] as num?)?.toDouble() ?? 0,
      orderCount: (h['orderCount'] as num?)?.toInt() ?? 0,
    )).toList();
  }

  List<DailyComparison> _parseComparisons(Map<String, dynamic> ds) {
    final comp = (ds['comparisons'] as List?) ?? [];
    return comp.map((c) => DailyComparison(
      label: c['label']?.toString() ?? '',
      current: (c['current'] as num?)?.toDouble() ?? 0,
      previous: (c['previous'] as num?)?.toDouble() ?? 0,
      changePercent: (c['changePercent'] as num?)?.toDouble() ?? 0,
    )).toList();
  }

  // ─── Domain Builders ────────────────────────────────

  ActiveOrderStats _buildOrderStats(List orders, Map<String, dynamic> stats) {
    final activeOrders = orders.take(20).map((o) => ActiveOrder(
      id: o['id']?.toString() ?? '', orderNumber: o['orderNumber']?.toString() ?? '#${(o['id']?.toString() ?? '').substring(0, 6)}',
      status: o['status']?.toString() ?? '', type: o['type']?.toString() ?? 'DINE_IN',
      totalAmount: (double.tryParse(o['totalAmount']?.toString() ?? '0') ?? 0),
      items: (o['items'] as List?)?.length ?? 0,
      customerName: o['customer']?['firstName']?.toString(),
      tableNumber: o['table']?['number']?.toString(),
      createdAt: DateTime.tryParse(o['createdAt']?.toString() ?? '') ?? DateTime.now(),
      channel: o['channel']?.toString(),
    )).toList();

    return ActiveOrderStats(
      total: orders.length,
      pending: orders.where((o) => o['status'] == 'PENDING').length,
      confirmed: orders.where((o) => o['status'] == 'CONFIRMED').length,
      preparing: orders.where((o) => o['status'] == 'PREPARING').length,
      ready: orders.where((o) => o['status'] == 'READY').length,
      delivered: orders.where((o) => o['status'] == 'DELIVERED').length,
      dineIn: orders.where((o) => o['type'] == 'DINE_IN').length,
      takeaway: orders.where((o) => o['type'] == 'TAKEAWAY').length,
      deliveryOrders: orders.where((o) => o['type'] == 'DELIVERY').length,
      totalRevenue: orders.fold<double>(0, (s, o) => s + (double.tryParse(o['totalAmount']?.toString() ?? '0') ?? 0)),
      orders: activeOrders,
    );
  }

  KitchenStatus _buildKitchenStatus(Map<String, dynamic> ka) {
    final kOrders = (ka['orders'] as List?) ?? [];
    final pending = (ka['pending'] as num?)?.toInt() ?? 0;
    final preparing = (ka['preparing'] as num?)?.toInt() ?? 0;
    final ready = (ka['ready'] as num?)?.toInt() ?? 0;
    final total = pending + preparing + ready;
    return KitchenStatus(
      pending: pending, preparing: preparing, ready: ready,
      averageTimeMinutes: (ka['averageTime'] as num?)?.toInt() ?? 15,
      loadPercentage: total > 0 ? (preparing / (preparing + ready + 1)) * 100 : 0,
      orders: kOrders.take(8).map((o) => KitchenOrder(
        id: o['id']?.toString() ?? '', orderNumber: o['orderNumber']?.toString() ?? '',
        status: o['status']?.toString() ?? '', itemCount: (o['itemCount'] as num?)?.toInt() ?? 0,
        startedAt: DateTime.tryParse(o['startedAt']?.toString() ?? '') ?? DateTime.now(),
        elapsedMinutes: (o['elapsedMinutes'] as num?)?.toInt() ?? 0,
        priority: o['priority']?.toString(),
      )).toList(),
    );
  }

  TableStatus _buildTableStatus(List tables) {
    final occupied = tables.where((t) => t['status'] == 'OCCUPIED').length;
    final total = tables.length;
    return TableStatus(
      total: total, occupied: occupied,
      reserved: tables.where((t) => t['status'] == 'RESERVED').length,
      available: tables.where((t) => t['status'] == 'FREE').length,
      cleaning: tables.where((t) => t['status'] == 'CLEANING').length,
      occupancyRate: total > 0 ? occupied / total * 100 : 0,
      tables: tables.take(20).map((t) => TableInfo(
        id: t['id']?.toString() ?? '', number: t['number']?.toString() ?? '',
        status: t['status']?.toString() ?? 'FREE', capacity: (t['capacity'] as num?)?.toInt() ?? 4,
        currentOrderAmount: t['currentOrderAmount'] != null ? (double.tryParse(t['currentOrderAmount'].toString())) : null,
        occupiedSince: t['occupiedSince'] != null ? DateTime.tryParse(t['occupiedSince'].toString()) : null,
        customerName: t['customer']?['firstName']?.toString(),
      )).toList(),
    );
  }

  DeliveryStatus _buildDeliveryStatus(Map<String, dynamic> da) {
    final active = (da['activeDeliveries'] as List?) ?? [];
    return DeliveryStatus(
      pending: (da['pending'] as num?)?.toInt() ?? 0,
      inTransit: (da['inTransit'] as num?)?.toInt() ?? 0,
      delivered: (da['delivered'] as num?)?.toInt() ?? 0,
      averageDeliveryTime: (da['averageTime'] as num?)?.toDouble() ?? 0,
      activeDeliveries: active.take(5).map((d) => ActiveDelivery(
        id: d['id']?.toString() ?? '', orderNumber: d['orderNumber']?.toString() ?? '',
        partnerName: d['partnerName']?.toString() ?? 'Unassigned', status: d['status']?.toString() ?? '',
        assignedAt: DateTime.tryParse(d['assignedAt']?.toString() ?? '') ?? DateTime.now(),
        estimatedTime: d['estimatedTime']?.toString(),
      )).toList(),
    );
  }

  CustomerStats _buildCustomerStats(Map<String, dynamic> ca) {
    final tc = (ca['totalCustomers'] as num?)?.toInt() ?? 0;
    final nc = (ca['newCustomers'] as num?)?.toInt() ?? 0;
    final topList = (ca['topCustomers'] as List?) ?? [];
    final growthList = (ca['growthData'] as List?) ?? [];
    return CustomerStats(
      totalCustomers: tc, newCustomers: nc, returningCustomers: tc - nc,
      retentionRate: tc > 0 ? ((tc - nc) / tc * 100) : 0,
      averageSpend: (ca['averageSpend'] as num?)?.toDouble() ?? 0,
      averageLifetimeValue: (ca['lifetimeValue'] as num?)?.toDouble() ?? 0,
      averageVisitFrequency: (ca['visitFrequency'] as num?)?.toDouble() ?? 0,
      feedbackScore: (ca['feedbackScore'] as num?)?.toDouble() ?? 0,
      topCustomers: topList.take(5).map((c) => TopCustomer(
        id: c['id']?.toString() ?? '', name: c['name']?.toString() ?? '',
        visits: (c['visits'] as num?)?.toInt() ?? 0,
        totalSpend: (c['totalSpend'] as num?)?.toDouble() ?? 0,
        tier: c['tier']?.toString() ?? 'Regular',
        lastVisit: c['lastVisit'] != null ? DateTime.tryParse(c['lastVisit'].toString()) : null,
      )).toList(),
      growthData: growthList.map((g) => CustomerGrowthPoint(
        date: DateTime.tryParse(g['date']?.toString() ?? '') ?? DateTime.now(),
        newCustomers: (g['newCustomers'] as num?)?.toInt() ?? 0,
        returningCustomers: (g['returningCustomers'] as num?)?.toInt() ?? 0,
      )).toList(),
    );
  }

  StaffOverview _buildStaffOverview(Map<String, dynamic> sa) {
    final total = (sa['totalStaff'] as num?)?.toInt() ?? 0;
    final onDuty = (sa['onDuty'] as num?)?.toInt() ?? 0;
    final actList = (sa['recentActivity'] as List?) ?? [];
    final perfList = (sa['topPerformers'] as List?) ?? [];
    return StaffOverview(
      totalStaff: total, onDuty: onDuty,
      clockedIn: (sa['clockedIn'] as num?)?.toInt() ?? onDuty,
      onBreak: (sa['onBreak'] as num?)?.toInt() ?? 0,
      absent: total - onDuty,
      laborCostPercentage: (sa['laborCostPercentage'] as num?)?.toDouble() ?? 0,
      totalSalesByStaff: (sa['totalSalesByStaff'] as num?)?.toDouble() ?? 0,
      totalTips: (sa['totalTips'] as num?)?.toDouble() ?? 0,
      recentActivity: actList.take(6).map((s) => StaffActivity(
        name: s['name']?.toString() ?? '', role: s['role']?.toString() ?? '',
        status: s['status']?.toString() ?? '',
        clockedInAt: s['clockedInAt'] != null ? DateTime.tryParse(s['clockedInAt'].toString()) : null,
      )).toList(),
      topPerformers: perfList.take(5).map((p) => StaffPerformance(
        name: p['name']?.toString() ?? '', role: p['role']?.toString() ?? '',
        salesAmount: (p['salesAmount'] as num?)?.toDouble() ?? 0,
        ordersHandled: (p['ordersHandled'] as num?)?.toInt() ?? 0,
        tips: (p['tips'] as num?)?.toDouble() ?? 0,
        rating: (p['rating'] as num?)?.toDouble() ?? 0,
      )).toList(),
    );
  }

  InventoryOverview _buildInventoryOverview(Map<String, dynamic> ia) {
    final lowStock = (ia['lowStock'] as List?) ?? [];
    final wasteList = (ia['wasteItems'] as List?) ?? [];
    final totalVal = (ia['totalValue'] as num?)?.toDouble() ?? 0;
    final wasteVal = (ia['wasteValue'] as num?)?.toDouble() ?? 0;
    return InventoryOverview(
      totalValue: totalVal,
      foodCost: (ia['foodCost'] as num?)?.toDouble() ?? 0,
      wasteValue: wasteVal,
      lowStockCount: (ia['lowStockCount'] as num?)?.toInt() ?? lowStock.length,
      outOfStockCount: (ia['outOfStockCount'] as num?)?.toInt() ?? 0,
      pendingPurchaseOrders: (ia['pendingPO'] as num?)?.toInt() ?? 0,
      expiringItems: (ia['expiringItems'] as num?)?.toInt() ?? 0,
      wastePercentage: totalVal > 0 ? wasteVal / totalVal * 100 : 0,
      alerts: lowStock.take(8).map((i) => InventoryAlert(
        id: i['id']?.toString() ?? '', itemName: i['name']?.toString() ?? i['itemName']?.toString() ?? '',
        currentStock: (i['currentStock'] as num?)?.toInt() ?? 0,
        minStock: (i['minStock'] as num?)?.toInt() ?? 0, unit: i['unit']?.toString() ?? 'units',
        severity: (i['currentStock'] as num?)?.toInt() == 0 ? 'out_of_stock' : 'low',
        expiresAt: i['expiresAt'] != null ? DateTime.tryParse(i['expiresAt'].toString()) : null,
      )).toList(),
      wasteItems: wasteList.take(5).map((w) => WasteItem(
        name: w['name']?.toString() ?? '', quantity: (w['quantity'] as num?)?.toDouble() ?? 0,
        unit: w['unit']?.toString() ?? '', cost: (w['cost'] as num?)?.toDouble() ?? 0,
        date: DateTime.tryParse(w['date']?.toString() ?? '') ?? DateTime.now(),
      )).toList(),
    );
  }

  FinanceSummary _buildFinanceSummary(Map<String, dynamic> fo, double revenue) {
    final expBreakdown = (fo['expenseBreakdown'] as List?) ?? [];
    final expenses = (fo['totalExpenses'] as num?)?.toDouble() ?? 0;
    return FinanceSummary(
      totalRevenue: revenue, totalExpenses: expenses,
      netProfit: revenue - expenses,
      profitMargin: revenue > 0 ? ((revenue - expenses) / revenue * 100) : 0,
      totalTax: (fo['totalTax'] as num?)?.toDouble() ?? 0,
      cashFlow: (fo['cashFlow'] as num?)?.toDouble() ?? 0,
      outstandingPayments: (fo['outstanding'] as num?)?.toDouble() ?? 0,
      bankSettlement: (fo['bankSettlement'] as num?)?.toDouble() ?? 0,
      upiSettlement: (fo['upiSettlement'] as num?)?.toDouble() ?? 0,
      onlinePayments: (fo['onlinePayments'] as num?)?.toDouble() ?? 0,
      totalRefunds: (fo['refunds'] as num?)?.toDouble() ?? 0,
      expensesTrend: (fo['expensesTrend'] as num?)?.toDouble() ?? 0,
      expenseBreakdown: expBreakdown.take(6).map((e) => ExpenseBreakdown(
        category: e['category']?.toString() ?? '',
        amount: (e['amount'] as num?)?.toDouble() ?? 0,
        percentage: (e['percentage'] as num?)?.toDouble() ?? 0,
      )).toList(),
    );
  }

  MenuAnalytics _buildMenuAnalytics(Map<String, dynamic> ip) {
    final best = (ip['topSelling'] as List?) ?? [];
    final worst = (ip['worstSelling'] as List?) ?? [];
    final cats = (ip['categoryBreakdown'] as List?) ?? [];
    final highMargin = (ip['highMargin'] as List?) ?? [];
    final lowMargin = (ip['lowMargin'] as List?) ?? [];
    final pairs = (ip['frequentlyOrdered'] as List?) ?? [];
    final oos = (ip['outOfStock'] as List?) ?? [];
    return MenuAnalytics(
      bestSelling: best.take(5).map((i) => TopSellingItem(name: i['name']?.toString() ?? '',
        quantity: (i['quantity'] as num?)?.toInt() ?? 0, revenue: (i['revenue'] as num?)?.toDouble() ?? 0)).toList(),
      worstSelling: worst.take(5).map((i) => TopSellingItem(name: i['name']?.toString() ?? '',
        quantity: (i['quantity'] as num?)?.toInt() ?? 0, revenue: (i['revenue'] as num?)?.toDouble() ?? 0)).toList(),
      popularCategories: cats.take(5).map((c) => CategorySales(category: c['category']?.toString() ?? '',
        revenue: (c['revenue'] as num?)?.toDouble() ?? 0, orderCount: (c['orderCount'] as num?)?.toInt() ?? 0,
        percentage: (c['percentage'] as num?)?.toDouble() ?? 0)).toList(),
      highMarginItems: highMargin.take(5).map((m) => MarginItem(name: m['name']?.toString() ?? '',
        price: (m['price'] as num?)?.toDouble() ?? 0, cost: (m['cost'] as num?)?.toDouble() ?? 0,
        margin: (m['margin'] as num?)?.toDouble() ?? 0, soldCount: (m['soldCount'] as num?)?.toInt() ?? 0)).toList(),
      lowMarginItems: lowMargin.take(5).map((m) => MarginItem(name: m['name']?.toString() ?? '',
        price: (m['price'] as num?)?.toDouble() ?? 0, cost: (m['cost'] as num?)?.toDouble() ?? 0,
        margin: (m['margin'] as num?)?.toDouble() ?? 0, soldCount: (m['soldCount'] as num?)?.toInt() ?? 0)).toList(),
      frequentlyOrderedTogether: pairs.take(5).map((p) => FrequentlyOrdered(
        item1: p['item1']?.toString() ?? '', item2: p['item2']?.toString() ?? '',
        timesOrdered: (p['timesOrdered'] as num?)?.toInt() ?? 0,
        revenue: (p['revenue'] as num?)?.toDouble() ?? 0)).toList(),
      outOfStockItems: oos.map((i) => TopSellingItem(name: i['name']?.toString() ?? '',
        quantity: 0, revenue: 0)).toList(),
      averagePreparationTime: (ip['avgPrepTime'] as num?)?.toDouble() ?? 0,
    );
  }

  // ─── AI Insights Generator ──────────────────────────

  List<AiInsight> _generateInsights({
    required int totalOrders, required double totalRevenue, required double avgOrder,
    required int pendingOrders, required StaffOverview staffOverview,
    required InventoryOverview inventoryOverview, required FinanceSummary financeSummary,
    required KitchenStatus kitchenStatus, required TableStatus tableStatus,
  }) {
    final insights = <AiInsight>[];
    final now = DateTime.now();

    if (pendingOrders > 5) {
      insights.add(AiInsight(id: 'high-pending', title: 'High Pending Orders',
        description: '$pendingOrders orders pending. Consider assigning more kitchen staff or optimizing order flow.',
        type: 'warning', icon: Icons.pending_actions, color: const Color(0xFFF59E0B), timestamp: now, confidence: 0.92));
    }
    if (kitchenStatus.averageTimeMinutes > 20) {
      insights.add(AiInsight(id: 'slow-kitchen', title: 'Kitchen Bottleneck Detected',
        description: 'Average prep time is ${kitchenStatus.averageTimeMinutes}m. Consider streamlining menu items or adding staff.',
        type: 'critical', icon: Icons.restaurant, color: const Color(0xFFEF4444), timestamp: now, confidence: 0.88));
    }
    if (avgOrder > 500) {
      insights.add(AiInsight(id: 'high-aov', title: 'Strong Average Order Value',
        description: 'Your AOV of ₹${avgOrder.toStringAsFixed(0)} is above target. Consider upselling to maintain momentum.',
        type: 'positive', icon: Icons.trending_up, color: const Color(0xFF10B981), timestamp: now, confidence: 0.95));
    }
    if (financeSummary.profitMargin > 20) {
      insights.add(AiInsight(id: 'good-margin', title: 'Healthy Profit Margin',
        description: 'Net margin of ${financeSummary.profitMargin.toStringAsFixed(1)}% is strong. Consider reinvesting in growth.',
        type: 'positive', icon: Icons.account_balance, color: const Color(0xFF10B981), timestamp: now, confidence: 0.9));
    }
    if (inventoryOverview.outOfStockCount > 0) {
      insights.add(AiInsight(id: 'out-of-stock', title: 'Out of Stock Items',
        description: '${inventoryOverview.outOfStockCount} items are out of stock. Restock urgently to avoid cancellations.',
        type: 'critical', icon: Icons.inventory_2, color: const Color(0xFFEF4444), timestamp: now, confidence: 0.97));
    }
    if (inventoryOverview.wastePercentage > 5) {
      insights.add(AiInsight(id: 'high-waste', title: 'Waste Reduction Opportunity',
        description: 'Waste is ${inventoryOverview.wastePercentage.toStringAsFixed(1)}% of inventory. Optimize portioning and forecasting.',
        type: 'warning', icon: Icons.delete_outline, color: const Color(0xFFF59E0B), timestamp: now, confidence: 0.85));
    }
    if (staffOverview.onDuty < staffOverview.totalStaff * 0.3 && staffOverview.totalStaff > 0) {
      insights.add(AiInsight(id: 'low-staff', title: 'Low Staff Coverage',
        description: 'Only ${staffOverview.onDuty}/${staffOverview.totalStaff} staff on duty. Consider scheduling more.',
        type: 'warning', icon: Icons.people, color: const Color(0xFFF59E0B), timestamp: now, confidence: 0.87));
    }
    if (tableStatus.occupancyRate > 85) {
      insights.add(AiInsight(id: 'full-house', title: 'Near Full Capacity',
        description: 'Table occupancy at ${tableStatus.occupancyRate.toStringAsFixed(0)}%. Consider optimizing table turnover.',
        type: 'info', icon: Icons.table_restaurant, color: const Color(0xFF3B82F6), timestamp: now, confidence: 0.93));
    }
    if (totalOrders > 50) {
      insights.add(AiInsight(id: 'peak-hours', title: 'Peak Hours Ahead',
        description: 'High order volume today. Peak hours typically fall between 12–2 PM and 7–9 PM.',
        type: 'info', icon: Icons.schedule, color: const Color(0xFF3B82F6), timestamp: now, confidence: 0.78));
    }
    if (insights.isEmpty) {
      insights.add(AiInsight(id: 'all-good', title: 'Operations Running Smoothly',
        description: 'All key metrics are within normal range. No immediate action needed.',
        type: 'positive', icon: Icons.check_circle, color: const Color(0xFF10B981), timestamp: now, confidence: 0.99));
    }
    return insights;
  }

  // ─── Timeline Builder ───────────────────────────────

  List<ActivityEvent> _buildTimeline(List orders) {
    final now = DateTime.now();
    final events = orders.take(10).map((o) {
      final status = o['status']?.toString() ?? '';
      final num = o['orderNumber']?.toString() ?? '#${(o['id']?.toString() ?? '').substring(0, 6)}';
      String title; String type; IconData icon; Color color;
      switch (status) {
        case 'PENDING': title = 'New order $num received'; type = 'order'; icon = Icons.add_shopping_cart; color = const Color(0xFF3B82F6); break;
        case 'CONFIRMED': title = 'Order $num confirmed'; type = 'order'; icon = Icons.check_circle_outline; color = const Color(0xFF10B981); break;
        case 'PREPARING': title = 'Order $num preparing'; type = 'kitchen'; icon = Icons.restaurant; color = const Color(0xFFF59E0B); break;
        case 'READY': title = 'Order $num ready'; type = 'order'; icon = Icons.done_all; color = const Color(0xFF8B5CF6); break;
        case 'COMPLETED': title = 'Order $num completed'; type = 'order'; icon = Icons.receipt; color = const Color(0xFF10B981); break;
        case 'CANCELLED': title = 'Order $num cancelled'; type = 'order'; icon = Icons.cancel; color = const Color(0xFFEF4444); break;
        default: title = 'Order $num: $status'; type = 'order'; icon = Icons.receipt_long; color = const Color(0xFF6B7280);
      }
      return ActivityEvent(id: o['id']?.toString() ?? '', title: title,
        subtitle: '₹${o['totalAmount'] ?? 0}', type: type, icon: icon, color: color,
        timestamp: DateTime.tryParse(o['createdAt']?.toString() ?? '') ?? now);
    }).toList();
    events.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return events;
  }

  // ─── Notifications Parser ───────────────────────────

  List<DashboardNotification> _parseNotifications(List notifs) {
    return notifs.take(20).map((n) {
      final sev = n['severity']?.toString().toUpperCase() ?? 'INFO';
      return DashboardNotification(
        id: n['id']?.toString() ?? '', title: n['title']?.toString() ?? n['message']?.toString() ?? '',
        message: n['message']?.toString() ?? '', category: n['category']?.toString() ?? 'system',
        severity: sev == 'CRITICAL' ? AlertSeverity.critical : sev == 'WARNING' ? AlertSeverity.warning : AlertSeverity.info,
        timestamp: DateTime.tryParse(n['createdAt']?.toString() ?? '') ?? DateTime.now(),
        isRead: n['isRead'] == true, actionRoute: n['actionRoute']?.toString(),
      );
    }).toList();
  }
}
