import 'package:flutter/material.dart';

// ─── Enums ───────────────────────────────────────────────

enum DashboardTimeRange {
  today, yesterday, thisWeek, lastWeek, thisMonth, lastMonth,
  thisQuarter, lastQuarter, thisYear, lastYear, custom,
}

enum DashboardView {
  overview, sales, customers, menu, finance, staff, inventory, live, notifications,
}

enum OrderType { dineIn, takeaway, delivery, all }

enum SalesChannel { pos, online, aggregator, all }

enum WidgetSize { small, medium, large, full }

enum AlertSeverity { info, warning, critical }

// ─── Dashboard Filter ────────────────────────────────────

class DashboardFilter {
  final DashboardTimeRange timeRange;
  final DateTime? customStart;
  final DateTime? customEnd;
  final String? branchId;
  final DashboardView view;
  final OrderType orderType;
  final SalesChannel salesChannel;
  final String? paymentMethod;
  final String? staffId;
  final String? category;

  const DashboardFilter({
    this.timeRange = DashboardTimeRange.today,
    this.customStart,
    this.customEnd,
    this.branchId,
    this.view = DashboardView.overview,
    this.orderType = OrderType.all,
    this.salesChannel = SalesChannel.all,
    this.paymentMethod,
    this.staffId,
    this.category,
  });

  DashboardFilter copyWith({
    DashboardTimeRange? timeRange,
    DateTime? customStart,
    DateTime? customEnd,
    String? branchId,
    DashboardView? view,
    OrderType? orderType,
    SalesChannel? salesChannel,
    String? paymentMethod,
    String? staffId,
    String? category,
  }) {
    return DashboardFilter(
      timeRange: timeRange ?? this.timeRange,
      customStart: customStart ?? this.customStart,
      customEnd: customEnd ?? this.customEnd,
      branchId: branchId ?? this.branchId,
      view: view ?? this.view,
      orderType: orderType ?? this.orderType,
      salesChannel: salesChannel ?? this.salesChannel,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      staffId: staffId ?? this.staffId,
      category: category ?? this.category,
    );
  }

  DateTime get effectiveStart {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    switch (timeRange) {
      case DashboardTimeRange.today: return today;
      case DashboardTimeRange.yesterday: return today.subtract(const Duration(days: 1));
      case DashboardTimeRange.thisWeek: return today.subtract(Duration(days: now.weekday - 1));
      case DashboardTimeRange.lastWeek: return today.subtract(Duration(days: now.weekday + 6));
      case DashboardTimeRange.thisMonth: return DateTime(now.year, now.month, 1);
      case DashboardTimeRange.lastMonth: return DateTime(now.year, now.month - 1, 1);
      case DashboardTimeRange.thisQuarter:
        final qStart = ((now.month - 1) ~/ 3) * 3 + 1;
        return DateTime(now.year, qStart, 1);
      case DashboardTimeRange.lastQuarter:
        final qStart = ((now.month - 1) ~/ 3) * 3 - 2;
        return DateTime(now.year, qStart, 1);
      case DashboardTimeRange.thisYear: return DateTime(now.year, 1, 1);
      case DashboardTimeRange.lastYear: return DateTime(now.year - 1, 1, 1);
      case DashboardTimeRange.custom: return customStart ?? today;
    }
  }

  DateTime get effectiveEnd {
    final now = DateTime.now();
    return customEnd ?? DateTime(now.year, now.month, now.day);
  }

  String get rangeLabel {
    switch (timeRange) {
      case DashboardTimeRange.today: return 'Today';
      case DashboardTimeRange.yesterday: return 'Yesterday';
      case DashboardTimeRange.thisWeek: return 'This Week';
      case DashboardTimeRange.lastWeek: return 'Last Week';
      case DashboardTimeRange.thisMonth: return 'This Month';
      case DashboardTimeRange.lastMonth: return 'Last Month';
      case DashboardTimeRange.thisQuarter: return 'This Quarter';
      case DashboardTimeRange.lastQuarter: return 'Last Quarter';
      case DashboardTimeRange.thisYear: return 'This Year';
      case DashboardTimeRange.lastYear: return 'Last Year';
      case DashboardTimeRange.custom: return 'Custom Range';
    }
  }
}

// ─── Executive Header ────────────────────────────────────

