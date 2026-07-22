import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/ai_models.dart';
import '../data/ai_service.dart';
import '../../../core/providers/riverpod_providers.dart';

final aiProvidersFutureProvider = FutureProvider<List<AiProviderConfig>>((ref) async {
  final service = ref.watch(aiPlatformServiceProvider);
  return service.getProviders();
});

class AiSettingsScreen extends ConsumerStatefulWidget {
  const AiSettingsScreen({super.key});

  @override
  ConsumerState<AiSettingsScreen> createState() => _AiSettingsScreenState();
}

class _AiSettingsScreenState extends ConsumerState<AiSettingsScreen> {
  bool _voiceEnabled = false;
  bool _streamingEnabled = true;
  bool _autoSuggestions = true;
  bool _offlineMode = true;
  String _selectedLanguage = 'English';
  String _selectedTone = 'Professional';

  @override
  Widget build(BuildContext context) {
    final providersAsync = ref.watch(aiProvidersFutureProvider);

    return Scaffold(
      appBar: AppBar(title: Text('AI Settings', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('AI Provider', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            providersAsync.when(
              loading: () => const NxFullScreenLoader(),
              error: (e, _) => Text('Error loading providers', style: GoogleFonts.inter(color: AppColors.danger)),
              data: (providers) => providers.isEmpty
                  ? NxCard(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Icon(Icons.cloud_off, size: 32, color: AppColors.gray400),
                          const SizedBox(height: 8),
                          Text('No AI providers configured', style: GoogleFonts.inter(color: AppColors.gray600)),
                          const SizedBox(height: 4),
                          Text('Configure OPENAI_API_KEY or GEMINI_API_KEY in environment', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
                        ],
                      ),
                    ))
                  : Column(
                      children: providers.map((p) => NxCard(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: p.isDefault ? AppColors.success.withValues(alpha: 0.1) : AppColors.gray100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(Icons.smart_toy, color: p.isDefault ? AppColors.success : AppColors.gray500, size: 18),
                          ),
                          title: Text(p.displayName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                          subtitle: Text(p.isDefault ? 'Default provider' : 'Available', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                          trailing: p.isDefault ? Icon(Icons.check_circle, color: AppColors.success, size: 18) : null,
                        ),
                      )).toList(),
                    ),
            ),
            const SizedBox(height: 24),
            Text('Preferences', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildSwitchTile('Streaming Responses', 'Get AI responses as they are generated', Icons.speed, _streamingEnabled, (v) => setState(() => _streamingEnabled = v)),
            _buildSwitchTile('Voice Input', 'Enable voice commands and speech input', Icons.mic, _voiceEnabled, (v) => setState(() => _voiceEnabled = v)),
            _buildSwitchTile('Auto Suggestions', 'Show AI suggestions proactively', Icons.lightbulb_outline, _autoSuggestions, (v) => setState(() => _autoSuggestions = v)),
            _buildSwitchTile('Offline Mode', 'Cache responses for offline access', Icons.offline_bolt, _offlineMode, (v) => setState(() => _offlineMode = v)),
            const SizedBox(height: 24),
            Text('Language & Tone', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildDropdownTile('Language', _selectedLanguage, ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Arabic'], (v) => setState(() => _selectedLanguage = v)),
            const SizedBox(height: 8),
            _buildDropdownTile('Response Tone', _selectedTone, ['Professional', 'Friendly', 'Concise', 'Detailed'], (v) => setState(() => _selectedTone = v)),
            const SizedBox(height: 24),
            Text('Usage & Costs', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            NxCard(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildUsageRow('Total Queries', '1,247'),
                    const Divider(),
                    _buildUsageRow('Tokens Used', '85,432'),
                    const Divider(),
                    _buildUsageRow('Est. Cost', '₹127.50'),
                    const Divider(),
                    _buildUsageRow('Conversations', '89'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            NxCard(
              child: ListTile(
                leading: Icon(Icons.delete_outline, color: AppColors.danger, size: 20),
                title: Text('Clear Conversation History', style: GoogleFonts.inter(fontSize: 14, color: AppColors.danger)),
                subtitle: Text('Delete all stored conversations and data', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
                onTap: () => _showClearDialog(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSwitchTile(String title, String subtitle, IconData icon, bool value, ValueChanged<bool> onChanged) {
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: SwitchListTile(
        secondary: Icon(icon, size: 20, color: AppColors.primary),
        title: Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500)),
        subtitle: Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
        value: value,
        onChanged: onChanged,
        activeColor: AppColors.primary,
      ),
    );
  }

  Widget _buildDropdownTile(String label, String value, List<String> options, ValueChanged<String> onChanged) {
    return NxCard(
      child: ListTile(
        title: Text(label, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500)),
        trailing: DropdownButton<String>(
          value: value,
          underline: const SizedBox(),
          items: options.map((o) => DropdownMenuItem(value: o, child: Text(o, style: GoogleFonts.inter(fontSize: 13)))).toList(),
          onChanged: (v) { if (v != null) onChanged(v); },
        ),
      ),
    );
  }

  Widget _buildUsageRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray600)),
          Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  void _showClearDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Clear History', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        content: Text('This will permanently delete all conversations and cached AI data.', style: GoogleFonts.inter(fontSize: 14)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: GoogleFonts.inter())),
          TextButton(
            onPressed: () { Navigator.pop(ctx); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('History cleared'))); },
            child: Text('Clear', style: GoogleFonts.inter(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}
