import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexaros_app/features/dashboard/data/dashboard_models.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('DashboardFilter', () {
    test('default filter has correct defaults', () {
      const f = DashboardFilter();
      expect(f.timeRange, DashboardTimeRange.today);
      expect(f.branchId, isNull);
      expect(f.orderType, OrderType.all);
      expect(f.salesChannel, SalesChannel.all);
    });

    test('copyWith preserves unmodified fields', () {
      const f = DashboardFilter(
        timeRange: DashboardTimeRange.thisWeek,
        branchId: 'b1',
        orderType: OrderType.dineIn,
      );
      final f2 = f.copyWith(salesChannel: SalesChannel.online);
      expect(f2.timeRange, DashboardTimeRange.thisWeek);
      expect(f2.branchId, 'b1');
      expect(f2.orderType, OrderType.dineIn);
      expect(f2.salesChannel, SalesChannel.online);
    });

    test('effectiveStart for today returns start of today', () {
      const f = DashboardFilter(timeRange: DashboardTimeRange.today);
      final now = DateTime.now();
      final start = f.effectiveStart;
      expect(start.year, now.year);
      expect(start.month, now.month);
      expect(start.day, now.day);
      expect(start.hour, 0);
      expect(start.minute, 0);
    });

    test('effectiveStart for thisMonth returns first of month', () {
      const f = DashboardFilter(timeRange: DashboardTimeRange.thisMonth);
      final start = f.effectiveStart;
      expect(start.day, 1);
    });

    test('effectiveStart for custom uses customStart', () {
      final custom = DateTime(2025, 6, 15);
      final f = DashboardFilter(timeRange: DashboardTimeRange.custom, customStart: custom);
      expect(f.effectiveStart, custom);
    });

    test('rangeLabel returns readable string', () {
      expect(const DashboardFilter(timeRange: DashboardTimeRange.today).rangeLabel, 'Today');
      expect(const DashboardFilter(timeRange: DashboardTimeRange.thisWeek).rangeLabel, 'This Week');
      expect(const DashboardFilter(timeRange: DashboardTimeRange.lastMonth).rangeLabel, 'Last Month');
      expect(const DashboardFilter(timeRange: DashboardTimeRange.custom).rangeLabel, 'Custom Range');
    });
  });

  group('DashboardWidgetConfig', () {
    test('copyWith preserves id and widgetType', () {
      const c = DashboardWidgetConfig(id: 'kpi', widgetType: 'kpi_cards', order: 2);
      final c2 = c.copyWith(order: 5);
      expect(c2.id, 'kpi');
      expect(c2.widgetType, 'kpi_cards');
      expect(c2.order, 5);
    });

    test('copyWith toggles isVisible', () {
      const c = DashboardWidgetConfig(id: 'x', widgetType: 't');
      expect(c.isVisible, isTrue);
      final c2 = c.copyWith(isVisible: false);
      expect(c2.isVisible, isFalse);
    });
  });

  group('RealtimeState', () {
    test('isConnected returns true when order and kitchen connected', () {
      const s = RealtimeState(
        orderStatus: ConnectionStatus.connected,
        kitchenStatus: ConnectionStatus.connected,
      );
      expect(s.isConnected, isTrue);
    });

    test('isConnected returns false when disconnected', () {
      const s = RealtimeState(
        orderStatus: ConnectionStatus.disconnected,
        kitchenStatus: ConnectionStatus.connected,
      );
      expect(s.isConnected, isFalse);
    });

    test('copyWith preserves unmodified statuses', () {
      const s = RealtimeState(
        orderStatus: ConnectionStatus.connected,
        paymentStatus: ConnectionStatus.reconnecting,
      );
      final s2 = s.copyWith(kitchenStatus: ConnectionStatus.connected);
      expect(s2.orderStatus, ConnectionStatus.connected);
      expect(s2.paymentStatus, ConnectionStatus.reconnecting);
      expect(s2.kitchenStatus, ConnectionStatus.connected);
    });
  });

  group('DashboardData', () {
    test('default const has empty lists and isLoading true', () {
      const d = DashboardData();
      expect(d.kpis, isEmpty);
      expect(d.salesData, isEmpty);
      expect(d.topSelling, isEmpty);
      expect(d.notifications, isEmpty);
      expect(d.isLoading, isTrue);
      expect(d.header, isNull);
      expect(d.error, isNull);
    });

    test('copyWith replaces error but keeps everything else', () {
      const d = DashboardData(isLoading: true);
      final d2 = d.copyWith(error: 'fail', isLoading: false);
      expect(d2.error, 'fail');
      expect(d2.isLoading, isFalse);
      expect(d2.kpis, isEmpty);
    });

    test('copyWith updates kpis list', () {
      const d = DashboardData();
      final kpis = [
        const DashboardKpi(id: '1', label: 'Revenue', value: '₹50K', icon: Icons.attach_money, color: Colors.green),
      ];
      final d2 = d.copyWith(kpis: kpis);
      expect(d2.kpis.length, 1);
      expect(d2.kpis.first.label, 'Revenue');
    });
  });

  group('DashboardKpi', () {
    test('defaults for isPositiveTrend and size', () {
      const kpi = DashboardKpi(id: '1', label: 'R', value: '100', icon: Icons.star, color: Colors.blue);
      expect(kpi.isPositiveTrend, isTrue);
      expect(kpi.size, WidgetSize.small);
      expect(kpi.category, 'general');
      expect(kpi.changePercent, isNull);
    });
  });

  group('ExecutiveHeaderData', () {
    test('nullable fields default correctly', () {
      final now = DateTime.now();
      final h = ExecutiveHeaderData(businessDate: now, lastSync: now);
      expect(h.restaurantName, '');
      expect(h.userAvatar, isNull);
      expect(h.weather, isNull);
      expect(h.temperature, isNull);
      expect(h.isBusinessHoursOpen, isTrue);
    });
  });

  group('ActiveOrderStats', () {
    test('defaults are all zero', () {
      const s = ActiveOrderStats();
      expect(s.total, 0);
      expect(s.pending, 0);
      expect(s.preparing, 0);
      expect(s.totalRevenue, 0.0);
      expect(s.orders, isEmpty);
    });
  });

  group('KitchenStatus', () {
    test('requires constructor params', () {
      const ks = KitchenStatus(pending: 3, preparing: 5, ready: 2, averageTimeMinutes: 12, orders: []);
      expect(ks.pending, 3);
      expect(ks.loadPercentage, 0);
    });
  });

  group('TableStatus', () {
    test('totals add up correctly in example', () {
      const ts = TableStatus(total: 20, occupied: 12, reserved: 3, available: 4, cleaning: 1, tables: []);
      expect(ts.occupied + ts.reserved + ts.available + ts.cleaning, ts.total);
      expect(ts.total, 20);
    });
  });

  group('DashboardNotification', () {
    test('isRead defaults to false', () {
      final n = DashboardNotification(
        id: '1', title: 'T', message: 'M',
        severity: AlertSeverity.info, category: 'c',
        timestamp: DateTime.now(),
      );
      expect(n.isRead, isFalse);
      expect(n.severity, AlertSeverity.info);
    });
  });
}
