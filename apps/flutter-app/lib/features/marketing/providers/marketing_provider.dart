import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';

class MarketingProvider extends ChangeNotifier {
  final ApiClient _api;

  MarketingProvider(this._api);

  // Campaigns
  List<Map<String, dynamic>> _campaigns = [];
  Map<String, dynamic>? _campaignStats;
  Map<String, dynamic>? _selectedCampaign;
  bool _campaignsLoading = false;
  bool _campaignStatsLoading = false;
  bool _campaignLoading = false;
  String? _campaignError;

  // Templates
  List<Map<String, dynamic>> _templates = [];
  Map<String, dynamic>? _selectedTemplate;
  bool _templatesLoading = false;
  final bool _templateLoading = false;
  String? _templateError;

  // Audiences
  List<Map<String, dynamic>> _audiences = [];
  Map<String, dynamic>? _selectedAudience;
  bool _audiencesLoading = false;
  final bool _audienceLoading = false;
  String? _audienceError;

  bool _loading = false;
  String? _error;

  // ── Getters ──

  List<Map<String, dynamic>> get campaigns => _campaigns;
  Map<String, dynamic>? get campaignStats => _campaignStats;
  Map<String, dynamic>? get selectedCampaign => _selectedCampaign;
  bool get campaignsLoading => _campaignsLoading;
  bool get campaignStatsLoading => _campaignStatsLoading;
  bool get campaignLoading => _campaignLoading;
  String? get campaignError => _campaignError;

  List<Map<String, dynamic>> get templates => _templates;
  Map<String, dynamic>? get selectedTemplate => _selectedTemplate;
  bool get templatesLoading => _templatesLoading;
  bool get templateLoading => _templateLoading;
  String? get templateError => _templateError;

  List<Map<String, dynamic>> get audiences => _audiences;
  Map<String, dynamic>? get selectedAudience => _selectedAudience;
  bool get audiencesLoading => _audiencesLoading;
  bool get audienceLoading => _audienceLoading;
  String? get audienceError => _audienceError;

  bool get loading => _loading;
  String? get error => _error;

  // ── Campaigns ──

  Future<void> loadCampaigns({String? status, String? type}) async {
    _campaignsLoading = true;
    _campaignError = null;
    notifyListeners();
    try {
      final params = <String, String>{};
      if (status != null) params['status'] = status;
      if (type != null) params['type'] = type;
      final query = params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
      final path = '/marketing/campaigns${query.isNotEmpty ? '?$query' : ''}';
      final result = await _api.get(path);
      _campaigns = (result['campaigns'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
    } catch (e) {
      _campaignError = e.toString();
    }
    _campaignsLoading = false;
    notifyListeners();
  }

  Future<void> loadCampaignStats() async {
    _campaignStatsLoading = true;
    notifyListeners();
    try {
      _campaignStats = await _api.get('/marketing/campaigns/stats') as Map<String, dynamic>?;
    } catch (_) {}
    _campaignStatsLoading = false;
    notifyListeners();
  }

  Future<void> loadCampaign(String id) async {
    _campaignLoading = true;
    notifyListeners();
    try {
      _selectedCampaign = await _api.get('/marketing/campaigns/$id') as Map<String, dynamic>;
      _campaignError = null;
    } catch (e) {
      _campaignError = e.toString();
    }
    _campaignLoading = false;
    notifyListeners();
  }

  Future<void> createCampaign(Map<String, dynamic> data) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.post('/marketing/campaigns', data);
      await loadCampaigns();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> updateCampaign(String id, Map<String, dynamic> data) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.patch('/marketing/campaigns/$id', data);
      await loadCampaign(id);
      await loadCampaigns();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> launchCampaign(String id) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.post('/marketing/campaigns/$id/launch', {});
      await loadCampaign(id);
      await loadCampaigns();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> cancelCampaign(String id) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.post('/marketing/campaigns/$id/cancel', {});
      await loadCampaign(id);
      await loadCampaigns();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> deleteCampaign(String id) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.delete('/marketing/campaigns/$id');
      _selectedCampaign = null;
      await loadCampaigns();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  // ── Templates ──

  Future<void> loadTemplates({String? category}) async {
    _templatesLoading = true;
    _templateError = null;
    notifyListeners();
    try {
      final path = category != null
          ? '/marketing/templates?category=${Uri.encodeComponent(category)}'
          : '/marketing/templates';
      final result = await _api.get(path);
      _templates = (result['templates'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
    } catch (e) {
      _templateError = e.toString();
    }
    _templatesLoading = false;
    notifyListeners();
  }

  Future<void> createTemplate(Map<String, dynamic> data) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.post('/marketing/templates', data);
      await loadTemplates();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> updateTemplate(String id, Map<String, dynamic> data) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.patch('/marketing/templates/$id', data);
      await loadTemplates();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> deleteTemplate(String id) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.delete('/marketing/templates/$id');
      if (_selectedTemplate?['id'] == id) _selectedTemplate = null;
      await loadTemplates();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  // ── Audiences ──

  Future<void> loadAudiences() async {
    _audiencesLoading = true;
    _audienceError = null;
    notifyListeners();
    try {
      final result = await _api.get('/marketing/audiences');
      _audiences = (result['audiences'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
    } catch (e) {
      _audienceError = e.toString();
    }
    _audiencesLoading = false;
    notifyListeners();
  }

  Future<void> createAudience(Map<String, dynamic> data) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.post('/marketing/audiences', data);
      await loadAudiences();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> updateAudience(String id, Map<String, dynamic> data) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.patch('/marketing/audiences/$id', data);
      await loadAudiences();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> deleteAudience(String id) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.delete('/marketing/audiences/$id');
      if (_selectedAudience?['id'] == id) _selectedAudience = null;
      await loadAudiences();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }
}
