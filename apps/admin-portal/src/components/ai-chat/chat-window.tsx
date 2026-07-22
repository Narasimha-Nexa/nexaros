'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { MessageBubble } from './message-bubble';
import { PromptSuggestions } from './prompt-suggestions';
import type { ChatMessage } from '@/stores/ai-chat.store';

interface ChatWindowProps {
  messages: ChatMessage[];
  suggestions: string[];
  streaming: boolean;
  sending: boolean;
  onSend: (message: string) => void;
  onSuggestionSelect: (suggestion: string) => void;
  onExport?: (format: string) => void;
  onRetry?: () => void;
}

export function ChatWindow({
  messages,
  suggestions,
  streaming,
  sending,
  onSend,
  onSuggestionSelect,
  onExport,
  onRetry,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text || sending) return;
    onSend(text);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [input, sending, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const hasProviderWarning = false;

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-primary" />
            </div>
            <h3 className="text-base font-display font-semibold text-ink mb-1">AI Business Copilot</h3>
            <p className="text-sm text-body text-center max-w-sm mb-6">
              Ask questions about your restaurant business in natural language.
              Get insights on revenue, orders, inventory, customers, and more.
            </p>
            {suggestions.length > 0 && (
              <PromptSuggestions suggestions={suggestions.slice(0, 6)} onSelect={onSuggestionSelect} />
            )}
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onExport={onExport}
                onRetry={onRetry}
                isStreaming={streaming && msg.isStreaming}
              />
            ))}
            {sending && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3 px-4 py-3 bg-canvas-soft">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Loader2 size={14} className="text-primary animate-spin" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-ink">Nexa AI</span>
                  <p className="text-xs text-caption mt-0.5 animate-pulse">Analyzing your data…</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-hairline p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about revenue, forecasts, inventory…"
            rows={1}
            className="flex-1 px-3 py-2 text-sm text-ink bg-canvas-soft border border-hairline placeholder:text-caption resize-none focus:outline-none focus:border-primary/40 min-h-[36px] max-h-[120px]"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || sending}
            className="p-2 bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-caption mt-1.5 px-1">
          AI-generated insights may not always be accurate. Verify critical business decisions.
        </p>
      </div>
    </div>
  );
}
