enum AiProviderStatus { active, inactive, configured, error }

enum ConversationType { general, orders, inventory, finance, staff, marketing, report }

enum AiAlertSeverity { info, warning, critical, success }

enum AiReportType { weekly, monthly, branch, menu, staff, custom }

enum WorkflowTrigger { schedule, event, threshold, manual }

enum WorkflowAction { notify, report, adjust, order, assign, message }

class AiProviderConfig {
  final String name;
  final String displayName;
  final bool isDefault;
  final bool isAvailable;
  final Map<String, dynamic>? config;

  const AiProviderConfig({
    required this.name,
    required this.displayName,
    this.isDefault = false,
    this.isAvailable = false,
    this.config,
  });

  factory AiProviderConfig.fromJson(Map<String, dynamic> json) => AiProviderConfig(
    name: json['name'] ?? '',
    displayName: json['displayName'] ?? json['name'] ?? '',
    isDefault: json['isDefault'] ?? false,
    isAvailable: json['isAvailable'] ?? true,
    config: json['config'],
  );
}

class AiConversation {
  final String id;
  final String title;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? lastMessage;
  final int messageCount;

  const AiConversation({
    required this.id,
    required this.title,
    required this.createdAt,
    required this.updatedAt,
    this.lastMessage,
    this.messageCount = 0,
  });

  factory AiConversation.fromJson(Map<String, dynamic> json) => AiConversation(
    id: json['id'] ?? '',
    title: json['title'] ?? 'New Conversation',
    createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) ?? DateTime.now() : DateTime.now(),
    updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt']) ?? DateTime.now() : DateTime.now(),
    lastMessage: json['lastMessage'],
    messageCount: json['messageCount'] ?? 0,
  );
}

class AiMessage {
  final String id;
  final String role;
  final String content;
  final Map<String, dynamic>? chart;
  final List<Map<String, dynamic>>? sources;
  final DateTime? createdAt;

  const AiMessage({
    required this.id,
    required this.role,
    required this.content,
    this.chart,
    this.sources,
    this.createdAt,
  });

  factory AiMessage.fromJson(Map<String, dynamic> json) => AiMessage(
    id: json['id'] ?? '',
    role: json['role'] ?? 'user',
    content: json['content'] ?? '',
    chart: json['chart'],
    sources: json['sources'] != null ? List<Map<String, dynamic>>.from(json['sources']) : null,
    createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
  );

  bool get isUser => role == 'user';
  bool get isAssistant => role == 'assistant';
}

class AiChatResponse {
  final String content;
  final String conversationId;
  final Map<String, dynamic>? chart;
  final List<Map<String, dynamic>> sources;

  const AiChatResponse({
    required this.content,
    required this.conversationId,
    this.chart,
    this.sources = const [],
  });

  factory AiChatResponse.fromJson(Map<String, dynamic> json) => AiChatResponse(
    content: json['content'] ?? '',
    conversationId: json['conversationId'] ?? '',
    chart: json['chart'],
    sources: (json['sources'] as List<dynamic>?)?.map((s) => s as Map<String, dynamic>).toList() ?? [],
  );
}

class AiReport {
  final String id;
  final String type;
  final String title;
  final String content;
  final String status;
  final DateTime? periodFrom;
  final DateTime? periodTo;
  final DateTime createdAt;

  const AiReport({
    required this.id,
    required this.type,
    required this.title,
    required this.content,
    required this.status,
    this.periodFrom,
    this.periodTo,
    required this.createdAt,
  });

  factory AiReport.fromJson(Map<String, dynamic> json) => AiReport(
    id: json['id'] ?? '',
    type: json['type'] ?? 'weekly',
    title: json['title'] ?? '',
    content: json['content'] ?? '',
    status: json['status'] ?? 'completed',
    periodFrom: json['periodFrom'] != null ? DateTime.tryParse(json['periodFrom']) : null,
    periodTo: json['periodTo'] != null ? DateTime.tryParse(json['periodTo']) : null,
    createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) ?? DateTime.now() : DateTime.now(),
  );
}

