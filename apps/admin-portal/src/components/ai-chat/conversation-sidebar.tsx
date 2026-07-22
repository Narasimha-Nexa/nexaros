'use client';

import React, { useState } from 'react';
import { Search, Plus, Pin, PanelLeftClose, PanelLeft } from 'lucide-react';
import { ConversationItem } from './message-bubble';
import type { Conversation } from '@/stores/ai-chat.store';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  searchQuery: string;
  searchResults: Conversation[];
  onSelect: (id: string) => void;
  onNew: () => void;
  onPin: (id: string, pinned: boolean) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onSearch: (query: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  searchQuery,
  searchResults,
  onSelect,
  onNew,
  onPin,
  onRename,
  onDelete,
  onSearch,
  isOpen,
  onToggle,
}: ConversationSidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const displayList = searchQuery.length > 2 ? searchResults : conversations;
  const pinned = displayList.filter((c) => c.pinned);
  const unpinned = displayList.filter((c) => !c.pinned);

  const handleRenameStart = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
  };

  const handleRenameConfirm = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  if (!isOpen) {
    return (
      <div className="w-10 border-r border-hairline bg-canvas flex flex-col items-center pt-3">
        <button onClick={onToggle} className="p-1.5 text-caption hover:text-ink transition-colors" title="Open sidebar">
          <PanelLeft size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-hairline bg-canvas flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-hairline">
        <span className="text-xs font-semibold text-ink">Conversations</span>
        <div className="flex items-center gap-1">
          <button onClick={onNew} className="p-1 text-caption hover:text-ink transition-colors" title="New chat">
            <Plus size={14} />
          </button>
          <button onClick={onToggle} className="p-1 text-caption hover:text-ink transition-colors" title="Collapse">
            <PanelLeftClose size={14} />
          </button>
        </div>
      </div>

      <div className="px-2 py-2">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-caption" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-hairline bg-canvas-soft text-ink placeholder:text-caption focus:outline-none focus:border-primary/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pinned.length > 0 && (
          <div>
            <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-caption font-medium">Pinned</p>
            {pinned.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                isActive={c.id === activeId}
                onSelect={() => onSelect(c.id)}
                onPin={() => onPin(c.id, !c.pinned)}
                onRename={() => handleRenameStart(c.id, c.title)}
                onDelete={() => onDelete(c.id)}
              />
            ))}
          </div>
        )}

        {unpinned.length > 0 && (
          <div>
            {pinned.length > 0 && <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-caption font-medium">Recent</p>}
            {unpinned.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                isActive={c.id === activeId}
                onSelect={() => onSelect(c.id)}
                onPin={() => onPin(c.id, true)}
                onRename={() => handleRenameStart(c.id, c.title)}
                onDelete={() => onDelete(c.id)}
              />
            ))}
          </div>
        )}

        {displayList.length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-caption">No conversations yet</p>
          </div>
        )}
      </div>

      {renamingId && (
        <div className="border-t border-hairline px-3 py-2">
          <p className="text-[10px] text-caption mb-1">Rename</p>
          <div className="flex gap-1">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameConfirm(); if (e.key === 'Escape') setRenamingId(null); }}
              className="flex-1 px-2 py-1 text-xs border border-hairline bg-white text-ink focus:outline-none focus:border-primary/40"
            />
            <button onClick={handleRenameConfirm} className="px-2 py-1 text-[10px] font-medium text-primary hover:text-primary/80">
              Save
            </button>
            <button onClick={() => setRenamingId(null)} className="px-2 py-1 text-[10px] text-caption hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