class ExecutiveHeaderData {
  final String restaurantName;
  final String branchName;
  final DateTime businessDate;
  final String currentShift;
  final String greeting;
  final String userName;
  final String userRole;
  final String? userAvatar;
  final bool isOnline;
  final DateTime lastSync;
  final String? weather;
  final double? temperature;
  final bool isBusinessHoursOpen;
  final String? businessHoursDisplay;

  const ExecutiveHeaderData({
    this.restaurantName = '',
    this.branchName = '',
    required this.businessDate,
    this.currentShift = '',
    this.greeting = '',
    this.userName = '',
    this.userRole = '',
    this.userAvatar,
    this.isOnline = true,
    required this.lastSync,
    this.weather,
    this.temperature,
    this.isBusinessHoursOpen = true,
    this.businessHoursDisplay,
  });
}

// ─── KPI Models ──────────────────────────────────────────

class DashboardKpi {
  final String id;
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final double? changePercent;
  final bool isPositiveTrend;
  final String? subtitle;
  final WidgetSize size;
  final String category;
  final List<double>? sparklineData;

  const DashboardKpi({
    required this.id,
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.changePercent,
    this.isPositiveTrend = true,
    this.subtitle,
    this.size = WidgetSize.small,
    this.category = 'general',
    this.sparklineData,
  });
}

// ─── Sales Models ────────────────────────────────────────

class SalesDataPoint {
  final DateTime date;
  final double revenue;
  final int orderCount;
  final double avgOrderValue;

  const SalesDataPoint({
    required this.date,
    required this.revenue,
    required this.orderCount,
    required this.avgOrderValue,
  });
}

class TopSellingItem {
  final String id;
  final String name;
  final int quantity;
  final double revenue;
  final String? category;
  final double? margin;
  final int? prepTimeMinutes;

  const TopSellingItem({
    this.id = '',
    required this.name,
    required this.quantity,
    required this.revenue,
    this.category,
    this.margin,
    this.prepTimeMinutes,
  });
}

class CategorySales {
  final String category;
  final double revenue;
  final int orderCount;
  final double percentage;

  const CategorySales({
    required this.category,
    required this.revenue,
    required this.orderCount,
    required this.percentage,
  });
}

class HourlySales {
  final int hour;
  final double revenue;
  final int orderCount;
  final bool isPeak;

  const HourlySales({
    required this.hour,
    required this.revenue,
    required this.orderCount,
    this.isPeak = false,
  });
}

class PaymentBreakdown {
  final String method;
  final double amount;
  final int count;
  final double percentage;

  const PaymentBreakdown({
    required this.method,
    required this.amount,
    required this.count,
    required this.percentage,
  });
}

class SalesChannelData {
  final String channel;
  final double revenue;
  final int orderCount;
  final double percentage;

  const SalesChannelData({
    required this.channel,
    required this.revenue,
    required this.orderCount,
    required this.percentage,
  });
}

class DailyComparison {
  final String label;
  final double current;
  final double previous;
  final double changePercent;

  const DailyComparison({
    required this.label,
    required this.current,
    required this.previous,
    required this.changePercent,
  });
}

class HeatmapData {
  final int dayOfWeek;
  final int hour;
  final double value;
  final int orderCount;

  const HeatmapData({
    required this.dayOfWeek,
    required this.hour,
    required this.value,
    required this.orderCount,
  });
}

// ─── Active Order Models ─────────────────────────────────

class ActiveOrder {
  final String id;
  final String orderNumber;
  final String status;
  final String type;
  final double totalAmount;
  final int items;
  final String? customerName;
  final String? tableNumber;
  final DateTime createdAt;
  final String? assignedTo;
  final String? channel;

  const ActiveOrder({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.type,
    required this.totalAmount,
    required this.items,
    this.customerName,
    this.tableNumber,
    required this.createdAt,
    this.assignedTo,
    this.channel,
  });
}

class ActiveOrderStats {
  final int total;
  final int pending;
  final int confirmed;
  final int preparing;
  final int ready;
  final int delivered;
  final int dineIn;
  final int takeaway;
  final int deliveryOrders;
  final double totalRevenue;
  final double pendingPayments;
  final double outstandingAmount;
  final double refunds;
  final double discounts;
  final List<ActiveOrder> orders;

  const ActiveOrderStats({
    this.total = 0,
    this.pending = 0,
    this.confirmed = 0,
    this.preparing = 0,
    this.ready = 0,
    this.delivered = 0,
    this.dineIn = 0,
    this.takeaway = 0,
    this.deliveryOrders = 0,
    this.totalRevenue = 0,
    this.pendingPayments = 0,
    this.outstandingAmount = 0,
    this.refunds = 0,
    this.discounts = 0,
    this.orders = const [],
  });
}

