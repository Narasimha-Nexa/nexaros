import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import '../core/theme/app_theme.dart';
import '../core/i18n/app_localizations.dart';
import '../features/auth/presentation/login_screen.dart';
import 'shells/mobile_shell.dart';
import 'shells/desktop_shell.dart';
import 'shells/tablet_shell.dart';

class NexaROSApp extends StatelessWidget {
  const NexaROSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NexaROS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      localizationsDelegates: [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: [
        const Locale('en', ''),
        const Locale('hi', ''),
        const Locale('kn', ''),
        const Locale('te', ''),
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
      home: const LoginScreen(),
    );
  }
}

class ResponsiveShell extends StatelessWidget {
  final Widget child;
  const ResponsiveShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > 1400) {
          return const DesktopShell();
        } else if (constraints.maxWidth > 900) {
          return const TabletShell();
        }
        return const MobileShell();
      },
    );
  }
}
