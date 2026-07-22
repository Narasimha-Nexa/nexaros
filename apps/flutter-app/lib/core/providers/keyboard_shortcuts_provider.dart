import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// A registered keyboard shortcut.
class KeyboardShortcut {
  final String id;
  final String label;
  final String description;
  final LogicalKeyboardKey key;
  final bool ctrl;
  final bool alt;
  final bool shift;
  final String? route;
  final VoidCallback? action;
  final String category;

  const KeyboardShortcut({
    required this.id,
    required this.label,
    required this.description,
    required this.key,
    this.ctrl = false,
    this.alt = false,
    this.shift = false,
    this.route,
    this.action,
    this.category = 'General',
  });

  /// Display string like "Ctrl+K" or "Alt+1".
  String get display {
    final parts = <String>[];
    if (ctrl) parts.add('Ctrl');
    if (alt) parts.add('Alt');
    if (shift) parts.add('Shift');
    parts.add(_keyLabel);
    return parts.join('+');
  }

  String get _keyLabel {
    if (key == LogicalKeyboardKey.keyK) return 'K';
    if (key == LogicalKeyboardKey.keyN) return 'N';
    if (key == LogicalKeyboardKey.keyS) return 'S';
    if (key == LogicalKeyboardKey.keyP) return 'P';
    if (key == LogicalKeyboardKey.keyI) return 'I';
    if (key == LogicalKeyboardKey.keyO) return 'O';
    if (key == LogicalKeyboardKey.keyF) return 'F';
    if (key == LogicalKeyboardKey.keyH) return 'H';
    if (key == LogicalKeyboardKey.keyL) return 'L';
    if (key == LogicalKeyboardKey.keyM) return 'M';
    if (key == LogicalKeyboardKey.keyR) return 'R';
    if (key == LogicalKeyboardKey.keyT) return 'T';
    if (key == LogicalKeyboardKey.digit1) return '1';
    if (key == LogicalKeyboardKey.digit2) return '2';
    if (key == LogicalKeyboardKey.digit3) return '3';
    if (key == LogicalKeyboardKey.digit4) return '4';
    if (key == LogicalKeyboardKey.digit5) return '5';
    if (key == LogicalKeyboardKey.digit6) return '6';
    if (key == LogicalKeyboardKey.digit7) return '7';
    if (key == LogicalKeyboardKey.digit8) return '8';
    if (key == LogicalKeyboardKey.digit9) return '9';
    if (key == LogicalKeyboardKey.escape) return 'Esc';
    if (key == LogicalKeyboardKey.slash) return '/';
    if (key == LogicalKeyboardKey.period) return '.';
    return key.keyLabel.toUpperCase();
  }

  bool matches(LogicalKeyboardKey pressedKey, {required bool ctrl, required bool alt, required bool shift}) {
    return key == pressedKey && this.ctrl == ctrl && this.alt == alt && this.shift == shift;
  }
}

/// Central registry for all keyboard shortcuts.
class KeyboardShortcutsRegistry extends ChangeNotifier {
  final List<KeyboardShortcut> _shortcuts = [];
  bool _showHelp = false;

  List<KeyboardShortcut> get shortcuts => List.unmodifiable(_shortcuts);
  bool get showHelp => _showHelp;
  Map<String, List<KeyboardShortcut>> get grouped => _grouped;

  Map<String, List<KeyboardShortcut>> get _grouped {
    final map = <String, List<KeyboardShortcut>>{};
    for (final s in _shortcuts) {
      map.putIfAbsent(s.category, () => []).add(s);
    }
    return map;
  }

  KeyboardShortcutsRegistry() {
    _registerDefaults();
  }

