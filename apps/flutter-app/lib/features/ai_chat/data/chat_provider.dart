import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import 'chat_models.dart';

class AiChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final String? error;

  const AiChatState({
    this.messages = const [],
    this.isLoading = false,
    this.error,
  });

  AiChatState copyWith({List<ChatMessage>? messages, bool? isLoading, String? error}) {
    return AiChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AiChatProvider extends ChangeNotifier {
  final ApiClient _api;
  AiChatState _state = const AiChatState();

  AiChatProvider(this._api);

  AiChatState get state => _state;
  List<ChatMessage> get messages => _state.messages;
  bool get isLoading => _state.isLoading;

  static const _suggestions = [
    ChatSuggestion(title: 'Sales Summary', subtitle: 'Show me today\'s sales overview', query: 'Show me today\'s sales summary'),
    ChatSuggestion(title: 'Top Items', subtitle: 'What are the best-selling items?', query: 'What are my top selling items today?'),
    ChatSuggestion(title: 'Staff Performance', subtitle: 'How is my staff performing?', query: 'Give me a staff performance summary'),
    ChatSuggestion(title: 'Inventory Alert', subtitle: 'Any low stock items?', query: 'Are there any items running low on stock?'),
    ChatSuggestion(title: 'Revenue Forecast', subtitle: 'Predict next week\'s revenue', query: 'Can you forecast revenue for next week?'),
    ChatSuggestion(title: 'Customer Insights', subtitle: 'Analyze customer patterns', query: 'What are the customer visit patterns this week?'),
  ];

  List<ChatSuggestion> get suggestions => _suggestions;

  void initChat() {
    _state = const AiChatState(messages: [
      ChatMessage(
        id: 'welcome',
        content: 'Hello! I\'m your AI restaurant assistant. I can help you with:\n\n• Sales and revenue analysis\n• Inventory management\n• Staff scheduling\n• Customer insights\n• Financial forecasting\n• General operations advice\n\nWhat would you like to know?',
        isUser: false,
      ),
    ]);
    notifyListeners();
  }

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty || _state.isLoading) return;

    final userMessage = ChatMessage(
      id: 'user_${DateTime.now().millisecondsSinceEpoch}',
      content: text.trim(),
      isUser: true,
      timestamp: DateTime.now(),
    );

    final loadingMessage = ChatMessage(
      id: 'loading_${DateTime.now().millisecondsSinceEpoch}',
      content: '',
      isUser: false,
      timestamp: DateTime.now(),
      isLoading: true,
    );

    _state = _state.copyWith(
      messages: [..._state.messages, userMessage, loadingMessage],
      isLoading: true,
      error: null,
    );
    notifyListeners();

    try {
      final response = await _api.requestWithRetry(() async {
        final h = await _api.headers;
        return http.post(
          Uri.parse('${_api.baseUrl}/ai/chat'),
          headers: h,
          body: jsonEncode({'message': text.trim(), 'context': 'restaurant_management'}),
        );
      });

      final reply = response['reply'] ?? response['message'] ?? response['response'] ?? 'I couldn\'t generate a response. Please try again.';
      final assistantMessage = ChatMessage(
        id: 'ai_${DateTime.now().millisecondsSinceEpoch}',
        content: reply.toString(),
        isUser: false,
        timestamp: DateTime.now(),
      );

      final messages = List<ChatMessage>.from(_state.messages);
      messages.removeWhere((m) => m.id.startsWith('loading_'));
      messages.add(assistantMessage);

      _state = _state.copyWith(messages: messages, isLoading: false);
    } catch (e) {
      final errorMessage = ChatMessage(
        id: 'error_${DateTime.now().millisecondsSinceEpoch}',
        content: 'Sorry, I encountered an error. Please try again later.',
        isUser: false,
        timestamp: DateTime.now(),
      );

      final messages = List<ChatMessage>.from(_state.messages);
      messages.removeWhere((m) => m.id.startsWith('loading_'));
      messages.add(errorMessage);

      _state = _state.copyWith(messages: messages, isLoading: false, error: e.toString());
    }
    notifyListeners();
  }

  void clearChat() {
    _state = const AiChatState();
    initChat();
  }
}
