import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../sync/offline_sync_service.dart';

class SyncStatusBar extends StatefulWidget {
  final OfflineSyncService syncService;

  const SyncStatusBar({super.key, required this.syncService});

  @override
  State<SyncStatusBar> createState() => _SyncStatusBarState();
}

class _SyncStatusBarState extends State<SyncStatusBar> {
  SyncStatus _status = SyncStatus.idle;
  int _pendingCount = 0;

  @override
  void initState() {
    super.initState();
    _listenToSync();
    _loadPendingCount();
  }

  void _listenToSync() {
    widget.syncService.statusStream.listen((status) {
      if (mounted) {
        setState(() => _status = status);
        _loadPendingCount();
      }
    });
  }

  Future<void> _loadPendingCount() async {
    final count = await widget.syncService.getPendingCount();
    if (mounted) setState(() => _pendingCount = count);
  }

  @override
  Widget build(BuildContext context) {
    if (_pendingCount == 0 && _status == SyncStatus.synced) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      color: _getStatusColor(),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_status == SyncStatus.syncing)
            const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            )
          else
            Icon(_getStatusIcon(), size: 14, color: Colors.white),
          const SizedBox(width: 6),
          Text(
            _getStatusText(),
            style: GoogleFonts.inter(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (_status) {
      case SyncStatus.syncing:
        return AppColors.warning;
      case SyncStatus.synced:
        return AppColors.success;
      case SyncStatus.error:
        return AppColors.danger;
      case SyncStatus.idle:
        return _pendingCount > 0 ? AppColors.warning : Colors.grey;
    }
  }

  IconData _getStatusIcon() {
    switch (_status) {
      case SyncStatus.syncing:
        return Icons.sync;
      case SyncStatus.synced:
        return Icons.cloud_done;
      case SyncStatus.error:
        return Icons.cloud_off;
      case SyncStatus.idle:
        return _pendingCount > 0 ? Icons.cloud_upload : Icons.cloud_queue;
    }
  }

  String _getStatusText() {
    switch (_status) {
      case SyncStatus.syncing:
        return 'Syncing...';
      case SyncStatus.synced:
        return _pendingCount > 0 ? '$_pendingCount pending' : 'All synced';
      case SyncStatus.error:
        return '$_pendingCount pending — will retry';
      case SyncStatus.idle:
        return _pendingCount > 0 ? '$_pendingCount pending' : '';
    }
  }
}
