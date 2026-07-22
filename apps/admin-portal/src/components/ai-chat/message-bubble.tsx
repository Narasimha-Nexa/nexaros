'use client';

import React, { useState } from 'react';
import { Copy, Check, Pin, Pencil, Trash2 } from 'lucide-react';
import { AIAvatar, UserAvatar } from './ai-avatar';
import { ChartRenderer } from './chart-renderer';
import { SourcesPanel } from './sources-panel';
import { ActionButtons } from './action-buttons';
import type { ChatMessage } from '@/stores/ai-chat.store';

interface MessageBubbleProps {
  message: ChatMessage;
  onCopy?: (text: string) => void;
  onExport?: (format: string) => void;
  onRetry?: () => void;
  isStreaming?: boolean;
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-canvas-soft border border-hairline text-[11px] font-mono">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-sm font-semibold text-ink mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-sm font-bold text-ink mt-4 mb-1">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-base font-bold text-ink mt-4 mb-2">$1</h1>')
    .replace(/^\| (.*) \|$/gm, (match) => {
      const cells = match.split('|').filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return '';
      return `<tr>${cells.map((c) => `<td class="px-2 py-1 border border-hairline text-xs">${c}</td>`).join('')}</tr>`;
    })
    .replace(/(<tr>[\s\S]*?<\/tr>)+/g, (match) => `<table class="border-collapse border border-hairline my-2">${match}</table>`)
    .replace(/^- (.*$)/gm, '<li class="ml-4 text-xs">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)+/g, (match) => `<ul class="list-disc my-1">${match}</ul>`)
    .replace(/\n/g, '<br/>');
}

export function MessageBubble({ message, onCopy, onExport, onRetry, isStreaming }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    onCopy?.(message.content);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 px-4 py-3 ${isUser ? 'bg-canvas' : 'bg-canvas-soft'}`}>
      {isUser ? <UserAvatar initials="U" /> : <AIAvatar />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-ink">{isUser ? 'You' : 'Nexa AI'}</span>
          <span className="text-[10px] text-caption">
            {new Date(message.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div
          className="text-sm text-ink leading-relaxed prose prose-xs max-w-none"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
        />

        {message.chart && <div className="mt-3"><ChartRenderer chart={message.chart} /></div>}
        {message.sources && message.sources.length > 0 && <SourcesPanel sources={message.sources} />}

        {!isUser && (
          <div className="flex items-center gap-1 mt-2">
            <button onClick={handleCopy} className="p-1 text-caption hover:text-ink transition-colors" title="Copy">
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            </button>
            <ActionButtons
              onExport={onExport}
              onRefresh={onRetry}
              isStreaming={isStreaming}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onPin,
  onRename,
  onDelete,
}: {
  conversation: { id: string; title: string; pinned: boolean; updatedAt: string; _count?: { messages: number } };
  isActive: boolean;
  onSelect: () => void;
  onPin: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
        isActive ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-canvas-soft border-l-2 border-transparent'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          {conversation.pinned && <Pin size={10} className="text-primary shrink-0" />}
          <p className="text-xs font-medium text-ink truncate">{conversation.title}</p>
        </div>
        <p className="text-[10px] text-caption mt-0.5">
          {new Date(conversation.updatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          {conversation._count ? ` · ${conversation._count.messages} messages` : ''}
        </p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onPin(); }} className="p-0.5 hover:text-primary" title="Pin">
          <Pin size={10} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onRename(); }} className="p-0.5 hover:text-primary" title="Rename">
          <Pencil size={10} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-0.5 hover:text-danger" title="Delete">
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}
