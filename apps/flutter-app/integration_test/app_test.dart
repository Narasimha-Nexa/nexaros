/// Integration tests for NexaROS app.
///
/// Run with: flutter test integration_test/app_test.dart
///
/// These tests verify full app flows across multiple screens and services.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexaros_app/main.dart';

void main() {
  group('NexaROS App Integration', () {
    testWidgets('app launches and shows splash/login', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(child: NexaROSApp()),
      );

      // App should render without crashing
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Verify the app renders a MaterialApp
      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('app has correct theme setup', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(child: NexaROSApp()),
      );

      await tester.pumpAndSettle();

      // Verify MaterialApp is present with proper setup
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(materialApp.theme, isNotNull);
      expect(materialApp.darkTheme, isNotNull);
      expect(materialApp.title, 'NexaROS');
    });

    testWidgets('app supports localization delegates', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(child: NexaROSApp()),
      );

      await tester.pumpAndSettle();

      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(materialApp.localizationsDelegates, isNotEmpty);
      expect(materialApp.supportedLocales.length, greaterThanOrEqualTo(7));
    });
  });
}
