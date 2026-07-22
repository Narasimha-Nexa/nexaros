import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';

class CmsProvider extends ChangeNotifier {
  final ApiClient _api;

  Map<String, dynamic> _config = {};
  bool _loading = false;
  bool _publishing = false;
  String? _error;

  CmsProvider(this._api);

  Map<String, dynamic> get config => _config;
  bool get loading => _loading;
  bool get publishing => _publishing;
  String? get error => _error;

  String get primaryColor => _config['primaryColor'] as String? ?? '#2563EB';
  String get secondaryColor => _config['secondaryColor'] as String? ?? '#7C3AED';
  String get accentColor => _config['accentColor'] as String? ?? '#F59E0B';
  String get fontHeading => _config['fontHeading'] as String? ?? 'Inter';
  String get fontBody => _config['fontBody'] as String? ?? 'Inter';
  String get restaurantName => _config['restaurantName'] as String? ?? '';
  String get tagline => _config['tagline'] as String? ?? '';
  String get logoUrl => _config['logoUrl'] as String? ?? '';
  String get phone => _config['phone'] as String? ?? '';
  String get email => _config['email'] as String? ?? '';
  String get address => _config['address'] as String? ?? '';
  String get whatsapp => _config['whatsapp'] as String? ?? '';
  String get mapUrl => _config['mapUrl'] as String? ?? '';
  String get instagram => _config['instagram'] as String? ?? '';
  String get facebook => _config['facebook'] as String? ?? '';
  String get twitter => _config['twitter'] as String? ?? '';
  String get youtube => _config['youtube'] as String? ?? '';
  List<dynamic> get openingHours => _config['openingHours'] as List<dynamic>? ?? [];
  String get borderRadius => _config['borderRadius'] as String? ?? 'medium';
  String get containerWidth => _config['containerWidth'] as String? ?? 'wide';
  String get metaTitle => _config['metaTitle'] as String? ?? '';
  String get metaDescription => _config['metaDescription'] as String? ?? '';
  String get ogImageUrl => _config['ogImageUrl'] as String? ?? '';
  String get twitterHandle => _config['twitterHandle'] as String? ?? '';
  String get googleAnalyticsId => _config['googleAnalyticsId'] as String? ?? '';
  String get facebookPixelId => _config['facebookPixelId'] as String? ?? '';
  String get privacyPolicyUrl => _config['privacyPolicyUrl'] as String? ?? '';
  String get termsUrl => _config['termsUrl'] as String? ?? '';
  String get refundPolicyUrl => _config['refundPolicyUrl'] as String? ?? '';
  List<dynamic> get sections => _config['sections'] as List<dynamic>? ?? [];
  Map<String, dynamic> get seo => _config['seo'] as Map<String, dynamic>? ?? {};
  Map<String, dynamic> get features => _config['features'] as Map<String, dynamic>? ?? {};

  Future<void> loadConfig() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _api.get('/cms/config');
      _config = result as Map<String, dynamic>? ?? {};
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> updateConfig(Map<String, dynamic> data) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _api.put('/cms/config', data);
      _config = result as Map<String, dynamic>? ?? {};
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> updateFeatures(Map<String, dynamic> features) async {
    _error = null;
    try {
      await _api.patch('/cms/features', features);
      _config['features'] = features;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> updateSections(List<dynamic> sections) async {
    _error = null;
    try {
      await _api.patch('/cms/sections', {'sections': sections});
      _config['sections'] = sections;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> updateSeo(Map<String, dynamic> seo) async {
    _error = null;
    try {
      await _api.patch('/cms/seo', seo);
      _config['seo'] = seo;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> publishWebsite() async {
    _publishing = true;
    _error = null;
    notifyListeners();
    try {
      await _api.post('/cms/publish', {});
    } catch (e) {
      _error = e.toString();
    }
    _publishing = false;
    notifyListeners();
  }

  Future<void> resetToDefaults() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _api.post('/cms/reset', {});
      _config = result as Map<String, dynamic>? ?? {};
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
