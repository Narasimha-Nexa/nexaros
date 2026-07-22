import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/staff_models.dart';

class StaffCommunicationScreen extends ConsumerStatefulWidget {
  const StaffCommunicationScreen({super.key});
  @override
  ConsumerState<StaffCommunicationScreen> createState() => _StaffCommunicationScreenState();
}

class _StaffCommunicationScreenState extends ConsumerState<StaffCommunicationScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final branchId = ref.read(appStateProvider).branchId ?? '';
      ref.read(staffProvider).loadAnnouncements(branchId: branchId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final staffProv = ref.watch(staffProvider);
    final announcements = staffProv.state.announcements;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Staff Communication'),
        actions: [
          IconButton(icon: const Icon(Icons.campaign), onPressed: () => _showAnnouncementDialog(context)),
        ],
      ),
      body: staffProv.state.isLoading
          ? const NxFullScreenLoader(message: 'Loading announcements...')
          : announcements.isEmpty
              ? const NxEmptyState(icon: Icons.campaign, title: 'No Announcements', subtitle: 'Post announcements for your team')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: announcements.length,
                  itemBuilder: (context, i) => _buildAnnouncementCard(context, announcements[i]),
                ),
    );
  }

  Widget _buildAnnouncementCard(BuildContext context, Announcement a) {
    final priorityColor = a.priority == AnnouncementPriority.urgent ? AppColors.danger
        : a.priority == AnnouncementPriority.high ? AppColors.warning
        : AppColors.primary;

    return NxCard(
      margin: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border(left: BorderSide(color: priorityColor, width: 4)),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: priorityColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(a.priority.name.toUpperCase(), style: TextStyle(fontSize: 10, color: priorityColor, fontWeight: FontWeight.bold)),
                ),
                const Spacer(),
                Text(DateFormat('MMM d, HH:mm').format(a.createdAt), style: const TextStyle(fontSize: 11, color: AppColors.gray500)),
              ],
            ),
            const SizedBox(height: 8),
            Text(a.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text(a.content, style: const TextStyle(fontSize: 13, color: AppColors.gray700)),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.person, size: 14, color: AppColors.gray500),
                const SizedBox(width: 4),
                Text(a.authorName ?? 'Admin', style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
                const Spacer(),
                const Icon(Icons.visibility, size: 14, color: AppColors.gray500),
                const SizedBox(width: 4),
                Text('${a.readCount} views', style: const TextStyle(fontSize: 11, color: AppColors.gray500)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showAnnouncementDialog(BuildContext context) {
    final titleCtrl = TextEditingController();
    final contentCtrl = TextEditingController();
    AnnouncementPriority priority = AnnouncementPriority.normal;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('New Announcement'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title *')),
                const SizedBox(height: 12),
                TextField(controller: contentCtrl, decoration: const InputDecoration(labelText: 'Content *'), maxLines: 4),
                const SizedBox(height: 12),
                DropdownButtonFormField<AnnouncementPriority>(
                  value: priority,
                  decoration: const InputDecoration(labelText: 'Priority'),
                  items: AnnouncementPriority.values.map((p) => DropdownMenuItem(value: p, child: Text(p.name.toUpperCase()))).toList(),
                  onChanged: (v) => setDialogState(() => priority = v!),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final branchId = ref.read(appStateProvider).branchId ?? '';
                await ref.read(staffProvider).loadAnnouncements(branchId: branchId);
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: const Text('Post'),
            ),
          ],
        ),
      ),
    );
  }
}
