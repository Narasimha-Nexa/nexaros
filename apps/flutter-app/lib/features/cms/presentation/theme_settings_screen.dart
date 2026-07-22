import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';

class ThemeSettingsScreen extends ConsumerStatefulWidget {
  const ThemeSettingsScreen({super.key});
  @override
  ConsumerState<ThemeSettingsScreen> createState() => _ThemeSettingsScreenState();
}

class _ThemeSettingsScreenState extends ConsumerState<ThemeSettingsScreen> {
  final _primaryCtrl = TextEditingController();
  final _secondaryCtrl = TextEditingController();
  final _accentCtrl = TextEditingController();

  String _fontHeading = 'Inter';
  String _fontBody = 'Inter';
  String _borderRadius = 'medium';
  String _containerWidth = 'wide';
  bool _initialized = false;

  static const _fonts = ['Inter', 'Playfair Display', 'Poppins', 'Roboto', 'Lato'];
  static const _radiusOptions = ['none', 'small', 'medium', 'large', 'xl'];
  static const _widthOptions = ['narrow', 'medium', 'wide', 'full'];

  static const _presetColors = [
    '#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#64748B',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initFromProvider());
  }

  void _initFromProvider() {
    if (_initialized) return;
    final cms = ref.read(cmsProvider.notifier);
    _primaryCtrl.text = cms.primaryColor;
    _secondaryCtrl.text = cms.secondaryColor;
    _accentCtrl.text = cms.accentColor;
    _fontHeading = cms.fontHeading;
    _fontBody = cms.fontBody;
    _borderRadius = cms.borderRadius;
    _containerWidth = cms.containerWidth;
    _initialized = true;
  }

  Future<void> _save() async {
    final cms = ref.read(cmsProvider.notifier);
    await cms.updateConfig({
      'primaryColor': _primaryCtrl.text,
      'secondaryColor': _secondaryCtrl.text,
      'accentColor': _accentCtrl.text,
      'fontHeading': _fontHeading,
      'fontBody': _fontBody,
      'borderRadius': _borderRadius,
      'containerWidth': _containerWidth,
    });
    if (mounted) {
      if (cms.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(cms.error!), backgroundColor: AppColors.danger));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Theme saved'), backgroundColor: AppColors.success));
      }
    }
  }

  Color _parseColor(String hex) {
    try {
      return Color(int.parse(hex.replaceFirst('#', '0xFF')));
    } catch (_) {
      return AppColors.primary;
    }
  }

  @override
  void dispose() {
    _primaryCtrl.dispose();
    _secondaryCtrl.dispose();
    _accentCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cms = ref.watch(cmsProvider);
    final primary = _parseColor(_primaryCtrl.text);
    final secondary = _parseColor(_secondaryCtrl.text);
    final accent = _parseColor(_accentCtrl.text);

    return Scaffold(
      appBar: AppBar(
        title: Text('Theme Settings', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _sectionCard('Colors', [
                _colorPicker('Primary Color', _primaryCtrl, primary),
                const SizedBox(height: 16),
                _colorPicker('Secondary Color', _secondaryCtrl, secondary),
                const SizedBox(height: 16),
                _colorPicker('Accent Color', _accentCtrl, accent),
              ]),
              const SizedBox(height: 16),
              _sectionCard('Typography', [
                _dropdownField('Heading Font', _fontHeading, _fonts, (v) => setState(() => _fontHeading = v!)),
                const SizedBox(height: 12),
                _dropdownField('Body Font', _fontBody, _fonts, (v) => setState(() => _fontBody = v!)),
              ]),
              const SizedBox(height: 16),
              _sectionCard('Layout', [
                _dropdownField('Border Radius', _borderRadius, _radiusOptions, (v) => setState(() => _borderRadius = v!)),
                const SizedBox(height: 12),
                _dropdownField('Container Width', _containerWidth, _widthOptions, (v) => setState(() => _containerWidth = v!)),
              ]),
              const SizedBox(height: 16),
              _sectionCard('Preview', [
                Container(
                  padding: EdgeInsets.all(_borderRadius == 'none' ? 8 : _borderRadius == 'small' ? 12 : _borderRadius == 'medium' ? 16 : _borderRadius == 'large' ? 24 : 32),
                  decoration: BoxDecoration(
                    color: primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(_borderRadius == 'none' ? 0 : _borderRadius == 'small' ? 4 : _borderRadius == 'medium' ? 8 : _borderRadius == 'large' ? 16 : 24),
                    border: Border.all(color: primary.withValues(alpha: 0.3)),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Sample Heading', style: GoogleFonts.getFont(_fontHeading, fontSize: 22, fontWeight: FontWeight.bold, color: primary)),
                    const SizedBox(height: 8),
                    Text('This is a preview of your body text with the selected font and theme colors. Adjust your settings to see real-time changes.',
                        style: GoogleFonts.getFont(_fontBody, fontSize: 14, color: AppColors.gray600)),
                    const SizedBox(height: 12),
                    Row(children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(color: primary, borderRadius: BorderRadius.circular(6)),
                        child: Text('Button', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(6)),
                        child: Text('Accent', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
                      ),
                    ]),
                  ]),
                ),
              ]),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: cms.loading ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: cms.loading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text('Save Theme', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
          if (cms.loading)
            Container(color: Colors.black26, child: const Center(child: CircularProgressIndicator())),
        ],
      ),
    );
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

  Widget _colorPicker(String label, TextEditingController ctrl, Color currentColor) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w500, color: AppColors.gray700)),
      const SizedBox(height: 8),
      Row(children: [
        Container(width: 44, height: 44, decoration: BoxDecoration(color: currentColor, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.gray200))),
        const SizedBox(width: 12),
        Expanded(
          child: TextFormField(
            controller: ctrl,
            decoration: const InputDecoration(hintText: '#HEX', border: OutlineInputBorder()),
            onChanged: (_) => setState(() {}),
          ),
        ),
      ]),
      const SizedBox(height: 8),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: _presetColors.map((hex) {
          final c = _parseColor(hex);
          final selected = ctrl.text.toUpperCase() == hex;
          return GestureDetector(
            onTap: () => setState(() => ctrl.text = hex),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: c,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: selected ? AppColors.gray900 : AppColors.gray200, width: selected ? 2.5 : 1),
              ),
            ),
          );
        }).toList(),
      ),
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
