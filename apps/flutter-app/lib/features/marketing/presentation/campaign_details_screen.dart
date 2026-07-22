import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class CampaignDetailsScreen extends ConsumerStatefulWidget {
  final String campaignId;
  const CampaignDetailsScreen({super.key, required this.campaignId});

  @override
  ConsumerState<CampaignDetailsScreen> createState() => _CampaignDetailsScreenState();
}

class _CampaignDetailsScreenState extends ConsumerState<CampaignDetailsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(marketingProvider.notifier).loadCampaign(widget.campaignId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final mp = ref.watch(marketingProvider);
    final campaign = mp.selectedCampaign;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          campaign?['name'] ?? 'Campaign Details',
          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: mp.campaignLoading
          ? const Center(child: NxFullScreenLoader())
          : campaign == null
              ? Center(
                  child: Text('Campaign not found', style: GoogleFonts.inter(color: AppColors.gray500)),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildInfoCard(campaign),
                      const SizedBox(height: 16),
                      _buildStatsCard(campaign),
                    ],
                  ),
                ),
    );
  }

  Widget _buildInfoCard(Map<String, dynamic> campaign) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(campaign['name'] ?? 'Untitled', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (campaign['description'] != null)
              Text(campaign['description'], style: GoogleFonts.inter(fontSize: 14, color: AppColors.gray600)),
            const SizedBox(height: 12),
            _buildDetailRow('Status', campaign['status'] ?? 'draft'),
            _buildDetailRow('Type', campaign['type'] ?? 'General'),
            _buildDetailRow('Channel', campaign['channel'] ?? 'Email'),
            if (campaign['scheduleDate'] != null)
              _buildDetailRow('Scheduled', campaign['scheduleDate']),
            _buildDetailRow('Created', campaign['createdAt'] ?? ''),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsCard(Map<String, dynamic> campaign) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Performance', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildStatItem('Sent', campaign['sentCount']?.toString() ?? '0', AppColors.primary),
                _buildStatItem('Opened', campaign['openedCount']?.toString() ?? '0', AppColors.info),
                _buildStatItem('Clicked', campaign['clickedCount']?.toString() ?? '0', AppColors.success),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray500)),
          ),
          Expanded(
            child: Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
        ],
      ),
    );
  }
}
