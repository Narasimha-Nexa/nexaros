import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import 'package:flutter/services.dart';

class ReservationScreen extends ConsumerStatefulWidget {
  const ReservationScreen({super.key});

  @override
  ConsumerState<ReservationScreen> createState() => _ReservationScreenState();
}

class _ReservationScreenState extends ConsumerState<ReservationScreen> {
  late final _api;
  List<dynamic> _reservations = [];
  List<dynamic> _tables = [];
  bool _isLoading = true;
  DateTime _selectedDate = DateTime.now();
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final branchId = ref.read(appStateProvider).branchId;
      final results = await Future.wait<dynamic>([
        _api.getReservations(
          date: DateFormat('yyyy-MM-dd').format(_selectedDate),
          branchId: branchId,
        ),
        _api.getTables(branchId: branchId),
      ]);
      if (mounted) {
        setState(() {
          _reservations = results[0];
          _tables = results[1];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _showCreateDialog() async {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final guestCtrl = TextEditingController(text: '2');
    final notesCtrl = TextEditingController();
    String? selectedTableId;
    TimeOfDay selectedTime = TimeOfDay.now();

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('New Reservation'),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Customer Name', prefixIcon: Icon(Icons.person, size: 20)),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: phoneCtrl,
                decoration: const InputDecoration(labelText: 'Phone', prefixIcon: Icon(Icons.phone, size: 20)),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final picked = await showTimePicker(
                        context: ctx,
                        initialTime: selectedTime,
                      );
                      if (picked != null) {
                        setDialogState(() => selectedTime = picked);
                      }
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'Time', prefixIcon: Icon(Icons.access_time, size: 20)),
                      child: Text(selectedTime.format(ctx)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: guestCtrl,
                    decoration: const InputDecoration(labelText: 'Guests', prefixIcon: Icon(Icons.people, size: 20)),
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  ),
                ),
              ]),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: 'Table (optional)', prefixIcon: Icon(Icons.table_restaurant, size: 20)),
                items: [
                  const DropdownMenuItem<String>(value: null, child: Text('No table assigned')),
                  ..._tables
                    .where((t) => t['status'] == 'FREE' || t['status'] == 'RESERVED')
                    .map<DropdownMenuItem<String>>((t) => DropdownMenuItem<String>(
                      value: t['id'] as String?,
                      child: Text('Table ${t['number']} (${t['capacity']} seats)'),
                    )),
                ],
                onChanged: (v) => setDialogState(() => selectedTableId = v),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: notesCtrl,
                decoration: const InputDecoration(labelText: 'Notes', prefixIcon: Icon(Icons.notes, size: 20)),
                maxLines: 2,
              ),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(onPressed: () async {
              if (nameCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty) return;
              await _api.createReservation({
                'customerName': nameCtrl.text.trim(),
                'customerPhone': phoneCtrl.text.trim(),
                'date': DateFormat('yyyy-MM-dd').format(_selectedDate),
                'time': '${selectedTime.hour.toString().padLeft(2, '0')}:${selectedTime.minute.toString().padLeft(2, '0')}',
                'guestCount': int.tryParse(guestCtrl.text) ?? 2,
                if (selectedTableId != null) 'tableId': selectedTableId,
                if (notesCtrl.text.trim().isNotEmpty) 'notes': notesCtrl.text.trim(),
              });
              if (ctx.mounted) Navigator.pop(ctx, true);
            }, child: const Text('Create')),
          ],
        ),
      ),
    );
    if (saved == true) _loadData();
  }

  Future<void> _updateStatus(String id, String status) async {
    try {
      await _api.updateReservation(id, {'status': status});
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Reservation ${status.toLowerCase()}'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'CONFIRMED': return AppColors.warning;
      case 'ARRIVED': return AppColors.success;
      case 'COMPLETED': return AppColors.gray500;
      case 'CANCELLED': return AppColors.danger;
      case 'NO_SHOW': return AppColors.gray400;
      default: return AppColors.gray400;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'CONFIRMED': return Icons.schedule;
      case 'ARRIVED': return Icons.check_circle;
      case 'COMPLETED': return Icons.done_all;
      case 'CANCELLED': return Icons.cancel;
      case 'NO_SHOW': return Icons.person_off;
      default: return Icons.circle;
    }
  }

  List<Map<String, dynamic>> get _filteredReservations {
    var list = _reservations.cast<Map<String, dynamic>>();
    if (_statusFilter != null) {
      list = list.where((r) => r['status'] == _statusFilter).toList();
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredReservations;
    final statusCounts = <String, int>{};
    for (final r in _reservations) {
      final s = r['status'] as String? ?? 'CONFIRMED';
      statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Reservations', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: _showCreateDialog),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
      ),
      body: Column(
        children: [
          // Date navigator
          Container(
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
            color: AppColors.primary50,
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () => setState(() { _selectedDate = _selectedDate.subtract(const Duration(days: 1)); _loadData(); }),
                ),
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _selectedDate,
                        firstDate: DateTime.now().subtract(const Duration(days: 30)),
                        lastDate: DateTime.now().add(const Duration(days: 90)),
                      );
                      if (picked != null) setState(() { _selectedDate = picked; _loadData(); });
                    },
                    child: Text(
                      DateFormat('EEEE, MMM d, yyyy').format(_selectedDate),
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () => setState(() { _selectedDate = _selectedDate.add(const Duration(days: 1)); _loadData(); }),
                ),
              ],
            ),
          ),
          // Status filter chips
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('All', null, statusCounts.values.fold(0, (a, b) => a + b)),
                  _buildFilterChip('Confirmed', 'CONFIRMED', statusCounts['CONFIRMED'] ?? 0),
                  _buildFilterChip('Arrived', 'ARRIVED', statusCounts['ARRIVED'] ?? 0),
                  _buildFilterChip('Completed', 'COMPLETED', statusCounts['COMPLETED'] ?? 0),
                  _buildFilterChip('No Show', 'NO_SHOW', statusCounts['NO_SHOW'] ?? 0),
                  _buildFilterChip('Cancelled', 'CANCELLED', statusCounts['CANCELLED'] ?? 0),
                ],
              ),
            ),
          ),
          // Reservation list
          Expanded(
            child: _isLoading
                ? const NxFullScreenLoader()
                : filtered.isEmpty
                    ? NxEmptyState(
                        icon: Icons.event_busy,
                        title: 'No reservations for this date',
                        actionLabel: 'Add Reservation',
                        onAction: _showCreateDialog,
                      )
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: filtered.length,
                          itemBuilder: (ctx, i) => _buildReservationCard(filtered[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String? filter, int count) {
    final isSelected = _statusFilter == filter;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text('$label ($count)', style: GoogleFonts.inter(fontSize: 12)),
        selected: isSelected,
        onSelected: (_) => setState(() => _statusFilter = isSelected ? null : filter),
        selectedColor: AppColors.primary.withValues(alpha: 0.15),
        labelStyle: TextStyle(color: isSelected ? AppColors.primary : AppColors.gray600),
      ),
    );
  }

  Widget _buildReservationCard(Map<String, dynamic> r) {
    final status = r['status'] as String? ?? 'CONFIRMED';
    final color = _statusColor(status);
    final table = r['table'] as Map<String, dynamic>?;
    final time = r['time'] as String? ?? '--:--';
    final guestCount = r['guestCount'] ?? 1;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: color.withValues(alpha: 0.3), width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(_statusIcon(status), color: color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(r['customerName'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15)),
                    const SizedBox(height: 2),
                    Row(children: [
                      Icon(Icons.access_time, size: 14, color: AppColors.gray400),
                      const SizedBox(width: 4),
                      Text(time, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13, color: AppColors.gray600)),
                      const SizedBox(width: 12),
                      Icon(Icons.people, size: 14, color: AppColors.gray400),
                      const SizedBox(width: 4),
                      Text('$guestCount guests', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    ]),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(status, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
              ),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              if (table != null) ...[
                Icon(Icons.table_restaurant, size: 14, color: AppColors.gray400),
                const SizedBox(width: 4),
                Text('Table ${table['number'] ?? '-'} (${table['capacity'] ?? '?'} seats)', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                const Spacer(),
              ],
              if (r['phone'] != null || r['customerPhone'] != null) ...[
                Icon(Icons.phone, size: 14, color: AppColors.gray400),
                const SizedBox(width: 4),
                Text(r['customerPhone'] ?? r['phone'] ?? '', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
              ],
            ]),
            if (r['notes'] != null && (r['notes'] as String).isNotEmpty) ...[
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.gray50,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(r['notes'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500, fontStyle: FontStyle.italic)),
              ),
            ],
            if (status == 'CONFIRMED') ...[
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                  child: SizedBox(
                    height: 32,
                    child: OutlinedButton.icon(
                      onPressed: () => _updateStatus(r['id'], 'CANCELLED'),
                      icon: const Icon(Icons.cancel, size: 16),
                      label: const Text('Cancel', style: TextStyle(fontSize: 12)),
                      style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger, side: const BorderSide(color: AppColors.danger)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: SizedBox(
                    height: 32,
                    child: ElevatedButton.icon(
                      onPressed: () => _updateStatus(r['id'], 'ARRIVED'),
                      icon: const Icon(Icons.check_circle, size: 16),
                      label: const Text('Arrived', style: TextStyle(fontSize: 12)),
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                    ),
                  ),
                ),
              ]),
            ] else if (status == 'ARRIVED') ...[
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                  child: SizedBox(
                    height: 32,
                    child: OutlinedButton.icon(
                      onPressed: () => _updateStatus(r['id'], 'NO_SHOW'),
                      icon: const Icon(Icons.person_off, size: 16),
                      label: const Text('No Show', style: TextStyle(fontSize: 12)),
                      style: OutlinedButton.styleFrom(foregroundColor: AppColors.warning, side: const BorderSide(color: AppColors.warning)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: SizedBox(
                    height: 32,
                    child: ElevatedButton.icon(
                      onPressed: () => _updateStatus(r['id'], 'COMPLETED'),
                      icon: const Icon(Icons.done_all, size: 16),
                      label: const Text('Complete', style: TextStyle(fontSize: 12)),
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                    ),
                  ),
                ),
              ]),
            ],
          ],
        ),
      ),
    );
  }
}
