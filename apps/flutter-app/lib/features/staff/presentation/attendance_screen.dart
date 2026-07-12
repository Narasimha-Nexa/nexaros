import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/app_state.dart';
import '../../../core/theme/app_colors.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  final _api = ApiClient();
  List<dynamic> _attendance = [];
  List<dynamic> _staff = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final branchId = context.read<AppState>().branchId ?? '';
      final attendance = await _api.getTodayAttendance(branchId: branchId);
      final staff = await _api.getStaff(branchId: branchId);
      if (mounted) {
        setState(() {
          _attendance = attendance;
          _staff = staff;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Attendance', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Summary header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: AppColors.primary50,
                  child: Row(
                    children: [
                      Text(
                        DateFormat('EEEE, MMM d').format(DateTime.now()),
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.gray700),
                      ),
                      const Spacer(),
                      Text(
                        '${_attendance.where((a) => a['checkOut'] == null).length} active',
                        style: GoogleFonts.inter(fontSize: 13, color: AppColors.success),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '${_attendance.length} present',
                        style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray500),
                      ),
                    ],
                  ),
                ),
                // Staff list
                Expanded(
                  child: _staff.isEmpty
                      ? Center(
                          child: Text('No staff found', style: GoogleFonts.inter(color: AppColors.gray500)),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadData,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(12),
                            itemCount: _staff.length,
                            itemBuilder: (ctx, i) => _buildStaffCard(_staff[i]),
                          ),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildStaffCard(Map<String, dynamic> staff) {
    final staffId = staff['id'];
    final clockedIn = _isClockedIn(staffId);
    final hasAttendance = _hasAttendanceToday(staffId);
    final todayRecord = _attendance.cast<Map<String, dynamic>>().firstWhere(
      (a) => a['staffId'] == staffId,
      orElse: () => {},
    );

    String statusText;
    Color statusColor;
    if (clockedIn) {
      final checkIn = DateTime.tryParse(todayRecord['checkIn'] ?? '');
      statusText = checkIn != null ? 'Since ${DateFormat('HH:mm').format(checkIn)}' : 'Clocked in';
      statusColor = AppColors.success;
    } else if (hasAttendance) {
      statusText = 'Completed shift';
      statusColor = AppColors.gray500;
    } else {
      statusText = 'Not clocked in';
      statusColor = AppColors.gray400;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: clockedIn ? AppColors.success.withValues(alpha: 0.15) : AppColors.gray100,
              child: Text(
                (staff['name'] as String? ?? '?')[0].toUpperCase(),
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  color: clockedIn ? AppColors.success : AppColors.gray500,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(staff['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Container(
                        width: 8, height: 8,
                        decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 4),
                      Text(statusText, style: GoogleFonts.inter(fontSize: 12, color: statusColor)),
                    ],
                  ),
                ],
              ),
            ),
            if (!hasAttendance)
              ElevatedButton(
                onPressed: () => _clockIn(staffId),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.success,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  textStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
                ),
                child: const Text('Clock In'),
              )
            else if (clockedIn)
              ElevatedButton(
                onPressed: () => _clockOut(staffId),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.warning,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  textStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
                ),
                child: const Text('Clock Out'),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.gray100,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text('Done', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
              ),
          ],
        ),
      ),
    );
  }
}
