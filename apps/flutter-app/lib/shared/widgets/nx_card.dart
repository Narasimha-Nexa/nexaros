import 'package:flutter/material.dart';
import '../../core/theme/app_dimens.dart';
import '../../core/theme/app_shadows.dart';

/// NexaROS enterprise card — theme-aware, dark-mode-safe.
class NxCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? color;
  final Color? borderColor;
  final double? borderRadius;
  final VoidCallback? onTap;
  final bool elevated;

  const NxCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.color,
    this.borderColor,
    this.borderRadius,
    this.onTap,
    this.elevated = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final cardColor = color ?? cs.surface;
    final border = borderColor ?? cs.outline;
    final radius = borderRadius ?? AppDimens.cardRadius;

    final card = Container(
      margin: margin,
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: border),
        boxShadow: elevated ? AppShadows.sm : null,
      ),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: padding ?? const EdgeInsets.all(AppDimens.base),
        child: child,
      ),
    );

    if (onTap != null) {
      return InkWell(onTap: onTap, borderRadius: BorderRadius.circular(radius), child: card);
    }
    return card;
  }
}
