/// Enterprise bottom status bar — desktop only.
library;

import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class BottomStatusBar extends StatefulWidget {
  final bool isOnline;
  final bool isConnected;
  final bool isSyncing;
  final String? syncProgress;
  final String? userName;
  final String? branchName;
  final String appVersion;

  const BottomStatusBar({
    super.key,
    this.isOnline = true,
    this.isConnected = true,
    this.isSyncing = false,
    this.syncProgress,
    this.userName,
    this.branchName,
    this.appVersion = 'v0.1.0',
  });

  @override
  State<BottomStatusBar> createState() => _BottomStatusBarState();
}

class _BottomStatusBarState extends State<BottomStatusBar> {
  late Timer _clockTimer;
  String _time = '';

  @override
  void initState() {
    super.initState();
    _updateTime();
    _clockTimer =
        Timer.periodic(const Duration(seconds: 1), (_) => _updateTime());
  }

  @override
  void dispose() {
    _clockTimer.cancel();
    super.dispose();
  }

  void _updateTime() {
    final now = DateTime.now();
    setState(() {
      _time =
          '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      height: 28,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: isDark
            ? cs.surface
            : cs.surfaceContainerHighest.withValues(alpha: 0.5),
        border:
            Border(top: BorderSide(color: cs.outline.withValues(alpha: 0.3))),
      ),
      child: Row(
        children: [
          _buildUser(cs),
          _buildDivider(),
          _buildBranch(cs),
          _buildDivider(),
          _buildStatusIndicator('Online', widget.isOnline),
          _buildDivider(),
          _buildStatusIndicator('API', widget.isConnected),
          if (widget.isSyncing) ...[
            _buildDivider(),
            Icon(Icons.sync, size: 12, color: AppColors.info),
            const SizedBox(width: 4),
            Text(
              widget.syncProgress ?? 'Syncing...',
              style: TextStyle(fontSize: 10, color: AppColors.info),
            ),
          ],
          const Spacer(),
          Text(
            _time,
            style: TextStyle(
              fontSize: 10,
              color: AppColors.gray500,
              fontFamily: 'monospace',
            ),
          ),
          const SizedBox(width: 12),
          Text(
            widget.appVersion,
            style: TextStyle(fontSize: 10, color: AppColors.gray400),
          ),
        ],
      ),
    );
  }

  Widget _buildUser(ColorScheme cs) {
    return Row(
      children: [
        Icon(Icons.person_outline, size: 12, color: AppColors.gray500),
        const SizedBox(width: 4),
        Text(
          widget.userName ?? 'User',
          style: TextStyle(fontSize: 10, color: AppColors.gray600),
        ),
      ],
    );
  }

  Widget _buildBranch(ColorScheme cs) {
    return Row(
      children: [
        Icon(Icons.store_outlined, size: 12, color: AppColors.gray500),
        const SizedBox(width: 4),
        Text(
          widget.branchName ?? 'Main Branch',
          style: TextStyle(fontSize: 10, color: AppColors.gray600),
        ),
      ],
    );
  }

  Widget _buildStatusIndicator(String label, bool status) {
    return Row(
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: status ? AppColors.success : AppColors.danger,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(fontSize: 10, color: AppColors.gray500),
        ),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 14,
      width: 1,
      margin: const EdgeInsets.symmetric(horizontal: 8),
      color: AppColors.gray300,
    );
  }
}
