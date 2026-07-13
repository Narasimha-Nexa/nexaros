import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/app_state.dart';
import '../../../core/theme/app_colors.dart';

class ShiftScheduleScreen extends StatefulWidget {
  const ShiftScheduleScreen({super.key});

  @override
  State<ShiftScheduleScreen> createState() => _ShiftScheduleScreenState();
}

class _ShiftScheduleScreenState extends State<ShiftScheduleScreen> {
  final _api = ApiClient();
  List<dynamic> _schedule = [];
  List<dynamic> _shifts = [];
  List<dynamic> _staff = [];
  bool _isLoading = true;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() => _isLoading = true);
    try {
      final branchId = context.read<AppState>().branchId ?? '';
      final results = await Future.wait([
        _api.getSchedule(branchId, DateFormat('yyyy-MM-dd').format(_selectedDate)),
        _api.getShifts(branchId: branchId),
        _api.getStaff(branchId: branchId),
      ]);
      if (mounted) {
        setState(() {
          _schedule = results[0];
          _shifts = results[1];
          _staff = results[2];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _showCreateShiftDialog() async {
    final nameCtrl = TextEditingController();
    final startCtrl = TextEditingController(text: '09:00');
    final endCtrl = TextEditingController(text: '18:00');
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create Shift'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Shift Name')),
          const SizedBox(height: 12),
          TextField(controller: startCtrl, decoration: const InputDecoration(labelText: 'Start Time')),
          const SizedBox(height: 12),
          TextField(controller: endCtrl, decoration: const InputDecoration(labelText: 'End Time')),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () async {
            final branchId = context.read<AppState>().branchId ?? '';
            await _api.createShift(branchId, {'name': nameCtrl.text, 'startTime': startCtrl.text, 'endTime': endCtrl.text});
            if (ctx.mounted) Navigator.pop(ctx, true);
          }, child: const Text('Create')),
        ],
      ),
    );
    if (saved == true) _loadAll();
  }

  Future<void> _assignStaff() async {
    String? selectedShiftId;
    final selectedStaff = <String>{};
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Assign Staff to Shift'),
          content: SizedBox(
            width: double.maxFinite,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: 'Shift'),
                items: _shifts.map<DropdownMenuItem<String>>((s) => DropdownMenuItem<String>(value: '${s['id']}', child: Text(s['name']))).toList(),
                onChanged: (v) => setDialogState(() => selectedShiftId = v),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView(
                  children: _staff.map((s) => CheckboxListTile(
                    title: Text(s['name']),
                    value: selectedStaff.contains(s['id']),
                    onChanged: (v) {
                      setDialogState(() {
                        if (v == true) {
                          selectedStaff.add(s['id']);
                        } else {
                          selectedStaff.remove(s['id']);
                        }
                      });
                    },
                  )).toList(),
                ),
              ),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(onPressed: () async {
              if (selectedShiftId == null) return;
              final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
              for (final sid in selectedStaff) {
                await _api.assignShift(sid, selectedShiftId!, dateStr);
              }
              if (ctx.mounted) Navigator.pop(ctx, true);
            }, child: const Text('Assign')),
          ],
        ),
      ),
    );
    if (saved == true) _loadAll();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Shift Schedule', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: _showCreateShiftDialog),
          IconButton(icon: const Icon(Icons.assignment_add), onPressed: _assignStaff),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            color: AppColors.primary50,
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () => setState(() { _selectedDate = _selectedDate.subtract(const Duration(days: 1)); _loadAll(); }),
                ),
                Expanded(
                  child: Text(
                    DateFormat('EEEE, MMM d, yyyy').format(_selectedDate),
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () => setState(() { _selectedDate = _selectedDate.add(const Duration(days: 1)); _loadAll(); }),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _schedule.isEmpty
                    ? Center(child: Text('No schedule for this date', style: GoogleFonts.inter(color: AppColors.gray500)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _schedule.length,
                        itemBuilder: (ctx, i) => _buildScheduleCard(_schedule[i]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleCard(Map<String, dynamic> entry) {
    final staff = entry['staff'] as Map<String, dynamic>?;
    final shift = entry['shift'] as Map<String, dynamic>?;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.primary50,
          child: Text((staff?['name'] as String? ?? '?')[0], style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppColors.primary)),
        ),
        title: Text(staff?['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        subtitle: Text('${shift?['name'] ?? ''} (${shift?['startTime'] ?? ''} - ${shift?['endTime'] ?? ''})', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: (entry['status'] == 'CHECKED_IN' ? AppColors.success : AppColors.gray100).withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(entry['status'] ?? 'ASSIGNED', style: GoogleFonts.inter(fontSize: 11, color: entry['status'] == 'CHECKED_IN' ? AppColors.success : AppColors.gray500)),
        ),
      ),
    );
  }
}
