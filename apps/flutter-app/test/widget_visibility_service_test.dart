import 'package:flutter_test/flutter_test.dart';
import 'package:nexaros_app/core/models/user_role.dart';
import 'package:nexaros_app/features/dashboard/data/dashboard_models.dart';
import 'package:nexaros_app/features/dashboard/presentation/widgets/widget_visibility_service.dart';

void main() {
  group('WidgetVisibilityService.filterByRole', () {
    test('restaurantOwner sees all widgets', () {
      final configs = _allWidgetIds().map((id) =>
        DashboardWidgetConfig(id: id, widgetType: id)).toList();
      final result = WidgetVisibilityService.filterByRole(configs, UserRole.restaurantOwner);
      expect(result.where((c) => c.isVisible).length, configs.length);
    });

    test('waiter cannot see finance_panel', () {
      final configs = [
        DashboardWidgetConfig(id: 'finance_panel', widgetType: 'finance'),
        DashboardWidgetConfig(id: 'live_operations', widgetType: 'live'),
      ];
      final result = WidgetVisibilityService.filterByRole(configs, UserRole.waiter);
      final finance = result.firstWhere((c) => c.id == 'finance_panel');
      final live = result.firstWhere((c) => c.id == 'live_operations');
      expect(finance.isVisible, isFalse);
      expect(live.isVisible, isTrue);
    });

    test('chef sees inventory_panel and menu_analytics', () {
      final configs = [
        DashboardWidgetConfig(id: 'inventory_panel', widgetType: 'inv'),
        DashboardWidgetConfig(id: 'menu_analytics', widgetType: 'menu'),
        DashboardWidgetConfig(id: 'finance_panel', widgetType: 'fin'),
      ];
      final result = WidgetVisibilityService.filterByRole(configs, UserRole.chef);
      expect(result.firstWhere((c) => c.id == 'inventory_panel').isVisible, isTrue);
      expect(result.firstWhere((c) => c.id == 'menu_analytics').isVisible, isTrue);
      expect(result.firstWhere((c) => c.id == 'finance_panel').isVisible, isFalse);
    });

    test('hr sees staff_panel but not live_operations', () {
      final configs = [
        DashboardWidgetConfig(id: 'staff_panel', widgetType: 'staff'),
        DashboardWidgetConfig(id: 'live_operations', widgetType: 'live'),
      ];
      final result = WidgetVisibilityService.filterByRole(configs, UserRole.hr);
      expect(result.firstWhere((c) => c.id == 'staff_panel').isVisible, isTrue);
      expect(result.firstWhere((c) => c.id == 'live_operations').isVisible, isFalse);
    });

    test('pre-existing invisible widgets stay invisible', () {
      final configs = [
        DashboardWidgetConfig(id: 'kpi_cards', widgetType: 'kpi', isVisible: false),
      ];
      final result = WidgetVisibilityService.filterByRole(configs, UserRole.restaurantOwner);
      expect(result.first.isVisible, isFalse);
    });

    test('unknown widget id is visible to all roles', () {
      final configs = [
        DashboardWidgetConfig(id: 'custom_widget_xyz', widgetType: 'custom'),
      ];
      final result = WidgetVisibilityService.filterByRole(configs, UserRole.cashier);
      expect(result.first.isVisible, isTrue);
    });
  });

  group('isWidgetVisibleForRole', () {
    test('cashier can see kpi_cards', () {
      expect(WidgetVisibilityService.isWidgetVisibleForRole('kpi_cards', UserRole.cashier), isTrue);
    });

    test('cashier cannot see ai_insights', () {
      expect(WidgetVisibilityService.isWidgetVisibleForRole('ai_insights', UserRole.cashier), isFalse);
    });

    test('superAdmin can see everything', () {
      for (final id in _allWidgetIds()) {
        expect(WidgetVisibilityService.isWidgetVisibleForRole(id, UserRole.superAdmin), isTrue, reason: '$id should be visible');
      }
    });

    test('unknown widget is visible', () {
      expect(WidgetVisibilityService.isWidgetVisibleForRole('unknown_xyz', UserRole.waiter), isTrue);
    });
  });

  group('getVisibleWidgetIds', () {
    test('returns only allowed widget ids for role', () {
      final ids = WidgetVisibilityService.getVisibleWidgetIds(UserRole.waiter);
      expect(ids, contains('live_operations'));
      expect(ids, contains('notifications_panel'));
      expect(ids, isNot(contains('finance_panel')));
      expect(ids, isNot(contains('staff_panel')));
    });

    test('superAdmin gets all widget ids', () {
      final ids = WidgetVisibilityService.getVisibleWidgetIds(UserRole.superAdmin);
      expect(ids.length, _allWidgetIds().length);
    });
  });

  group('widgetLabel', () {
    test('returns readable label for known id', () {
      expect(WidgetVisibilityService.widgetLabel('kpi_cards'), 'KPI Cards');
      expect(WidgetVisibilityService.widgetLabel('sales_overview'), 'Sales Overview');
      expect(WidgetVisibilityService.widgetLabel('ai_insights'), 'AI Insights');
      expect(WidgetVisibilityService.widgetLabel('finance_panel'), 'Finance');
    });

    test('returns raw id for unknown widget', () {
      expect(WidgetVisibilityService.widgetLabel('custom_widget'), 'custom_widget');
    });
  });
}

List<String> _allWidgetIds() => [
  'kpi_cards', 'sales_overview', 'peak_hours_heatmap', 'top_selling',
  'order_breakdown', 'live_operations', 'ai_insights', 'activity_timeline',
  'customer_panel', 'staff_panel', 'inventory_panel', 'finance_panel',
  'menu_analytics', 'notifications_panel',
];
