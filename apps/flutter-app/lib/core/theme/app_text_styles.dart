import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// NexaROS text style tokens using Google Fonts (Inter).
class AppTextStyles {
  AppTextStyles._();

  // ── Display / Headings ──
  static TextStyle displayLarge = GoogleFonts.inter(
    fontSize: 32,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.5,
  );

  static TextStyle displayMedium = GoogleFonts.inter(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.3,
  );

  static TextStyle h1 = GoogleFonts.inter(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.2,
  );

  static TextStyle h2 = GoogleFonts.inter(
    fontSize: 20,
    fontWeight: FontWeight.w700,
  );

  static TextStyle h3 = GoogleFonts.inter(
    fontSize: 18,
    fontWeight: FontWeight.w600,
  );

  static TextStyle h4 = GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w600,
  );

  // ── Body ──
  static TextStyle bodyLarge = GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w400,
  );

  static TextStyle bodyMedium = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w400,
  );

  static TextStyle bodySmall = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w400,
  );

  // ── Labels / Captions ──
  static TextStyle labelLarge = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w600,
  );

  static TextStyle labelMedium = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w600,
  );

  static TextStyle labelSmall = GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.3,
  );

  // ── Stat / Value Display ──
  static TextStyle statValue = GoogleFonts.inter(
    fontSize: 22,
    fontWeight: FontWeight.w700,
  );

  static TextStyle statLabel = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w500,
  );

  // ── Table Cell ──
  static TextStyle tableHeader = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.3,
  );

  static TextStyle tableCell = GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w400,
  );

  // ── Button ──
  static TextStyle buttonLarge = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w600,
  );

  static TextStyle buttonMedium = GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w600,
  );

  static TextStyle buttonSmall = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w600,
  );

  // ── With color variants ──
  static TextStyle primary([double size = 14]) => GoogleFonts.inter(
    fontSize: size,
    fontWeight: FontWeight.w600,
    color: AppColors.primary,
  );

  static TextStyle success([double size = 14]) => GoogleFonts.inter(
    fontSize: size,
    fontWeight: FontWeight.w600,
    color: AppColors.success,
  );

  static TextStyle danger([double size = 14]) => GoogleFonts.inter(
    fontSize: size,
    fontWeight: FontWeight.w600,
    color: AppColors.danger,
  );

  static TextStyle muted([double size = 12]) => GoogleFonts.inter(
    fontSize: size,
    fontWeight: FontWeight.w400,
    color: AppColors.gray400,
  );
}
