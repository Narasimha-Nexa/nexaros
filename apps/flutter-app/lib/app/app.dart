import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/theme/app_theme.dart';
import '../core/providers/riverpod_providers.dart';
import '../core/i18n/app_localizations.dart';
import 'router/app_router.dart';

class NexaROSApp extends ConsumerWidget {
  const NexaROSApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final themeMode = ref.watch(themeProvider).themeMode;
    final router = createRouter(authState);

    return MaterialApp.router(
      title: 'NexaROS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
      localizationsDelegates: [
        const AppLocalizationsDelegate(),
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: [
        const Locale('en', ''),
        const Locale('hi', ''),
        const Locale('kn', ''),
        const Locale('te', ''),
        const Locale('ta', ''),
        const Locale('ml', ''),
        const Locale('ar', ''),
      ],
      localeResolutionCallback: (locale, supportedLocales) {
        if (locale == null) return supportedLocales.first;
        for (final supported in supportedLocales) {
          if (supported.languageCode == locale.languageCode) {
            return supported;
          }
        }
        return supportedLocales.first;
      },
    );
  }
}
