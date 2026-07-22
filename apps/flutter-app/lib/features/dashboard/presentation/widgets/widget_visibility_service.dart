import '../../../../core/models/user_role.dart';
import '../../data/dashboard_models.dart';

class WidgetVisibilityService {
  static final Map<String, List<UserRole>> _roleVisibility = {
    'kpi_cards': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager, UserRole.cashier, UserRole.accountant],
    'sales_overview': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager, UserRole.cashier, UserRole.accountant],
    'peak_hours_heatmap': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager, UserRole.accountant],
    'top_selling': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager, UserRole.cashier, UserRole.chef],
    'order_breakdown': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager, UserRole.cashier],
    'live_operations': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager, UserRole.cashier, UserRole.waiter, UserRole.chef, UserRole.kitchenStaff],
    'ai_insights': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager],
    'activity_timeline': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager],
    'customer_panel': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager, UserRole.cashier],
    'staff_panel': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager, UserRole.hr],
    'inventory_panel': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager, UserRole.inventoryManager, UserRole.chef],
    'finance_panel': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager, UserRole.accountant],
    'menu_analytics': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager, UserRole.chef],
    'notifications_panel': [UserRole.superAdmin, UserRole.restaurantOwner, UserRole.branchManager, UserRole.cashier, UserRole.waiter],
  };

  static List<DashboardWidgetConfig> filterByRole(
    List<DashboardWidgetConfig> configs, UserRole role,
  ) {
    return configs.map((config) {
      final visibleRoles = _roleVisibility[config.id];
      final roleAllowed = visibleRoles == null || visibleRoles.contains(role);
      return config.copyWith(isVisible: config.isVisible && roleAllowed);
    }).toList();
  }

  static bool isWidgetVisibleForRole(String widgetId, UserRole role) {
    final visibleRoles = _roleVisibility[widgetId];
    return visibleRoles == null || visibleRoles.contains(role);
  }

  static List<String> getVisibleWidgetIds(UserRole role) {
    return _roleVisibility.keys.where((id) => isWidgetVisibleForRole(id, role)).toList();
  }

  static String widgetLabel(String widgetId) {
    return switch (widgetId) {
      'kpi_cards' => 'KPI Cards',
      'sales_overview' => 'Sales Overview',
      'peak_hours_heatmap' => 'Peak Hours',
      'top_selling' => 'Top Selling Items',
      'order_breakdown' => 'Order Breakdown',
      'live_operations' => 'Live Operations',
      'ai_insights' => 'AI Insights',
      'activity_timeline' => 'Activity Timeline',
      'customer_panel' => 'Customer Analytics',
      'staff_panel' => 'Staff Overview',
      'inventory_panel' => 'Inventory',
      'finance_panel' => 'Finance',
      'menu_analytics' => 'Menu Analytics',
      'notifications_panel' => 'Notifications',
      _ => widgetId,
    };
  }
}
