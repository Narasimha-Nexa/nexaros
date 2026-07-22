import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dashboard_models.dart';

class DashboardCacheService {
  static const _prefix = 'dashboard_cache_';
  static const _defaultTtl = Duration(minutes: 5);

  final SharedPreferences _prefs;
  DashboardCacheService(this._prefs);

  Future<void> cacheData(DashboardFilter filter, DashboardData data) async {
    final key = _keyFor(filter);
    final payload = <String, dynamic>{
      'timestamp': DateTime.now().toIso8601String(),
      'header': _serializeHeader(data.header),
      'kpis': data.kpis.map(_serializeKpi).toList(),
      'salesData': data.salesData.map(_serializeSalesPoint).toList(),
      'topSelling': data.topSelling.map(_serializeTopSelling).toList(),
      'categorySales': data.categorySales.map(_serializeCategorySales).toList(),
      'hourlySales': data.hourlySales.map(_serializeHourlySales).toList(),
      'paymentBreakdown': data.paymentBreakdown.map(_serializePayment).toList(),
      'channelData': data.channelData.map(_serializeChannel).toList(),
      'comparisons': data.comparisons.map(_serializeComparison).toList(),
      'activeOrderStats': _serializeOrderStats(data.activeOrderStats),
      'kitchenStatus': _serializeKitchenStatus(data.kitchenStatus),
      'tableStatus': _serializeTableStatus(data.tableStatus),
      'deliveryStatus': _serializeDeliveryStatus(data.deliveryStatus),
      'customerStats': _serializeCustomerStats(data.customerStats),
      'staffOverview': _serializeStaffOverview(data.staffOverview),
      'menuAnalytics': _serializeMenuAnalytics(data.menuAnalytics),
      'inventoryOverview': _serializeInventoryOverview(data.inventoryOverview),
      'financeSummary': _serializeFinanceSummary(data.financeSummary),
      'aiInsights': data.aiInsights.map(_serializeAiInsight).toList(),
      'activityTimeline': data.activityTimeline.map(_serializeActivity).toList(),
      'notifications': data.notifications.map(_serializeNotification).toList(),
    };
    await _prefs.setString(key, jsonEncode(payload));
  }

  DashboardData? getCachedData(DashboardFilter filter, {Duration? ttl}) {
    final key = _keyFor(filter);
    final raw = _prefs.getString(key);
    if (raw == null) return null;
    try {
      final payload = jsonDecode(raw) as Map<String, dynamic>;
      final timestamp = DateTime.parse(payload['timestamp'] as String);
      if (DateTime.now().difference(timestamp) > (ttl ?? _defaultTtl)) {
        _prefs.remove(key);
        return null;
      }
      return _deserializeData(payload);
    } catch (_) {
      _prefs.remove(key);
      return null;
    }
  }

  void invalidate(DashboardFilter filter) => _prefs.remove(_keyFor(filter));

  void clearAll() {
    final keys = _prefs.getKeys().where((k) => k.startsWith(_prefix));
    for (final key in keys) { _prefs.remove(key); }
  }

  Future<void> setLastOnline(bool online) async => _prefs.setBool('${_prefix}last_online', online);
  bool? getLastOnline() => _prefs.getBool('${_prefix}last_online');

  String _keyFor(DashboardFilter filter) {
    final parts = [
      filter.timeRange.name, filter.branchId ?? 'all',
      filter.orderType.name, filter.salesChannel.name,
    ];
    return '${_prefix}${parts.join('_')}';
  }

  // ─── Serialization ───────────────────────────────────

  Map<String, dynamic> _serializeHeader(ExecutiveHeaderData? h) {
    if (h == null) return {};
    return {
      'restaurantName': h.restaurantName, 'branchName': h.branchName,
      'businessDate': h.businessDate.toIso8601String(), 'currentShift': h.currentShift,
      'greeting': h.greeting, 'userName': h.userName, 'userRole': h.userRole,
      'isOnline': h.isOnline, 'lastSync': h.lastSync.toIso8601String(),
      'weather': h.weather, 'temperature': h.temperature,
      'isBusinessHoursOpen': h.isBusinessHoursOpen, 'businessHoursDisplay': h.businessHoursDisplay,
    };
  }

  Map<String, dynamic> _serializeKpi(DashboardKpi k) => {
    'id': k.id, 'label': k.label, 'value': k.value, 'changePercent': k.changePercent,
    'isPositiveTrend': k.isPositiveTrend, 'subtitle': k.subtitle,
    'size': k.size.name, 'category': k.category,
    'colorValue': k.color.toARGB32(), 'iconCodePoint': k.icon.codePoint,
    'sparklineData': k.sparklineData,
  };

