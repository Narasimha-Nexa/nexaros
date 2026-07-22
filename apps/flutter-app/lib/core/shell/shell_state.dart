/// Shell UI state — sidebar collapse, panels, search, command palette.
library;

import 'package:flutter/foundation.dart';

@immutable
class ShellState {
  final bool isSidebarCollapsed;
  final bool isMobileOpen;
  final bool isRightPanelOpen;
  final String? rightPanelContent;
  final bool isSearchOpen;
  final bool isCommandPaletteOpen;
  final bool isQuickActionsOpen;
  final String? searchQuery;

  const ShellState({
    this.isSidebarCollapsed = false,
    this.isMobileOpen = false,
    this.isRightPanelOpen = false,
    this.rightPanelContent,
    this.isSearchOpen = false,
    this.isCommandPaletteOpen = false,
    this.isQuickActionsOpen = false,
    this.searchQuery,
  });

  ShellState copyWith({
    bool? isSidebarCollapsed,
    bool? isMobileOpen,
    bool? isRightPanelOpen,
    String? rightPanelContent,
    bool? isSearchOpen,
    bool? isCommandPaletteOpen,
    bool? isQuickActionsOpen,
    String? searchQuery,
  }) {
    return ShellState(
      isSidebarCollapsed: isSidebarCollapsed ?? this.isSidebarCollapsed,
      isMobileOpen: isMobileOpen ?? this.isMobileOpen,
      isRightPanelOpen: isRightPanelOpen ?? this.isRightPanelOpen,
      rightPanelContent: rightPanelContent ?? this.rightPanelContent,
      isSearchOpen: isSearchOpen ?? this.isSearchOpen,
      isCommandPaletteOpen: isCommandPaletteOpen ?? this.isCommandPaletteOpen,
      isQuickActionsOpen: isQuickActionsOpen ?? this.isQuickActionsOpen,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ShellState &&
          runtimeType == other.runtimeType &&
          isSidebarCollapsed == other.isSidebarCollapsed &&
          isMobileOpen == other.isMobileOpen &&
          isRightPanelOpen == other.isRightPanelOpen &&
          rightPanelContent == other.rightPanelContent &&
          isSearchOpen == other.isSearchOpen &&
          isCommandPaletteOpen == other.isCommandPaletteOpen &&
          isQuickActionsOpen == other.isQuickActionsOpen &&
          searchQuery == other.searchQuery;

  @override
  int get hashCode => Object.hash(
        isSidebarCollapsed,
        isMobileOpen,
        isRightPanelOpen,
        rightPanelContent,
        isSearchOpen,
        isCommandPaletteOpen,
        isQuickActionsOpen,
        searchQuery,
      );
}
