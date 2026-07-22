import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../core/providers/riverpod_providers.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = ref.watch(themeProvider);
    final accessibility = ref.watch(accessibilityProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Settings', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSection('Appearance', [
              _buildNavigationTile(context, Icons.dark_mode, 'Theme', 'Light / Dark / System', () => _showThemeDialog(theme)),
              _buildNavigationTile(context, Icons.language, 'Language', _getLanguageName(Localizations.localeOf(context).languageCode), () => _showLanguageDialog()),
              _buildNavigationTile(context, Icons.text_fields, 'Font Size', '${(accessibility.fontScale * 100).round()}%', () => _showFontScaleDialog(accessibility)),
            ], accessibility),
            const SizedBox(height: 16),
            _buildSection('Accessibility', [
              _buildSwitchTile(context, Icons.high_quality, 'High Contrast', 'Increase contrast for better visibility', accessibility.highContrast, (v) => accessibility.setHighContrast(v)),
              _buildSwitchTile(context, Icons.animation, 'Reduce Motion', 'Minimize animations throughout the app', accessibility.reduceMotion, (v) => accessibility.setReduceMotion(v)),
              _buildSwitchTile(context, Icons.record_voice_over, 'Screen Reader Mode', 'Optimize UI for screen readers', accessibility.screenReaderMode, (v) => accessibility.setScreenReaderMode(v)),
              _buildSwitchTile(context, Icons.format_bold, 'Bold Text', 'Make all text bolder', accessibility.boldText, (v) => accessibility.setBoldText(v)),
              _buildSwitchTile(context, Icons.touch_app, 'Large Touch Targets', 'Increase tap target sizes', accessibility.largeTouchTargets, (v) => accessibility.setLargeTouchTargets(v)),
            ], accessibility),
            const SizedBox(height: 16),
            _buildSection('Notifications', [
              _buildSwitchTile(context, Icons.notifications, 'Push Notifications', 'Receive push notifications', true, (v) {}),
              _buildSwitchTile(context, Icons.email, 'Email Notifications', 'Receive email summaries', true, (v) {}),
              _buildSwitchTile(context, Icons.sms, 'SMS Alerts', 'Get SMS for critical alerts', false, (v) {}),
            ], accessibility),
            const SizedBox(height: 16),
            _buildSection('Keyboard Shortcuts', [
              _buildNavigationTile(context, Icons.keyboard, 'View All Shortcuts', 'Ctrl+K for command palette', () {
                ref.read(keyboardShortcutsProvider).openHelp();
                context.pop();
              }),
            ], accessibility),
            const SizedBox(height: 16),
            _buildSection('Account', [
              _buildNavigationTile(context, Icons.person, 'Profile', 'Edit your profile', () => context.push('/shell/profile')),
              _buildNavigationTile(context, Icons.store, 'Branch', 'Switch branch', () {}),
              _buildNavigationTile(context, Icons.card_membership, 'Subscription', 'Manage subscription', () => context.push('/subscription')),
            ], accessibility),
            const SizedBox(height: 16),
            _buildSection('Support', [
              _buildNavigationTile(context, Icons.help_outline, 'Help Center', 'Get help and support', () => context.push('/shell/support/help')),
              _buildNavigationTile(context, Icons.quiz, 'FAQ', 'Frequently asked questions', () => context.push('/shell/support/faq')),
              _buildNavigationTile(context, Icons.description, 'Release Notes', 'What\'s new in v2.0', () => _showReleaseNotes()),
              _buildNavigationTile(context, Icons.info_outline, 'About', 'NexaROS v2.0.0', () => _showAbout()),
            ], accessibility),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children, dynamic accessibility) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.gray500, letterSpacing: 0.5)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.gray200),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildNavigationTile(BuildContext context, IconData icon, String title, String subtitle, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, size: 20, color: AppColors.gray600),
      title: Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
      trailing: Icon(Icons.chevron_right, size: 18, color: AppColors.gray400),
      onTap: onTap,
    );
  }

  Widget _buildSwitchTile(BuildContext context, IconData icon, String title, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return SwitchListTile(
      secondary: Icon(icon, size: 20, color: AppColors.gray600),
      title: Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
      value: value,
      onChanged: onChanged,
      activeColor: AppColors.primary,
    );
  }

  void _showThemeDialog(dynamic theme) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Theme', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildThemeOption(ctx, 'System', Icons.brightness_auto, ThemeMode.system, theme),
            _buildThemeOption(ctx, 'Light', Icons.light_mode, ThemeMode.light, theme),
            _buildThemeOption(ctx, 'Dark', Icons.dark_mode, ThemeMode.dark, theme),
          ],
        ),
      ),
    );
  }

  Widget _buildThemeOption(BuildContext ctx, String label, IconData icon, ThemeMode mode, dynamic theme) {
    final isSelected = theme.themeMode == mode;
    return ListTile(
      leading: Icon(icon, color: isSelected ? AppColors.primary : AppColors.gray600),
      title: Text(label, style: GoogleFonts.inter(fontSize: 14, fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal)),
      trailing: isSelected ? Icon(Icons.check_circle, color: AppColors.primary, size: 18) : null,
      onTap: () {
        theme.setThemeMode(mode);
        Navigator.pop(ctx);
      },
    );
  }

  void _showLanguageDialog() {
    final languages = [
      ('en', 'English', '🌐'),
      ('hi', 'हिन्दी', '🇮🇳'),
      ('kn', 'ಕನ್ನಡ', '🇮🇳'),
      ('te', 'తెలుగు', '🇮🇳'),
      ('ta', 'தமிழ்', '🇮🇳'),
      ('ml', 'മലയാളം', '🇮🇳'),
      ('ar', 'العربية', '🇸🇦'),
    ];

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Language', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        content: SizedBox(
          width: 300,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: languages.length,
            itemBuilder: (ctx, i) {
              final (code, name, flag) = languages[i];
              final isCurrent = Localizations.localeOf(ctx).languageCode == code;
              return ListTile(
                leading: Text(flag, style: const TextStyle(fontSize: 20)),
                title: Text(name, style: GoogleFonts.inter(fontSize: 14)),
                trailing: isCurrent ? Icon(Icons.check_circle, color: AppColors.primary, size: 18) : null,
                onTap: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Language will switch to $name on next restart')),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }

  void _showFontScaleDialog(dynamic accessibility) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Font Size', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        content: StatefulBuilder(
          builder: (ctx, setDialogState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Preview Text', style: GoogleFonts.inter(fontSize: 16.0 * accessibility.fontScale)),
              const SizedBox(height: 16),
              Slider(
                value: accessibility.fontScale,
                min: 0.8,
                max: 2.0,
                divisions: 12,
                label: '${(accessibility.fontScale * 100).round()}%',
                onChanged: (v) {
                  setDialogState(() {});
                  accessibility.setFontScale(v);
                },
              ),
              Text('${(accessibility.fontScale * 100).round()}%', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray600)),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Done', style: GoogleFonts.inter())),
        ],
      ),
    );
  }

  void _showReleaseNotes() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Release Notes', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Version 2.0.0', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('Release Date: January 2025', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
              const SizedBox(height: 16),
              _buildReleaseFeature('AI Platform', 'Enterprise AI assistant with chat, insights, forecasts, and workflows'),
              _buildReleaseFeature('Support System', 'Ticket management, FAQ, and help center'),
              _buildReleaseFeature('Enhanced POS', 'Faster checkout with AI upsell suggestions'),
              _buildReleaseFeature('Finance Module', 'Complete accounting, banking, and tax management'),
              _buildReleaseFeature('Performance', '30% faster navigation and reduced memory usage'),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Close', style: GoogleFonts.inter())),
        ],
      ),
    );
  }

  Widget _buildReleaseFeature(String title, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.check_circle, size: 14, color: AppColors.success),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                Text(description, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showAbout() {
    showAboutDialog(
      context: context,
      applicationName: 'NexaROS',
      applicationVersion: '2.0.0',
      applicationIcon: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(8)),
        child: const Icon(Icons.restaurant, color: Colors.white, size: 24),
      ),
      children: [
        Text('AI-Powered Restaurant Operating System', style: GoogleFonts.inter(fontSize: 14)),
        const SizedBox(height: 8),
        Text('Enterprise SaaS for restaurant management with AI-powered analytics, real-time operations, and multi-branch support.', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray600)),
      ],
    );
  }

  String _getLanguageName(String code) {
    switch (code) {
      case 'en': return 'English';
      case 'hi': return 'हिन्दी';
      case 'kn': return 'ಕನ್ನಡ';
      case 'te': return 'తెలుగు';
      case 'ta': return 'தமிழ்';
      case 'ml': return 'മലയാളം';
      case 'ar': return 'العربية';
      default: return 'English';
    }
  }
}