  Map<String, dynamic> _serializeSalesPoint(SalesDataPoint s) => {
    'date': s.date.toIso8601String(), 'revenue': s.revenue,
    'orderCount': s.orderCount, 'avgOrderValue': s.avgOrderValue,
  };

  Map<String, dynamic> _serializeTopSelling(TopSellingItem t) => {
    'id': t.id, 'name': t.name, 'quantity': t.quantity, 'revenue': t.revenue,
    'category': t.category, 'margin': t.margin, 'prepTimeMinutes': t.prepTimeMinutes,
  };

  Map<String, dynamic> _serializeCategorySales(CategorySales c) => {
    'category': c.category, 'revenue': c.revenue, 'orderCount': c.orderCount, 'percentage': c.percentage,
  };

  Map<String, dynamic> _serializeHourlySales(HourlySales h) => {
    'hour': h.hour, 'revenue': h.revenue, 'orderCount': h.orderCount, 'isPeak': h.isPeak,
  };

  Map<String, dynamic> _serializePayment(PaymentBreakdown p) => {
    'method': p.method, 'amount': p.amount, 'count': p.count, 'percentage': p.percentage,
  };

  Map<String, dynamic> _serializeChannel(SalesChannelData c) => {
    'channel': c.channel, 'revenue': c.revenue, 'orderCount': c.orderCount, 'percentage': c.percentage,
  };

  Map<String, dynamic> _serializeComparison(DailyComparison d) => {
    'label': d.label, 'current': d.current, 'previous': d.previous, 'changePercent': d.changePercent,
  };

  Map<String, dynamic> _serializeOrderStats(ActiveOrderStats s) => {
    'total': s.total, 'pending': s.pending, 'confirmed': s.confirmed,
    'preparing': s.preparing, 'ready': s.ready, 'delivered': s.delivered,
    'dineIn': s.dineIn, 'takeaway': s.takeaway, 'deliveryOrders': s.deliveryOrders,
    'totalRevenue': s.totalRevenue, 'pendingPayments': s.pendingPayments,
    'outstandingAmount': s.outstandingAmount, 'refunds': s.refunds, 'discounts': s.discounts,
    'orders': s.orders.map(_serializeActiveOrder).toList(),
  };

  Map<String, dynamic> _serializeActiveOrder(ActiveOrder o) => {
    'id': o.id, 'orderNumber': o.orderNumber, 'status': o.status, 'type': o.type,
    'totalAmount': o.totalAmount, 'items': o.items, 'customerName': o.customerName,
    'tableNumber': o.tableNumber, 'createdAt': o.createdAt.toIso8601String(),
    'assignedTo': o.assignedTo, 'channel': o.channel,
  };

  Map<String, dynamic> _serializeKitchenStatus(KitchenStatus k) => {
    'pending': k.pending, 'preparing': k.preparing, 'ready': k.ready,
    'averageTimeMinutes': k.averageTimeMinutes, 'loadPercentage': k.loadPercentage,
    'orders': k.orders.map((o) => {
      'id': o.id, 'orderNumber': o.orderNumber, 'status': o.status,
      'itemCount': o.itemCount, 'startedAt': o.startedAt.toIso8601String(),
      'elapsedMinutes': o.elapsedMinutes, 'priority': o.priority,
    }).toList(),
  };

  Map<String, dynamic> _serializeTableStatus(TableStatus t) => {
    'total': t.total, 'occupied': t.occupied, 'reserved': t.reserved,
    'available': t.available, 'cleaning': t.cleaning, 'occupancyRate': t.occupancyRate,
    'tables': t.tables.map((ti) => {
      'id': ti.id, 'number': ti.number, 'status': ti.status, 'capacity': ti.capacity,
      'currentOrderAmount': ti.currentOrderAmount,
      'occupiedSince': ti.occupiedSince?.toIso8601String(), 'customerName': ti.customerName,
    }).toList(),
  };

  Map<String, dynamic> _serializeDeliveryStatus(DeliveryStatus d) => {
    'pending': d.pending, 'inTransit': d.inTransit, 'delivered': d.delivered,
    'averageDeliveryTime': d.averageDeliveryTime,
    'activeDeliveries': d.activeDeliveries.map((ad) => {
      'id': ad.id, 'orderNumber': ad.orderNumber, 'partnerName': ad.partnerName,
      'status': ad.status, 'assignedAt': ad.assignedAt.toIso8601String(),
      'estimatedTime': ad.estimatedTime,
    }).toList(),
  };

