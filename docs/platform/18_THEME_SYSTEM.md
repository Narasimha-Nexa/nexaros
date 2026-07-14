# Theme System

## Overview

NexaROS uses Material 3 with custom theming for consistent look across platforms.

## Light Theme

```dart
final lightTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    brightness: Brightness.light,
  ),
  scaffoldBackgroundColor: AppColors.background,
  appBarTheme: AppBarTheme(
    backgroundColor: AppColors.surface,
    foregroundColor: AppColors.text,
    elevation: 0,
  ),
  cardTheme: CardTheme(
    color: AppColors.surface,
    elevation: 1,
    shape: RoundedRectangleBorder(
      borderRadius: AppRadius.md,
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.md,
      ),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    border: OutlineInputBorder(
      borderRadius: AppRadius.md,
    ),
    contentPadding: EdgeInsets.all(AppSpacing.md),
  ),
);
```

## Dark Theme

```dart
final darkTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    brightness: Brightness.dark,
  ),
  scaffoldBackgroundColor: Color(0xFF111827),
  appBarTheme: AppBarTheme(
    backgroundColor: Color(0xFF1F2937),
    foregroundColor: Colors.white,
    elevation: 0,
  ),
  cardTheme: CardTheme(
    color: Color(0xFF1F2937),
    elevation: 1,
    shape: RoundedRectangleBorder(
      borderRadius: AppRadius.md,
    ),
  ),
);
```

## Theme Provider

```dart
class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.light;
  
  ThemeMode get themeMode => _themeMode;
  
  void toggleTheme() {
    _themeMode = _themeMode == ThemeMode.light
        ? ThemeMode.dark
        : ThemeMode.light;
    notifyListeners();
  }
  
  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
  }
}
```

## Usage

```dart
// In MaterialApp
MaterialApp(
  theme: lightTheme,
  darkTheme: darkTheme,
  themeMode: themeProvider.themeMode,
);

// Toggle theme
ElevatedButton(
  onPressed: () => themeProvider.toggleTheme(),
  child: Icon(
    themeProvider.themeMode == ThemeMode.light
        ? Icons.dark_mode
        : Icons.light_mode,
  ),
);
```

## Related Documents

- [Design System](16_DESIGN_SYSTEM.md)
- [Component Library](17_COMPONENT_LIBRARY.md)
