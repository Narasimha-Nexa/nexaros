import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';

class WebsiteEditorScreen extends ConsumerStatefulWidget {
  const WebsiteEditorScreen({super.key});
  @override
  ConsumerState<WebsiteEditorScreen> createState() => _WebsiteEditorScreenState();
}

class _WebsiteEditorScreenState extends ConsumerState<WebsiteEditorScreen> {
  final _nameCtrl = TextEditingController();
  final _taglineCtrl = TextEditingController();
  final _logoCtl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _whatsappCtrl = TextEditingController();
  final _mapUrlCtrl = TextEditingController();
  final _instagramCtrl = TextEditingController();
  final _facebookCtrl = TextEditingController();
  final _twitterCtrl = TextEditingController();
  final _youtubeCtrl = TextEditingController();
  final _primaryCtrl = TextEditingController();
  final _secondaryCtrl = TextEditingController();
  final _accentCtrl = TextEditingController();

  String _fontHeading = 'Inter';
  String _fontBody = 'Inter';
  String _borderRadius = 'medium';
  bool _initialized = false;

  final _hoursDays = <String>['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  final _hourCtrls = <TextEditingController>[];

  static const _fonts = ['Inter', 'Playfair Display', 'Poppins', 'Roboto'];
  static const _radiusOptions = ['none', 'small', 'medium', 'large', 'xl'];

  @override
  void initState() {
    super.initState();
    for (final _ in _hoursDays) {
      _hourCtrls.add(TextEditingController());
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _initFromProvider());
  }

  void _initFromProvider() {
    if (_initialized) return;
    final cms = ref.read(cmsProvider.notifier);
    _nameCtrl.text = cms.restaurantName;
    _taglineCtrl.text = cms.tagline;
    _logoCtl.text = cms.logoUrl;
    _phoneCtrl.text = cms.phone;
    _emailCtrl.text = cms.email;
    _addressCtrl.text = cms.address;
    _whatsappCtrl.text = cms.whatsapp;
    _mapUrlCtrl.text = cms.mapUrl;
    _instagramCtrl.text = cms.instagram;
    _facebookCtrl.text = cms.facebook;
    _twitterCtrl.text = cms.twitter;
    _youtubeCtrl.text = cms.youtube;
    _primaryCtrl.text = cms.primaryColor;
    _secondaryCtrl.text = cms.secondaryColor;
    _accentCtrl.text = cms.accentColor;
    _fontHeading = cms.fontHeading;
    _fontBody = cms.fontBody;
    _borderRadius = cms.borderRadius;
    final hours = cms.openingHours;
    for (var i = 0; i < _hoursDays.length && i < hours.length; i++) {
      _hourCtrls[i].text = hours[i]['hours'] as String? ?? '';
    }
    _initialized = true;
  }

  Map<String, dynamic> _buildData() {
    return {
      'restaurantName': _nameCtrl.text,
      'tagline': _taglineCtrl.text,
      'logoUrl': _logoCtl.text,
      'phone': _phoneCtrl.text,
      'email': _emailCtrl.text,
      'address': _addressCtrl.text,
      'whatsapp': _whatsappCtrl.text,
      'mapUrl': _mapUrlCtrl.text,
      'instagram': _instagramCtrl.text,
      'facebook': _facebookCtrl.text,
      'twitter': _twitterCtrl.text,
      'youtube': _youtubeCtrl.text,
      'primaryColor': _primaryCtrl.text,
      'secondaryColor': _secondaryCtrl.text,
      'accentColor': _accentCtrl.text,
      'fontHeading': _fontHeading,
      'fontBody': _fontBody,
      'borderRadius': _borderRadius,
      'openingHours': List.generate(_hoursDays.length, (i) => {'day': _hoursDays[i], 'hours': _hourCtrls[i].text}),
    };
  }

  Future<void> _save() async {
    final cms = ref.read(cmsProvider.notifier);
    await cms.updateConfig(_buildData());
    if (mounted && cms.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(cms.error!), backgroundColor: AppColors.danger));
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Website settings saved'), backgroundColor: AppColors.success));
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _taglineCtrl.dispose();
    _logoCtl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    _whatsappCtrl.dispose();
    _mapUrlCtrl.dispose();
    _instagramCtrl.dispose();
    _facebookCtrl.dispose();
    _twitterCtrl.dispose();
    _youtubeCtrl.dispose();
    _primaryCtrl.dispose();
    _secondaryCtrl.dispose();
    _accentCtrl.dispose();
    for (final c in _hourCtrls) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cms = ref.watch(cmsProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('Website Editor', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          Form(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildBrandingSection(),
                const SizedBox(height: 16),
                _buildThemeSection(),
                const SizedBox(height: 16),
                _buildContactSection(),
                const SizedBox(height: 16),
                _buildSocialSection(),
                const SizedBox(height: 16),
                _buildHoursSection(),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: cms.loading ? null : _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: cms.loading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text('Save Changes', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
          if (cms.loading)
            Container(color: Colors.black26, child: const Center(child: CircularProgressIndicator())),
        ],
      ),
    );
  }

  Widget _buildBrandingSection() {
    return _sectionCard('Branding', [
      TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Restaurant Name', border: OutlineInputBorder())),
      const SizedBox(height: 12),
      TextFormField(controller: _taglineCtrl, decoration: const InputDecoration(labelText: 'Tagline', border: OutlineInputBorder())),
      const SizedBox(height: 12),
      TextFormField(controller: _logoCtl, decoration: const InputDecoration(labelText: 'Logo URL', hintText: 'https://...', border: OutlineInputBorder())),
    ]);
  }

  Widget _buildThemeSection() {
    return _sectionCard('Theme', [
      _colorField('Primary Color', _primaryCtrl),
      const SizedBox(height: 12),
      _colorField('Secondary Color', _secondaryCtrl),
      const SizedBox(height: 12),
      _colorField('Accent Color', _accentCtrl),
      const SizedBox(height: 12),
      _dropdownField('Heading Font', _fontHeading, _fonts, (v) => setState(() => _fontHeading = v!)),
      const SizedBox(height: 12),
      _dropdownField('Body Font', _fontBody, _fonts, (v) => setState(() => _fontBody = v!)),
      const SizedBox(height: 12),
      _dropdownField('Border Radius', _borderRadius, _radiusOptions, (v) => setState(() => _borderRadius = v!)),
    ]);
  }

  Widget _buildContactSection() {
    return _sectionCard('Contact', [
      TextFormField(controller: _phoneCtrl, decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder())),
      const SizedBox(height: 12),
      TextFormField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder())),
      const SizedBox(height: 12),
      TextFormField(controller: _addressCtrl, decoration: const InputDecoration(labelText: 'Address', border: OutlineInputBorder()), maxLines: 2),
      const SizedBox(height: 12),
      TextFormField(controller: _whatsappCtrl, decoration: const InputDecoration(labelText: 'WhatsApp Number', border: OutlineInputBorder())),
      const SizedBox(height: 12),
      TextFormField(controller: _mapUrlCtrl, decoration: const InputDecoration(labelText: 'Google Maps URL', border: OutlineInputBorder())),
    ]);
  }

  Widget _buildSocialSection() {
    return _sectionCard('Social Links', [
      TextFormField(controller: _instagramCtrl, decoration: const InputDecoration(labelText: 'Instagram URL', border: OutlineInputBorder())),
      const SizedBox(height: 12),
      TextFormField(controller: _facebookCtrl, decoration: const InputDecoration(labelText: 'Facebook URL', border: OutlineInputBorder())),
      const SizedBox(height: 12),
      TextFormField(controller: _twitterCtrl, decoration: const InputDecoration(labelText: 'Twitter URL', border: OutlineInputBorder())),
      const SizedBox(height: 12),
      TextFormField(controller: _youtubeCtrl, decoration: const InputDecoration(labelText: 'YouTube URL', border: OutlineInputBorder())),
    ]);
  }

  Widget _buildHoursSection() {
    return _sectionCard('Opening Hours', [
      for (int i = 0; i < _hoursDays.length; i++) ...[
        if (i > 0) const SizedBox(height: 8),
        Row(children: [
          SizedBox(width: 100, child: Text(_hoursDays[i], style: GoogleFonts.inter(fontWeight: FontWeight.w500))),
          const SizedBox(width: 12),
          Expanded(
            child: TextFormField(
              controller: _hourCtrls[i],
              decoration: const InputDecoration(hintText: 'e.g. 9:00 AM - 10:00 PM', border: OutlineInputBorder()),
            ),
          ),
        ]),
      ],
    ]);
  }

  Widget _sectionCard(String title, List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.gray900)),
          const SizedBox(height: 12),
          ...children,
        ]),
      ),
    );
  }

  Widget _colorField(String label, TextEditingController ctrl) {
    Color? parsed;
    try {
      parsed = Color(int.parse(ctrl.text.replaceFirst('#', '0xFF')));
    } catch (_) {}
    return Row(children: [
      Expanded(
        child: TextFormField(
          controller: ctrl,
          decoration: InputDecoration(labelText: label, hintText: '#HEX', border: const OutlineInputBorder()),
        ),
      ),
      const SizedBox(width: 12),
      Container(width: 36, height: 36, decoration: BoxDecoration(color: parsed ?? AppColors.gray300, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.gray200))),
    ]);
  }

  Widget _dropdownField(String label, String value, List<String> options, ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
      items: options.map((o) => DropdownMenuItem(value: o, child: Text(o, style: GoogleFonts.inter()))).toList(),
      onChanged: onChanged,
    );
  }
}
