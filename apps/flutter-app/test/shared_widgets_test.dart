/// Widget tests for shared widgets.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexaros_app/shared/widgets/nx_card.dart';
import 'package:nexaros_app/shared/widgets/nx_empty_state.dart';
import 'package:nexaros_app/shared/widgets/nx_status_badge.dart';
import 'package:nexaros_app/shared/widgets/nx_stat_card.dart';
import 'package:nexaros_app/shared/widgets/nx_skeleton.dart';
import 'package:nexaros_app/shared/widgets/nx_search_bar.dart';
import 'package:nexaros_app/shared/widgets/nx_section_header.dart';
import 'package:nexaros_app/shared/widgets/nx_confirmation_dialog.dart';
import 'package:nexaros_app/core/theme/app_colors.dart';

Widget _wrap(Widget child) => MaterialApp(
      home: Scaffold(body: Padding(padding: const EdgeInsets.all(16), child: child)),
    );

void main() {
  group('NxCard', () {
    testWidgets('renders child', (tester) async {
      await tester.pumpWidget(_wrap(const NxCard(child: Text('Hello'))));
      expect(find.text('Hello'), findsOneWidget);
      expect(find.byType(NxCard), findsOneWidget);
    });

    testWidgets('handles onTap', (tester) async {
      var tapped = false;
      await tester.pumpWidget(_wrap(
        NxCard(onTap: () => tapped = true, child: const Text('Tappable')),
      ));
      await tester.tap(find.text('Tappable'));
      expect(tapped, isTrue);
    });

    testWidgets('renders without onTap', (tester) async {
      await tester.pumpWidget(_wrap(
        const NxCard(child: Text('No Tap')),
      ));
      expect(find.text('No Tap'), findsOneWidget);
    });
  });

  group('NxEmptyState', () {
    testWidgets('renders title and subtitle', (tester) async {
      await tester.pumpWidget(_wrap(
        const NxEmptyState(
          icon: Icons.inbox,
          title: 'No data',
          subtitle: 'Add items to see them here',
        ),
      ));
      expect(find.text('No data'), findsOneWidget);
      expect(find.text('Add items to see them here'), findsOneWidget);
    });
  });

  group('NxStatusBadge', () {
    testWidgets('renders label', (tester) async {
      await tester.pumpWidget(_wrap(
        const NxStatusBadge(label: 'Active', color: AppColors.success),
      ));
      expect(find.text('Active'), findsOneWidget);
    });
  });

  group('NxStatCard', () {
    testWidgets('renders title and value', (tester) async {
      await tester.pumpWidget(_wrap(
        const NxStatCard(
          title: 'Revenue',
          value: '₹1,25,000',
          icon: Icons.trending_up,
          color: AppColors.success,
        ),
      ));
      expect(find.text('Revenue'), findsOneWidget);
      expect(find.text('₹1,25,000'), findsOneWidget);
    });
  });

  group('NxSkeleton', () {
    testWidgets('renders with default size', (tester) async {
      await tester.pumpWidget(_wrap(const NxSkeleton()));
      expect(find.byType(NxSkeleton), findsOneWidget);
    });

    testWidgets('renders circle variant', (tester) async {
      await tester.pumpWidget(_wrap(const NxSkeleton.circle(size: 48)));
      expect(find.byType(NxSkeleton), findsOneWidget);
    });

    testWidgets('renders card variant', (tester) async {
      await tester.pumpWidget(_wrap(const NxSkeleton.card()));
      expect(find.byType(NxSkeleton), findsOneWidget);
    });

    testWidgets('NxSkeletonList renders items', (tester) async {
      await tester.pumpWidget(_wrap(const NxSkeletonList(itemCount: 3)));
      expect(find.byType(NxSkeletonList), findsOneWidget);
    });

    testWidgets('NxSkeletonGrid renders items', (tester) async {
      await tester.pumpWidget(_wrap(const NxSkeletonGrid(itemCount: 4)));
      expect(find.byType(NxSkeletonGrid), findsOneWidget);
    });
  });

  group('NxSearchBar', () {
    testWidgets('renders search field', (tester) async {
      await tester.pumpWidget(_wrap(NxSearchBar(onChanged: (_) {})));
      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('fires onChanged', (tester) async {
      String? result;
      await tester.pumpWidget(_wrap(NxSearchBar(onChanged: (v) => result = v)));
      await tester.enterText(find.byType(TextField), 'test query');
      expect(result, 'test query');
    });
  });

  group('NxSectionHeader', () {
    testWidgets('renders title', (tester) async {
      await tester.pumpWidget(_wrap(
        const NxSectionHeader(title: 'Section Title'),
      ));
      expect(find.text('Section Title'), findsOneWidget);
    });

    testWidgets('renders with trailing widget', (tester) async {
      await tester.pumpWidget(_wrap(
        const NxSectionHeader(
          title: 'With Action',
          trailing: Text('View All'),
        ),
      ));
      expect(find.text('With Action'), findsOneWidget);
      expect(find.text('View All'), findsOneWidget);
    });
  });

  group('NxConfirmationDialog', () {
    testWidgets('shows dialog with title and message', (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: ElevatedButton(
              onPressed: () => showDialog(
                context: context,
                builder: (_) => NxConfirmationDialog(
                  title: 'Delete Item',
                  message: 'Are you sure you want to delete this item?',
                  confirmLabel: 'Delete',
                  confirmColor: AppColors.danger,
                  onConfirm: () {},
                ),
              ),
              child: const Text('Show'),
            ),
          ),
        ),
      ));
      await tester.tap(find.text('Show'));
      await tester.pumpAndSettle();
      expect(find.text('Delete Item'), findsOneWidget);
      expect(find.text('Are you sure you want to delete this item?'), findsOneWidget);
    });
  });
}