  Map<String, dynamic> _serializeCustomerStats(CustomerStats c) => {
    'totalCustomers': c.totalCustomers, 'newCustomers': c.newCustomers,
    'returningCustomers': c.returningCustomers, 'retentionRate': c.retentionRate,
    'averageSpend': c.averageSpend, 'averageLifetimeValue': c.averageLifetimeValue,
    'averageVisitFrequency': c.averageVisitFrequency, 'feedbackScore': c.feedbackScore,
    'topCustomers': c.topCustomers.map((tc) => {
      'id': tc.id, 'name': tc.name, 'visits': tc.visits,
      'totalSpend': tc.totalSpend, 'tier': tc.tier,
      'lastVisit': tc.lastVisit?.toIso8601String(),
    }).toList(),
  };

  Map<String, dynamic> _serializeStaffOverview(StaffOverview s) => {
    'totalStaff': s.totalStaff, 'onDuty': s.onDuty, 'clockedIn': s.clockedIn,
    'onBreak': s.onBreak, 'absent': s.absent, 'laborCostPercentage': s.laborCostPercentage,
    'totalSalesByStaff': s.totalSalesByStaff, 'totalTips': s.totalTips,
    'recentActivity': s.recentActivity.map((a) => {
      'name': a.name, 'role': a.role, 'status': a.status,
      'clockedInAt': a.clockedInAt?.toIso8601String(),
    }).toList(),
    'topPerformers': s.topPerformers.map((p) => {
      'name': p.name, 'role': p.role, 'salesAmount': p.salesAmount,
      'ordersHandled': p.ordersHandled, 'tips': p.tips, 'rating': p.rating,
    }).toList(),
  };

  Map<String, dynamic> _serializeMenuAnalytics(MenuAnalytics m) => {
    'bestSelling': m.bestSelling.map(_serializeTopSelling).toList(),
    'worstSelling': m.worstSelling.map(_serializeTopSelling).toList(),
    'popularCategories': m.popularCategories.map(_serializeCategorySales).toList(),
    'highMarginItems': m.highMarginItems.map((i) => {
      'name': i.name, 'price': i.price, 'cost': i.cost, 'margin': i.margin, 'soldCount': i.soldCount,
    }).toList(),
    'frequentlyOrderedTogether': m.frequentlyOrderedTogether.map((f) => {
      'item1': f.item1, 'item2': f.item2, 'timesOrdered': f.timesOrdered, 'revenue': f.revenue,
    }).toList(),
    'outOfStockItems': m.outOfStockItems.map(_serializeTopSelling).toList(),
    'averagePreparationTime': m.averagePreparationTime,
  };

  Map<String, dynamic> _serializeInventoryOverview(InventoryOverview i) => {
    'totalValue': i.totalValue, 'foodCost': i.foodCost, 'wasteValue': i.wasteValue,
    'lowStockCount': i.lowStockCount, 'outOfStockCount': i.outOfStockCount,
    'pendingPurchaseOrders': i.pendingPurchaseOrders, 'expiringItems': i.expiringItems,
    'wastePercentage': i.wastePercentage,
    'alerts': i.alerts.map((a) => {
      'id': a.id, 'itemName': a.itemName, 'currentStock': a.currentStock,
      'minStock': a.minStock, 'unit': a.unit, 'severity': a.severity,
      'expiresAt': a.expiresAt?.toIso8601String(),
    }).toList(),
    'wasteItems': i.wasteItems.map((w) => {
      'name': w.name, 'quantity': w.quantity, 'unit': w.unit,
      'cost': w.cost, 'date': w.date.toIso8601String(),
    }).toList(),
  };

  Map<String, dynamic> _serializeFinanceSummary(FinanceSummary f) => {
    'totalRevenue': f.totalRevenue, 'totalExpenses': f.totalExpenses,
    'netProfit': f.netProfit, 'profitMargin': f.profitMargin,
    'totalTax': f.totalTax, 'cashFlow': f.cashFlow,
    'outstandingPayments': f.outstandingPayments, 'bankSettlement': f.bankSettlement,
    'upiSettlement': f.upiSettlement, 'onlinePayments': f.onlinePayments,
    'totalRefunds': f.totalRefunds, 'expensesTrend': f.expensesTrend,
    'expenseBreakdown': f.expenseBreakdown.map((e) => {
      'category': e.category, 'amount': e.amount, 'percentage': e.percentage,
    }).toList(),
  };

