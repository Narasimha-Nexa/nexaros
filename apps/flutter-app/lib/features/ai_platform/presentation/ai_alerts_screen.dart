import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/ai_models.dart';

class AiAlertsScreen extends StatefulWidget {
  const AiAlertsScreen({super.key});

  @override
  State<AiAlertsScreen> createState() => _AiAlertsScreenState();
}

class _AiAlertsScreenState extends State<AiAlertsScreen> {
  final List<AiAlert> _alerts = [
    AiAlert(id: '1', title: 'Revenue Drop Detected', message: 'Revenue dropped 15% compared to last week. Consider running promotions to boost sales.', severity: AiAlertSeverity.critical, category: 'finance', actionLabel: 'View Finance', actionRoute: '/shell/finance', isRead: false, createdAt: DateTime.now().subtract(const Duration(hours: 2))),
    AiAlert(id: '2', title: 'Low Stock Alert', message: 'Tomatoes, Onions, and Chicken are below minimum stock level. Auto-reorder suggested.', severity: AiAlertSeverity.warning, category: 'inventory', actionLabel: 'View Inventory', actionRoute: '/shell/inventory', isRead: false, createdAt: DateTime.now().subtract(const Duration(hours: 5))),
    AiAlert(id: '3', title: 'Kitchen Delay Warning', message: 'Average order preparation time increased to 25 minutes (target: 15 min). 3 orders delayed.', severity: AiAlertSeverity.warning, category: 'kitchen', actionLabel: 'View Kitchen', actionRoute: '/shell/kitchen', isRead: true, createdAt: DateTime.now().subtract(const Duration(hours: 8))),
    AiAlert(id: '4', title: 'High Customer Satisfaction', message: 'Customer satisfaction score reached 4.7/5 this week. Loyalty program members are most active.', severity: AiAlertSeverity.success, category: 'customer', isRead: true, createdAt: DateTime.now().subtract(const Duration(days: 1))),
    AiAlert(id: '5', title: 'Staff Overtime Alert', message: '2 staff members exceeded 48 hours this week. Review scheduling to prevent burnout.', severity: AiAlertSeverity.warning, category: 'staff', actionLabel: 'View Staff', actionRoute: '/shell/staff', isRead: false, createdAt: DateTime.now().subtract(const Duration(hours: 3))),
    AiAlert(id: '6', title: 'Menu Item Performance', message: 'Paneer Tikka sales dropped 30% this month. Consider updating the recipe or running a promotion.', severity: AiAlertSeverity.info, category: 'menu', isRead: true, createdAt: DateTime.now().subtract(const Duration(days: 2))),
    AiAlert(id: '7', title: 'Payment Reconciliation', message: '3 pending payment reconciliations need attention. Total pending: ₹12,500.', severity: AiAlertSeverity.warning, category: 'finance', isRead: false, createdAt: DateTime.now().subtract(const Duration(hours: 6))),
  ];

  String _selectedFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final filtered = _selectedFilter == 'all'
        ? _alerts
        : _selectedFilter == 'unread'
            ? _alerts.where((a) => !a.isRead).toList()
            : _alerts.where((a) => a.category == _selectedFilter).toList();

    return Scaffold(
      appBar: AppBar(title: Text('AI Alerts', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: Column(
        children: [
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: ['all', 'unread', 'finance', 'inventory', 'kitchen', 'staff', 'customer', 'menu'].map((f) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(f == 'all' ? 'All' : f == 'unread' ? 'Unread' : f[0].toUpperCase() + f.substring(1), style: GoogleFonts.inter(fontSize: 11, color: _selectedFilter == f ? AppColors.white : AppColors.gray600)),
                  selected: _selectedFilter == f,
                  onSelected: (_) => setState(() => _selectedFilter = f),
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.gray100,
                ),
              )).toList(),
            ),
          ),
          Expanded(
            child: filtered.isEmpty
                ? const NxEmptyState(icon: Icons.notifications_none, title: 'No alerts')
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (ctx, i) => _buildAlertCard(filtered[i]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertCard(AiAlert alert) {
    final color = switch (alert.severity) {
      AiAlertSeverity.critical => AppColors.danger,
      AiAlertSeverity.warning => AppColors.warning,
      AiAlertSeverity.success => AppColors.success,
      _ => AppColors.info,
    };
    final icon = switch (alert.severity) {
      AiAlertSeverity.critical => Icons.error,
      AiAlertSeverity.warning => Icons.warning,
      AiAlertSeverity.success => Icons.check_circle,
      _ => Icons.info,
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: alert.isRead ? AppColors.gray200 : color.withValues(alpha: 0.3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                  child: Icon(icon, color: color, size: 16),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(alert.title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                          ),
                          if (!alert.isRead)
                            Container(width: 8, height: 8, decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                        ],
                      ),
                      Text(_formatTime(alert.createdAt), style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(alert.message, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray700, height: 1.4)),
            if (alert.actionLabel != null) ...[
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerRight,
                child: OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(side: BorderSide(color: color), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4)),
                  child: Text(alert.actionLabel!, style: GoogleFonts.inter(fontSize: 11, color: color)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