class AiInsight {
  final String id;
  final String title;
  final String description;
  final String category;
  final AiAlertSeverity severity;
  final double? confidence;
  final String? actionLabel;
  final String? actionRoute;
  final Map<String, dynamic>? data;
  final DateTime createdAt;

  const AiInsight({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    this.severity = AiAlertSeverity.info,
    this.confidence,
    this.actionLabel,
    this.actionRoute,
    this.data,
    required this.createdAt,
  });

  factory AiInsight.fromJson(Map<String, dynamic> json) => AiInsight(
    id: json['id'] ?? '',
    title: json['title'] ?? '',
    description: json['description'] ?? '',
    category: json['category'] ?? 'general',
    severity: _parseSeverity(json['severity']),
    confidence: json['confidence'] != null ? (json['confidence'] as num).toDouble() : null,
    actionLabel: json['actionLabel'],
    actionRoute: json['actionRoute'],
    data: json['data'],
    createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) ?? DateTime.now() : DateTime.now(),
  );

  static AiAlertSeverity _parseSeverity(String? v) {
    switch (v) {
      case 'critical': return AiAlertSeverity.critical;
      case 'warning': return AiAlertSeverity.warning;
      case 'success': return AiAlertSeverity.success;
      default: return AiAlertSeverity.info;
    }
  }
}

class AiForecast {
  final String metric;
  final int horizon;
  final List<ForecastPoint> predictions;
  final double? trend;
  final String? summary;

  const AiForecast({
    required this.metric,
    required this.horizon,
    this.predictions = const [],
    this.trend,
    this.summary,
  });

  factory AiForecast.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;
    return AiForecast(
      metric: data['metric'] ?? json['metric'] ?? '',
      horizon: data['horizon'] ?? json['horizon'] ?? 7,
      predictions: (data['predictions'] as List<dynamic>? ?? []).map((p) => ForecastPoint.fromJson(p as Map<String, dynamic>)).toList(),
      trend: data['trend'] != null ? (data['trend'] as num).toDouble() : null,
      summary: data['summary'],
    );
  }
}

class ForecastPoint {
  final DateTime date;
  final double value;
  final double? lower;
  final double? upper;

  const ForecastPoint({required this.date, required this.value, this.lower, this.upper});

  factory ForecastPoint.fromJson(Map<String, dynamic> json) => ForecastPoint(
    date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
    value: (json['value'] ?? 0).toDouble(),
    lower: json['lower'] != null ? (json['lower'] as num).toDouble() : null,
    upper: json['upper'] != null ? (json['upper'] as num).toDouble() : null,
  );
}

class AiBusinessHealth {
  final double score;
  final String label;
  final List<AiInsight> insights;
  final Map<String, double> dimensions;
  final AiAlertSeverity overallSeverity;

  const AiBusinessHealth({
    required this.score,
    required this.label,
    this.insights = const [],
    this.dimensions = const {},
    this.overallSeverity = AiAlertSeverity.info,
  });

  factory AiBusinessHealth.fromJson(Map<String, dynamic> json) => AiBusinessHealth(
    score: (json['score'] ?? 0).toDouble(),
    label: json['label'] ?? '',
    insights: (json['insights'] as List<dynamic>? ?? []).map((i) => AiInsight.fromJson(i as Map<String, dynamic>)).toList(),
    dimensions: (json['dimensions'] as Map<String, dynamic>?)?.map((k, v) => MapEntry(k, (v as num).toDouble())) ?? {},
    overallSeverity: AiInsight._parseSeverity(json['overallSeverity']),
  );
}

class AiAlert {
  final String id;
  final String title;
  final String message;
  final AiAlertSeverity severity;
  final String? category;
  final String? actionLabel;
  final String? actionRoute;
  final bool isRead;
  final DateTime createdAt;

  const AiAlert({
    required this.id,
    required this.title,
    required this.message,
    required this.severity,
    this.category,
    this.actionLabel,
    this.actionRoute,
    this.isRead = false,
    required this.createdAt,
  });

