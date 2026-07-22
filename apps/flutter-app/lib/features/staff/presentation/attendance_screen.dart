import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../shared/widgets/shared_widgets.dart';

class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  late final dynamic _api;
  List<dynamic> _attendance = [];
  List<dynamic> _staff = [];
  bool _isLoading = true;
  String _filter = 'all'; // all, clocked-in, not-clocked

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final branchId = ref.read(appStateProvider).branchId ?? '';
      final results = await Future.wait<dynamic>([
        _api.getTodayAttendance(branchId: branchId),
        _api.getStaff(branchId: branchId).then((r) => r is Map ? List<dynamic>.from(r['staff'] ?? []) : r),
      ]);
      if (mounted) {
        setState(() {
          _attendance = results[0];
          _staff = results[1];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _clockIn(String staffId) async {
    try {
      await _api.clockIn(staffId);
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Clocked in successfully'), backgroundColor: AppColors.success),
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

  Future<void> _clockOut(String staffId) async {
    try {
      await _api.clockOut(staffId);
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Clocked out successfully'), backgroundColor: AppColors.success),
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

  bool _isClockedIn(String staffId) {
    return _attendance.any((a) => a['staffId'] == staffId && a['checkOut'] == null);
  }

  bool _hasAttendanceToday(String staffId) {
    return _attendance.any((a) => a['staffId'] == staffId);
  }

  Map<String, dynamic>? _getAttendanceRecord(String staffId) {
    try {
      return _attendance.cast<Map<String, dynamic>>().firstWhere((a) => a['staffId'] == staffId);
    } catch (_) {
      return null;
    }
  }

  Duration? _getWorkDuration(Map<String, dynamic> record) {
    final checkIn = DateTime.tryParse(record['checkIn'] ?? '');
    final checkOut = DateTime.tryParse(record['checkOut'] ?? '');
    if (checkIn == null) return null;
    return (checkOut ?? DateTime.now()).difference(checkIn);
  }

  List<dynamic> get _filteredStaff {
    if (_filter == 'all') return _staff;
    return _staff.where((s) {
      final clockedIn = _isClockedIn(s['id']);
      final hasAtt = _hasAttendanceToday(s['id']);
      if (_filter == 'clocked-in') return clockedIn;
      if (_filter == 'not-clocked') return !hasAtt;
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final clockedInCount = _staff.where((s) => _isClockedIn(s['id'])).length;
    final presentCount = _staff.where((s) => _hasAttendanceToday(s['id'])).length;

    return Scaffold(
      appBar: AppBar(
        title: Text('Attendance', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : Column(children: [
              // Summary header
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                color: AppColors.primary50,
                child: Column(children: [
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 16, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text(
                        DateFormat('EEEE, MMM d, yyyy').format(DateTime.now()),
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.gray700),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(children: [
                    _AttendanceStat(
                      label: 'Active', value: '$clockedInCount',
                      color: AppColors.success, icon: Icons.access_time,
                    ),
                    const SizedBox(width: 16),
                    _AttendanceStat(
                      label: 'Present', value: '$presentCount',
                      color: AppColors.primary, icon: Icons.check_circle,
                    ),
                    const SizedBox(width: 16),
                    _AttendanceStat(
                      label: 'Absent', value: '${_staff.length - presentCount}',
                      color: AppColors.warning, icon: Icons.person_off,
                    ),
                    const SizedBox(width: 16),
                    _AttendanceStat(
                      label: 'Total', value: '${_staff.length}',
                      color: AppColors.gray500, icon: Icons.people,
                    ),
                  ]),
                ]),
              ),
              // Filter chips
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(children: [
                  _FilterChip(label: 'All', isSelected: _filter == 'all', onTap: () => setState(() => _filter = 'all')),
                  const SizedBox(width: 6),
                  _FilterChip(label: 'Clocked In', isSelected: _filter == 'clocked-in', onTap: () => setState(() => _filter = 'clocked-in')),
                  const SizedBox(width: 6),
                  _FilterChip(label: 'Not Clocked', isSelected: _filter == 'not-clocked', onTap: () => setState(() => _filter = 'not-clocked')),
                ]),
              ),
              // Staff list
              Expanded(
                child: _filteredStaff.isEmpty
                    ? NxEmptyState(
                        icon: Icons.people_outline,
                        title: _filter == 'all' ? 'No staff found' : 'No staff matching filter',
                      )
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _filteredStaff.length,
                          itemBuilder: (ctx, i) => _buildStaffCard(_filteredStaff[i]),
                        ),
                      ),
              ),
            ]),
    );
  }

  Widget _buildStaffCard(Map<String, dynamic> staff) {
    final staffId = staff['id'];
    final clockedIn = _isClockedIn(staffId);
    final hasAttendance = _hasAttendanceToday(staffId);
    final record = _getAttendanceRecord(staffId);
    final role = staff['role'] as Map<String, dynamic>?;

    String statusText;
    Color statusColor;
    String? durationText;

    if (clockedIn && record != null) {
      final checkIn = DateTime.tryParse(record['checkIn'] ?? '');
      statusText = checkIn != null ? 'Since ${DateFormat('HH:mm').format(checkIn)}' : 'Clocked in';
      statusColor = AppColors.success;
      final duration = _getWorkDuration(record);
      if (duration != null) {
        final hours = duration.inHours;
        final mins = duration.inMinutes % 60;
        durationText = hours > 0 ? '${hours}h ${mins}m' : '${mins}m';
      }
    } else if (hasAttendance && record != null) {
      final duration = _getWorkDuration(record);
      statusText = 'Completed shift';
      statusColor = AppColors.gray500;
      if (duration != null) {
        final hours = duration.inHours;
        final mins = duration.inMinutes % 60;
        durationText = 'Worked ${hours > 0 ? '${hours}h ' : ''}${mins}m';
      }
    } else {
      statusText = 'Not clocked in';
      statusColor = AppColors.gray400;
    }

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            // Avatar with status indicator
            Stack(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: clockedIn
                      ? AppColors.success.withValues(alpha: 0.15)
                      : hasAttendance
                          ? AppColors.gray100
                          : AppColors.primary50,
                  child: Text(
                    (staff['name'] as String? ?? '?')[0].toUpperCase(),
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.bold,
                      color: clockedIn ? AppColors.success : hasAttendance ? AppColors.gray400 : AppColors.primary,
                    ),
                  ),
                ),
                Positioned(
                  right: 0, bottom: 0,
                  child: Container(
                    width: 12, height: 12,
                    decoration: BoxDecoration(
                      color: statusColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Text(staff['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(width: 6),
                    Text(role?['name'] ?? '', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                  ]),
                  const SizedBox(height: 4),
                  Row(children: [
                    Container(
                      width: 8, height: 8,
                      decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 4),
                    Text(statusText, style: GoogleFonts.inter(fontSize: 12, color: statusColor)),
                    if (durationText != null) ...[
                      const SizedBox(width: 8),
                      Icon(Icons.timer, size: 12, color: AppColors.gray400),
                      const SizedBox(width: 2),
                      Text(durationText, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    ],
                  ]),
                ],
              ),
            ),
            // Action button
            if (!hasAttendance)
              ElevatedButton.icon(
                onPressed: () => _clockIn(staffId),
                icon: const Icon(Icons.login, size: 16),
                label: const Text('Clock In'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.success,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                ),
              )
            else if (clockedIn)
              ElevatedButton.icon(
                onPressed: () => _clockOut(staffId),
                icon: const Icon(Icons.logout, size: 16),
                label: const Text('Clock Out'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.warning,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.gray100, borderRadius: BorderRadius.circular(6),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.check, size: 14, color: AppColors.gray400),
                  const SizedBox(width: 4),
                  Text('Done', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                ]),
              ),
          ],
        ),
      ),
    );
  }
}

class _AttendanceStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;
  const _AttendanceStat({required this.label, required this.value, required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(width: 4),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: color)),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
        ],
      ),
    ]);
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(AppDimens.radiusFull),
        ),
        child: Text(label, style: GoogleFonts.inter(
          fontSize: 12, fontWeight: FontWeight.w500,
          color: isSelected ? Colors.white : AppColors.gray600,
        )),
      ),
    );
  }
}
