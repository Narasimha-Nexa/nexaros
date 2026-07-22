import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';

class SeoScreen extends ConsumerStatefulWidget {
  const SeoScreen({super.key});
  @override
  ConsumerState<SeoScreen> createState() => _SeoScreenState();
}

class _SeoScreenState extends ConsumerState<SeoScreen> {
  final _metaTitleCtrl = TextEditingController();
  final _metaDescCtrl = TextEditingController();
  final _ogImageCtrl = TextEditingController();
  final _twitterHandleCtrl = TextEditingController();
  final _gaCtrl = TextEditingController();
  final _fbPixelCtrl = TextEditingController();
  final _privacyCtrl = TextEditingController();
  final _termsCtrl = TextEditingController();
  final _refundCtrl = TextEditingController();
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initFromProvider());
  }

  void _initFromProvider() {
    if (_initialized) return;
    final cms = ref.read(cmsProvider.notifier);
    _metaTitleCtrl.text = cms.metaTitle;
    _metaDescCtrl.text = cms.metaDescription;
    _ogImageCtrl.text = cms.ogImageUrl;
    _twitterHandleCtrl.text = cms.twitterHandle;
    _gaCtrl.text = cms.googleAnalyticsId;
    _fbPixelCtrl.text = cms.facebookPixelId;
    _privacyCtrl.text = cms.privacyPolicyUrl;
    _termsCtrl.text = cms.termsUrl;
    _refundCtrl.text = cms.refundPolicyUrl;
    _initialized = true;
  }

  Map<String, dynamic> _buildSeoData() {
    return {
      'metaTitle': _metaTitleCtrl.text,
      'metaDescription': _metaDescCtrl.text,
      'ogImageUrl': _ogImageCtrl.text,
      'twitterHandle': _twitterHandleCtrl.text,
      'googleAnalyticsId': _gaCtrl.text,
      'facebookPixelId': _fbPixelCtrl.text,
      'privacyPolicyUrl': _privacyCtrl.text,
      'termsUrl': _termsCtrl.text,
      'refundPolicyUrl': _refundCtrl.text,
    };
  }

  Future<void> _save() async {
    final cms = ref.read(cmsProvider.notifier);
    await cms.updateConfig(_buildSeoData());
    if (mounted) {
      if (cms.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(cms.error!), backgroundColor: AppColors.danger));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('SEO settings saved'), backgroundColor: AppColors.success));
      }
    }
  }

  Future<void> _generateSitemap() async {
    final cms = ref.read(cmsProvider.notifier);
    try {
      await cms.publishWebsite();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sitemap generated & website published'), backgroundColor: AppColors.success));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(cms.error ?? 'Failed to generate sitemap'), backgroundColor: AppColors.danger));
      }
    }
  }

  @override
  void dispose() {
    _metaTitleCtrl.dispose();
    _metaDescCtrl.dispose();
    _ogImageCtrl.dispose();
    _twitterHandleCtrl.dispose();
    _gaCtrl.dispose();
    _fbPixelCtrl.dispose();
    _privacyCtrl.dispose();
    _termsCtrl.dispose();
    _refundCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cms = ref.watch(cmsProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('SEO Settings', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          TextButton.icon(
            onPressed: cms.publishing ? null : _generateSitemap,
            icon: cms.publishing
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.map, color: Colors.white, size: 18),
            label: Text('Generate Sitemap', style: GoogleFonts.inter(color: Colors.white, fontSize: 13)),
          ),
        ],
      ),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _sectionCard('Meta Tags', [
                TextFormField(controller: _metaTitleCtrl, decoration: const InputDecoration(labelText: 'Meta Title', hintText: 'My Restaurant - Best Food in Town', border: OutlineInputBorder())),
                const SizedBox(height: 12),
                TextFormField(controller: _metaDescCtrl, decoration: const InputDecoration(labelText: 'Meta Description', hintText: 'Describe your restaurant...', border: OutlineInputBorder()), maxLines: 3),
                const SizedBox(height: 12),
                TextFormField(controller: _ogImageCtrl, decoration: const InputDecoration(labelText: 'OG Image URL', hintText: 'https://...', border: OutlineInputBorder())),
                const SizedBox(height: 12),
                TextFormField(controller: _twitterHandleCtrl, decoration: const InputDecoration(labelText: 'Twitter Handle', hintText: '@yourhandle', border: OutlineInputBorder())),
              ]),
              const SizedBox(height: 16),
              _sectionCard('Analytics', [
                TextFormField(controller: _gaCtrl, decoration: const InputDecoration(labelText: 'Google Analytics ID', hintText: 'G-XXXXXXXXXX', border: OutlineInputBorder())),
                const SizedBox(height: 12),
                TextFormField(controller: _fbPixelCtrl, decoration: const InputDecoration(labelText: 'Facebook Pixel ID', hintText: '1234567890', border: OutlineInputBorder())),
              ]),
              const SizedBox(height: 16),
              _sectionCard('Legal Pages', [
                TextFormField(controller: _privacyCtrl, decoration: const InputDecoration(labelText: 'Privacy Policy URL', hintText: 'https://...', border: OutlineInputBorder())),
                const SizedBox(height: 12),
                TextFormField(controller: _termsCtrl, decoration: const InputDecoration(labelText: 'Terms & Conditions URL', hintText: 'https://...', border: OutlineInputBorder())),
                const SizedBox(height: 12),
                TextFormField(controller: _refundCtrl, decoration: const InputDecoration(labelText: 'Refund Policy URL', hintText: 'https://...', border: OutlineInputBorder())),
              ]),
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
                      : Text('Save SEO Settings', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
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
}
