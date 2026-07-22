import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/riverpod_providers.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';

const double _defaultPanelWidth = 320;

/// Collapsible right-side context panel.
///
/// Slides in from the right edge with a width defined by [_defaultPanelWidth]
/// (since AppDimens does not expose a right-panel token). Accepts an optional
/// [title] for the header and a [child] widget slot for dynamic content.
class RightContextPanel extends ConsumerStatefulWidget {
  final String title;
  final Widget child;

  const RightContextPanel({
    super.key,
    this.title = 'Details',
    required this.child,
  });

  @override
  ConsumerState<RightContextPanel> createState() => _RightContextPanelState();
}

class _RightContextPanelState extends ConsumerState<RightContextPanel>
    with SingleTickerProviderStateMixin {
  late final AnimationController _slideController;
  late final Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _slideController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 260),
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(1, 0),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic),
    );

    // Sync initial state
    final isOpen = ref.read(shellProvider).state.isRightPanelOpen;
    if (isOpen) _slideController.value = 1.0;
  }

  @override
  void didUpdateWidget(RightContextPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    final isOpen = ref.read(shellProvider).state.isRightPanelOpen;
    if (isOpen && !_slideController.isAnimating && _slideController.value == 0) {
      _slideController.forward();
    }
  }

  @override
  void dispose() {
    _slideController.dispose();
    super.dispose();
  }

  void _close() {
    ref.read(shellProvider.notifier).closeRightPanel();
    _slideController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final isOpen = ref.watch(
      shellProvider.select((s) => s.state.isRightPanelOpen),
    );

    // Drive animation from state
    if (isOpen && !_slideController.isAnimating && _slideController.value == 0) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _slideController.forward();
      });
    } else if (!isOpen &&
        !_slideController.isAnimating &&
        _slideController.value == 1) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _slideController.reverse();
      });
    }

    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;

    return AnimatedBuilder(
      animation: _slideAnim,
      builder: (context, child) {
        final fraction = _slideController.value;
        if (fraction == 0) return const SizedBox.shrink();

        return Align(
          alignment: Alignment.centerRight,
          child: FractionallySizedBox(
            widthFactor: fraction,
            child: SizedBox(
              width: _defaultPanelWidth,
              child: _buildPanel(isDark),
            ),
          ),
        );
      },
    );
  }

  Widget _buildPanel(bool isDark) {
    final bgColor = isDark ? AppColors.darkSurface : AppColors.white;
    final borderColor =
        isDark ? AppColors.darkBorder : AppColors.gray200;

    return Material(
      color: bgColor,
      elevation: 4,
      child: Container(
        decoration: BoxDecoration(
          border: Border(
            left: BorderSide(color: borderColor),
          ),
        ),
        child: Column(
          children: [
            _buildHeader(isDark),
            const Divider(height: 1),
            Expanded(child: widget.child),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Container(
      height: AppDimens.appBarHeight,
      padding: const EdgeInsets.symmetric(horizontal: AppDimens.base),
      child: Row(
        children: [
          Expanded(
            child: Text(
              widget.title,
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: isDark
                    ? AppColors.darkTextPrimary
                    : AppColors.textPrimary,
              ),
            ),
          ),
          IconButton(
            onPressed: _close,
            icon: Icon(
              Icons.close_rounded,
              size: AppDimens.iconMd,
              color: isDark ? AppColors.gray400 : AppColors.gray500,
            ),
            tooltip: 'Close panel',
            splashRadius: 16,
          ),
        ],
      ),
    );
  }
}
