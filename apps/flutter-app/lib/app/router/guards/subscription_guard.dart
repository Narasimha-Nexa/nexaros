import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/riverpod_providers.dart';

/// Redirects to the subscription screen if the user's subscription
/// does not have access to the requested feature module.
class SubscriptionGuard {
  static String? checkAccess(
    BuildContext context,
    GoRouterState state,
    String moduleKey,
  ) {
    final container = ProviderScope.containerOf(context, listen: false);
    final subProv = container.read(subscriptionProvider);
    if (!subProv.canAccessFeature(moduleKey)) {
      return '/subscription?locked=$moduleKey';
    }
    return null;
  }

  static bool canOperate(BuildContext context) {
    final container = ProviderScope.containerOf(context, listen: false);
    final subProv = container.read(subscriptionProvider);
    return subProv.info.canOperate;
  }
}
