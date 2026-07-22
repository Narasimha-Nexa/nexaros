/// Shell state management via Riverpod.
library;

import 'package:flutter/foundation.dart';
import 'shell_state.dart';

/// Manages all shell UI state.
class ShellProvider extends ChangeNotifier {
  ShellState _state = const ShellState();
  final List<String> _favoriteIds = [];
  final List<String> _recentRoutes = [];
  final int _maxRecent = 10;

  ShellState get state => _state;
  List<String> get favoriteIds => List.unmodifiable(_favoriteIds);
  List<String> get recentRoutes => List.unmodifiable(_recentRoutes);

  /// Toggle sidebar collapsed state.
  void toggleSidebar() {
    _state = _state.copyWith(isSidebarCollapsed: !_state.isSidebarCollapsed);
    notifyListeners();
  }

  /// Set sidebar collapsed state.
  void setSidebarCollapsed(bool collapsed) {
    _state = _state.copyWith(isSidebarCollapsed: collapsed);
    notifyListeners();
  }

  /// Toggle right panel.
  void toggleRightPanel({String? content}) {
    if (_state.isRightPanelOpen && _state.rightPanelContent == content) {
      _state = _state.copyWith(isRightPanelOpen: false, rightPanelContent: null);
    } else {
      _state = _state.copyWith(isRightPanelOpen: true, rightPanelContent: content);
    }
    notifyListeners();
  }

  /// Close right panel.
  void closeRightPanel() {
    _state = _state.copyWith(isRightPanelOpen: false, rightPanelContent: null);
    notifyListeners();
  }

  /// Toggle search overlay.
  void toggleSearch() {
    _state = _state.copyWith(isSearchOpen: !_state.isSearchOpen);
    notifyListeners();
  }

  /// Open search.
  void openSearch() {
    _state = _state.copyWith(isSearchOpen: true);
    notifyListeners();
  }

  /// Close search.
  void closeSearch() {
    _state = _state.copyWith(isSearchOpen: false);
    notifyListeners();
  }

  /// Toggle command palette.
  void toggleCommandPalette() {
    _state = _state.copyWith(isCommandPaletteOpen: !_state.isCommandPaletteOpen);
    notifyListeners();
  }

  /// Toggle quick actions FAB.
  void toggleQuickActions() {
    _state = _state.copyWith(isQuickActionsOpen: !_state.isQuickActionsOpen);
    notifyListeners();
  }

  /// Add a route to recent history.
  void addRecentRoute(String route) {
    _recentRoutes.remove(route);
    _recentRoutes.insert(0, route);
    if (_recentRoutes.length > _maxRecent) {
      _recentRoutes.removeRange(_maxRecent, _recentRoutes.length);
    }
    notifyListeners();
  }

  /// Toggle a navigation item as favorite.
  void toggleFavorite(String itemId) {
    if (_favoriteIds.contains(itemId)) {
      _favoriteIds.remove(itemId);
    } else {
      _favoriteIds.add(itemId);
    }
    notifyListeners();
  }

  /// Check if an item is favorited.
  bool isFavorite(String itemId) => _favoriteIds.contains(itemId);
}
