import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/ai_models.dart';
import '../../../core/providers/riverpod_providers.dart';

class AiReportsScreen extends ConsumerStatefulWidget {
  const AiReportsScreen({super.key});

  @override
  ConsumerState<AiReportsScreen> createState() => _AiReportsScreenState();
}

class _AiReportsScreenState extends ConsumerState<AiReportsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(aiReportsProvider).loadReports();
    });
  }

  @override
  Widget build(BuildContext context) {
    final reportsProvider = ref.watch(aiReportsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('AI Reports', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.add_circle_outline, size: 20),
            onSelected: (type) async {
              final report = await reportsProvider.generateReport(type);
              if (report != null && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Report generated: ${report.title}')));
              }
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(value: 'weekly', child: Text('Weekly Report')),
              const PopupMenuItem(value: 'monthly', child: Text('Monthly Report')),
              const PopupMenuItem(value: 'branch', child: Text('Branch Comparison')),
              const PopupMenuItem(value: 'menu', child: Text('Menu Analysis')),
              const PopupMenuItem(value: 'staff', child: Text('Staff Performance')),
            ],
          ),
        ],
      ),
      body: reportsProvider.isLoading
          ? const Center(child: NxFullScreenLoader())
          : reportsProvider.reports.isEmpty
              ? const NxEmptyState(icon: Icons.description, title: 'No reports generated yet', subtitle: 'Tap + to generate your first AI report')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: reportsProvider.reports.length,
                  itemBuilder: (ctx, i) => _buildReportCard(reportsProvider.reports[i]),
                ),
    );
  }

  Widget _buildReportCard(AiReport report) {
    final typeIcon = switch (report.type) {
      'weekly' => Icons.date_range,
      'monthly' => Icons.calendar_month,
      'branch' => Icons.store,
      'menu' => Icons.restaurant_menu,
      'staff' => Icons.people,
      _ => Icons.description,
    };

    return NxCard(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(typeIcon, color: AppColors.primary, size: 20),
        ),
        title: Text(report.title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
        subtitle: Text(
          report.content.length > 120 ? '${report.content.substring(0, 120)}...' : report.content,
          style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray600),
          maxLines: 3,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Icon(Icons.chevron_right, color: AppColors.gray400),
        onTap: () => _showReportDetail(report),
      ),
    );
  }

  void _showReportDetail(AiReport report) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (ctx, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.gray300, borderRadius: BorderRadius.circular(2))),
              ),
              const SizedBox(height: 16),
              Text(report.title, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('Generated ${_formatDate(report.createdAt)}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
              const SizedBox(height: 16),
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Text(report.content, style: GoogleFonts.inter(fontSize: 14, height: 1.6, color: AppColors.gray800)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
