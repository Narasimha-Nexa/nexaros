import 'package:flutter/material.dart';
import '../data/ai_models.dart';
import '../data/ai_service.dart';

class AiChatState {
  final List<AiMessage> messages;
  final String? conversationId;
  final bool isLoading;
  final bool isStreaming;
  final String? error;
  final String streamingText;

  const AiChatState({
    this.messages = const [],
    this.conversationId,
    this.isLoading = false,
    this.isStreaming = false,
    this.error,
    this.streamingText = '',
  });

  AiChatState copyWith({
    List<AiMessage>? messages,
    String? conversationId,
    bool? isLoading,
    bool? isStreaming,
    String? error,
    String? streamingText,
  }) {
    return AiChatState(
      messages: messages ?? this.messages,
      conversationId: conversationId ?? this.conversationId,
      isLoading: isLoading ?? this.isLoading,
      isStreaming: isStreaming ?? this.isStreaming,
      error: error,
      streamingText: streamingText ?? this.streamingText,
    );
  }
}

class AiChatProvider extends ChangeNotifier {
  final AiPlatformService _service;
  AiChatState _state = const AiChatState();

  AiChatProvider(this._service);

  AiChatState get state => _state;
  List<AiMessage> get messages => _state.messages;
  bool get isLoading => _state.isLoading;
  bool get isStreaming => _state.isStreaming;
  String? get conversationId => _state.conversationId;

  void initChat() {
    _state = const AiChatState();
    notifyListeners();
  }

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty || _state.isLoading) return;

    final userMsg = AiMessage(id: 'u_${DateTime.now().millisecondsSinceEpoch}', role: 'user', content: text.trim());
    _state = _state.copyWith(
      messages: [..._state.messages, userMsg],
      isLoading: true,
      error: null,
    );
    notifyListeners();

    try {
      final response = await _service.chat(text.trim(), conversationId: _state.conversationId);
      final assistantMsg = AiMessage(
        id: 'a_${DateTime.now().millisecondsSinceEpoch}',
        role: 'assistant',
        content: response.content,
        chart: response.chart,
        sources: response.sources,
      );
      _state = _state.copyWith(
        messages: [..._state.messages, assistantMsg],
        conversationId: response.conversationId,
        isLoading: false,
      );
    } catch (e) {
      final errorMsg = AiMessage(
        id: 'e_${DateTime.now().millisecondsSinceEpoch}',
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      );
      _state = _state.copyWith(
        messages: [..._state.messages, errorMsg],
        isLoading: false,
        error: e.toString(),
      );
    }
    notifyListeners();
  }

  Future<void> loadConversation(String conversationId) async {
    _state = _state.copyWith(isLoading: true);
    notifyListeners();
    try {
      final messages = await _service.getConversationMessages(conversationId);
      _state = _state.copyWith(messages: messages, conversationId: conversationId, isLoading: false);
    } catch (e) {
      _state = _state.copyWith(isLoading: false, error: e.toString());
    }
    notifyListeners();
  }

  void clearChat() {
    _state = const AiChatState();
    notifyListeners();
  }
}

class AiConversationListProvider extends ChangeNotifier {
  final AiPlatformService _service;
  List<AiConversation> _conversations = [];
  bool _isLoading = false;
  String? _error;

  AiConversationListProvider(this._service);

  List<AiConversation> get conversations => _conversations;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadConversations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _conversations = await _service.listConversations();
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> deleteConversation(String id) async {
    final success = await _service.deleteConversation(id);
    if (success) {
      _conversations.removeWhere((c) => c.id == id);
      notifyListeners();
    }
    return success;
  }
}

class AiDashboardProvider extends ChangeNotifier {
  final AiPlatformService _service;
  AiBusinessHealth? _health;
  List<AiInsight> _insights = [];
  List<AiAlert> _alerts = [];
  AiForecast? _revenueForecast;
  AiForecast? _ordersForecast;
  AiUsageStats? _usageStats;
  bool _isLoading = false;
  String? _error;

  AiDashboardProvider(this._service);

