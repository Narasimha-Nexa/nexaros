import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

export 'app_colors.dart';
export 'app_dimens.dart';
export 'app_text_styles.dart';
export 'app_shadows.dart';

/// NexaROS Theme — light & dark.
///
/// All widgets should consume colors from [AppColors] and
/// the resolved [ColorScheme], not hardcoded hex values.
class AppTheme {
  AppTheme._();

  // ── Light ──
  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.light,
      primary: AppColors.primary,
      onPrimary: AppColors.white,
      secondary: AppColors.secondary,
      onSecondary: AppColors.white,
      surface: AppColors.white,
      onSurface: AppColors.gray900,
      error: AppColors.danger,
      onError: AppColors.white,
      outline: AppColors.gray200,
      outlineVariant: AppColors.gray100,
    );

    return _buildTheme(colorScheme, Brightness.light);
  }

  // ── Dark ──
  static ThemeData get darkTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.dark,
      primary: AppColors.primaryLight,
      onPrimary: AppColors.white,
      secondary: AppColors.secondaryLight,
      onSecondary: AppColors.white,
      surface: AppColors.darkSurface,
      onSurface: AppColors.darkTextPrimary,
      error: AppColors.danger,
      onError: AppColors.white,
      outline: AppColors.darkBorder,
      outlineVariant: AppColors.darkSurfaceElevated,
    );

    return _buildTheme(colorScheme, Brightness.dark);
  }

  static ThemeData _buildTheme(ColorScheme colorScheme, Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final textTheme = GoogleFonts.interTextTheme(
      isDark ? ThemeData.dark().textTheme : ThemeData.light().textTheme,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      textTheme: textTheme,
      scaffoldBackgroundColor: isDark ? AppColors.darkBackground : AppColors.gray50,

      // ── AppBar ──
      appBarTheme: AppBarTheme(
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 1,
        shadowColor: isDark ? Colors.black26 : AppColors.gray200,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: colorScheme.onSurface,
        ),
      ),

      // ── Card ──
      cardTheme: CardThemeData(
        color: colorScheme.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: colorScheme.outline),
        ),
        margin: EdgeInsets.zero,
      ),

      // ── Input ──
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: colorScheme.outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: colorScheme.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: colorScheme.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: colorScheme.error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        hintStyle: GoogleFonts.inter(color: AppColors.gray400, fontSize: 14),
      ),

      // ── Elevated Button ──
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          minimumSize: const Size(0, 40),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          elevation: 0,
          textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),

      // ── Outlined Button ──
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colorScheme.onSurface,
          minimumSize: const Size(0, 40),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          side: BorderSide(color: colorScheme.outline),
          textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),

      // ── Text Button ──
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: colorScheme.primary,
          textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),

      // ── Divider ──
      dividerTheme: DividerThemeData(
        color: colorScheme.outline,
        thickness: 1,
        space: 1,
      ),

      // ── Chip ──
      chipTheme: ChipThemeData(
        backgroundColor: colorScheme.surface,
        selectedColor: colorScheme.primary.withValues(alpha: 0.1),
        side: BorderSide(color: colorScheme.outline),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        labelStyle: GoogleFonts.inter(fontSize: 12),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
      ),

      // ── NavigationBar (mobile) ──
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: colorScheme.surface,
        indicatorColor: colorScheme.primary.withValues(alpha: 0.1),
        elevation: 2,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final isSelected = states.contains(WidgetState.selected);
          return GoogleFonts.inter(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            color: isSelected ? colorScheme.primary : AppColors.gray500,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final isSelected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: isSelected ? colorScheme.primary : AppColors.gray500,
            size: 22,
          );
        }),
      ),

      // ── NavigationRail (tablet) ──
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: colorScheme.surface,
        indicatorColor: colorScheme.primary.withValues(alpha: 0.1),
        selectedIconTheme: IconThemeData(color: colorScheme.primary, size: 22),
        unselectedIconTheme: IconThemeData(color: AppColors.gray500, size: 22),
        selectedLabelTextStyle: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: colorScheme.primary,
        ),
        unselectedLabelTextStyle: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: AppColors.gray500,
        ),
      ),

      // ── SnackBar ──
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        contentTextStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.white),
      ),

      // ── Dialog ──
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        backgroundColor: colorScheme.surface,
      ),

      // ── Bottom Sheet ──
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colorScheme.surface,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
      ),

      // ── Table ──
      dataTableTheme: DataTableThemeData(
        headingTextStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.gray500,
          letterSpacing: 0.3,
        ),
        dataTextStyle: GoogleFonts.inter(
          fontSize: 13,
          color: colorScheme.onSurface,
        ),
        headingRowColor: WidgetStateProperty.all(
          isDark ? AppColors.darkSurfaceElevated : AppColors.gray50,
        ),
        dividerThickness: 1,
      ),

      // ── Floating Action Button ──
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        elevation: 3,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
