import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

/// Visual floor plan screen — renders tables at posX/posY positions
/// on a scrollable canvas with drag-and-drop repositioning.
class FloorPlanScreen extends ConsumerStatefulWidget {
  const FloorPlanScreen({super.key});

  @override
  ConsumerState<FloorPlanScreen> createState() => _FloorPlanScreenState();
}

class _FloorPlanScreenState extends ConsumerState<FloorPlanScreen> {
  late final dynamic _api;
  late final dynamic _appState;
  List<dynamic> _tables = [];
  bool _isLoading = true;
  bool _editMode = false;
  String? _selectedSection;
  Timer? _tickTimer;

  // Canvas state
  final TransformationController _transformationController = TransformationController();
  static const double _canvasWidth = 1200;
  static const double _canvasHeight = 800;
  static const double _tableWidth = 80;
  static const double _tableHeight = 80;

  @override
  void initState() {
    super.initState();
    _appState = ref.read(appStateProvider);
    _api = _appState.api;
    _loadFloorPlan();
    _tickTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tickTimer?.cancel();
    _transformationController.dispose();
    super.dispose();
  }

  Future<void> _loadFloorPlan() async {
    setState(() => _isLoading = true);
    try {
      final result = await _api.getFloorPlan(branchId: _appState.branchId);
      if (mounted) {
        setState(() {
          _tables = result['tables'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<String> get _sections {
    final sections = _tables
        .map((t) => (t['section'] as String?) ?? 'Main')
        .toSet()
        .toList();
    sections.sort();
    return sections;
  }

  List<dynamic> get _visibleTables {
    if (_selectedSection == null) return _tables;
    return _tables.where((t) => ((t['section'] as String?) ?? 'Main') == _selectedSection).toList();
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'FREE': return 'Free';
      case 'OCCUPIED': return 'Occupied';
      case 'RESERVED': return 'Reserved';
      case 'CLEANING': return 'Cleaning';
      case 'ORDER_READY': return 'Ready';
      case 'BILLING': return 'Billing';
      default: return status;
    }
  }

  String _formatDuration(Duration d) {
    if (d.inHours > 0) return '${d.inHours}h ${d.inMinutes % 60}m';
    return '${d.inMinutes}m ${d.inSeconds % 60}s';
  }

  Duration? _occupiedDuration(Map<String, dynamic> table) {
    final occupiedSince = table['occupiedSince'];
    if (occupiedSince == null) return null;
    final since = DateTime.tryParse(occupiedSince.toString());
    if (since == null) return null;
    return DateTime.now().difference(since);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text(_editMode ? 'Edit Floor Plan' : 'Floor Plan'),
        actions: [
          if (_sections.length > 1)
            PopupMenuButton<String?>(
              icon: const Icon(Icons.filter_list),
              onSelected: (v) => setState(() => _selectedSection = v),
              itemBuilder: (_) => [
                const PopupMenuItem(value: null, child: Text('All Sections')),
                ..._sections.map((s) => PopupMenuItem(value: s, child: Text(s))),
              ],
            ),
          IconButton(
            onPressed: () => setState(() => _editMode = !_editMode),
            icon: Icon(_editMode ? Icons.done : Icons.edit),
            tooltip: _editMode ? 'Save positions' : 'Edit positions',
          ),
          IconButton(onPressed: _loadFloorPlan, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : _buildFloorPlan(cs),
    );
  }

  Widget _buildFloorPlan(ColorScheme cs) {
    if (_visibleTables.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.table_restaurant, size: 64, color: AppColors.gray300),
            const SizedBox(height: 16),
            Text('No tables on floor plan', style: TextStyle(color: AppColors.gray500)),
            const SizedBox(height: 8),
            Text('Assign posX/posY in table settings', style: TextStyle(fontSize: 12, color: AppColors.gray400)),
          ],
        ),
      );
    }

    return Column(
      children: [
        // Section tabs
        if (_sections.length > 1)
          Container(
            height: 40,
            color: cs.surface,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _sectionTab(null, 'All'),
                ..._sections.map((s) => _sectionTab(s, s)),
              ],
            ),
          ),
        // Legend
        _buildLegend(cs),
        // Canvas
        Expanded(
          child: InteractiveViewer(
            transformationController: _transformationController,
            minScale: 0.3,
            maxScale: 3.0,
            child: Container(
              width: _canvasWidth,
              height: _canvasHeight,
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark
                    ? AppColors.gray900
                    : AppColors.gray50,
                border: Border.all(color: AppColors.gray200),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Stack(
                children: [
                  // Grid lines
                  CustomPaint(size: const Size(_canvasWidth, _canvasHeight), painter: _GridPainter()),
                  // Section labels
                  if (_selectedSection == null)
                    ..._buildSectionLabels(),
                  // Table widgets
                  ..._visibleTables.map((table) => _buildDraggableTable(table)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _sectionTab(String? value, String label) {
    final isSelected = _selectedSection == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label, style: const TextStyle(fontSize: 11)),
        selected: isSelected,
        onSelected: (_) => setState(() => _selectedSection = value),
        selectedColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
      ),
    );
  }

  Widget _buildLegend(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: cs.surface,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _legendDot('Free', AppColors.tableFree),
          const SizedBox(width: 12),
          _legendDot('Occupied', AppColors.tableOccupied),
          const SizedBox(width: 12),
          _legendDot('Reserved', AppColors.tableReserved),
          const SizedBox(width: 12),
          _legendDot('Ready', AppColors.tableReady),
          const SizedBox(width: 12),
          _legendDot('Billing', AppColors.tableBilling),
          if (_editMode) ...[
            const SizedBox(width: 20),
            Icon(Icons.drag_indicator, size: 14, color: AppColors.gray500),
            const SizedBox(width: 4),
            Text('Drag to reposition', style: TextStyle(fontSize: 11, color: AppColors.gray500)),
          ],
        ],
      ),
    );
  }

  Widget _legendDot(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 10, color: AppColors.gray600)),
      ],
    );
  }

  List<Widget> _buildSectionLabels() {
    final sections = <String, List<dynamic>>{};
    for (final table in _visibleTables) {
      final section = (table['section'] as String?) ?? 'Main';
      sections.putIfAbsent(section, () => []).add(table);
    }

    return sections.entries.map((entry) {
      final tables = entry.value;
      if (tables.isEmpty) return const SizedBox.shrink();

      double avgX = 0, avgY = 0;
      for (final t in tables) {
        avgX += (t['posX'] as num?)?.toDouble() ?? 0;
        avgY += (t['posY'] as num?)?.toDouble() ?? 0;
      }
      avgX /= tables.length;
      avgY /= tables.length;

      return Positioned(
        left: avgX.clamp(0, _canvasWidth - 100),
        top: (avgY - 30).clamp(0, _canvasHeight - 20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(entry.key, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.primary)),
        ),
      );
    }).toList();
  }

  Widget _buildDraggableTable(Map<String, dynamic> table) {
    final status = table['status'] ?? 'FREE';
    final color = AppColors.tableStatusColor(status);
    final posX = (table['posX'] as num?)?.toDouble() ?? 100;
    final posY = (table['posY'] as num?)?.toDouble() ?? 100;
    final duration = _occupiedDuration(table);
    final activeOrders = (table['orders'] as List<dynamic>?) ?? [];

    Widget tableWidget = GestureDetector(
      onTap: () => _showTableQuickActions(table),
      child: Container(
        width: _tableWidth,
        height: _tableHeight,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color, width: 2),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'T${table['number']}',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color),
            ),
            if (table['name'] != null)
              Text(table['name'], style: TextStyle(fontSize: 8, color: AppColors.gray500), maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(4)),
              child: Text(_statusLabel(status), style: TextStyle(fontSize: 8, color: color, fontWeight: FontWeight.w600)),
            ),
            if (activeOrders.isNotEmpty)
              Text('${activeOrders.length} order${activeOrders.length > 1 ? 's' : ''}', style: TextStyle(fontSize: 8, color: AppColors.gray500)),
            if (duration != null && status == 'OCCUPIED')
              Text(_formatDuration(duration), style: TextStyle(fontSize: 8, color: AppColors.danger, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );

    if (_editMode) {
      return Positioned(
        left: posX,
        top: posY,
        child: Draggable(
          data: table,
          feedback: Material(
            elevation: 8,
            child: Container(
              width: _tableWidth,
              height: _tableHeight,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary, width: 2),
              ),
              child: Center(
                child: Text('T${table['number']}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
              ),
            ),
          ),
          childWhenDragging: Opacity(opacity: 0.3, child: tableWidget),
          onDragEnd: (details) {
            // Save new position
            _saveTablePosition(table, details.offset.dx, details.offset.dy);
          },
          child: tableWidget,
        ),
      );
    }

    return Positioned(left: posX, top: posY, child: tableWidget);
  }

  Future<void> _saveTablePosition(Map<String, dynamic> table, double x, double y) async {
    final clampedX = x.clamp(0.0, _canvasWidth - _tableWidth);
    final clampedY = y.clamp(0.0, _canvasHeight - _tableHeight);
    try {
      await _api.updateTablePosition(table['id'], clampedX, clampedY);
      // Update local state immediately
      setState(() {
        final idx = _tables.indexWhere((t) => t['id'] == table['id']);
        if (idx >= 0) {
          _tables[idx] = {..._tables[idx], 'posX': clampedX, 'posY': clampedY};
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save position: $e'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  void _showTableQuickActions(Map<String, dynamic> table) {
    final status = table['status'] ?? 'FREE';
    final color = AppColors.tableStatusColor(status);
    final duration = _occupiedDuration(table);

    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(color: AppColors.gray300, borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const SizedBox(width: 16),
                Text('Table ${table['number']}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                  child: Text(_statusLabel(status), style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600)),
                ),
                if (duration != null && status == 'OCCUPIED') ...[
                  const SizedBox(width: 8),
                  Text(_formatDuration(duration), style: TextStyle(fontSize: 12, color: AppColors.danger)),
                ],
              ],
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: ['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'ORDER_READY', 'BILLING'].map((s) {
                final isSelected = status == s;
                return ActionChip(
                  label: Text(_statusLabel(s), style: const TextStyle(fontSize: 12)),
                  onPressed: isSelected ? null : () async {
                    Navigator.pop(ctx);
                    try {
                      await _api.updateTableStatus(table['id'], s);
                      _loadFloorPlan();
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger),
                        );
                      }
                    }
                  },
                  backgroundColor: isSelected ? color.withValues(alpha: 0.15) : null,
                  side: BorderSide(color: isSelected ? color : Theme.of(context).colorScheme.outline),
                );
              }              ).toList(),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

/// Custom painter for grid lines on the floor plan canvas.
class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.grey.withValues(alpha: 0.1)
      ..strokeWidth = 1;

    const gridSize = 40.0;
    for (double x = 0; x < size.width; x += gridSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += gridSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
