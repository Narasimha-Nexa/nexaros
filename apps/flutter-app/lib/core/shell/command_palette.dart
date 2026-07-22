import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/riverpod_providers.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import 'navigation_config.dart';

/// Wraps [child] with a keyboard shortcut listener (Ctrl/Cmd+K) that opens
/// the command palette via [ShellProvider].
class CommandPaletteShortcut extends StatelessWidget {
  final Widget child;
  const CommandPaletteShortcut({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return CallbackShortcuts(
      bindings: <ShortcutActivator, VoidCallback>{
        const SingleActivator(LogicalKeyboardKey.keyK, control: true): () =>
            _openPalette(context),
        const SingleActivator(LogicalKeyboardKey.keyK, meta: true): () =>
            _openPalette(context),
      },
      child: Focus(autofocus: true, child: child),
    );
  }

  void _openPalette(BuildContext context) {
    final container = ProviderScope.containerOf(context, listen: false);
    container.read(shellProvider.notifier).openSearch();
  }
}

/// VS Code / Notion / Linear style command palette overlay.
///
/// Displays a searchable list of [NavigationConfig.commandPaletteItems] with
/// animated entry, keyboard navigation (↑↓ Enter ESC), and shortcut hints.
class CommandPaletteOverlay extends ConsumerStatefulWidget {
  const CommandPaletteOverlay({super.key});

