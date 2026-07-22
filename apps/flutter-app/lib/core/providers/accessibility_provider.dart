import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Accessibility settings for the entire app.
/// Manages font scale, high contrast, reduce motion, and screen reader mode.
class AccessibilityProvider extends ChangeNotifier {
  double _fontScale = 1.0;
  bool _highContrast = false;
  bool _reduceMotion = false;
  bool _screenReaderMode = false;
  bool _boldText = false;
  bool _largeTouchTargets = false;

  static const _fontScaleKey = 'accessibility_font_scale';
  static const _highContrastKey = 'accessibility_high_contrast';
  static const _reduceMotionKey = 'accessibility_reduce_motion';
  static const _screenReaderKey = 'accessibility_screen_reader';
  static const _boldTextKey = 'accessibility_bold_text';
  static const _largeTouchKey = 'accessibility_large_touch';

  double get fontScale => _fontScale;
  bool get highContrast => _highContrast;
  bool get reduceMotion => _reduceMotion;
  bool get screenReaderMode => _screenReaderMode;
  bool get boldText => _boldText;
  bool get largeTouchTargets => _largeTouchTargets;

  /// Effective text scale factor combining font scale and bold text.
  double get effectiveTextScale => _fontScale;

  /// Duration multiplier for animations. Returns 0 when reduce motion is on.
  Duration animDuration(Duration base) {
    if (_reduceMotion) return Duration.zero;
    return base;
  }

  /// Scale factor for animation durations. 0.0 when reduce motion, 1.0 otherwise.
  double get animationScale => _reduceMotion ? 0.0 : 1.0;

  AccessibilityProvider() {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    _fontScale = prefs.getDouble(_fontScaleKey) ?? 1.0;
    _highContrast = prefs.getBool(_highContrastKey) ?? false;
    _reduceMotion = prefs.getBool(_reduceMotionKey) ?? false;
    _screenReaderMode = prefs.getBool(_screenReaderKey) ?? false;
    _boldText = prefs.getBool(_boldTextKey) ?? false;
    _largeTouchTargets = prefs.getBool(_largeTouchKey) ?? false;
    notifyListeners();
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble(_fontScaleKey, _fontScale);
    await prefs.setBool(_highContrastKey, _highContrast);
    await prefs.setBool(_reduceMotionKey, _reduceMotion);
    await prefs.setBool(_screenReaderKey, _screenReaderMode);
    await prefs.setBool(_boldTextKey, _boldText);
    await prefs.setBool(_largeTouchKey, _largeTouchTargets);
  }

  Future<void> setFontScale(double scale) async {
    _fontScale = scale.clamp(0.8, 2.0);
    notifyListeners();
    await _save();
  }

  Future<void> setHighContrast(bool value) async {
    _highContrast = value;
    notifyListeners();
    await _save();
  }

  Future<void> setReduceMotion(bool value) async {
    _reduceMotion = value;
    notifyListeners();
    await _save();
  }

  Future<void> setScreenReaderMode(bool value) async {
    _screenReaderMode = value;
    notifyListeners();
    await _save();
  }

  Future<void> setBoldText(bool value) async {
    _boldText = value;
    notifyListeners();
    await _save();
  }

  Future<void> setLargeTouchTargets(bool value) async {
    _largeTouchTargets = value;
    notifyListeners();
    await _save();
  }

  /// Apply all accessibility settings to a MediaQueryData.
  MediaQueryData applyTo(MediaQueryData data) {
    return data.copyWith(
      textScaler: TextScaler.linear(_fontScale),
      boldText: _boldText || data.boldText,
      accessibleNavigation: _screenReaderMode || data.accessibleNavigation,
      disableAnimations: _reduceMotion || data.disableAnimations,
    );
  }

  /// Whether the current user has any accessibility settings enabled.
  bool get hasActiveAccessibility =>
      _fontScale != 1.0 ||
      _highContrast ||
      _reduceMotion ||
      _screenReaderMode ||
      _boldText ||
      _largeTouchTargets;

  /// Wrap a widget with Semantics for screen reader support.
  Widget wrapWithSemantics(Widget child, {String? label, String? hint, bool isButton = false, bool isHeader = false}) {
    return Semantics(
      label: label,
      hint: hint,
      button: isButton,
      header: isHeader,
      child: child,
    );
  }
}