// ─── Kitchen Models ──────────────────────────────────────

class KitchenStatus {
  final int pending;
  final int preparing;
  final int ready;
  final int averageTimeMinutes;
  final List<KitchenOrder> orders;
  final double loadPercentage;

  const KitchenStatus({
    required this.pending,
    required this.preparing,
    required this.ready,
    required this.averageTimeMinutes,
    required this.orders,
    this.loadPercentage = 0,
  });
}

class KitchenOrder {
  final String id;
  final String orderNumber;
  final String status;
  final int itemCount;
  final DateTime startedAt;
  final int elapsedMinutes;
  final String? priority;

  const KitchenOrder({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.itemCount,
    required this.startedAt,
    required this.elapsedMinutes,
    this.priority,
  });
}

// ─── Table Models ────────────────────────────────────────

class TableStatus {
  final int total;
  final int occupied;
  final int reserved;
  final int available;
  final int cleaning;
  final double occupancyRate;
  final List<TableInfo> tables;

  const TableStatus({
    required this.total,
    required this.occupied,
    required this.reserved,
    required this.available,
    required this.cleaning,
    this.occupancyRate = 0,
    required this.tables,
  });
}

class TableInfo {
  final String id;
  final String number;
  final String status;
  final int capacity;
  final double? currentOrderAmount;
  final DateTime? occupiedSince;
  final String? customerName;

  const TableInfo({
    required this.id,
    required this.number,
    required this.status,
    required this.capacity,
    this.currentOrderAmount,
    this.occupiedSince,
    this.customerName,
  });
}

// ─── Delivery Models ─────────────────────────────────────

class DeliveryStatus {
  final int pending;
  final int inTransit;
  final int delivered;
  final double averageDeliveryTime;
  final List<ActiveDelivery> activeDeliveries;

  const DeliveryStatus({
    required this.pending,
    required this.inTransit,
    required this.delivered,
    required this.averageDeliveryTime,
    required this.activeDeliveries,
  });
}

class ActiveDelivery {
  final String id;
  final String orderNumber;
  final String partnerName;
  final String status;
  final DateTime assignedAt;
  final String? estimatedTime;

  const ActiveDelivery({
    required this.id,
    required this.orderNumber,
    required this.partnerName,
    required this.status,
    required this.assignedAt,
    this.estimatedTime,
  });
}

// ─── Customer Models ─────────────────────────────────────

class CustomerStats {
  final int totalCustomers;
  final int newCustomers;
  final int returningCustomers;
  final double retentionRate;
  final double averageSpend;
  final double averageLifetimeValue;
  final double averageVisitFrequency;
  final double feedbackScore;
  final List<TopCustomer> topCustomers;
  final List<CustomerGrowthPoint> growthData;

  const CustomerStats({
    required this.totalCustomers,
    required this.newCustomers,
    required this.returningCustomers,
    required this.retentionRate,
    required this.averageSpend,
    this.averageLifetimeValue = 0,
    this.averageVisitFrequency = 0,
    this.feedbackScore = 0,
    required this.topCustomers,
    this.growthData = const [],
  });
}

class TopCustomer {
  final String id;
  final String name;
  final int visits;
  final double totalSpend;
  final String tier;
  final DateTime? lastVisit;

  const TopCustomer({
    this.id = '',
    required this.name,
    required this.visits,
    required this.totalSpend,
    required this.tier,
    this.lastVisit,
  });
}

class CustomerGrowthPoint {
  final DateTime date;
  final int newCustomers;
  final int returningCustomers;

  const CustomerGrowthPoint({
    required this.date,
    required this.newCustomers,
    required this.returningCustomers,
  });
}

// ─── Staff Models ────────────────────────────────────────

class StaffOverview {
  final int totalStaff;
  final int onDuty;
  final int clockedIn;
  final int onBreak;
  final int absent;
  final double laborCostPercentage;
  final double totalSalesByStaff;
  final double totalTips;
  final List<StaffActivity> recentActivity;
  final List<StaffPerformance> topPerformers;

  const StaffOverview({
    required this.totalStaff,
    required this.onDuty,
    required this.clockedIn,
    required this.onBreak,
    this.absent = 0,
    required this.laborCostPercentage,
    this.totalSalesByStaff = 0,
    this.totalTips = 0,
    required this.recentActivity,
    this.topPerformers = const [],
  });
}