  Map<String, dynamic> _serializeAiInsight(AiInsight a) => {
    'id': a.id, 'title': a.title, 'description': a.description, 'type': a.type,
    'timestamp': a.timestamp.toIso8601String(), 'confidence': a.confidence,
    'actionLabel': a.actionLabel, 'colorValue': a.color.toARGB32(), 'iconCodePoint': a.icon.codePoint,
  };

  Map<String, dynamic> _serializeActivity(ActivityEvent a) => {
    'id': a.id, 'title': a.title, 'subtitle': a.subtitle, 'type': a.type,
    'timestamp': a.timestamp.toIso8601String(), 'colorValue': a.color.toARGB32(), 'iconCodePoint': a.icon.codePoint,
  };

  Map<String, dynamic> _serializeNotification(DashboardNotification n) => {
    'id': n.id, 'title': n.title, 'message': n.message,
    'severity': n.severity.name, 'category': n.category,
    'timestamp': n.timestamp.toIso8601String(), 'isRead': n.isRead, 'actionRoute': n.actionRoute,
  };

  // ─── Deserialization ─────────────────────────────────

  DashboardData _deserializeData(Map<String, dynamic> p) {
    return DashboardData(
      header: _deserializeHeader(p['header']),
      kpis: _list(p['kpis']).map(_deserializeKpi).toList(),
      salesData: _list(p['salesData']).map(_deserializeSalesPoint).toList(),
      topSelling: _list(p['topSelling']).map(_deserializeTopSelling).toList(),
      categorySales: _list(p['categorySales']).map(_deserializeCategorySales).toList(),
      hourlySales: _list(p['hourlySales']).map(_deserializeHourlySales).toList(),
      paymentBreakdown: _list(p['paymentBreakdown']).map(_deserializePayment).toList(),
      channelData: _list(p['channelData']).map(_deserializeChannel).toList(),
      comparisons: _list(p['comparisons']).map(_deserializeComparison).toList(),
      activeOrderStats: _deserializeOrderStats(p['activeOrderStats']),
      kitchenStatus: _deserializeKitchenStatus(p['kitchenStatus']),
      tableStatus: _deserializeTableStatus(p['tableStatus']),
      deliveryStatus: _deserializeDeliveryStatus(p['deliveryStatus']),
      customerStats: _deserializeCustomerStats(p['customerStats']),
      staffOverview: _deserializeStaffOverview(p['staffOverview']),
      menuAnalytics: _deserializeMenuAnalytics(p['menuAnalytics']),
      inventoryOverview: _deserializeInventoryOverview(p['inventoryOverview']),
      financeSummary: _deserializeFinanceSummary(p['financeSummary']),
      aiInsights: _list(p['aiInsights']).map(_deserializeAiInsight).toList(),
      activityTimeline: _list(p['activityTimeline']).map(_deserializeActivity).toList(),
      notifications: _list(p['notifications']).map(_deserializeNotification).toList(),
      isLoading: false,
    );
  }

  ExecutiveHeaderData? _deserializeHeader(dynamic h) {
    if (h == null || h is! Map) return null;
    return ExecutiveHeaderData(
      restaurantName: h['restaurantName'] ?? '', branchName: h['branchName'] ?? '',
      businessDate: _parseDate(h['businessDate']) ?? DateTime.now(),
      currentShift: h['currentShift'] ?? '', greeting: h['greeting'] ?? '',
      userName: h['userName'] ?? '', userRole: h['userRole'] ?? '',
      isOnline: h['isOnline'] ?? true, lastSync: _parseDate(h['lastSync']) ?? DateTime.now(),
      weather: h['weather'], temperature: (h['temperature'] as num?)?.toDouble(),
      isBusinessHoursOpen: h['isBusinessHoursOpen'] ?? true,
      businessHoursDisplay: h['businessHoursDisplay'],
    );
  }

  DashboardKpi _deserializeKpi(dynamic k) {
    final m = k as Map<String, dynamic>;
    final iconCodePoint = (m['iconCodePoint'] as int?) ?? 0xe047;
    return DashboardKpi(
      id: m['id'] ?? '', label: m['label'] ?? '', value: m['value'] ?? '',
      icon: IconData(iconCodePoint, fontFamily: 'MaterialIcons'),
      color: Color(m['colorValue'] ?? 0xFF2196F3),
      changePercent: (m['changePercent'] as num?)?.toDouble(),
      isPositiveTrend: m['isPositiveTrend'] ?? true, subtitle: m['subtitle'],
      size: WidgetSize.values.asNameMap()[m['size']] ?? WidgetSize.small,
      category: m['category'] ?? 'general',
      sparklineData: (m['sparklineData'] as List<dynamic>?)?.map((e) => (e as num).toDouble()).toList(),
    );
  }

