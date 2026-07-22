import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../data/ai_models.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../providers/ai_providers.dart';

class AiChatScreen extends ConsumerStatefulWidget {
  const AiChatScreen({super.key});

  @override
  ConsumerState<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends ConsumerState<AiChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  bool _showHistory = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(aiChatProvider).initChat();
      ref.read(aiConversationListProvider).loadConversations();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(_scrollController.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  void _sendMessage(String text) {
    if (text.trim().isEmpty) return;
    _controller.clear();
    ref.read(aiChatProvider).sendMessage(text);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final chat = ref.watch(aiChatProvider);
    final messages = chat.messages;

    ref.listen<AiChatProvider>(aiChatProvider, (_, next) {
      _scrollToBottom();
    });

    return Scaffold(
      backgroundColor: AppColors.gray50,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Nexa AI', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16)),
            if (chat.conversationId != null)
              Text('New conversation', style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
          ],
        ),
        backgroundColor: AppColors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(_showHistory ? Icons.close : Icons.history, size: 20),
            onPressed: () => setState(() { _showHistory = !_showHistory; ref.read(aiConversationListProvider).loadConversations(); }),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: () => ref.read(aiChatProvider).clearChat(),
          ),
        ],
      ),
      body: Column(
        children: [
          if (_showHistory) _buildHistoryPanel(),
          Expanded(
            child: messages.isEmpty
                ? _buildWelcomeView()
                : _buildChatMessages(messages),
          ),
          if (chat.isStreaming) _buildStreamingIndicator(),
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildWelcomeView() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [AppColors.primary.withValues(alpha: 0.1), AppColors.secondary.withValues(alpha: 0.1)]),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.auto_awesome, size: 48, color: AppColors.primary),
            ),
            const SizedBox(height: 16),
            Text('Nexa AI Assistant', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Ask me anything about your restaurant operations', style: GoogleFonts.inter(fontSize: 14, color: AppColors.gray500), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            _buildSuggestionChips(),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestionChips() {
    final suggestions = [
      _SuggestionItem('How is revenue today?', Icons.trending_up, AppColors.success),
      _SuggestionItem('Top selling items', Icons.star, AppColors.warning),
      _SuggestionItem('Inventory alerts', Icons.warning_amber, AppColors.danger),
      _SuggestionItem('Staff performance', Icons.people, AppColors.primary),
      _SuggestionItem('Forecast next week', Icons.analytics, AppColors.secondary),
      _SuggestionItem('Generate weekly report', Icons.description, AppColors.info),
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: suggestions.map((s) => GestureDetector(
        onTap: () {
          _controller.text = s.text;
          _sendMessage(s.text);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: s.color.withValues(alpha: 0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(s.icon, size: 14, color: s.color),
              const SizedBox(width: 6),
              Text(s.text, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray700)),
            ],
          ),
        ),
      )).toList(),
    );
  }

  Widget _buildChatMessages(List<AiMessage> messages) {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: messages.length,
      itemBuilder: (ctx, i) => _buildMessageBubble(messages[i]),
    );
  }

  Widget _buildMessageBubble(AiMessage message) {
    final isUser = message.isUser;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isUser ? AppColors.primary : AppColors.white,
          borderRadius: BorderRadius.circular(12).copyWith(
            bottomRight: isUser ? const Radius.circular(4) : null,
            bottomLeft: !isUser ? const Radius.circular(4) : null,
          ),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isUser && message.sources != null && message.sources!.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.all(6),
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(color: AppColors.info.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.psychology, size: 12, color: AppColors.info),
                    const SizedBox(width: 4),
                    Text('Used ${message.sources!.length} data source${message.sources!.length > 1 ? 's' : ''}', style: GoogleFonts.inter(fontSize: 10, color: AppColors.info)),
                  ],
                ),
              ),
            ],
            Text(message.content, style: GoogleFonts.inter(fontSize: 14, color: isUser ? AppColors.white : AppColors.gray800, height: 1.5)),
            if (message.chart != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(6)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.bar_chart, size: 14, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Text('Chart data available', style: GoogleFonts.inter(fontSize: 11, color: AppColors.primary)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStreamingIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
          const SizedBox(width: 8),
          Text('Thinking...', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
        ],
      ),
    );
  }

  Widget _buildHistoryPanel() {
    final convList = ref.watch(aiConversationListProvider);
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: AppColors.white,
        border: Border(bottom: BorderSide(color: AppColors.gray200)),
      ),
      child: convList.isLoading
          ? const Center(child: CircularProgressIndicator())
          : convList.conversations.isEmpty
              ? Center(child: Text('No conversations yet', style: GoogleFonts.inter(color: AppColors.gray500)))
              : ListView.builder(
                  padding: const EdgeInsets.all(8),
                  itemCount: convList.conversations.length,
                  itemBuilder: (ctx, i) {
                    final conv = convList.conversations[i];
                    return ListTile(
                      dense: true,
                      leading: Icon(Icons.chat_bubble_outline, size: 16, color: AppColors.gray400),
                      title: Text(conv.title, style: GoogleFonts.inter(fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                      subtitle: Text(_formatTime(conv.updatedAt), style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
                      trailing: IconButton(
                        icon: Icon(Icons.delete_outline, size: 16, color: AppColors.gray400),
                        onPressed: () async {
                          await convList.deleteConversation(conv.id);
                          ref.read(aiChatProvider).clearChat();
                        },
                      ),
                      onTap: () {
                        ref.read(aiChatProvider).loadConversation(conv.id);
                        setState(() => _showHistory = false);
                      },
                    );
                  },
                ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, -2))],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(24)),
                child: TextField(
                  controller: _controller,
                  style: GoogleFonts.inter(fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Ask Nexa anything...',
                    hintStyle: GoogleFonts.inter(color: AppColors.gray400),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                  maxLines: null,
                  textInputAction: TextInputAction.send,
                  onSubmitted: _sendMessage,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              child: IconButton(
                icon: const Icon(Icons.send, color: AppColors.white, size: 20),
                onPressed: () => _sendMessage(_controller.text),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

class _SuggestionItem {
  final String text;
  final IconData icon;
  final Color color;
  const _SuggestionItem(this.text, this.icon, this.color);
}