  AiBusinessHealth? get health => _health;
  List<AiInsight> get insights => _insights;
  List<AiAlert> get alerts => _alerts;
  AiForecast? get revenueForecast => _revenueForecast;
  AiForecast? get ordersForecast => _ordersForecast;
  AiUsageStats? get usageStats => _usageStats;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        _service.getBusinessHealth(),
        _service.getInsights(),
        _service.getForecast(days: 7),
        _service.getForecast(days: 7),
      ]);
      _health = results[0] as AiBusinessHealth;
      _insights = results[1] as List<AiInsight>;
      _revenueForecast = results[2] as AiForecast;
      _ordersForecast = results[3] as AiForecast;
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadInsights() async {
    try {
      _insights = await _service.getInsights();
      notifyListeners();
    } catch (_) {}
  }
}

class AiReportsProvider extends ChangeNotifier {
  final AiPlatformService _service;
  List<AiReport> _reports = [];
  bool _isLoading = false;
  bool _isGenerating = false;
  String? _error;

  AiReportsProvider(this._service);

  List<AiReport> get reports => _reports;
  bool get isLoading => _isLoading;
  bool get isGenerating => _isGenerating;
  String? get error => _error;

  Future<void> loadReports() async {
    _isLoading = true;
    notifyListeners();
    try {
      _reports = await _service.listReports();
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<AiReport?> generateReport(String type, {String? from, String? to}) async {
    _isGenerating = true;
    _error = null;
    notifyListeners();
    try {
      final report = await _service.generateReport(type, from: from, to: to);
      _reports.insert(0, report);
      _isGenerating = false;
      notifyListeners();
      return report;
    } catch (e) {
      _error = e.toString();
      _isGenerating = false;
      notifyListeners();
      return null;
    }
  }
}

class AiWorkflowProvider extends ChangeNotifier {
  List<AiWorkflow> _workflows = [];
  bool _isLoading = false;

  List<AiWorkflow> get workflows => _workflows;
  bool get isLoading => _isLoading;

  void loadMockWorkflows() {
    _workflows = [
      AiWorkflow(id: '1', name: 'Daily Revenue Report', description: 'Send daily revenue summary at 10 PM', trigger: WorkflowTrigger.schedule, triggerConfig: '0 22 * * *', steps: [AiWorkflowStep(type: 'report', config: 'daily_revenue'), AiWorkflowStep(type: 'notify', config: 'owner')], isActive: true, executionCount: 45, lastExecuted: DateTime.now().subtract(const Duration(hours: 2)), createdAt: DateTime.now().subtract(const Duration(days: 30))),
      AiWorkflow(id: '2', name: 'Low Stock Alert', description: 'Auto-alert when inventory drops below threshold', trigger: WorkflowTrigger.threshold, triggerConfig: 'inventory < 10', steps: [AiWorkflowStep(type: 'notify', config: 'inventory_manager'), AiWorkflowStep(type: 'order', config: 'auto_reorder')], isActive: true, executionCount: 12, createdAt: DateTime.now().subtract(const Duration(days: 15))),
      AiWorkflow(id: '3', name: 'Staff Overtime Alert', description: 'Alert when staff exceeds 48 hours/week', trigger: WorkflowTrigger.threshold, triggerConfig: 'staff_hours > 48', steps: [AiWorkflowStep(type: 'notify', config: 'hr_manager')], isActive: true, executionCount: 3, createdAt: DateTime.now().subtract(const Duration(days: 10))),
      AiWorkflow(id: '4', name: 'Weekly Performance Report', description: 'Generate comprehensive weekly performance report', trigger: WorkflowTrigger.schedule, triggerConfig: '0 9 * * 1', steps: [AiWorkflowStep(type: 'report', config: 'weekly_performance'), AiWorkflowStep(type: 'notify', config: 'all_managers')], isActive: true, executionCount: 8, createdAt: DateTime.now().subtract(const Duration(days: 60))),
    ];
    notifyListeners();
  }

  void toggleWorkflow(String id) {
    _workflows = _workflows.map((w) => w.id == id ? AiWorkflow(id: w.id, name: w.name, description: w.description, trigger: w.trigger, triggerConfig: w.triggerConfig, steps: w.steps, isActive: !w.isActive, executionCount: w.executionCount, lastExecuted: w.lastExecuted, createdAt: w.createdAt) : w).toList();
    notifyListeners();
  }
}
