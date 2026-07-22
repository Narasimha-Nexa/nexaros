import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../data/support_models.dart';

class TicketDetailScreen extends ConsumerStatefulWidget {
  final String ticketId;
  const TicketDetailScreen({super.key, required this.ticketId});
  @override
  ConsumerState<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends ConsumerState<TicketDetailScreen> {
  final _msgCtrl = TextEditingController();
  bool _isInternal = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(supportProvider).loadTicket(widget.ticketId);
    });
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final support = ref.watch(supportProvider);
    final supportState = support.state;
    final ticket = supportState.selectedTicket;

    if (supportState.isLoading && ticket == null) {
      return Scaffold(appBar: AppBar(title: const Text('Ticket')), body: const Center(child: CircularProgressIndicator()));
    }
    if (ticket == null) {
      return Scaffold(appBar: AppBar(title: const Text('Ticket')), body: const Center(child: Text('Ticket not found')));
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(ticket.subject, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          PopupMenuButton<String>(
            onSelected: (v) async {
              await ref.read(supportProvider).updateStatus(ticket.id, v);
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(value: 'IN_PROGRESS', child: Text('Mark In Progress')),
              const PopupMenuItem(value: 'WAITING_CUSTOMER', child: Text('Mark Waiting')),
              const PopupMenuItem(value: 'RESOLVED', child: Text('Mark Resolved')),
              const PopupMenuItem(value: 'CLOSED', child: Text('Mark Closed')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          _buildTicketInfo(ticket),
          const Divider(height: 1),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: ticket.messages.length,
              itemBuilder: (ctx, i) => _buildMessage(ticket.messages[i]),
            ),
          ),
          _buildMessageInput(ticket),
        ],
      ),
    );
  }

  Widget _buildTicketInfo(SupportTicket ticket) {
    return Container(
      padding: const EdgeInsets.all(12),
      color: AppColors.gray50,
      child: Row(
        children: [
          _infoChip('Status', SupportStatusHelpers.statusLabel(ticket.status), _statusColor(ticket.status)),
          const SizedBox(width: 8),
          _infoChip('Priority', SupportStatusHelpers.priorityLabel(ticket.priority), _priorityColor(ticket.priority)),
          const SizedBox(width: 8),
          _infoChip('Messages', '${ticket.messages.length}', AppColors.info),
        ],
      ),
    );
  }

  Widget _infoChip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
      child: Text('$label: $value', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
    );
  }

  Widget _buildMessage(TicketMessage msg) {
    final isCustomer = msg.senderType == SenderType.customer;
    return Align(
      alignment: isCustomer ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: msg.isInternal ? AppColors.warning.withValues(alpha: 0.1) : (isCustomer ? AppColors.gray100 : AppColors.primary.withValues(alpha: 0.1)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Text(msg.senderType.name.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.gray500)),
              if (msg.isInternal) ...[
                const SizedBox(width: 6),
                Container(padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1), decoration: BoxDecoration(color: AppColors.warning, borderRadius: BorderRadius.circular(4)),
                  child: Text('INTERNAL', style: GoogleFonts.inter(fontSize: 8, color: Colors.white, fontWeight: FontWeight.bold))),
              ],
              const Spacer(),
              Text(_timeAgo(msg.createdAt), style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray400)),
            ]),
            const SizedBox(height: 4),
            Text(msg.message, style: GoogleFonts.inter(fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageInput(SupportTicket ticket) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.gray200))),
      child: Row(
        children: [
          IconButton(
            icon: Icon(_isInternal ? Icons.lock : Icons.lock_open, size: 20, color: _isInternal ? AppColors.warning : AppColors.gray400),
            tooltip: _isInternal ? 'Internal Note' : 'Reply to Customer',
            onPressed: () => setState(() => _isInternal = !_isInternal),
          ),
          Expanded(
            child: TextField(
              controller: _msgCtrl,
              decoration: InputDecoration(
                hintText: _isInternal ? 'Internal note...' : 'Type a message...',
                isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              maxLines: null,
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.send, size: 20),
            color: AppColors.primary,
            onPressed: () async {
              if (_msgCtrl.text.trim().isEmpty) return;
              final success = await ref.read(supportProvider).addMessage(
                ticket.id, message: _msgCtrl.text.trim(), isInternal: _isInternal,
              );
              if (success) _msgCtrl.clear();
            },
          ),
        ],
      ),
    );
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

  Color _priorityColor(TicketPriority p) {
    switch (p) {
      case TicketPriority.urgent: return AppColors.danger;
      case TicketPriority.high: return AppColors.warning;
      case TicketPriority.normal: return AppColors.info;
      case TicketPriority.low: return AppColors.gray400;
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