  SalesDataPoint _deserializeSalesPoint(dynamic s) {
    final m = s as Map<String, dynamic>;
    return SalesDataPoint(
      date: _parseDate(m['date']) ?? DateTime.now(), revenue: (m['revenue'] as num? ?? 0).toDouble(),
      orderCount: m['orderCount'] ?? 0, avgOrderValue: (m['avgOrderValue'] as num? ?? 0).toDouble(),
    );
  }

  TopSellingItem _deserializeTopSelling(dynamic t) {
    final m = t as Map<String, dynamic>;
    return TopSellingItem(
      id: m['id'] ?? '', name: m['name'] ?? '', quantity: m['quantity'] ?? 0,
      revenue: (m['revenue'] as num? ?? 0).toDouble(), category: m['category'],
      margin: (m['margin'] as num?)?.toDouble(), prepTimeMinutes: m['prepTimeMinutes'],
    );
  }

  CategorySales _deserializeCategorySales(dynamic c) {
    final m = c as Map<String, dynamic>;
    return CategorySales(
      category: m['category'] ?? '', revenue: (m['revenue'] as num? ?? 0).toDouble(),
      orderCount: m['orderCount'] ?? 0, percentage: (m['percentage'] as num? ?? 0).toDouble(),
    );
  }

  HourlySales _deserializeHourlySales(dynamic h) {
    final m = h as Map<String, dynamic>;
    return HourlySales(
      hour: m['hour'] ?? 0, revenue: (m['revenue'] as num? ?? 0).toDouble(),
      orderCount: m['orderCount'] ?? 0, isPeak: m['isPeak'] ?? false,
    );
  }

  PaymentBreakdown _deserializePayment(dynamic p) {
    final m = p as Map<String, dynamic>;
    return PaymentBreakdown(
      method: m['method'] ?? '', amount: (m['amount'] as num? ?? 0).toDouble(),
      count: m['count'] ?? 0, percentage: (m['percentage'] as num? ?? 0).toDouble(),
    );
  }

  SalesChannelData _deserializeChannel(dynamic c) {
    final m = c as Map<String, dynamic>;
    return SalesChannelData(
      channel: m['channel'] ?? '', revenue: (m['revenue'] as num? ?? 0).toDouble(),
      orderCount: m['orderCount'] ?? 0, percentage: (m['percentage'] as num? ?? 0).toDouble(),
    );
  }

  DailyComparison _deserializeComparison(dynamic d) {
    final m = d as Map<String, dynamic>;
    return DailyComparison(
      label: m['label'] ?? '', current: (m['current'] as num? ?? 0).toDouble(),
      previous: (m['previous'] as num? ?? 0).toDouble(),
      changePercent: (m['changePercent'] as num? ?? 0).toDouble(),
    );
  }

  ActiveOrderStats _deserializeOrderStats(dynamic s) {
    if (s == null) return const ActiveOrderStats();
    final m = s as Map<String, dynamic>;
    return ActiveOrderStats(
      total: m['total'] ?? 0, pending: m['pending'] ?? 0, confirmed: m['confirmed'] ?? 0,
      preparing: m['preparing'] ?? 0, ready: m['ready'] ?? 0, delivered: m['delivered'] ?? 0,
      dineIn: m['dineIn'] ?? 0, takeaway: m['takeaway'] ?? 0, deliveryOrders: m['deliveryOrders'] ?? 0,
      totalRevenue: (m['totalRevenue'] as num? ?? 0).toDouble(),
      pendingPayments: (m['pendingPayments'] as num? ?? 0).toDouble(),
      outstandingAmount: (m['outstandingAmount'] as num? ?? 0).toDouble(),
      refunds: (m['refunds'] as num? ?? 0).toDouble(), discounts: (m['discounts'] as num? ?? 0).toDouble(),
      orders: _list(m['orders']).map((o) {
        final om = o as Map<String, dynamic>;
        return ActiveOrder(
          id: om['id'] ?? '', orderNumber: om['orderNumber'] ?? '', status: om['status'] ?? '',
          type: om['type'] ?? '', totalAmount: (om['totalAmount'] as num? ?? 0).toDouble(),
          items: om['items'] ?? 0, customerName: om['customerName'], tableNumber: om['tableNumber'],
          createdAt: _parseDate(om['createdAt']) ?? DateTime.now(),
          assignedTo: om['assignedTo'], channel: om['channel'],
        );
      }).toList(),
    );
  }

