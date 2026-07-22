enum TicketStatus { open, inProgress, waitingCustomer, resolved, closed }

enum TicketPriority { low, normal, high, urgent }

enum SenderType { customer, admin, system }

class SupportTicket {
  final String id;
  final String tenantId;
  final String subject;
  final String description;
  final TicketStatus status;
  final TicketPriority priority;
  final String? assignedTo;
  final List<TicketMessage> messages;
  final DateTime createdAt;
  final DateTime updatedAt;

  const SupportTicket({
    required this.id,
    required this.tenantId,
    required this.subject,
    required this.description,
    this.status = TicketStatus.open,
    this.priority = TicketPriority.normal,
    this.assignedTo,
    this.messages = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) => SupportTicket(
    id: json['id'] ?? '',
    tenantId: json['tenantId'] ?? '',
    subject: json['subject'] ?? '',
    description: json['description'] ?? '',
    status: TicketStatus.values.firstWhere((s) => s.name == json['status']?.toLowerCase(), orElse: () => TicketStatus.open),
    priority: TicketPriority.values.firstWhere((p) => p.name == json['priority']?.toLowerCase(), orElse: () => TicketPriority.normal),
    assignedTo: json['assignedTo'],
    messages: (json['messages'] as List<dynamic>?)?.map((m) => TicketMessage.fromJson(m)).toList() ?? [],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
  );

  TicketMessage? get lastMessage => messages.isNotEmpty ? messages.last : null;
  bool get isOpen => status == TicketStatus.open || status == TicketStatus.inProgress || status == TicketStatus.waitingCustomer;
}

class TicketMessage {
  final String id;
  final String ticketId;
  final SenderType senderType;
  final String senderId;
  final String message;
  final bool isInternal;
  final DateTime createdAt;

  const TicketMessage({
    required this.id,
    required this.ticketId,
    required this.senderType,
    required this.senderId,
    required this.message,
    this.isInternal = false,
    required this.createdAt,
  });

  factory TicketMessage.fromJson(Map<String, dynamic> json) => TicketMessage(
    id: json['id'] ?? '',
    ticketId: json['ticketId'] ?? '',
    senderType: SenderType.values.firstWhere((s) => s.name == json['senderType']?.toLowerCase(), orElse: () => SenderType.system),
    senderId: json['senderId'] ?? '',
    message: json['message'] ?? '',
    isInternal: json['isInternal'] ?? false,
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

class SupportStats {
  final int total;
  final int active;
  final int open;
  final int inProgress;
  final int waitingCustomer;
  final int resolved;
  final int closed;
  final List<PriorityCount> byPriority;

  const SupportStats({
    this.total = 0,
    this.active = 0,
    this.open = 0,
    this.inProgress = 0,
    this.waitingCustomer = 0,
    this.resolved = 0,
    this.closed = 0,
    this.byPriority = const [],
  });

  factory SupportStats.fromJson(Map<String, dynamic> json) {
    final byStatus = json['byStatus'] as Map<String, dynamic>? ?? {};
    final byPriority = (json['byPriority'] as List<dynamic>?)?.map((p) => PriorityCount.fromJson(p)).toList() ?? [];
    return SupportStats(
      total: json['total'] ?? 0,
      active: json['active'] ?? 0,
      open: byStatus['open'] ?? 0,
      inProgress: byStatus['inProgress'] ?? 0,
      waitingCustomer: byStatus['waitingCustomer'] ?? 0,
      resolved: byStatus['resolved'] ?? 0,
      closed: byStatus['closed'] ?? 0,
      byPriority: byPriority,
    );
  }
}

class PriorityCount {
  final String priority;
  final int count;

  const PriorityCount({required this.priority, required this.count});

  factory PriorityCount.fromJson(Map<String, dynamic> json) => PriorityCount(
    priority: json['priority'] ?? '',
    count: json['count'] ?? 0,
  );
}

class FaqItem {
  final String id;
  final String question;
  final String answer;
  final String category;

  const FaqItem({required this.id, required this.question, required this.answer, required this.category});

  factory FaqItem.fromJson(Map<String, dynamic> json) => FaqItem(
    id: json['id'] ?? '', question: json['question'] ?? '', answer: json['answer'] ?? '', category: json['category'] ?? '',
  );
}

class SupportStatusHelpers {
  static String statusLabel(TicketStatus status) {
    switch (status) {
      case TicketStatus.open: return 'Open';
      case TicketStatus.inProgress: return 'In Progress';
      case TicketStatus.waitingCustomer: return 'Waiting';
      case TicketStatus.resolved: return 'Resolved';
      case TicketStatus.closed: return 'Closed';
    }
  }

  static String priorityLabel(TicketPriority priority) {
    switch (priority) {
      case TicketPriority.low: return 'Low';
      case TicketPriority.normal: return 'Normal';
      case TicketPriority.high: return 'High';
      case TicketPriority.urgent: return 'Urgent';
    }
  }
}