class StaffActivity {
  final String name;
  final String role;
  final String status;
  final DateTime? clockedInAt;

  const StaffActivity({
    required this.name,
    required this.role,
    required this.status,
    this.clockedInAt,
  });
}

class StaffPerformance {
  final String name;
  final String role;
  final double salesAmount;
  final int ordersHandled;
  final double tips;
  final double rating;

  const StaffPerformance({
    required this.name,
    required this.role,
    required this.salesAmount,
    required this.ordersHandled,
    required this.tips,
    required this.rating,
  });
}

// ─── Inventory Models ────────────────────────────────────

class InventoryAlert {
  final String id;
  final String itemName;
  final int currentStock;
  final int minStock;
  final String unit;
  final String severity;
  final DateTime? expiresAt;

  const InventoryAlert({
    this.id = '',
    required this.itemName,
    required this.currentStock,
    required this.minStock,
    required this.unit,
    required this.severity,
    this.expiresAt,
  });
}

class InventoryOverview {
  final double totalValue;
  final double foodCost;
  final double wasteValue;
  final int lowStockCount;
  final int outOfStockCount;
  final int pendingPurchaseOrders;
  final int expiringItems;
  final List<InventoryAlert> alerts;
  final List<WasteItem> wasteItems;
  final double wastePercentage;

  const InventoryOverview({
    this.totalValue = 0,
    this.foodCost = 0,
    this.wasteValue = 0,
    this.lowStockCount = 0,
    this.outOfStockCount = 0,
    this.pendingPurchaseOrders = 0,
    this.expiringItems = 0,
    this.alerts = const [],
    this.wasteItems = const [],
    this.wastePercentage = 0,
  });
}

class WasteItem {
  final String name;
  final double quantity;
  final String unit;
  final double cost;
  final DateTime date;

  const WasteItem({
    required this.name,
    required this.quantity,
    required this.unit,
    required this.cost,
    required this.date,
  });
}

// ─── Finance Models ──────────────────────────────────────

class FinanceSummary {
  final double totalRevenue;
  final double totalExpenses;
  final double netProfit;
  final double profitMargin;
  final double totalTax;
  final double cashFlow;
  final double outstandingPayments;
  final double bankSettlement;
  final double upiSettlement;
  final double onlinePayments;
  final double totalRefunds;
  final double expensesTrend;
  final List<ExpenseBreakdown> expenseBreakdown;

  const FinanceSummary({
    required this.totalRevenue,
    required this.totalExpenses,
    required this.netProfit,
    required this.profitMargin,
    required this.totalTax,
    this.cashFlow = 0,
    this.outstandingPayments = 0,
    this.bankSettlement = 0,
    this.upiSettlement = 0,
    this.onlinePayments = 0,
    this.totalRefunds = 0,
    this.expensesTrend = 0,
    required this.expenseBreakdown,
  });
}

class ExpenseBreakdown {
  final String category;
  final double amount;
  final double percentage;

  const ExpenseBreakdown({
    required this.category,
    required this.amount,
    required this.percentage,
  });
}

// ─── Menu Analytics Models ───────────────────────────────

class MenuAnalytics {
  final List<TopSellingItem> bestSelling;
  final List<TopSellingItem> worstSelling;
  final List<CategorySales> popularCategories;
  final List<MarginItem> highMarginItems;
  final List<MarginItem> lowMarginItems;
  final List<FrequentlyOrdered> frequentlyOrderedTogether;
  final List<TopSellingItem> outOfStockItems;
  final double averagePreparationTime;

  const MenuAnalytics({
    this.bestSelling = const [],
    this.worstSelling = const [],
    this.popularCategories = const [],
    this.highMarginItems = const [],
    this.lowMarginItems = const [],
    this.frequentlyOrderedTogether = const [],
    this.outOfStockItems = const [],
    this.averagePreparationTime = 0,
  });
}

class MarginItem {
  final String name;
  final double price;
  final double cost;
  final double margin;
  final int soldCount;

  const MarginItem({
    required this.name,
    required this.price,
    required this.cost,
    required this.margin,
    required this.soldCount,
  });
}

class FrequentlyOrdered {
  final String item1;
  final String item2;
  final int timesOrdered;
  final double revenue;

  const FrequentlyOrdered({
    required this.item1,
    required this.item2,
    required this.timesOrdered,
    required this.revenue,
  });
}

// ─── AI Insights Models ──────────────────────────────────

