import 'package:flutter/material.dart';

/// NexaROS spacing & sizing tokens — 8-point grid.
class AppDimens {
  AppDimens._();

  // ── Spacing (8pt grid) ──
  static const double xxs = 2;
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double base = 16;
  static const double lg = 20;
  static const double xl = 24;
  static const double xxl = 32;
  static const double xxxl = 40;
  static const double xxxxl = 48;
  static const double xxxxxl = 64;

  // ── Border Radius ──
  static const double radiusXs = 4;
  static const double radiusSm = 6;
  static const double radiusMd = 8;
  static const double radiusLg = 12;
  static const double radiusXl = 16;
  static const double radiusXxl = 20;
  static const double radiusFull = 999;

  // ── Card ──
  static const double cardRadius = radiusLg;
  static const double cardPadding = base;
  static const double cardElevation = 0;

  // ── Button Heights ──
  static const double buttonHeightSm = 32;
  static const double buttonHeightMd = 40;
  static const double buttonHeightLg = 48;

  // ── Icon Sizes ──
  static const double iconXs = 14;
  static const double iconSm = 18;
  static const double iconMd = 22;
  static const double iconLg = 28;
  static const double iconXl = 32;
  static const double iconXxl = 48;

  // ── Sidebar ──
  static const double sidebarWidth = 240;
  static const double sidebarCollapsedWidth = 64;
  static const double railWidth = 80;

  // ── App Bar ──
  static const double appBarHeight = 56;
  static const double bottomNavHeight = 64;

  // ── Breakpoints (replicated for convenience) ──
  static const double mobileMax = 600;
  static const double tabletMax = 1024;
  static const double desktopMax = 1440;
  static const double largeDesktopMax = 1920;

  // ── Responsive Grid ──
  static int gridColumns(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    if (width < mobileMax) return 1;
    if (width < tabletMax) return 2;
    if (width < desktopMax) return 3;
    return 4;
  }

  static double responsivePadding(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    if (width < mobileMax) return sm;
    if (width < tabletMax) return base;
    return xl;
  }

  // ── Responsive Typography Scale ──
  static double responsiveTitle(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    if (width < mobileMax) return 18;
    if (width < tabletMax) return 20;
    return 24;
  }

  static double responsiveSubtitle(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    if (width < mobileMax) return 14;
    return 16;
  }
}
