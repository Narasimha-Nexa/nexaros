import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_state.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/sound_service.dart';
import '../../../core/theme/app_colors.dart';

/// TV-optimized Kitchen Display System with kanban board layout.
///
/// Shows 4 columns: NEW (Pending+Confirmed), PREPARING, READY, COMPLETED
/// Each order card shows order#, table#, items, elapsed timer, special notes,
/// and a status-advance button.
class KitchenDisplayScreen extends StatefulWidget {
  const KitchenDisplayScreen({super.key});

  @override
  State<KitchenDisplayScreen> createState() => _KitchenDisplayScreenState();
}

class _KitchenDisplayScreenState extends State<KitchenDisplayScreen>
    with WidgetsBindingObserver {
  late final ApiClient _api;
  List<Map<String, dynamic>> _orders = [];
  bool _isLoading = true;
  Timer? _timer; // 1-second tick for order timers
  Timer? _completedCleanupTimer; // periodic cleanup of completed orders
  bool _fullScreen = false;

  // Socket listener cleanup handled by AppState.removeSocketListener

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    final appState = context.read<AppState>();
    _api = appState.api;
    _loadOrders(branchId: appState.branchId);

    _startTimer();
    _setupSocketListeners();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    _completedCleanupTimer?.cancel();
    _sound.dispose();
    // Restore system UI if we were in full-screen
    _exitFullScreen();
    // Socket listeners cleaned up in _setupSocketListeners on next init
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      final appState = context.read<AppState>();
      _loadOrders(branchId: appState.branchId);
      // Re-enter full-screen if it was enabled
      if (_fullScreen) _enterFullScreen();
    }
  }

  void _toggleFullScreen() {
    setState(() {
      _fullScreen = !_fullScreen;
      if (_fullScreen) {
        _enterFullScreen();
      } else {
        _exitFullScreen();
      }
    });
  }

  void _enterFullScreen() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  void _exitFullScreen() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }

  void _startTimer() {
    // Tick every second to update elapsed timers
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
    // Clean up completed orders every 30 seconds
    _completedCleanupTimer =
        Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) _cleanupCompletedOrders();
    });
  }

  void _setupSocketListeners() {
    final appState = context.read<AppState>();
    final branchId = appState.branchId;

    // Remove stale listeners first to avoid duplicates
    appState.removeSocketListener('order:created');
    appState.removeSocketListener('order:status-changed');
    appState.removeSocketListener('order:ready');

    // New order arrives — play alert and refresh
    appState.listenToEvent('order:created', (_) {
      _playNewOrderAlert();
      _loadOrders(branchId: branchId);
    });

    // Order status changed — refresh
    appState.listenToEvent('order:status-changed', (_) {
      _loadOrders(branchId: branchId);
    });

    // Order ready — refresh
    appState.listenToEvent('order:ready', (_) {
      _loadOrders(branchId: branchId);
    });
  }

  Future<void> _loadOrders({String? branchId}) async {
    try {
      final rawOrders = await _api.getActiveKitchenOrders(
        branchId: branchId,
      );
      if (mounted) {
        setState(() {
          _orders = rawOrders.cast<Map<String, dynamic>>();
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  final SoundService _sound = SoundService();

  void _playNewOrderAlert() {
    // Visual pulse is handled by the animated builder.
    // Play a proper kitchen bell chime as audio cue.
    _sound.playNewOrderChime();
  }

  void _cleanupCompletedOrders() {
    // Orders in COMPLETED older than 5 minutes are removed from the view
    final cutoff = DateTime.now().subtract(const Duration(minutes: 5));
    setState(() {
      _orders.removeWhere((o) {
        final status = o['status'] as String? ?? '';
        if (status != 'COMPLETED' && status != 'SERVED') return false;
        final updatedAt = DateTime.tryParse(o['updatedAt'] ?? '');
        return updatedAt != null && updatedAt.isBefore(cutoff);
      });
    });
  }

  Future<void> _updateStatus(String orderId, String newStatus) async {
    try {
      final appState = context.read<AppState>();
      await _api.updateKitchenOrderStatus(
        orderId,
        newStatus,
        branchId: appState.branchId,
      );
      // Socket event will trigger refresh
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  Future<void> _reprintKot(String orderId) async {
    try {
      await _api.printKot(orderId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('KOT resent to printer'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Print error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Large, TV-optimized layout
    return Scaffold(
      backgroundColor: AppColors.gray900,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(48),
        child: _buildHeader(),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : _orders.isEmpty
              ? _buildEmptyState()
              : _buildKanbanBoard(),
    );
  }

  Widget _buildHeader() {
    final now = DateTime.now();
    final timeStr =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    final dateStr =
        '${now.day}/${now.month}/${now.year}';

    final pending = _orders.where((o) =>
            o['status'] == 'PENDING' || o['status'] == 'CONFIRMED')
        .length;
    final preparing =
        _orders.where((o) => o['status'] == 'PREPARING').length;
    final ready = _orders.where((o) => o['status'] == 'READY').length;

    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: const BoxDecoration(
        color: AppColors.gray800,
        border: Border(bottom: BorderSide(color: AppColors.gray700)),
      ),
      child: Row(
        children: [
          Text(
            '🍳 KITCHEN',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.white,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(width: 24),
          _buildHeaderStat('NEW', pending, AppColors.danger),
          const SizedBox(width: 12),
          _buildHeaderStat('PREP', preparing, AppColors.orderPreparing),
          const SizedBox(width: 12),
          _buildHeaderStat('READY', ready, AppColors.orderReady),
          // Sound mute toggle
          IconButton(
            icon: Icon(
              _sound.muted ? Icons.volume_off : Icons.volume_up,
              color: _sound.muted ? AppColors.gray500 : AppColors.gray300,
              size: 18,
            ),
            tooltip: _sound.muted ? 'Unmute sound' : 'Mute sound',
            onPressed: () {
              setState(() => _sound.toggleMute());
            },
          ),
          // Full-screen toggle
          const SizedBox(width: 4),
          IconButton(
            icon: Icon(
              _fullScreen ? Icons.fullscreen_exit : Icons.fullscreen,
              color: _fullScreen ? AppColors.primary : AppColors.gray300,
              size: 18,
            ),
            tooltip: _fullScreen ? 'Exit full screen' : 'Full screen',
            onPressed: _toggleFullScreen,
          ),
          const SizedBox(width: 8),
          Text(
            '$dateStr  $timeStr',
            style: GoogleFonts.jetBrainsMono(
              fontSize: 14,
              color: AppColors.gray400,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderStat(String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            '$label: $count',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.restaurant_menu, size: 80, color: AppColors.gray600),
          const SizedBox(height: 16),
          Text(
            'No Active Orders',
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: AppColors.gray400,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'New orders will appear here in real-time',
            style: GoogleFonts.inter(fontSize: 16, color: AppColors.gray500),
          ),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () {
              final appState = context.read<AppState>();
              _loadOrders(branchId: appState.branchId);
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Refresh'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.gray300,
              side: const BorderSide(color: AppColors.gray600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKanbanBoard() {
    final columns = _buildColumns();

    return LayoutBuilder(
      builder: (context, constraints) {
        final screenWidth = constraints.maxWidth;

        // Responsive column count
        int columnCount;
        if (screenWidth > 1600) {
          columnCount = 4; // Full 4 columns on large screens
        } else if (screenWidth > 1100) {
          columnCount = 3; // Hide COMPLETED on medium
        } else {
          columnCount = 2; // Only NEW+PREPARING on smaller KDS
        }

        final visibleColumns = columns.take(columnCount).toList();

        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: SizedBox(
            width: columnCount * 320.0,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: visibleColumns
                  .map((col) => SizedBox(width: 320, child: col))
                  .toList(),
            ),
          ),
        );
      },
    );
  }

  List<Widget> _buildColumns() {
    final newOrders = _orders
        .where((o) =>
            o['status'] == 'PENDING' || o['status'] == 'CONFIRMED')
        .toList();
    final preparingOrders =
        _orders.where((o) => o['status'] == 'PREPARING').toList();
    final readyOrders =
        _orders.where((o) => o['status'] == 'READY').toList();
    final completedOrders = _orders
        .where(
            (o) => o['status'] == 'COMPLETED' || o['status'] == 'SERVED')
        .toList();

    return [
      _buildColumn(
        title: 'NEW',
        count: newOrders.length,
        color: AppColors.danger,
        bgColor: const Color(0x1AEF4444),
        orders: newOrders,
        nextStatus: 'PREPARING',
        nextLabel: '▶ START',
        nextColor: AppColors.orderPreparing,
        shouldPulse: true,
      ),
      _buildColumn(
        title: 'PREPARING',
        count: preparingOrders.length,
        color: AppColors.orderPreparing,
        bgColor: const Color(0x1AF97316),
        orders: preparingOrders,
        nextStatus: 'READY',
        nextLabel: '✅ DONE',
        nextColor: AppColors.orderReady,
        shouldPulse: false,
      ),
      _buildColumn(
        title: 'READY',
        count: readyOrders.length,
        color: AppColors.orderReady,
        bgColor: const Color(0x1A10B981),
        orders: readyOrders,
        nextStatus: 'SERVED',
        nextLabel: '🍽 SERVE',
        nextColor: AppColors.orderServed,
        shouldPulse: false,
      ),
      _buildColumn(
        title: 'COMPLETED',
        count: completedOrders.length,
        color: AppColors.gray500,
        bgColor: const Color(0x1A64748B),
        orders: completedOrders,
        nextStatus: null,
        nextLabel: null,
        nextColor: null,
        shouldPulse: false,
      ),
    ];
  }

  Widget _buildColumn({
    required String title,
    required int count,
    required Color color,
    required Color bgColor,
    required List<Map<String, dynamic>> orders,
    required String? nextStatus,
    required String? nextLabel,
    required Color? nextColor,
    required bool shouldPulse,
  }) {
    final isNewColumn = title == 'NEW';

    return Container(
      margin: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.gray800,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.gray700),
      ),
      child: Column(
        children: [
          // Column header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.2),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(10)),
            ),
            child: Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: color,
                    letterSpacing: 1,
                  ),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.gray700,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '$count',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Orders list
          Expanded(
            child: orders.isEmpty
                ? Center(
                    child: Text(
                      'No orders',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppColors.gray500,
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: orders.length,
                    itemBuilder: (ctx, i) {
                      final isNew = isNewColumn && i < 3;
                      return _buildOrderCard(
                        orders[i],
                        nextStatus: nextStatus,
                        nextLabel: nextLabel,
                        nextColor: nextColor,
                        isHighlighted: isNew && shouldPulse,
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(
    Map<String, dynamic> order, {
    required String? nextStatus,
    required String? nextLabel,
    required Color? nextColor,
    bool isHighlighted = false,
  }) {
    final status = order['status'] as String? ?? 'PENDING';
    final orderNumber = order['orderNumber'] ?? '-';
    final table = order['table'] as Map<String, dynamic>?;
    final tableNumber = table?['number'] ?? '-';
    final items = (order['items'] as List<dynamic>?) ?? [];
    final notes = order['notes'] as String? ?? '';
    final createdAt = DateTime.tryParse(order['createdAt'] ?? '') ?? DateTime.now();

    // Compute elapsed time
    final elapsed = DateTime.now().difference(createdAt);
    final elapsedMinutes = elapsed.inMinutes;
    final elapsedSeconds = elapsed.inSeconds.remainder(60);
    final elapsedStr =
        '${elapsedMinutes.toString().padLeft(2, '0')}:${elapsedSeconds.toString().padLeft(2, '0')}';

    // Urgency color: >10 min = danger, >5 min = warning
    Color timerColor = AppColors.success;
    if (elapsedMinutes >= 10) {
      timerColor = AppColors.danger;
    } else if (elapsedMinutes >= 5) {
      timerColor = AppColors.warning;
    }

    // Count veg / non-veg items
    final vegCount = items.where((i) {
      final mi = i['menuItem'] as Map<String, dynamic>?;
      return mi?['isVeg'] == true;
    }).length;
    final nonVegCount = items.length - vegCount;

    final isCompleted = status == 'COMPLETED' || status == 'SERVED';

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isCompleted ? AppColors.gray800.withValues(alpha: 0.5) : AppColors.gray700,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isHighlighted
              ? AppColors.warning.withValues(alpha: 0.6)
              : AppColors.gray600,
          width: isHighlighted ? 2 : 1,
        ),
        boxShadow: isHighlighted
            ? [
                BoxShadow(
                  color: AppColors.warning.withValues(alpha: 0.2),
                  blurRadius: 8,
                  spreadRadius: 1,
                ),
              ]
            : null,
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Order # + Table # + Timer
            Row(
              children: [
                // Order number
                Text(
                  '#$orderNumber',
                  style: GoogleFonts.inter(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.white,
                  ),
                ),
                const SizedBox(width: 10),
                // Table
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.gray600,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'T$tableNumber',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.gray200,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Order type
                if (order['type'] != null) ...[
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.info.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      (order['type'] as String).replaceAll('_', ' '),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.info,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
                const Spacer(),
                // Timer
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: timerColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.timer,
                        size: 14,
                        color: timerColor,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        elapsedStr,
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: timerColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Items list
            if (items.isNotEmpty) ...[
              ...items.take(6).map((item) {
                final mi = item['menuItem'] as Map<String, dynamic>?;
                final itemName = item['name'] ?? mi?['name'] ?? '';
                final qty = item['quantity'] ?? 1;
                final isVeg = mi?['isVeg'] == true;
                final itemNotes = item['notes'] as String? ?? '';
                return Padding(
                  padding: const EdgeInsets.only(bottom: 3),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Veg/Non-veg indicator
                      Container(
                        width: 14,
                        height: 14,
                        margin: const EdgeInsets.only(top: 3, right: 6),
                        decoration: BoxDecoration(
                          color: isVeg
                              ? AppColors.success.withValues(alpha: 0.2)
                              : AppColors.danger.withValues(alpha: 0.2),
                          border: Border.all(
                            color: isVeg ? AppColors.success : AppColors.danger,
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: Center(
                          child: Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: isVeg
                                  ? AppColors.success
                                  : AppColors.danger,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ),
                      // Quantity
                      Text(
                        '${qty}x ',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.white,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          itemName,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: AppColors.gray200,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      // Item notes indicator
                      if (itemNotes.isNotEmpty)
                        const Icon(Icons.info_outline,
                            size: 14, color: AppColors.warning),
                    ],
                  ),
                );
              }),
              if (items.length > 6)
                Text(
                  '+${items.length - 6} more items',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.gray400,
                    fontStyle: FontStyle.italic,
                  ),
                ),
            ],

            // Special notes (highlighted)
            if (notes.isNotEmpty) ...[
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(
                    color: AppColors.warning.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded,
                        size: 14, color: AppColors.warning),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        notes,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.warning,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Veg / Non-veg summary
            if (vegCount > 0 || nonVegCount > 0) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  if (vegCount > 0)
                    Text(
                      '🟢 $vegCount veg',
                      style: GoogleFonts.inter(
                          fontSize: 11, color: AppColors.gray400),
                    ),
                  if (vegCount > 0 && nonVegCount > 0)
                    const SizedBox(width: 8),
                  if (nonVegCount > 0)
                    Text(
                      '🔴 $nonVegCount non-veg',
                      style: GoogleFonts.inter(
                          fontSize: 11, color: AppColors.gray400),
                    ),
                ],
              ),
            ],

            // Actions
            const SizedBox(height: 8),
            Row(
              children: [
                // Status advance button
                if (nextStatus != null && nextLabel != null) ...[
                  Expanded(
                    child: SizedBox(
                      height: 36,
                      child: ElevatedButton(
                        onPressed: () => _updateStatus(
                            order['id'], nextStatus),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: nextColor ?? AppColors.primary,
                          foregroundColor: AppColors.white,
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                          textStyle: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                        child: Text(nextLabel),
                      ),
                    ),
                  ),
                ],
                // KOT reprint
                const SizedBox(width: 6),
                SizedBox(
                  height: 36,
                  child: OutlinedButton(
                    onPressed: () => _reprintKot(order['id']),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.gray300,
                      side: const BorderSide(color: AppColors.gray500),
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    child: const Icon(Icons.print, size: 18),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
