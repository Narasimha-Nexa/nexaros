import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_role.dart';
import '../providers/riverpod_providers.dart';
import '../theme/app_colors.dart';

/// Conditionally renders [child] only if the current user has the
/// specified [permission]. Otherwise renders [fallback].
class RequirePermission extends ConsumerWidget {
  final Permission permission;
  final Widget child;
  final Widget? fallback;

  const RequirePermission({
    super.key,
    required this.permission,
    required this.child,
    this.fallback,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roleProv = ref.watch(roleProvider);
    if (roleProv.can(permission)) return child;
    return fallback ?? const SizedBox.shrink();
  }
}

/// Conditionally renders [child] only if the current user's role
/// is one of the [roles]. Otherwise renders [fallback].
class RequireRole extends ConsumerWidget {
  final List<UserRole> roles;
  final Widget child;
  final Widget? fallback;

  const RequireRole({
    super.key,
    required this.roles,
    required this.child,
    this.fallback,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roleProv = ref.watch(roleProvider);
    if (roleProv.isRole(roles)) return child;
    return fallback ?? const SizedBox.shrink();
  }
}

/// Dual-gate widget that checks BOTH role-based permission AND
/// subscription entitlement. Renders [child] only if both pass.
class PermissionGate extends ConsumerWidget {
  final Permission permission;
  final String? moduleKey;
  final Widget child;
  final Widget? fallback;
  final VoidCallback? onUpgrade;

  const PermissionGate({
    super.key,
    required this.permission,
    this.moduleKey,
    required this.child,
    this.fallback,
    this.onUpgrade,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roleProv = ref.watch(roleProvider);
    final subProv = ref.watch(subscriptionProvider);
    final cs = Theme.of(context).colorScheme;

    if (!roleProv.can(permission)) {
      return fallback ?? const SizedBox.shrink();
    }

    if (moduleKey != null && !subProv.canAccessFeature(moduleKey!)) {
      return Stack(
        children: [
          Opacity(
            opacity: 0.3,
            child: IgnorePointer(child: child),
          ),
          Positioned.fill(
            child: Center(
              child: Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: cs.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: cs.outline),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primary50,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.lock_outline,
                        color: AppColors.primary,
                        size: 28,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Feature Locked',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: cs.onSurface,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subProv.getModuleLockReason(moduleKey!),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.gray500,
                        height: 1.4,
                      ),
                    ),
                    if (onUpgrade != null) ...[
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: onUpgrade,
                        icon: const Icon(Icons.upgrade, size: 16),
                        label: const Text('Upgrade Plan'),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      );
    }

    return child;
  }
}