  KitchenStatus _deserializeKitchenStatus(dynamic s) {
    if (s == null) return const KitchenStatus(pending: 0, preparing: 0, ready: 0, averageTimeMinutes: 0, orders: []);
    final m = s as Map<String, dynamic>;
    return KitchenStatus(
      pending: m['pending'] ?? 0, preparing: m['preparing'] ?? 0, ready: m['ready'] ?? 0,
      averageTimeMinutes: m['averageTimeMinutes'] ?? 0, loadPercentage: (m['loadPercentage'] as num? ?? 0).toDouble(),
      orders: _list(m['orders']).map((o) {
        final om = o as Map<String, dynamic>;
        return KitchenOrder(
          id: om['id'] ?? '', orderNumber: om['orderNumber'] ?? '', status: om['status'] ?? '',
          itemCount: om['itemCount'] ?? 0, startedAt: _parseDate(om['startedAt']) ?? DateTime.now(),
          elapsedMinutes: om['elapsedMinutes'] ?? 0, priority: om['priority'],
        );
      }).toList(),
    );
  }

  TableStatus _deserializeTableStatus(dynamic s) {
    if (s == null) return const TableStatus(total: 0, occupied: 0, reserved: 0, available: 0, cleaning: 0, tables: []);
    final m = s as Map<String, dynamic>;
    return TableStatus(
      total: m['total'] ?? 0, occupied: m['occupied'] ?? 0, reserved: m['reserved'] ?? 0,
      available: m['available'] ?? 0, cleaning: m['cleaning'] ?? 0,
      occupancyRate: (m['occupancyRate'] as num? ?? 0).toDouble(),
      tables: _list(m['tables']).map((t) {
        final tm = t as Map<String, dynamic>;
        return TableInfo(
          id: tm['id'] ?? '', number: tm['number'] ?? '', status: tm['status'] ?? '',
          capacity: tm['capacity'] ?? 0,
          currentOrderAmount: (tm['currentOrderAmount'] as num?)?.toDouble(),
          occupiedSince: _parseDate(tm['occupiedSince']), customerName: tm['customerName'],
        );
      }).toList(),
    );
  }

  DeliveryStatus _deserializeDeliveryStatus(dynamic s) {
    if (s == null) return const DeliveryStatus(pending: 0, inTransit: 0, delivered: 0, averageDeliveryTime: 0, activeDeliveries: []);
    final m = s as Map<String, dynamic>;
    return DeliveryStatus(
      pending: m['pending'] ?? 0, inTransit: m['inTransit'] ?? 0, delivered: m['delivered'] ?? 0,
      averageDeliveryTime: (m['averageDeliveryTime'] as num? ?? 0).toDouble(),
      activeDeliveries: _list(m['activeDeliveries']).map((d) {
        final dm = d as Map<String, dynamic>;
        return ActiveDelivery(
          id: dm['id'] ?? '', orderNumber: dm['orderNumber'] ?? '', partnerName: dm['partnerName'] ?? '',
          status: dm['status'] ?? '', assignedAt: _parseDate(dm['assignedAt']) ?? DateTime.now(),
          estimatedTime: dm['estimatedTime'],
        );
      }).toList(),
    );
  }

  CustomerStats _deserializeCustomerStats(dynamic s) {
    if (s == null) return const CustomerStats(totalCustomers: 0, newCustomers: 0, returningCustomers: 0, retentionRate: 0, averageSpend: 0, topCustomers: []);
    final m = s as Map<String, dynamic>;
    return CustomerStats(
      totalCustomers: m['totalCustomers'] ?? 0, newCustomers: m['newCustomers'] ?? 0,
      returningCustomers: m['returningCustomers'] ?? 0,
      retentionRate: (m['retentionRate'] as num? ?? 0).toDouble(),
      averageSpend: (m['averageSpend'] as num? ?? 0).toDouble(),
      averageLifetimeValue: (m['averageLifetimeValue'] as num? ?? 0).toDouble(),
      averageVisitFrequency: (m['averageVisitFrequency'] as num? ?? 0).toDouble(),
      feedbackScore: (m['feedbackScore'] as num? ?? 0).toDouble(),
      topCustomers: _list(m['topCustomers']).map((c) {
        final cm = c as Map<String, dynamic>;
        return TopCustomer(
          id: cm['id'] ?? '', name: cm['name'] ?? '', visits: cm['visits'] ?? 0,
          totalSpend: (cm['totalSpend'] as num? ?? 0).toDouble(), tier: cm['tier'] ?? '',
          lastVisit: _parseDate(cm['lastVisit']),
        );
      }).toList(),
    );
  }

