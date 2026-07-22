import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../data/support_models.dart';

class SupportDashboardScreen extends ConsumerStatefulWidget {
  const SupportDashboardScreen({super.key});
  @override
  ConsumerState<SupportDashboardScreen> createState() => _SupportDashboardScreenState();
}

class _SupportDashboardScreenState extends ConsumerState<SupportDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = ref.read(supportProvider);
      provider.loadStats();
      provider.loadTickets();
    });
  }

  @override
  Widget build(BuildContext context) {
    final support = ref.watch(supportProvider);
    final supportState = support.state;
    final stats = supportState.stats;

    return Scaffold(
      appBar: AppBar(title: Text('Support Center', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: supportState.isLoading && stats == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async { await support.loadStats(); await support.loadTickets(); },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildStatCards(stats),
                    const SizedBox(height: 20),
                    Text('Active Tickets', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    if (supportState.tickets.isEmpty)
                      Card(child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Center(child: Column(children: [
                          Icon(Icons.support_agent, size: 48, color: AppColors.gray300),
                          const SizedBox(height: 8),
                          Text('No support tickets', style: GoogleFonts.inter(color: AppColors.gray400)),
                        ])),
                      ))
                    else
                      ...supportState.tickets.take(10).map((ticket) => _buildTicketCard(ticket)),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatCards(SupportStats? stats) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: [
        _statCard('Open', '${stats?.open ?? 0}', Icons.radio_button_unchecked, AppColors.info),
        _statCard('In Progress', '${stats?.inProgress ?? 0}', Icons.autorenew, AppColors.warning),
        _statCard('Waiting', '${stats?.waitingCustomer ?? 0}', Icons.hourglass_empty, AppColors.secondary),
        _statCard('Resolved', '${stats?.resolved ?? 0}', Icons.check_circle, AppColors.success),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 22),
          Text(value, style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
          Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
        ],
      ),
    );
  }

  Widget _buildTicketCard(SupportTicket ticket) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _priorityColor(ticket.priority).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.support_agent, color: _priorityColor(ticket.priority), size: 20),
        ),
        title: Text(ticket.subject, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14)),
        subtitle: Text(
          ticket.lastMessage?.message ?? ticket.description,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: _statusColor(ticket.status).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                SupportStatusHelpers.statusLabel(ticket.status),
                style: GoogleFonts.inter(fontSize: 10, color: _statusColor(ticket.status), fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _timeAgo(ticket.createdAt),
              style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray400),
            ),
          ],
        ),
        onTap: () => Navigator.pushNamed(context, '/support/ticket/${ticket.id}'),
      ),
    );
  }

  Color _priorityColor(TicketPriority p) {
    switch (p) {
      case TicketPriority.urgent: return AppColors.danger;
      case TicketPriority.high: return AppColors.warning;
      case TicketPriority.normal: return AppColors.info;
      case TicketPriority.low: return AppColors.gray400;
    }
  }

  Color _statusColor(TicketStatus s) {
    switch (s) {
      case TicketStatus.open: return AppColors.info;
      case TicketStatus.inProgress: return AppColors.warning;
      case TicketStatus.waitingCustomer: return AppColors.secondary;
      case TicketStatus.resolved: return AppColors.success;
      case TicketStatus.closed: return AppColors.gray400;
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