  @override
  ConsumerState<CommandPaletteOverlay> createState() =>
      _CommandPaletteOverlayState();
}

class _CommandPaletteOverlayState extends ConsumerState<CommandPaletteOverlay>
    with SingleTickerProviderStateMixin {
  late final TextEditingController _controller;
  late final AnimationController _animController;
  late final Animation<double> _fadeAnim;
  late final Animation<double> _scaleAnim;

  List<NavItem> _allItems = [];
  List<NavItem> _filtered = [];
  int _selectedIndex = 0;
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _scaleAnim = Tween<double>(begin: 0.95, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
    );

    _allItems = NavigationConfig.commandPaletteItems;
    _filtered = List.of(_allItems);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _animController.forward();
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _animController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _filter(String query) {
    setState(() {
      if (query.trim().isEmpty) {
        _filtered = List.of(_allItems);
      } else {
        final q = query.toLowerCase();
        _filtered =
            _allItems.where((i) => i.label.toLowerCase().contains(q)).toList();
      }
      _selectedIndex = 0;
    });
  }

  void _close() {
    ref.read(shellProvider.notifier).closeSearch();
  }

  void _select(int index) {
    if (index < 0 || index >= _filtered.length) return;
    final item = _filtered[index];
    _close();
    Navigator.of(context).pushNamed(item.route);
  }

  void _handleKey(KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) return;
    switch (event.logicalKey) {
      case LogicalKeyboardKey.escape:
        _close();
      case LogicalKeyboardKey.arrowDown:
        setState(() {
          _selectedIndex =
              (_selectedIndex + 1).clamp(0, _filtered.length - 1);
        });
      case LogicalKeyboardKey.arrowUp:
        setState(() {
          _selectedIndex =
              (_selectedIndex - 1).clamp(0, _filtered.length - 1);
        });
      case LogicalKeyboardKey.enter:
        _select(_selectedIndex);
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;

    return FadeTransition(
      opacity: _fadeAnim,
      child: ScaleTransition(
        scale: _scaleAnim,
        child: GestureDetector(
          onTap: _close,
          child: Container(
            color: AppColors.black.withValues(alpha: 0.5),
            alignment: Alignment.topCenter,
            padding: const EdgeInsets.only(top: 80),
            child: KeyboardListener(
              focusNode: _focusNode,
              onKeyEvent: _handleKey,
              child: GestureDetector(
                onTap: () {},
                child: _buildPaletteCard(isDark),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPaletteCard(bool isDark) {
    final bgColor = isDark ? AppColors.darkSurface : AppColors.white;
    final borderColor =
        isDark ? AppColors.darkBorder : AppColors.gray200;

    return Container(
      width: 520,
      constraints: const BoxConstraints(maxHeight: 440),
      margin: const EdgeInsets.symmetric(horizontal: AppDimens.base),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppDimens.radiusLg),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildSearchField(isDark),
          const Divider(height: 1),
          Flexible(child: _buildResultsList(isDark)),
          _buildFooter(isDark),
        ],
      ),
    );
  }

  Widget _buildSearchField(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimens.base,
        vertical: AppDimens.sm,
      ),
      child: Row(
        children: [
          Icon(Icons.search_rounded,
              color: isDark ? AppColors.gray400 : AppColors.gray500,
              size: AppDimens.iconMd),
          const SizedBox(width: AppDimens.sm),
          Expanded(
            child: TextField(
              controller: _controller,
              onChanged: _filter,
              autofocus: true,
              style: GoogleFonts.inter(
                fontSize: 15,
                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
              ),
              decoration: InputDecoration(
                hintText: 'Search navigation, actions...',
                hintStyle: GoogleFonts.inter(
                  fontSize: 15,
                  color: AppColors.gray400,
                ),
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  vertical: AppDimens.sm,
                ),
              ),
            ),
          ),
          _ShortcutBadge(
            keys: _isMac ? '⌘ K' : 'Ctrl+K',
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildResultsList(bool isDark) {
    if (_filtered.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppDimens.xl),
          child: Text(
            'No results found',
            style: GoogleFonts.inter(
              color: AppColors.gray400,
              fontSize: 14,
            ),
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      padding: const EdgeInsets.symmetric(vertical: AppDimens.xs),
      itemCount: _filtered.length,
      itemBuilder: (context, index) {
        final item = _filtered[index];
        final isSelected = index == _selectedIndex;
        return _ResultTile(
          item: item,
          isSelected: isSelected,
          isDark: isDark,
          onTap: () => _select(index),
          onHover: () => setState(() => _selectedIndex = index),
        );
      },
    );
  }

  Widget _buildFooter(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimens.base,
        vertical: AppDimens.sm,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.gray800 : AppColors.gray50,
        borderRadius: const BorderRadius.vertical(
          bottom: Radius.circular(AppDimens.radiusLg),
        ),
      ),
      child: Row(
        children: [
          _FooterHint(label: '↑↓', desc: 'navigate', isDark: isDark),
          const SizedBox(width: AppDimens.md),
          _FooterHint(label: '↵', desc: 'select', isDark: isDark),
          const SizedBox(width: AppDimens.md),
          _FooterHint(label: 'esc', desc: 'close', isDark: isDark),
        ],
      ),
    );
  }
}

class _ResultTile extends StatelessWidget {
  final NavItem item;
  final bool isSelected;
  final bool isDark;
  final VoidCallback onTap;
  final VoidCallback onHover;

  const _ResultTile({
    required this.item,
    required this.isSelected,
    required this.isDark,
    required this.onTap,
    required this.onHover,
  });

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => onHover(),
      child: Material(
        color: isSelected
            ? AppColors.primary.withValues(alpha: 0.08)
            : Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppDimens.base,
              vertical: AppDimens.sm,
            ),
            child: Row(
              children: [
                Icon(
                  item.icon,
                  size: AppDimens.iconMd,
                  color: isSelected
                      ? AppColors.primary
                      : (isDark
                          ? AppColors.gray400
                          : AppColors.gray500),
                ),
                const SizedBox(width: AppDimens.md),
                Expanded(
                  child: Text(
                    item.label,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w400,
                      color: isSelected
                          ? AppColors.primary
                          : (isDark
                              ? AppColors.darkTextPrimary
                              : AppColors.textPrimary),
                    ),
                  ),
                ),
                if (isSelected)
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 12,
                    color: AppColors.primary,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ShortcutBadge extends StatelessWidget {
  final String keys;
  final bool isDark;
  const _ShortcutBadge({required this.keys, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimens.sm,
        vertical: AppDimens.xxs,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.gray700 : AppColors.gray100,
        borderRadius: BorderRadius.circular(AppDimens.radiusXs),
      ),
      child: Text(
        keys,
        style: GoogleFonts.spaceMono(
          fontSize: 11,
          color: isDark ? AppColors.gray300 : AppColors.gray500,
        ),
      ),
    );
  }
}

class _FooterHint extends StatelessWidget {
  final String label;
  final String desc;
  final bool isDark;
  const _FooterHint({
    required this.label,
    required this.desc,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppDimens.xs,
            vertical: AppDimens.xxs,
          ),
          decoration: BoxDecoration(
            color: isDark ? AppColors.gray700 : AppColors.gray200,
            borderRadius: BorderRadius.circular(AppDimens.radiusXs),
          ),
          child: Text(
            label,
            style: GoogleFonts.spaceMono(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: isDark ? AppColors.gray300 : AppColors.gray600,
            ),
          ),
        ),
        const SizedBox(width: AppDimens.xxs),
        Text(
          desc,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: AppColors.gray400,
          ),
        ),
      ],
    );
  }
}

bool get _isMac {
  try {
    return Platform.isMacOS;
  } catch (_) {
    return false;
  }
}
