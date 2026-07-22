/// Enterprise adaptive sidebar — collapsible, grouped, searchable, role-based.
library;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import 'navigation_config.dart';

class EnterpriseSidebar extends StatefulWidget {
  final bool isCollapsed;
  final VoidCallback onToggleCollapse;
  final String currentRoute;
  final List<String> favoriteIds;
  final List<String> recentRoutes;
  final String? searchQuery;
  final ValueChanged<String>? onSearchChanged;
  final VoidCallback? onClearSearch;

  const EnterpriseSidebar({
    super.key,
    this.isCollapsed = false,
    required this.onToggleCollapse,
    required this.currentRoute,
    this.favoriteIds = const [],
    this.recentRoutes = const [],
    this.searchQuery,
    this.onSearchChanged,
    this.onClearSearch,
  });

  @override
  State<EnterpriseSidebar> createState() => _EnterpriseSidebarState();
}

class _EnterpriseSidebarState extends State<EnterpriseSidebar> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final width = widget.isCollapsed
        ? AppDimens.sidebarCollapsedWidth
        : AppDimens.sidebarWidth;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeInOut,
      width: width,
      decoration: BoxDecoration(
        color: isDark ? cs.surface : cs.surface,
        border: Border(
          right: BorderSide(color: cs.outline.withValues(alpha: 0.3)),
        ),
      ),
      child: Column(
        children: [
          _buildHeader(context, cs),
          if (!widget.isCollapsed) _buildSearchBar(context, cs),
          const SizedBox(height: 4),
          Expanded(child: _buildNavList(context, cs)),
          _buildFooter(context, cs),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, ColorScheme cs) {
    return Container(
      padding: EdgeInsets.all(widget.isCollapsed ? 12 : AppDimens.lg),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: cs.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.restaurant_rounded,
              color: cs.primary,
              size: 18,
            ),
          ),
          if (!widget.isCollapsed) ...[
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'NexaROS',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: cs.onSurface,
                  letterSpacing: -0.3,
                ),
              ),
            ),
          ],
          IconButton(
            icon: Icon(
              widget.isCollapsed ? Icons.chevron_right : Icons.chevron_left,
              size: 18,
              color: AppColors.gray500,
            ),
            onPressed: widget.onToggleCollapse,
            tooltip: widget.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar',
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context, ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: TextField(
        controller: _searchController,
        onChanged: widget.onSearchChanged,
        decoration: InputDecoration(
          hintText: 'Search navigation...',
          hintStyle: TextStyle(fontSize: 12, color: AppColors.gray400),
          prefixIcon:
              Icon(Icons.search, size: 16, color: AppColors.gray400),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: Icon(Icons.clear, size: 14, color: AppColors.gray400),
                  onPressed: () {
                    _searchController.clear();
                    widget.onClearSearch?.call();
                  },
                )
              : null,
          isDense: true,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: cs.outline.withValues(alpha: 0.3)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: cs.outline.withValues(alpha: 0.3)),
          ),
          filled: true,
          fillColor: cs.surfaceContainerHighest.withValues(alpha: 0.3),
        ),
        style: const TextStyle(fontSize: 12),
      ),
    );
  }

  Widget _buildNavList(BuildContext context, ColorScheme cs) {
    final query = widget.searchQuery ?? _searchController.text;
    final items = NavigationConfig.sidebarItems;
    final filteredItems = query.isEmpty
        ? items
        : items
            .where((i) =>
                i.label.toLowerCase().contains(query.toLowerCase()))
            .toList();

    final favoriteItems = filteredItems
        .where((i) => widget.favoriteIds.contains(i.id))
        .toList();
    final recentItems = filteredItems
        .where((i) => widget.recentRoutes.contains(i.route))
        .take(3)
        .toList();
    final mainItems = filteredItems
        .where((i) => !widget.favoriteIds.contains(i.id))
        .toList();

    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      children: [
        if (favoriteItems.isNotEmpty && query.isEmpty) ...[
          _buildSectionHeader(context, 'Favorites', cs),
          ...favoriteItems.map((item) => _buildNavItem(context, item, cs)),
          const SizedBox(height: 8),
        ],
        if (recentItems.isNotEmpty && query.isEmpty) ...[
          _buildSectionHeader(context, 'Recent', cs),
          ...recentItems.map((item) => _buildNavItem(context, item, cs)),
          const SizedBox(height: 8),
        ],
        _buildSectionHeader(context, 'Navigation', cs),
        ...mainItems.map((item) => _buildNavItem(context, item, cs)),
      ],
    );
  }

  Widget _buildSectionHeader(
      BuildContext context, String title, ColorScheme cs) {
    if (widget.isCollapsed) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: AppColors.gray400,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, NavItem item, ColorScheme cs) {
    final isActive = widget.currentRoute.startsWith(item.route);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Tooltip(
      message: widget.isCollapsed ? item.label : '',
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 1),
        decoration: BoxDecoration(
          color: isActive
              ? cs.primary.withValues(alpha: isDark ? 0.15 : 0.08)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          child: InkWell(
            borderRadius: BorderRadius.circular(8),
            onTap: () => context.go(item.route),
            child: Padding(
              padding: EdgeInsets.symmetric(
                horizontal: widget.isCollapsed ? 0 : 12,
                vertical: widget.isCollapsed ? 10 : 8,
              ),
              child: Row(
                mainAxisAlignment: widget.isCollapsed
                    ? MainAxisAlignment.center
                    : MainAxisAlignment.start,
                children: [
                  Icon(
                    isActive ? (item.activeIcon ?? item.icon) : item.icon,
                    color: isActive ? cs.primary : AppColors.gray500,
                    size: 20,
                  ),
                  if (!widget.isCollapsed) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        item.label,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight:
                              isActive ? FontWeight.w600 : FontWeight.w400,
                          color: isActive ? cs.primary : AppColors.gray600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (item.badge != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.danger,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          item.badge!,
                          style: const TextStyle(
                            fontSize: 10,
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    if (widget.favoriteIds.contains(item.id))
                      Icon(Icons.star,
                          size: 12, color: AppColors.warning),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFooter(BuildContext context, ColorScheme cs) {
    return Container(
      padding: EdgeInsets.all(widget.isCollapsed ? 8 : 12),
      decoration: BoxDecoration(
        border:
            Border(top: BorderSide(color: cs.outline.withValues(alpha: 0.3))),
      ),
      child: Column(
        children: [
          _buildFooterLink(context, Icons.notifications_outlined,
              'Notifications', '/shell/notifications'),
          _buildFooterLink(
              context, Icons.person_outline, 'Profile', '/shell/profile'),
          _buildFooterLink(
              context, Icons.settings_outlined, 'Settings', '/shell/settings'),
        ],
      ),
    );
  }

  Widget _buildFooterLink(
      BuildContext context, IconData icon, String label, String route) {
    final isActive = widget.currentRoute.startsWith(route);
    final cs = Theme.of(context).colorScheme;
    return ListTile(
      leading: Icon(icon,
          color: isActive ? cs.primary : AppColors.gray500, size: 20),
      title: widget.isCollapsed
          ? null
          : Text(
              label,
              style: TextStyle(
                  fontSize: 13,
                  color: isActive ? cs.primary : AppColors.gray600),
            ),
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 8),
      onTap: () => context.go(route),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    );
  }
}