class AiInsight {
  final String id;
  final String title;
  final String description;
  final String type;
  final IconData icon;
  final Color color;
  final DateTime timestamp;
  final double? confidence;
  final String? actionLabel;
  final VoidCallback? onAction;

  const AiInsight({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.icon,
    required this.color,
    required this.timestamp,
    this.confidence,
    this.actionLabel,
    this.onAction,
  });
}

// ─── Activity Timeline Models ────────────────────────────

class ActivityEvent {
  final String id;
  final String title;
  final String? subtitle;
  final String type;
  final IconData icon;
  final Color color;
  final DateTime timestamp;

  const ActivityEvent({
    required this.id,
    required this.title,
    this.subtitle,
    required this.type,
    required this.icon,
    required this.color,
    required this.timestamp,
  });
}

// ─── Notification Models ─────────────────────────────────

class DashboardNotification {
  final String id;
  final String title;
  final String message;
  final AlertSeverity severity;
  final String category;
  final DateTime timestamp;
  final bool isRead;
  final String? actionRoute;

  const DashboardNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.severity,
    required this.category,
    required this.timestamp,
    this.isRead = false,
    this.actionRoute,
  });
}

// ─── Dashboard Config ────────────────────────────────────

class DashboardWidgetConfig {
  final String id;
  final String widgetType;
  final WidgetSize size;
  final int order;
  final bool isVisible;
  final bool isCollapsed;

  const DashboardWidgetConfig({
    required this.id,
    required this.widgetType,
    this.size = WidgetSize.medium,
    this.order = 0,
    this.isVisible = true,
    this.isCollapsed = false,
  });

  DashboardWidgetConfig copyWith({
    WidgetSize? size,
    int? order,
    bool? isVisible,
    bool? isCollapsed,
  }) {
    return DashboardWidgetConfig(
      id: id,
      widgetType: widgetType,
      size: size ?? this.size,
      order: order ?? this.order,
      isVisible: isVisible ?? this.isVisible,
      isCollapsed: isCollapsed ?? this.isCollapsed,
    );
  }
}

// ─── Real-Time State ─────────────────────────────────────

enum ConnectionStatus { connected, disconnected, reconnecting, connecting }

class RealtimeState {
  final ConnectionStatus orderStatus;
  final ConnectionStatus kitchenStatus;
  final ConnectionStatus paymentStatus;
  final ConnectionStatus reservationStatus;
  final ConnectionStatus inventoryStatus;
  final ConnectionStatus notificationStatus;

  const RealtimeState({
    this.orderStatus = ConnectionStatus.connecting,
    this.kitchenStatus = ConnectionStatus.connecting,
    this.paymentStatus = ConnectionStatus.connecting,
    this.reservationStatus = ConnectionStatus.connecting,
    this.inventoryStatus = ConnectionStatus.connecting,
    this.notificationStatus = ConnectionStatus.connecting,
  });

  bool get isConnected =>
      orderStatus == ConnectionStatus.connected &&
      kitchenStatus == ConnectionStatus.connected;

  RealtimeState copyWith({
    ConnectionStatus? orderStatus,
    ConnectionStatus? kitchenStatus,
    ConnectionStatus? paymentStatus,
    ConnectionStatus? reservationStatus,
    ConnectionStatus? inventoryStatus,
    ConnectionStatus? notificationStatus,
  }) {
    return RealtimeState(
      orderStatus: orderStatus ?? this.orderStatus,
      kitchenStatus: kitchenStatus ?? this.kitchenStatus,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      reservationStatus: reservationStatus ?? this.reservationStatus,
      inventoryStatus: inventoryStatus ?? this.inventoryStatus,
      notificationStatus: notificationStatus ?? this.notificationStatus,
    );
  }
}

// ─── Master Dashboard Data ───────────────────────────────

class DashboardData {
  final ExecutiveHeaderData? header;
  final List<DashboardKpi> kpis;
  final List<SalesDataPoint> salesData;
  final List<TopSellingItem> topSelling;
  final List<CategorySales> categorySales;
  final List<HourlySales> hourlySales;
  final List<PaymentBreakdown> paymentBreakdown;
  final List<SalesChannelData> channelData;
  final List<DailyComparison> comparisons;
  final List<HeatmapData> heatmapData;
  final ActiveOrderStats activeOrderStats;
  final KitchenStatus kitchenStatus;
  final TableStatus tableStatus;
  final DeliveryStatus deliveryStatus;
  final CustomerStats customerStats;
  final StaffOverview staffOverview;
  final MenuAnalytics menuAnalytics;
  final InventoryOverview inventoryOverview;
  final FinanceSummary financeSummary;
  final List<AiInsight> aiInsights;
  final List<ActivityEvent> activityTimeline;
  final List<DashboardNotification> notifications;
  final RealtimeState realtimeState;
  final bool isLoading;
  final String? error;

