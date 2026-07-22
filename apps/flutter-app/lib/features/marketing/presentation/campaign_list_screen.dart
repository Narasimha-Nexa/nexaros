import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';
import 'create_campaign_screen.dart';
import 'campaign_details_screen.dart';

class CampaignListScreen extends ConsumerStatefulWidget {
  const CampaignListScreen({super.key});
  @override
  ConsumerState<CampaignListScreen> createState() => _CampaignListScreenState();
}

class _CampaignListScreenState extends ConsumerState<CampaignListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  final _tabs = ['Active', 'Drafts', 'Scheduled', 'Completed'];
  final _tabStatuses = ['active', 'draft', 'scheduled', 'completed'];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: _tabs.length, vsync: this);
    _tabCtrl.addListener(() {
      if (!_tabCtrl.indexIsChanging) _load();
    });
    ref.read(marketingProvider.notifier).loadCampaigns();
  }

  Future<void> _load() async {
    final status = _tabStatuses[_tabCtrl.index];
    await ref.read(marketingProvider.notifier).loadCampaigns(status: status);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mp = ref.watch(marketingProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('Campaigns', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabCtrl,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          indicatorColor: Colors.white,
          tabs: _tabs.map((t) => Tab(text: t)).toList(),
        ),
      ),
      body: mp.campaignsLoading && mp.campaigns.isEmpty
          ? const Center(child: NxFullScreenLoader())
          : mp.campaigns.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.campaign_outlined, size: 64, color: AppColors.gray300),
                        const SizedBox(height: 16),
                        Text('No campaigns yet',
                            style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.gray500)),
                        const SizedBox(height: 8),
                        Text('Create your first marketing campaign to get started.',
                            style: GoogleFonts.inter(fontSize: 14, color: AppColors.gray400)),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: mp.campaigns.length,
                    itemBuilder: (ctx, i) {
                      final c = mp.campaigns[i];
                      return _CampaignCard(
                        campaign: c,
                        onTap: () => _openDetails(c),
                        onEdit: c['status'] == 'draft'
                            ? () => _editCampaign(c)
                            : null,
                        onLaunch: c['status'] == 'draft'
                            ? () => _confirmLaunch(c)
                            : null,
                        onCancel: c['status'] == 'active' || c['status'] == 'scheduled'
                            ? () => _confirmCancel(c)
                            : null,
                        onDelete: c['status'] == 'draft'
                            ? () => _confirmDelete(c)
                            : null,
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const CreateCampaignScreen()),
        ),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _openDetails(Map<String, dynamic> c) {
    final id = c['id'] as String;
    final provider = ref.read(marketingProvider.notifier);
    provider.loadCampaign(id).then((_) {
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => CampaignDetailsScreen(campaignId: id),
        ),
      );
    });
  }

  void _editCampaign(Map<String, dynamic> c) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CreateCampaignScreen(campaign: c),
      ),
    );
  }

  void _confirmLaunch(Map<String, dynamic> c) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Launch Campaign'),
        content: Text('Are you sure you want to launch "${c['name']}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(marketingProvider.notifier).launchCampaign(c['id']);
            },
            child: const Text('Launch'),
          ),
        ],
      ),
    );
  }

  void _confirmCancel(Map<String, dynamic> c) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Campaign'),
        content: Text('Are you sure you want to cancel "${c['name']}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('No')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(marketingProvider.notifier).cancelCampaign(c['id']);
            },
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(Map<String, dynamic> c) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Campaign'),
        content: Text('Delete "${c['name']}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(marketingProvider.notifier).deleteCampaign(c['id']);
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _CampaignCard extends StatelessWidget {
  final Map<String, dynamic> campaign;
  final VoidCallback onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onLaunch;
  final VoidCallback? onCancel;
  final VoidCallback? onDelete;

  const _CampaignCard({
    required this.campaign,
    required this.onTap,
    this.onEdit,
    this.onLaunch,
    this.onCancel,
    this.onDelete,
  });

  Color _statusColor(String? status) {
    switch (status) {
      case 'active':
        return AppColors.success;
      case 'draft':
        return AppColors.gray400;
      case 'scheduled':
        return AppColors.info;
      case 'completed':
        return AppColors.gray500;
      case 'cancelled':
        return AppColors.danger;
      default:
        return AppColors.gray400;
    }
  }

  Color _typeColor(String? type) {
    switch (type) {
      case 'Promotional':
        return AppColors.primary;
      case 'Seasonal':
        return AppColors.success;
      case 'Festival':
        return AppColors.warning;
      case 'Re-engagement':
        return AppColors.secondary;
      case 'Birthday':
        return Colors.pink;
      case 'Anniversary':
        return Colors.amber;
      case 'Feedback':
        return AppColors.info;
      default:
        return AppColors.gray500;
    }
  }

  IconData _channelIcon(String? channel) {
    switch (channel) {
      case 'Email':
        return Icons.email_outlined;
      case 'SMS':
        return Icons.sms_outlined;
      case 'Both':
        return Icons.compare_arrows;
      default:
        return Icons.campaign_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = campaign['name'] ?? 'Untitled';
    final status = campaign['status'] as String?;
    final type = campaign['type'] as String?;
    final channel = campaign['channel'] as String?;
    final scheduleDate = campaign['scheduleDate'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: Icon(_channelIcon(channel), color: AppColors.primary, size: 28),
        title: Row(
          children: [
            Expanded(
              child: Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: _statusColor(status).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                status?.toUpperCase() ?? 'UNKNOWN',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: _statusColor(status),
                ),
              ),
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: _typeColor(type).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  type ?? 'General',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: _typeColor(type),
                  ),
                ),
              ),
              if (scheduleDate != null) ...[
                const SizedBox(width: 8),
                Icon(Icons.schedule, size: 12, color: AppColors.gray400),
                const SizedBox(width: 3),
                Text(
                  scheduleDate,
                  style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400),
                ),
              ],
            ],
          ),
        ),
        trailing: (onEdit != null || onLaunch != null || onCancel != null || onDelete != null)
            ? PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, size: 18),
                onSelected: (v) {
                  switch (v) {
                    case 'edit':
                      onEdit?.call();
                    case 'launch':
                      onLaunch?.call();
                    case 'cancel':
                      onCancel?.call();
                    case 'delete':
                      onDelete?.call();
                  }
                },
                itemBuilder: (_) => [
                  if (onEdit != null)
                    const PopupMenuItem(value: 'edit', child: Text('Edit')),
                  if (onLaunch != null)
                    const PopupMenuItem(value: 'launch', child: Text('Launch')),
                  if (onCancel != null)
                    const PopupMenuItem(value: 'cancel', child: Text('Cancel')),
                  if (onDelete != null)
                    const PopupMenuItem(value: 'delete', child: Text('Delete')),
                ],
              )
            : null,
      ),
    );
  }
}
