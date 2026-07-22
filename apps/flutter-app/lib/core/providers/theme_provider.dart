import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Persists the user's theme mode preference (system / light / dark).
class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;
  static const _key = 'theme_mode';

  ThemeMode get themeMode => _themeMode;

  ThemeProvider() {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getString(_key);
    if (value != null) {
      _themeMode = ThemeMode.values.firstWhere(
        (e) => e.name == value,
        orElse: () => ThemeMode.system,
      );
      notifyListeners();
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, mode.name);
  }

  void toggle(Brightness brightness) {
    if (_themeMode == ThemeMode.system) {
      // If system, switch to explicit opposite of current system brightness
      setThemeMode(brightness == Brightness.light ? ThemeMode.dark : ThemeMode.light);
    } else {
      setThemeMode(_themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light);
    }
  }
}
