import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app/app.dart';
import 'core/providers/app_state.dart';
import 'core/providers/subscription_provider.dart';
import 'core/providers/branch_provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'core/network/api_client.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final api = ApiClient();
  runApp(
    MultiProvider(
      providers: [
        Provider.value(value: api),
        ChangeNotifierProvider(create: (_) => AuthProvider(api)),
        ChangeNotifierProvider(create: (_) => AppState()),
        ChangeNotifierProvider(create: (_) => SubscriptionProvider(api)),
        ChangeNotifierProvider(create: (_) => BranchProvider(api)),
      ],
      child: const NexaROSApp(),
    ),
  );
}