  void _registerDefaults() {
    // Navigation
    register(KeyboardShortcut(id: 'cmd_palette', label: 'Command Palette', description: 'Open command palette for quick navigation', key: LogicalKeyboardKey.keyK, ctrl: true, category: 'Navigation'));
    register(KeyboardShortcut(id: 'nav_1', label: 'Dashboard', description: 'Go to Dashboard', key: LogicalKeyboardKey.digit1, alt: true, route: '/shell/dashboard', category: 'Navigation'));
    register(KeyboardShortcut(id: 'nav_2', label: 'Orders', description: 'Go to Orders', key: LogicalKeyboardKey.digit2, alt: true, route: '/shell/orders', category: 'Navigation'));
    register(KeyboardShortcut(id: 'nav_3', label: 'POS', description: 'Go to POS', key: LogicalKeyboardKey.digit3, alt: true, route: '/shell/pos', category: 'Navigation'));
    register(KeyboardShortcut(id: 'nav_4', label: 'Kitchen', description: 'Go to Kitchen', key: LogicalKeyboardKey.digit4, alt: true, route: '/shell/kitchen', category: 'Navigation'));
    register(KeyboardShortcut(id: 'nav_5', label: 'Inventory', description: 'Go to Inventory', key: LogicalKeyboardKey.digit5, alt: true, route: '/shell/inventory', category: 'Navigation'));
    register(KeyboardShortcut(id: 'nav_6', label: 'Staff', description: 'Go to Staff', key: LogicalKeyboardKey.digit6, alt: true, route: '/shell/staff', category: 'Navigation'));
    register(KeyboardShortcut(id: 'nav_7', label: 'Finance', description: 'Go to Finance', key: LogicalKeyboardKey.digit7, alt: true, route: '/shell/finance', category: 'Navigation'));
    register(KeyboardShortcut(id: 'nav_8', label: 'Analytics', description: 'Go to Analytics', key: LogicalKeyboardKey.digit8, alt: true, route: '/shell/analytics', category: 'Navigation'));
    register(KeyboardShortcut(id: 'nav_9', label: 'Settings', description: 'Go to Settings', key: LogicalKeyboardKey.digit9, alt: true, route: '/shell/settings', category: 'Navigation'));

    // Actions
    register(KeyboardShortcut(id: 'new_order', label: 'New Order', description: 'Create a new order', key: LogicalKeyboardKey.keyN, ctrl: true, route: '/shell/orders', category: 'Actions'));
    register(KeyboardShortcut(id: 'new_customer', label: 'New Customer', description: 'Add a new customer', key: LogicalKeyboardKey.keyN, ctrl: true, shift: true, category: 'Actions'));
    register(KeyboardShortcut(id: 'ai_chat', label: 'AI Assistant', description: 'Open AI chat assistant', key: LogicalKeyboardKey.keyI, ctrl: true, route: '/shell/ai-chat', category: 'Actions'));
    register(KeyboardShortcut(id: 'global_search', label: 'Search', description: 'Open global search', key: LogicalKeyboardKey.keyK, ctrl: true, category: 'Navigation'));

    // Help
    register(KeyboardShortcut(id: 'help', label: 'Keyboard Shortcuts', description: 'Show keyboard shortcuts', key: LogicalKeyboardKey.slash, ctrl: true, shift: true, category: 'Help'));
    register(KeyboardShortcut(id: 'escape', label: 'Close Panel', description: 'Close any open panel or overlay', key: LogicalKeyboardKey.escape, category: 'Help'));
  }

  void register(KeyboardShortcut shortcut) {
    _shortcuts.add(shortcut);
    notifyListeners();
  }

  void unregister(String id) {
    _shortcuts.removeWhere((s) => s.id == id);
    notifyListeners();
  }

  void toggleHelp() {
    _showHelp = !_showHelp;
    notifyListeners();
  }

  void openHelp() {
    _showHelp = true;
    notifyListeners();
  }

  void closeHelp() {
    _showHelp = false;
    notifyListeners();
  }

  /// Find a matching shortcut for the given key combination.
  KeyboardShortcut? findMatch(LogicalKeyboardKey key, {required bool ctrl, required bool alt, required bool shift}) {
    try {
      return _shortcuts.firstWhere((s) => s.matches(key, ctrl: ctrl, alt: alt, shift: shift));
    } catch (_) {
      return null;
    }
  }
}