  StaffOverview _deserializeStaffOverview(dynamic s) {
    if (s == null) return const StaffOverview(totalStaff: 0, onDuty: 0, clockedIn: 0, onBreak: 0, laborCostPercentage: 0, recentActivity: []);
    final m = s as Map<String, dynamic>;
    return StaffOverview(
      totalStaff: m['totalStaff'] ?? 0, onDuty: m['onDuty'] ?? 0, clockedIn: m['clockedIn'] ?? 0,
      onBreak: m['onBreak'] ?? 0, absent: m['absent'] ?? 0,
      laborCostPercentage: (m['laborCostPercentage'] as num? ?? 0).toDouble(),
      totalSalesByStaff: (m['totalSalesByStaff'] as num? ?? 0).toDouble(),
      totalTips: (m['totalTips'] as num? ?? 0).toDouble(),
      recentActivity: _list(m['recentActivity']).map((a) {
        final am = a as Map<String, dynamic>;
        return StaffActivity(
          name: am['name'] ?? '', role: am['role'] ?? '', status: am['status'] ?? '',
          clockedInAt: _parseDate(am['clockedInAt']),
        );
      }).toList(),
      topPerformers: _list(m['topPerformers']).map((p) {
        final pm = p as Map<String, dynamic>;
        return StaffPerformance(
          name: pm['name'] ?? '', role: pm['role'] ?? '',
          salesAmount: (pm['salesAmount'] as num? ?? 0).toDouble(),
          ordersHandled: pm['ordersHandled'] ?? 0,
          tips: (pm['tips'] as num? ?? 0).toDouble(),
          rating: (pm['rating'] as num? ?? 0).toDouble(),
        );
      }).toList(),
    );
  }

  MenuAnalytics _deserializeMenuAnalytics(dynamic m) {
    if (m == null) return const MenuAnalytics();
    final p = m as Map<String, dynamic>;
    return MenuAnalytics(
      bestSelling: _list(p['bestSelling']).map(_deserializeTopSelling).toList(),
      worstSelling: _list(p['worstSelling']).map(_deserializeTopSelling).toList(),
      popularCategories: _list(p['popularCategories']).map(_deserializeCategorySales).toList(),
      highMarginItems: _list(p['highMarginItems']).map((i) {
        final im = i as Map<String, dynamic>;
        return MarginItem(
          name: im['name'] ?? '', price: (im['price'] as num? ?? 0).toDouble(),
          cost: (im['cost'] as num? ?? 0).toDouble(), margin: (im['margin'] as num? ?? 0).toDouble(),
          soldCount: im['soldCount'] ?? 0,
        );
      }).toList(),
      frequentlyOrderedTogether: _list(p['frequentlyOrderedTogether']).map((f) {
        final fm = f as Map<String, dynamic>;
        return FrequentlyOrdered(
          item1: fm['item1'] ?? '', item2: fm['item2'] ?? '',
          timesOrdered: fm['timesOrdered'] ?? 0, revenue: (fm['revenue'] as num? ?? 0).toDouble(),
        );
      }).toList(),
      outOfStockItems: _list(p['outOfStockItems']).map(_deserializeTopSelling).toList(),
      averagePreparationTime: (p['averagePreparationTime'] as num? ?? 0).toDouble(),
    );
  }

  InventoryOverview _deserializeInventoryOverview(dynamic s) {
    if (s == null) return const InventoryOverview();
    final m = s as Map<String, dynamic>;
    return InventoryOverview(
      totalValue: (m['totalValue'] as num? ?? 0).toDouble(),
      foodCost: (m['foodCost'] as num? ?? 0).toDouble(),
      wasteValue: (m['wasteValue'] as num? ?? 0).toDouble(),
      lowStockCount: m['lowStockCount'] ?? 0, outOfStockCount: m['outOfStockCount'] ?? 0,
      pendingPurchaseOrders: m['pendingPurchaseOrders'] ?? 0, expiringItems: m['expiringItems'] ?? 0,
      wastePercentage: (m['wastePercentage'] as num? ?? 0).toDouble(),
      alerts: _list(m['alerts']).map((a) {
        final am = a as Map<String, dynamic>;
        return InventoryAlert(
          id: am['id'] ?? '', itemName: am['itemName'] ?? '', currentStock: am['currentStock'] ?? 0,
          minStock: am['minStock'] ?? 0, unit: am['unit'] ?? '', severity: am['severity'] ?? '',
          expiresAt: _parseDate(am['expiresAt']),
        );
      }).toList(),
      wasteItems: _list(m['wasteItems']).map((w) {
        final wm = w as Map<String, dynamic>;
        return WasteItem(
          name: wm['name'] ?? '', quantity: (wm['quantity'] as num? ?? 0).toDouble(),
          unit: wm['unit'] ?? '', cost: (wm['cost'] as num? ?? 0).toDouble(),
          date: _parseDate(wm['date']) ?? DateTime.now(),
        );
      }).toList(),
    );
  }

