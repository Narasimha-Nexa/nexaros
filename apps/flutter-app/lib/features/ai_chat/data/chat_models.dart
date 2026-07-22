class ChatMessage {
  final String id;
  final String content;
  final bool isUser;
  final DateTime? timestamp;
  final bool isLoading;

  const ChatMessage({
    required this.id,
    required this.content,
    required this.isUser,
    this.timestamp,
    this.isLoading = false,
  });

  ChatMessage copyWith({String? id, String? content, bool? isUser, DateTime? timestamp, bool? isLoading}) {
    return ChatMessage(
      id: id ?? this.id,
      content: content ?? this.content,
      isUser: isUser ?? this.isUser,
      timestamp: timestamp ?? this.timestamp,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class ChatSuggestion {
  final String title;
  final String subtitle;
  final String query;

  const ChatSuggestion({required this.title, required this.subtitle, required this.query});
}