  factory AiAlert.fromJson(Map<String, dynamic> json) => AiAlert(
    id: json['id'] ?? '',
    title: json['title'] ?? '',
    message: json['message'] ?? '',
    severity: AiInsight._parseSeverity(json['severity']),
    category: json['category'],
    actionLabel: json['actionLabel'],
    actionRoute: json['actionRoute'],
    isRead: json['isRead'] ?? false,
    createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) ?? DateTime.now() : DateTime.now(),
  );
}

class AiWorkflow {
  final String id;
  final String name;
  final String description;
  final WorkflowTrigger trigger;
  final String triggerConfig;
  final List<AiWorkflowStep> steps;
  final bool isActive;
  final int executionCount;
  final DateTime? lastExecuted;
  final DateTime createdAt;

  const AiWorkflow({
    required this.id,
    required this.name,
    required this.description,
    required this.trigger,
    required this.triggerConfig,
    this.steps = const [],
    this.isActive = true,
    this.executionCount = 0,
    this.lastExecuted,
    required this.createdAt,
  });

  factory AiWorkflow.fromJson(Map<String, dynamic> json) => AiWorkflow(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    description: json['description'] ?? '',
    trigger: WorkflowTrigger.values.firstWhere((t) => t.name == json['trigger'], orElse: () => WorkflowTrigger.manual),
    triggerConfig: json['triggerConfig'] ?? '',
    steps: (json['steps'] as List<dynamic>? ?? []).map((s) => AiWorkflowStep.fromJson(s as Map<String, dynamic>)).toList(),
    isActive: json['isActive'] ?? true,
    executionCount: json['executionCount'] ?? 0,
    lastExecuted: json['lastExecuted'] != null ? DateTime.tryParse(json['lastExecuted']) : null,
    createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) ?? DateTime.now() : DateTime.now(),
  );
}

class AiWorkflowStep {
  final String type;
  final String config;
  final bool requiresApproval;

  const AiWorkflowStep({required this.type, required this.config, this.requiresApproval = false});

  factory AiWorkflowStep.fromJson(Map<String, dynamic> json) => AiWorkflowStep(
    type: json['type'] ?? '',
    config: json['config'] ?? '',
    requiresApproval: json['requiresApproval'] ?? false,
  );
}

class AiSearchResult {
  final String id;
  final String type;
  final String title;
  final String snippet;
  final double score;
  final String? route;
  final Map<String, dynamic>? metadata;

  const AiSearchResult({
    required this.id,
    required this.type,
    required this.title,
    required this.snippet,
    required this.score,
    this.route,
    this.metadata,
  });

  factory AiSearchResult.fromJson(Map<String, dynamic> json) => AiSearchResult(
    id: json['id'] ?? '',
    type: json['type'] ?? '',
    title: json['title'] ?? '',
    snippet: json['snippet'] ?? '',
    score: (json['score'] ?? 0).toDouble(),
    route: json['route'],
    metadata: json['metadata'],
  );
}

class AiUsageStats {
  final int totalQueries;
  final int totalTokens;
  final int conversationsCount;
  final int reportsGenerated;
  final double avgResponseTimeMs;
  final Map<String, int> queriesByProvider;
  final Map<String, int> queriesByCategory;

  const AiUsageStats({
    this.totalQueries = 0,
    this.totalTokens = 0,
    this.conversationsCount = 0,
    this.reportsGenerated = 0,
    this.avgResponseTimeMs = 0,
    this.queriesByProvider = const {},
    this.queriesByCategory = const {},
  });

  factory AiUsageStats.fromJson(Map<String, dynamic> json) => AiUsageStats(
    totalQueries: json['totalQueries'] ?? 0,
    totalTokens: json['totalTokens'] ?? 0,
    conversationsCount: json['conversationsCount'] ?? 0,
    reportsGenerated: json['reportsGenerated'] ?? 0,
    avgResponseTimeMs: (json['avgResponseTimeMs'] ?? 0).toDouble(),
    queriesByProvider: (json['queriesByProvider'] as Map<String, dynamic>?)?.map((k, v) => MapEntry(k, v as int)) ?? {},
    queriesByCategory: (json['queriesByCategory'] as Map<String, dynamic>?)?.map((k, v) => MapEntry(k, v as int)) ?? {},
  );
}