  FinanceSummary _deserializeFinanceSummary(dynamic s) {
    if (s == null) return const FinanceSummary(totalRevenue: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0, totalTax: 0, expenseBreakdown: []);
    final m = s as Map<String, dynamic>;
    return FinanceSummary(
      totalRevenue: (m['totalRevenue'] as num? ?? 0).toDouble(),
      totalExpenses: (m['totalExpenses'] as num? ?? 0).toDouble(),
      netProfit: (m['netProfit'] as num? ?? 0).toDouble(),
      profitMargin: (m['profitMargin'] as num? ?? 0).toDouble(),
      totalTax: (m['totalTax'] as num? ?? 0).toDouble(),
      cashFlow: (m['cashFlow'] as num? ?? 0).toDouble(),
      outstandingPayments: (m['outstandingPayments'] as num? ?? 0).toDouble(),
      bankSettlement: (m['bankSettlement'] as num? ?? 0).toDouble(),
      upiSettlement: (m['upiSettlement'] as num? ?? 0).toDouble(),
      onlinePayments: (m['onlinePayments'] as num? ?? 0).toDouble(),
      totalRefunds: (m['totalRefunds'] as num? ?? 0).toDouble(),
      expensesTrend: (m['expensesTrend'] as num? ?? 0).toDouble(),
      expenseBreakdown: _list(m['expenseBreakdown']).map((e) {
        final em = e as Map<String, dynamic>;
        return ExpenseBreakdown(
          category: em['category'] ?? '', amount: (em['amount'] as num? ?? 0).toDouble(),
          percentage: (em['percentage'] as num? ?? 0).toDouble(),
        );
      }).toList(),
    );
  }

  AiInsight _deserializeAiInsight(dynamic a) {
    final m = a as Map<String, dynamic>;
    final iconCodePoint = (m['iconCodePoint'] as int?) ?? 0xe873;
    return AiInsight(
      id: m['id'] ?? '', title: m['title'] ?? '', description: m['description'] ?? '',
      type: m['type'] ?? '',
      icon: IconData(iconCodePoint, fontFamily: 'MaterialIcons'),
      color: Color(m['colorValue'] ?? 0xFF2196F3),
      timestamp: _parseDate(m['timestamp']) ?? DateTime.now(),
      confidence: (m['confidence'] as num?)?.toDouble(), actionLabel: m['actionLabel'],
    );
  }

  ActivityEvent _deserializeActivity(dynamic a) {
    final m = a as Map<String, dynamic>;
    final iconCodePoint = (m['iconCodePoint'] as int?) ?? 0xe06b;
    return ActivityEvent(
      id: m['id'] ?? '', title: m['title'] ?? '', subtitle: m['subtitle'], type: m['type'] ?? '',
      icon: IconData(iconCodePoint, fontFamily: 'MaterialIcons'),
      color: Color(m['colorValue'] ?? 0xFF2196F3),
      timestamp: _parseDate(m['timestamp']) ?? DateTime.now(),
    );
  }

  DashboardNotification _deserializeNotification(dynamic n) {
    final m = n as Map<String, dynamic>;
    return DashboardNotification(
      id: m['id'] ?? '', title: m['title'] ?? '', message: m['message'] ?? '',
      severity: AlertSeverity.values.asNameMap()[m['severity']] ?? AlertSeverity.info,
      category: m['category'] ?? '', timestamp: _parseDate(m['timestamp']) ?? DateTime.now(),
      isRead: m['isRead'] ?? false, actionRoute: m['actionRoute'],
    );
  }

  // ─── Helpers ──────────────────────────────────────────

  List<dynamic> _list(dynamic v) => v is List ? v : [];
  DateTime? _parseDate(dynamic v) {
    if (v == null) return null;
    if (v is String) return DateTime.tryParse(v);
    return null;
  }
}
