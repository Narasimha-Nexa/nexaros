'use client';

import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  chart?: ChartData | null;
  sources?: Array<{ tool: string; durationMs: number }>;
  createdAt: string;
  isStreaming?: boolean;
}

export interface ChartData {
  type: 'line' | 'bar' | 'donut' | 'area' | 'pie';
  title: string;
  labels: string[];
  series: Array<{ name: string; data: number[] }>;
}

export interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface AiChatState {
  tenantId: string | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  suggestions: string[];
  providers: Array<{ name: string; configured: boolean; isDefault: boolean }>;
  reports: Array<{ id: string; title: string; content: string; status: string; createdAt: string }>;
  loading: boolean;
  streaming: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: Conversation[];
  sidebarOpen: boolean;

  setTenantId: (id: string) => void;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  setSuggestions: (suggestions: string[]) => void;
  setProviders: (providers: AiChatState['providers']) => void;
  setReports: (reports: AiChatState['reports']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Conversation[]) => void;
  setSidebarOpen: (open: boolean) => void;
  addConversation: (conversation: Conversation) => void;
  removeConversation: (id: string) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  clearChat: () => void;
}

export const useAiChatStore = create<AiChatState>((set) => ({
  tenantId: null,
  conversations: [],
  activeConversationId: null,
  messages: [],
  suggestions: [],
  providers: [],
  reports: [],
  loading: false,
  streaming: false,
  error: null,
  searchQuery: '',
  searchResults: [],
  sidebarOpen: true,

  setTenantId: (id) => set({ tenantId: id }),
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  updateLastMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content, isStreaming: true };
      }
      return { messages: msgs };
    }),
  setStreaming: (streaming) => set({ streaming }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setProviders: (providers) => set({ providers }),
  setReports: (reports) => set({ reports }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addConversation: (conversation) =>
    set((s) => ({ conversations: [conversation, ...s.conversations] })),
  removeConversation: (id) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
    })),
  updateConversation: (id, updates) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  clearChat: () =>
    set({
      activeConversationId: null,
      messages: [],
      error: null,
    }),
}));
