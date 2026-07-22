import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexaros_app/features/dashboard/data/dashboard_models.dart';
import 'package:nexaros_app/features/dashboard/presentation/widgets/dashboard_search_overlay.dart';

DashboardData _testData() => DashboardData(
  header: ExecutiveHeaderData(
    restaurantName: 'Spice Garden',
    branchName: 'Downtown',
    businessDate: DateTime.now(),
    lastSync: DateTime.now(),
  ),
  kpis: [
    const DashboardKpi(id: 'rev', label: 'Total Revenue', value: '₹1,25,000', icon: Icons.attach_money, color: Colors.green),
    const DashboardKpi(id: 'ord', label: 'Orders Today', value: '84', icon: Icons.receipt, color: Colors.blue),
  ],
  topSelling: const [
    TopSellingItem(name: 'Paneer Tikka', quantity: 42, revenue: 12600, category: 'Starters'),
    TopSellingItem(name: 'Veg Biryani', quantity: 30, revenue: 9000, category: 'Mains'),
  ],
  categorySales: const [
    CategorySales(category: 'Starters', revenue: 35000, orderCount: 50, percentage: 35.0),
    CategorySales(category: 'Mains', revenue: 45000, orderCount: 60, percentage: 45.0),
  ],
  notifications: [
    DashboardNotification(
      id: 'n1', title: 'Low Stock Alert', message: 'Paneer running low',
      severity: AlertSeverity.warning, category: 'inventory',
      timestamp: DateTime.now(),
    ),
  ],
  aiInsights: [
    AiInsight(
      id: 'a1', title: 'Peak Hours Recommendation',
      description: 'Consider adding staff for evening rush',
      type: 'staffing', icon: Icons.lightbulb, color: Colors.amber,
      timestamp: DateTime.now(),
    ),
  ],
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Widget buildOverlay() => MaterialApp(
    home: Scaffold(body: DashboardSearchOverlay(data: _testData())),
  );

  group('DashboardSearchOverlay', () {
    testWidgets('shows empty state hint initially', (tester) async {
      await tester.pumpWidget(buildOverlay());
      await tester.pumpAndSettle();
      expect(find.text('Search KPIs, items, categories...'), findsOneWidget);
    });

    testWidgets('search finds KPI by label', (tester) async {
      await tester.pumpWidget(buildOverlay());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'Revenue');
      await tester.pumpAndSettle(const Duration(milliseconds: 300));
      expect(find.text('Total Revenue'), findsOneWidget);
    });

    testWidgets('search finds menu item', (tester) async {
      await tester.pumpWidget(buildOverlay());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'Paneer');
      await tester.pumpAndSettle(const Duration(milliseconds: 300));
      expect(find.text('Paneer Tikka'), findsOneWidget);
      expect(find.text('42 sold'), findsOneWidget);
    });

    testWidgets('search finds category', (tester) async {
      await tester.pumpWidget(buildOverlay());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'Mains');
      await tester.pumpAndSettle(const Duration(milliseconds: 300));
      expect(find.text('Mains'), findsWidgets);
    });

    testWidgets('search finds notification', (tester) async {
      await tester.pumpWidget(buildOverlay());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'Low Stock');
      await tester.pumpAndSettle(const Duration(milliseconds: 300));
      expect(find.text('Low Stock Alert'), findsOneWidget);
    });

    testWidgets('search finds restaurant name', (tester) async {
      await tester.pumpWidget(buildOverlay());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'Spice');
      await tester.pumpAndSettle(const Duration(milliseconds: 300));
      expect(find.text('Spice Garden'), findsOneWidget);
    });

    testWidgets('no results message for unmatched query', (tester) async {
      await tester.pumpWidget(buildOverlay());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'xyznotfound');
      await tester.pumpAndSettle(const Duration(milliseconds: 300));
      expect(find.text('No results found'), findsOneWidget);
    });

    testWidgets('clear button clears search', (tester) async {
      await tester.pumpWidget(buildOverlay());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'Paneer');
      await tester.pumpAndSettle(const Duration(milliseconds: 300));
      expect(find.text('Paneer Tikka'), findsOneWidget);

      await tester.tap(find.byIcon(Icons.clear));
      await tester.pumpAndSettle(const Duration(milliseconds: 300));
      expect(find.text('Search KPIs, items, categories...'), findsOneWidget);
    });

    testWidgets('search is case-insensitive', (tester) async {
      await tester.pumpWidget(buildOverlay());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'revenue');
      await tester.pumpAndSettle(const Duration(milliseconds: 300));
      expect(find.text('Total Revenue'), findsOneWidget);
    });
  });
}
