import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/network/api_client.dart';
import 'ai_models.dart';

class AiPlatformService {
  final ApiClient _api;

  AiPlatformService(this._api);

  // ─── Chat ───

  Future<AiChatResponse> chat(String message, {String? conversationId}) async {
    final body = <String, dynamic>{'message': message};
    if (conversationId != null) body['conversationId'] = conversationId;
    final response = await _api.requestWithRetry(() async {
      final h = await _api.headers;
      return http.post(Uri.parse('${_api.baseUrl}/ai-copilot/chat'), headers: h, body: jsonEncode(body));
    });
    return AiChatResponse.fromJson(response);
  }

  Stream<String> streamChat(String message, {String? conversationId}) async* {
    final uri = Uri.parse('${_api.baseUrl}/ai-copilot/chat/stream').replace(queryParameters: {
      'message': message,
      if (conversationId != null) 'conversationId': conversationId,
    });
    final h = await _api.headers;
    final request = http.Request('GET', uri);
    request.headers.addAll(h);
    final response = await http.Client().send(request);
    String buffer = '';
    await for (final chunk in response.stream.transform(utf8.decoder)) {
      buffer += chunk;
      final lines = buffer.split('\n');
      buffer = lines.removeLast();
      for (final line in lines) {
        if (line.startsWith('data: ')) {
          final data = line.substring(6).trim();
          if (data.isEmpty) continue;
          try {
            final json = jsonDecode(data);
            if (json is Map<String, dynamic>) {
              if (json['done'] == true) return;
              if (json['token'] != null) yield json['token'].toString();
            }
          } catch (_) {}
        }
      }
    }
  }

  // ─── Conversations ───

  Future<List<AiConversation>> listConversations() async {
    final response = await _api.requestWithRetry(() async {
      final h = await _api.headers;
      return http.get(Uri.parse('${_api.baseUrl}/ai-copilot/conversations'), headers: h);
    });
    final data = response is List ? response : (response['data'] ?? []);
    return (data as List<dynamic>).map((c) => AiConversation.fromJson(c as Map<String, dynamic>)).toList();
  }

  Future<List<AiMessage>> getConversationMessages(String conversationId) async {
    final response = await _api.requestWithRetry(() async {
      final h = await _api.headers;
      return http.get(Uri.parse('${_api.baseUrl}/ai-copilot/conversations/$conversationId'), headers: h);
    });
    final messages = response['messages'] as List<dynamic>? ?? [];
    return messages.map((m) => AiMessage.fromJson(m as Map<String, dynamic>)).toList();
  }

  Future<bool> deleteConversation(String conversationId) async {
    try {
      await _api.requestWithRetry(() async {
        final h = await _api.headers;
        return http.delete(Uri.parse('${_api.baseUrl}/ai-copilot/conversations/$conversationId'), headers: h);
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  // ─── Suggestions ───

  Future<List<String>> getSuggestions() async {
    final response = await _api.requestWithRetry(() async {
      final h = await _api.headers;
      return http.get(Uri.parse('${_api.baseUrl}/ai-copilot/suggestions'), headers: h);
    });
    return (response is List ? response : []).cast<String>();
  }

  // ─── Providers ───

  Future<List<AiProviderConfig>> getProviders() async {
    final response = await _api.requestWithRetry(() async {
      final h = await _api.headers;
      return http.get(Uri.parse('${_api.baseUrl}/ai-copilot/providers'), headers: h);
    });
    final data = response is List ? response : (response['data'] ?? []);
    return (data as List<dynamic>).map((p) => AiProviderConfig.fromJson(p as Map<String, dynamic>)).toList();
  }

  // ─── Reports ───

  Future<AiReport> generateReport(String type, {String? from, String? to}) async {
    final body = <String, dynamic>{'type': type};
    if (from != null) body['from'] = from;
    if (to != null) body['to'] = to;
    final response = await _api.requestWithRetry(() async {
      final h = await _api.headers;
      return http.post(Uri.parse('${_api.baseUrl}/ai-copilot/reports'), headers: h, body: jsonEncode(body));
    });
    return AiReport.fromJson(response);
  }

  Future<List<AiReport>> listReports() async {
    final response = await _api.requestWithRetry(() async {
      final h = await _api.headers;
      return http.get(Uri.parse('${_api.baseUrl}/ai-copilot/reports'), headers: h);
    });
    final data = response is List ? response : (response['data'] ?? []);
    return (data as List<dynamic>).map((r) => AiReport.fromJson(r as Map<String, dynamic>)).toList();
  }

  // ─── AI Analytics ───

  Future<List<Map<String, dynamic>>> getPairings(String menuItemId) async {
    final response = await _api.requestWithRetry(() async {
      final h = await _api.headers;
      return http.get(Uri.parse('${_api.baseUrl}/ai/pairings/$menuItemId'), headers: h);
    });
    final data = response['pairings'] ?? response['data'] ?? response;
    return (data is List ? data : []).cast<Map<String, dynamic>>();
  }

  Future<AiForecast> getForecast({int days = 7, String metric = 'revenue'}) async {
    final response = await _api.requestWithRetry(() async {
      final h = await _api.headers;
      return http.get(Uri.parse('${_api.baseUrl}/ai/forecast?days=$days'), headers: h);
    });
    return AiForecast.fromJson(response);
  }

  Future<List<AiInsight>> getInsights() async {
    final response = await _api.requestWithRetry(() async {
      final h = await _api.headers;
      return http.get(Uri.parse('${_api.baseUrl}/ai/insights'), headers: h);
    });
    final data = response['insights'] ?? response['data'] ?? response;
    return (data is List ? data : []).map((i) => AiInsight.fromJson(i as Map<String, dynamic>)).toList();
  }

  // ─── Composite Dashboard Data ───

  Future<AiBusinessHealth> getBusinessHealth() async {
    try {
      final results = await Future.wait([
        _api.requestWithRetry(() async {
          final h = await _api.headers;
          return http.get(Uri.parse('${_api.baseUrl}/ai/insights'), headers: h);
        }),
        _api.requestWithRetry(() async {
          final h = await _api.headers;
          return http.get(Uri.parse('${_api.baseUrl}/ai/forecast?days=7'), headers: h);
        }),
        _api.requestWithRetry(() async {
          final h = await _api.headers;
          return http.get(Uri.parse('${_api.baseUrl}/billing/entitlements/${_api.tenantId ?? ''}'), headers: h);
        }),
      ]);

      final insightsData = results[0]['insights'] ?? results[0]['data'] ?? [];
      final insights = (insightsData is List ? insightsData : []).map((i) => AiInsight.fromJson(i as Map<String, dynamic>)).toList();

      double score = 75.0;
      final dimensions = <String, double>{};
      if (insights.isNotEmpty) {
        final positive = insights.where((i) => i.severity == AiAlertSeverity.success).length;
        final critical = insights.where((i) => i.severity == AiAlertSeverity.critical).length;
        score = ((positive / insights.length) * 100 - (critical / insights.length) * 30).clamp(0, 100);
      }

      return AiBusinessHealth(
        score: score,
        label: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs Attention' : 'Critical',
        insights: insights.take(10).toList(),
        dimensions: dimensions,
        overallSeverity: score >= 70 ? AiAlertSeverity.success : score >= 50 ? AiAlertSeverity.warning : AiAlertSeverity.critical,
      );
    } catch (_) {
      return const AiBusinessHealth(score: 75, label: 'Good');
    }
  }
}
