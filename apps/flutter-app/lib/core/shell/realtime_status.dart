import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';

/// Possible connection states for the real-time layer (WebSocket / Socket.IO).
enum ConnectionStatus {
  connected,
  connecting,
  reconnecting,
  offline,
}

/// Extension that maps each status to a human-readable label.
extension ConnectionStatusLabel on ConnectionStatus {
  String get label {
    switch (this) {
      case ConnectionStatus.connected:
        return 'Connected';
      case ConnectionStatus.connecting:
        return 'Connecting...';
      case ConnectionStatus.reconnecting:
        return 'Reconnecting...';
      case ConnectionStatus.offline:
        return 'Offline';
    }
  }
}

/// A compact real-time connection status indicator.
///
/// Can render in two modes:
/// - **compact**: a small color-coded dot (default).
/// - **expanded**: a chip with icon + label.
class RealtimeStatusIndicator extends StatelessWidget {
  final ConnectionStatus status;
  final bool expanded;
  final VoidCallback? onTap;

  const RealtimeStatusIndicator({
    super.key,
    this.status = ConnectionStatus.connected,
    this.expanded = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;

    if (expanded) {
      return _ExpandedChip(
        status: status,
        isDark: isDark,
        onTap: onTap,
      );
    }
    return _CompactDot(status: status, onTap: onTap);
  }
}

// ── Internal widgets ───────────────────────────────────────────────────────

class _CompactDot extends StatelessWidget {
  final ConnectionStatus status;
  final VoidCallback? onTap;

  const _CompactDot({required this.status, this.onTap});

  Color get _color {
    switch (status) {
      case ConnectionStatus.connected:
        return AppColors.success;
      case ConnectionStatus.connecting:
      case ConnectionStatus.reconnecting:
        return AppColors.warning;
      case ConnectionStatus.offline:
        return AppColors.danger;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Tooltip(
        message: status.label,
        child: Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: _color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: _color.withValues(alpha: 0.4),
                blurRadius: 4,
                spreadRadius: 1,
              ),
            ],
          ),
          child: status == ConnectionStatus.connecting ||
                  status == ConnectionStatus.reconnecting
              ? _PulsingDot(color: _color)
              : null,
        ),
      ),
    );
  }
}

class _ExpandedChip extends StatelessWidget {
  final ConnectionStatus status;
  final bool isDark;
  final VoidCallback? onTap;

  const _ExpandedChip({
    required this.status,
    required this.isDark,
    this.onTap,
  });

  Color get _color {
    switch (status) {
      case ConnectionStatus.connected:
        return AppColors.success;
      case ConnectionStatus.connecting:
      case ConnectionStatus.reconnecting:
        return AppColors.warning;
      case ConnectionStatus.offline:
        return AppColors.danger;
    }
  }

  IconData get _icon {
    switch (status) {
      case ConnectionStatus.connected:
        return Icons.wifi_rounded;
      case ConnectionStatus.connecting:
        return Icons.wifi_find_rounded;
      case ConnectionStatus.reconnecting:
        return Icons.wifi_off_rounded;
      case ConnectionStatus.offline:
        return Icons.cloud_off_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(
          horizontal: AppDimens.md,
          vertical: AppDimens.xs,
        ),
        decoration: BoxDecoration(
          color: _color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppDimens.radiusFull),
          border: Border.all(color: _color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(_icon, size: AppDimens.iconSm, color: _color),
            const SizedBox(width: AppDimens.xs),
            Text(
              status.label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: _color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PulsingDot extends StatefulWidget {
  final Color color;
  const _PulsingDot({required this.color});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Opacity(
          opacity: 0.5 + 0.5 * _controller.value,
          child: child,
        );
      },
      child: Center(
        child: Container(
          width: 4,
          height: 4,
          decoration: const BoxDecoration(
            color: AppColors.white,
            shape: BoxShape.circle,
          ),
        ),
      ),
    );
  }
}
