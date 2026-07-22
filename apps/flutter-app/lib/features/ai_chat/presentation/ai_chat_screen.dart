import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../data/chat_models.dart';
import '../data/chat_provider.dart';

final aiChatProvider = ChangeNotifierProvider<AiChatProvider>((ref) {
  return AiChatProvider(ref.watch(apiClientProvider));
});

class AiChatScreen extends ConsumerStatefulWidget {
  const AiChatScreen({super.key});

  @override
  ConsumerState<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends ConsumerState<AiChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(aiChatProvider).initChat();
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
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
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
    final messages = chat.state.messages;

    ref.listen<AiChatProvider>(aiChatProvider, (_, next) {
      _scrollToBottom();
    });

    return Scaffold(
      backgroundColor: AppColors.gray50,
      appBar: AppBar(
        title: Text('AI Assistant', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: () => ref.read(aiChatProvider).clearChat(),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: messages.isEmpty || (messages.length == 1 && messages.first.id == 'welcome')
                ? _buildWelcomeView(messages)
                : _buildChatMessages(messages),
          ),
          _buildSuggestions(chat),
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildWelcomeView(List<ChatMessage> messages) {
    return SingleChildScrollView(
      child: Column(
        children: [
          if (messages.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: _buildMessageBubble(messages.first),
            ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Quick Actions', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.gray800)),
                const SizedBox(height: 12),
                ...ref.read(aiChatProvider).suggestions.map((s) => _buildSuggestionCard(s)),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildSuggestionCard(ChatSuggestion suggestion) {
    return GestureDetector(
      onTap: () {
        _controller.text = suggestion.query;
        _sendMessage(suggestion.query);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.gray200),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.auto_awesome, size: 18, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(suggestion.title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                  Text(suggestion.subtitle, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.gray400),
          ],
        ),
      ),
    );
  }

  Widget _buildChatMessages(List<ChatMessage> messages) {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: messages.length,
      itemBuilder: (ctx, i) => _buildMessageBubble(messages[i]),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    if (message.isLoading) {
      return Align(
        alignment: Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
              ),
              const SizedBox(width: 8),
              Text('Thinking...', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray500)),
            ],
          ),
        ),
      );
    }

    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: message.isUser ? AppColors.primary : AppColors.white,
          borderRadius: BorderRadius.circular(12).copyWith(
            bottomRight: message.isUser ? const Radius.circular(4) : null,
            bottomLeft: !message.isUser ? const Radius.circular(4) : null,
          ),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.content,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: message.isUser ? AppColors.white : AppColors.gray800,
                height: 1.5,
              ),
            ),
            if (message.timestamp != null) ...[
              const SizedBox(height: 6),
              Text(
                _formatTime(message.timestamp!),
                style: GoogleFonts.inter(
                  fontSize: 10,
                  color: message.isUser ? AppColors.white.withValues(alpha: 0.7) : AppColors.gray400,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestions(AiChatProvider chat) {
    if (chat.state.messages.length > 2) return const SizedBox.shrink();
    final suggestions = chat.suggestions.take(3).toList();

    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: suggestions.map((s) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: ActionChip(
            label: Text(s.title, style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary)),
            backgroundColor: AppColors.primary.withValues(alpha: 0.08),
            side: BorderSide.none,
            onPressed: () {
              _controller.text = s.query;
              _sendMessage(s.query);
            },
          ),
        )).toList(),
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
                decoration: BoxDecoration(
                  color: AppColors.gray100,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: _controller,
                  style: GoogleFonts.inter(fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Ask me anything...',
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
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
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
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}