  const DashboardData({
    this.header,
    this.kpis = const [],
    this.salesData = const [],
    this.topSelling = const [],
    this.categorySales = const [],
    this.hourlySales = const [],
    this.paymentBreakdown = const [],
    this.channelData = const [],
    this.comparisons = const [],
    this.heatmapData = const [],
    this.activeOrderStats = const ActiveOrderStats(),
    this.kitchenStatus = const KitchenStatus(pending: 0, preparing: 0, ready: 0, averageTimeMinutes: 0, orders: []),
    this.tableStatus = const TableStatus(total: 0, occupied: 0, reserved: 0, available: 0, cleaning: 0, tables: []),
    this.deliveryStatus = const DeliveryStatus(pending: 0, inTransit: 0, delivered: 0, averageDeliveryTime: 0, activeDeliveries: []),
    this.customerStats = const CustomerStats(totalCustomers: 0, newCustomers: 0, returningCustomers: 0, retentionRate: 0, averageSpend: 0, topCustomers: []),
    this.staffOverview = const StaffOverview(totalStaff: 0, onDuty: 0, clockedIn: 0, onBreak: 0, laborCostPercentage: 0, recentActivity: []),
    this.menuAnalytics = const MenuAnalytics(),
    this.inventoryOverview = const InventoryOverview(),
    this.financeSummary = const FinanceSummary(totalRevenue: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0, totalTax: 0, expenseBreakdown: []),
    this.aiInsights = const [],
    this.activityTimeline = const [],
    this.notifications = const [],
    this.realtimeState = const RealtimeState(),
    this.isLoading = true,
    this.error,
  });

  DashboardData copyWith({
    ExecutiveHeaderData? header,
    List<DashboardKpi>? kpis,
    List<SalesDataPoint>? salesData,
    List<TopSellingItem>? topSelling,
    List<CategorySales>? categorySales,
    List<HourlySales>? hourlySales,
    List<PaymentBreakdown>? paymentBreakdown,
    List<SalesChannelData>? channelData,
    List<DailyComparison>? comparisons,
    List<HeatmapData>? heatmapData,
    ActiveOrderStats? activeOrderStats,
    KitchenStatus? kitchenStatus,
    TableStatus? tableStatus,
    DeliveryStatus? deliveryStatus,
    CustomerStats? customerStats,
    StaffOverview? staffOverview,
    MenuAnalytics? menuAnalytics,
    InventoryOverview? inventoryOverview,
    FinanceSummary? financeSummary,
    List<AiInsight>? aiInsights,
    List<ActivityEvent>? activityTimeline,
    List<DashboardNotification>? notifications,
    RealtimeState? realtimeState,
    bool? isLoading,
    String? error,
  }) {
    return DashboardData(
      header: header ?? this.header,
      kpis: kpis ?? this.kpis,
      salesData: salesData ?? this.salesData,
      topSelling: topSelling ?? this.topSelling,
      categorySales: categorySales ?? this.categorySales,
      hourlySales: hourlySales ?? this.hourlySales,
      paymentBreakdown: paymentBreakdown ?? this.paymentBreakdown,
      channelData: channelData ?? this.channelData,
      comparisons: comparisons ?? this.comparisons,
      heatmapData: heatmapData ?? this.heatmapData,
      activeOrderStats: activeOrderStats ?? this.activeOrderStats,
      kitchenStatus: kitchenStatus ?? this.kitchenStatus,
      tableStatus: tableStatus ?? this.tableStatus,
      deliveryStatus: deliveryStatus ?? this.deliveryStatus,
      customerStats: customerStats ?? this.customerStats,
      staffOverview: staffOverview ?? this.staffOverview,
      menuAnalytics: menuAnalytics ?? this.menuAnalytics,
      inventoryOverview: inventoryOverview ?? this.inventoryOverview,
      financeSummary: financeSummary ?? this.financeSummary,
      aiInsights: aiInsights ?? this.aiInsights,
      activityTimeline: activityTimeline ?? this.activityTimeline,
      notifications: notifications ?? this.notifications,
      realtimeState: realtimeState ?? this.realtimeState,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}
