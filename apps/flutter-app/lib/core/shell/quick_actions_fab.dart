import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/riverpod_providers.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import 'navigation_config.dart';

/// Floating quick actions menu with animated expansion.
///
/// Tapping the main FAB expands to reveal action buttons for common tasks
/// (New Order, New Reservation, New Customer, New Expense). The main FAB icon
/// rotates to an X when expanded.
class QuickActionsFab extends ConsumerStatefulWidget {
  const QuickActionsFab({super.key});

  @override
  ConsumerState<QuickActionsFab> createState() => _QuickActionsFabState();
}

class _QuickActionsFabState extends ConsumerState<QuickActionsFab>
    with SingleTickerProviderStateMixin {
  late final AnimationController _expandController;
  late final Animation<double> _expandAnim;
  late final Animation<double> _rotateAnim;

  @override
  void initState() {
    super.initState();
    _expandController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
    _expandAnim = CurvedAnimation(
      parent: _expandController,
      curve: Curves.easeOutCubic,
    );
    _rotateAnim = Tween<double>(begin: 0, end: 0.75).animate(
      CurvedAnimation(parent: _expandController, curve: Curves.easeOutCubic),
    );
  }

  @override
  void dispose() {
    _expandController.dispose();
    super.dispose();
  }

  void _toggle() {
    final shell = ref.read(shellProvider.notifier);
    shell.toggleQuickActions();
    if (ref.read(shellProvider).state.isQuickActionsOpen) {
      _expandController.forward();
    } else {
      _expandController.reverse();
    }
  }

  void _onActionTap(String route) {
    _toggle();
    Navigator.of(context).pushNamed(route);
  }

  @override
  Widget build(BuildContext context) {
    final isOpen = ref.watch(
      shellProvider.select((s) => s.state.isQuickActionsOpen),
    );
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;

    // Use first 4 quick actions (skip AI Assistant for FAB)
    final actions = NavigationConfig.quickActions.take(4).toList();

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Action buttons
        AnimatedBuilder(
          animation: _expandAnim,
          builder: (context, child) {
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(actions.length, (i) {
                final action = actions[i];
                final delay = i * 0.12;
                final itemProgress =
                    ((_expandAnim.value - delay).clamp(0.0, 1.0)) / (1.0 - delay).clamp(0.01, 1.0);
                return Transform.translate(
                  offset: Offset(0, 24 * (1 - itemProgress.clamp(0.0, 1.0))),
                  child: Opacity(
                    opacity: itemProgress.clamp(0.0, 1.0),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: AppDimens.sm),
                      child: _ActionItem(
                        label: action.label,
                        icon: action.icon,
                        isDark: isDark,
                        onTap: () => _onActionTap(action.route),
                      ),
                    ),
                  ),
                );
              }),
            );
          },
        ),

        // Main FAB
        AnimatedBuilder(
          animation: _rotateAnim,
          builder: (context, child) {
            return FloatingActionButton(
              onPressed: _toggle,
              backgroundColor: isOpen
                  ? AppColors.danger
                  : AppColors.primary,
              elevation: 4,
              child: Transform.rotate(
                angle: _rotateAnim.value * 3.14159 * 2,
                child: Icon(
                  isOpen ? Icons.close_rounded : Icons.add_rounded,
                  color: AppColors.white,
                  size: AppDimens.iconLg,
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _ActionItem extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isDark;
  final VoidCallback onTap;

  const _ActionItem({
    required this.label,
    required this.icon,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Label chip
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppDimens.md,
              vertical: AppDimens.sm,
            ),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurfaceElevated : AppColors.white,
              borderRadius: BorderRadius.circular(AppDimens.radiusMd),
              border: Border.all(
                color: isDark ? AppColors.darkBorder : AppColors.gray200,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.black.withValues(alpha: 0.06),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: isDark
                    ? AppColors.darkTextPrimary
                    : AppColors.textPrimary,
              ),
            ),
          ),
          const SizedBox(width: AppDimens.sm),
          // Small FAB
          SizedBox(
            width: 40,
            height: 40,
            child: FloatingActionButton(
              onPressed: onTap,
              backgroundColor: AppColors.primary50,
              elevation: 2,
              mini: true,
              child: Icon(icon, size: AppDimens.iconMd, color: AppColors.primary),
            ),
          ),
        ],
      ),
    );
  }
}
