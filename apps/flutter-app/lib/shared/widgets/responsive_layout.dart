import 'package:flutter/material.dart';
import '../../core/theme/app_dimens.dart';

/// Responsive layout builder that switches between mobile/tablet/desktop.
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;
  final double mobileMax;
  final double tabletMax;

  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
    this.mobileMax = AppDimens.mobileMax,
    this.tabletMax = AppDimens.tabletMax,
  });

  static bool isMobile(BuildContext context) =>
      MediaQuery.sizeOf(context).width < AppDimens.mobileMax;

  static bool isTablet(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    return w >= AppDimens.mobileMax && w < AppDimens.tabletMax;
  }

  static bool isDesktop(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= AppDimens.tabletMax;

  static DeviceType deviceType(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w >= AppDimens.tabletMax) return DeviceType.desktop;
    if (w >= AppDimens.mobileMax) return DeviceType.tablet;
    return DeviceType.mobile;
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= tabletMax) {
          return desktop ?? tablet ?? mobile;
        } else if (constraints.maxWidth >= mobileMax) {
          return tablet ?? mobile;
        }
        return mobile;
      },
    );
  }
}

enum DeviceType { mobile, tablet, desktop }

/// Responsive grid that adjusts columns based on screen width.
class ResponsiveGrid extends StatelessWidget {
  final List<Widget> children;
  final double spacing;
  final double runSpacing;
  final double mobileItemWidth;
  final double tabletItemWidth;
  final double desktopItemWidth;
  final EdgeInsetsGeometry? padding;

  const ResponsiveGrid({
    super.key,
    required this.children,
    this.spacing = AppDimens.sm,
    this.runSpacing = AppDimens.sm,
    this.mobileItemWidth = 160,
    this.tabletItemWidth = 200,
    this.desktopItemWidth = 240,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth = constraints.maxWidth >= AppDimens.tabletMax
            ? desktopItemWidth
            : constraints.maxWidth >= AppDimens.mobileMax
                ? tabletItemWidth
                : mobileItemWidth;
        final columns = (constraints.maxWidth / (itemWidth + spacing)).floor().clamp(1, 6);
        return GridView.count(
          crossAxisCount: columns,
          crossAxisSpacing: spacing,
          mainAxisSpacing: runSpacing,
          padding: padding,
          childAspectRatio: 1.0,
          children: children,
        );
      },
    );
  }
}
