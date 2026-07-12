import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/responsive/responsive_layout.dart';
import 'app/shells/mobile_shell.dart';
import 'app/shells/desktop_shell.dart';
import 'features/auth/presentation/login_screen.dart';

class NexaROSApp extends ConsumerWidget {
  const NexaROSApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'NexaROS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const LoginScreen(),
    );
  }
}
