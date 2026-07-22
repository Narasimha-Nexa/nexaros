/// Enterprise top app bar with breadcrumbs, search, actions, status indicators.
library;

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import '../widgets/branch_switcher.dart';
import 'navigation_config.dart';

class EnterpriseAppBar extends StatelessWidget
    implements PreferredSizeWidget {
  final String currentRoute;
  final VoidCallback? onSearchTap;
  final VoidCallback? onNotificationTap;
  final VoidCallback? onProfileTap;
  final VoidCallback? onMenuTap;
  final int unreadCount;
  final bool showBackButton;
  final VoidCallback? onBackPressed;
  final Widget? title;
  final List<Widget>? actions;

  const EnterpriseAppBar({
    super.key,
    required this.currentRoute,
    this.onSearchTap,
    this.onNotificationTap,
    this.onProfileTap,
    this.onMenuTap,
    this.unreadCount = 0,
    this.showBackButton = false,
    this.onBackPressed,
    this.title,
    this.actions,
  });

  @override
  Size get preferredSize => const Size.fromHeight(AppDimens.appBarHeight);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final navItem = NavigationConfig.getItemByRoute(currentRoute);

    return AppBar(
      elevation: 0,
      scrolledUnderElevation: 1,
      leading: showBackButton
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, size: 18),
              onPressed: onBackPressed ?? () => Navigator.of(context).pop(),
            )
          : IconButton(
              icon: const Icon(Icons.menu_rounded, size: 20),
              onPressed: onMenuTap,
              tooltip: 'Toggle sidebar',
            ),
      title: title ?? _buildTitle(context, cs, navItem),
      actions: [
        _buildSearchButton(context, cs),
        if (MediaQuery.sizeOf(context).width > 600)
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 4),
            child: BranchSwitcher(),
          ),
        if (MediaQuery.sizeOf(context).width > 600) const SizedBox(width: 4),
        ...?actions,
        _buildNotificationButton(context, cs),
        _buildProfileButton(context, cs),
        const SizedBox(width: 4),
      ],
    );
  }

  Widget _buildTitle(
      BuildContext context, ColorScheme cs, NavItem? navItem) {
    return Row(
      children: [
        if (navItem != null) ...[
          Icon(navItem.icon, size: 18, color: cs.primary),
          const SizedBox(width: 8),
        ],
        Flexible(
          child: Text(
            navItem?.label ?? 'NexaROS',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: cs.onSurface,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildSearchButton(BuildContext context, ColorScheme cs) {
    return Tooltip(
      message: 'Search (Ctrl+K)',
      child: IconButton(
        icon: Icon(Icons.search_rounded,
            size: 20, color: AppColors.gray500),
        onPressed: onSearchTap,
        constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
      ),
    );
  }

  Widget _buildNotificationButton(
      BuildContext context, ColorScheme cs) {
    return Stack(
      children: [
        IconButton(
          icon: Icon(Icons.notifications_outlined,
              size: 20, color: AppColors.gray500),
          onPressed: onNotificationTap,
          tooltip: 'Notifications',
          constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
        ),
        if (unreadCount > 0)
          Positioned(
            right: 6,
            top: 6,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                  color: AppColors.danger, shape: BoxShape.circle),
              child: Text(
                unreadCount > 99 ? '99+' : '$unreadCount',
                style: const TextStyle(
                  fontSize: 9,
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildProfileButton(BuildContext context, ColorScheme cs) {
    return IconButton(
      icon: CircleAvatar(
        radius: 14,
        backgroundColor: cs.primary.withValues(alpha: 0.1),
        child: Icon(Icons.person, size: 16, color: cs.primary),
      ),
      onPressed: onProfileTap,
      tooltip: 'Profile',
      constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
    );
  }
}
