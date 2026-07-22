import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Help Center', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _helpCard(context, Icons.support_agent, 'Contact Support', 'Get help from our team', AppColors.primary, '/support/tickets'),
          _helpCard(context, Icons.help_outline, 'FAQ', 'Frequently asked questions', AppColors.info, '/support/faq'),
          _helpCard(context, Icons.description, 'Documentation', 'Platform guides and tutorials', AppColors.secondary, null),
          _helpCard(context, Icons.bug_report, 'Report a Bug', 'Let us know about issues', AppColors.danger, '/support/create'),
          _helpCard(context, Icons.feedback, 'Send Feedback', 'Share your suggestions', AppColors.success, '/support/create'),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Icon(Icons.headset_mic, size: 48, color: AppColors.primary),
                  const SizedBox(height: 12),
                  Text('Need immediate help?', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text('Our support team is available Mon-Sat, 9AM-6PM IST', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray500)),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () => context.push('/support/create'),
                    icon: const Icon(Icons.add),
                    label: const Text('Create Support Ticket'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _helpCard(BuildContext context, IconData icon, String title, String subtitle, Color color, String? route) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: color, size: 22),
        ),
        title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
        subtitle: Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
        trailing: const Icon(Icons.chevron_right),
        onTap: route != null ? () => context.push(route) : null,
      ),
    );
  }
}
