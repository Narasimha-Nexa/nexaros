import 'package:flutter/material.dart';

/// NexaROS Enterprise Color System
///
/// 8-point grid, semantic tokens mapped to Material ColorScheme.
/// All hardcoded color references in widgets should use these tokens.
class AppColors {
  AppColors._();

  // ── Brand / Primary (Red) ──
  static const primary = Color(0xFFE51A24);
  static const primaryDark = Color(0xFFB81119);
  static const primaryLight = Color(0xFFFFA1A5);
  static const primary50 = Color(0xFFFFEBEC);
  static const primary100 = Color(0xFFFFEBEC);
  static const primary200 = Color(0xFFFFA1A5);
  static const primary600 = Color(0xFFE51A24);
  static const primary700 = Color(0xFFB81119);

  // ── Secondary / Accent (Black) ──
  static const secondary = Color(0xFF111111);
  static const secondaryDark = Color(0xFF0B0B0B);
  static const secondaryLight = Color(0xFF4A4A4A);
  static const secondary50 = Color(0xFFF4F4F4);
  static const secondary100 = Color(0xFFF4F4F4);

  // ── Semantic: Success (Emerald) ──
  static const success = Color(0xFF10B981);
  static const successDark = Color(0xFF059669);
  static const success50 = Color(0xFFECFDF5);
  static const success100 = Color(0xFFD1FAE5);

  // ── Semantic: Warning (Yellow) ──
  static const warning = Color(0xFFF1B31C);
  static const warningDark = Color(0xFFC58F0C);
  static const warning50 = Color(0xFFFEF7E3);
  static const warning100 = Color(0xFFFEF7E3);

  // ── Semantic: Danger (Red) ──
  static const danger = Color(0xFFE51A24);
  static const dangerDark = Color(0xFFB81119);
  static const danger50 = Color(0xFFFFEBEC);
  static const danger100 = Color(0xFFFFEBEC);

  // ── Semantic: Info (Cyan) ──
  static const info = Color(0xFF06B6D4);
  static const infoDark = Color(0xFF0891B2);
  static const info50 = Color(0xFFECFEFF);
  static const info100 = Color(0xFFCFFAFE);

  // ── Neutral Scale (black/white palette) ──
  static const gray50 = Color(0xFFF4F4F4);
  static const gray100 = Color(0xFFF4F4F4);
  static const gray200 = Color(0xFFE2E2E2);
  static const gray300 = Color(0xFF8E8E8E);
  static const gray400 = Color(0xFF8E8E8E);
  static const gray500 = Color(0xFF4A4A4A);
  static const gray600 = Color(0xFF4A4A4A);
  static const gray700 = Color(0xFF222222);
  static const gray800 = Color(0xFF111111);
  static const gray900 = Color(0xFF0B0B0B);
  static const gray950 = Color(0xFF000000);

  // ── Aliases for semantic surface roles ──
  static const background = gray50;
  static const surface = white;
  static const border = gray200;
  static const textPrimary = gray800;
  static const textSecondary = gray500;
  static const textMuted = gray400;

  // ── White / Black convenience ──
  static const white = Color(0xFFFFFFFF);
  static const black = Color(0xFF000000);

  // ── Order Status Colors ──
  static const orderPending = Color(0xFFF1B31C);
  static const orderConfirmed = Color(0xFF3B82F6);
  static const orderPreparing = Color(0xFFF97316);
  static const orderReady = Color(0xFF10B981);
  static const orderServed = Color(0xFF06B6D4);
  static const orderCompleted = Color(0xFF4A4A4A);
  static const orderCancelled = Color(0xFFE51A24);

  // ── Table Status Colors ──
  static const tableFree = Color(0xFF10B981);
  static const tableOccupied = Color(0xFFF1B31C);
  static const tableReserved = Color(0xFF8B5CF6);
  static const tableCleaning = Color(0xFF8E8E8E);
  static const tableReady = Color(0xFF06B6D4);
  static const tableBilling = Color(0xFF3B82F6);

  // ── Dark mode surface palette ──
  static const darkBackground = Color(0xFF0B0B0B);
  static const darkSurface = Color(0xFF111111);
  static const darkSurfaceElevated = Color(0xFF222222);
  static const darkBorder = Color(0xFF222222);
  static const darkTextPrimary = Color(0xFFF4F4F4);
  static const darkTextSecondary = Color(0xFF8E8E8E);

  /// Helper: resolve a color based on brightness
  static Color forBrightness(Brightness brightness, {
    required Color light,
    required Color dark,
  }) {
    return brightness == Brightness.light ? light : dark;
  }

  /// Map order status string to color
  static Color orderStatusColor(String status) {
    switch (status) {
      case 'PENDING': return orderPending;
      case 'CONFIRMED': return orderConfirmed;
      case 'PREPARING': return orderPreparing;
      case 'READY': return orderReady;
      case 'SERVED': return orderServed;
      case 'COMPLETED': return orderCompleted;
      case 'CANCELLED': return orderCancelled;
      default: return gray400;
    }
  }

  /// Map table status string to color
  static Color tableStatusColor(String status) {
    switch (status) {
      case 'FREE': return tableFree;
      case 'OCCUPIED': return tableOccupied;
      case 'RESERVED': return tableReserved;
      case 'CLEANING': return tableCleaning;
      case 'READY': return tableReady;
      case 'BILLING': return tableBilling;
      default: return gray400;
    }
  }
}
