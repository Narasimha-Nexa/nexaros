'use client';
import { create } from 'zustand';

interface HistoryEntry {
  draft: Record<string, any>;
  timestamp: number;
}

interface WebsiteBuilderState {
  device: 'desktop' | 'tablet' | 'mobile';
  activeTab: string;
  selectedSection: string | null;
  isPreviewMode: boolean;
  sidebarCollapsed: boolean;
  propertiesPanelOpen: boolean;

  history: HistoryEntry[];
  historyIndex: number;
  maxHistory: number;

  draft: Record<string, any>;
  serverHash: string;
  isDirty: boolean;
  lastSavedAt: Date | null;
  lastPublishedAt: Date | null;

  setDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  setActiveTab: (tab: string) => void;
  setSelectedSection: (section: string | null) => void;
  togglePreviewMode: () => void;
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  setDraft: (updates: Record<string, any> | ((d: Record<string, any>) => Record<string, any>)) => void;
  pushHistory: (state: Record<string, any>) => void;
  undo: () => Record<string, any> | null;
  redo: () => Record<string, any> | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  markSaved: (hash: string) => void;
  markPublished: (at: Date) => void;
  initializeDraft: (data: Record<string, any>) => void;
}

export const useWebsiteBuilderStore = create<WebsiteBuilderState>((set, get) => ({
  device: 'desktop',
  activeTab: 'branding',
  selectedSection: null,
  isPreviewMode: false,
  sidebarCollapsed: false,
  propertiesPanelOpen: true,

  history: [],
  historyIndex: -1,
  maxHistory: 50,

  draft: {},
  serverHash: '',
  isDirty: false,
  lastSavedAt: null,
  lastPublishedAt: null,

  setDevice: (device) => set({ device }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedSection: (selectedSection) => set({ selectedSection }),
  togglePreviewMode: () => set((s) => ({ isPreviewMode: !s.isPreviewMode })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  togglePropertiesPanel: () => set((s) => ({ propertiesPanelOpen: !s.propertiesPanelOpen })),

  setDraft: (updates) => {
    const state = get();
    const currentDraft = state.draft;
    const newDraft = typeof updates === 'function' ? updates(currentDraft) : { ...currentDraft, ...updates };
    const isDirty = JSON.stringify(newDraft) !== state.serverHash;

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({ draft: currentDraft, timestamp: Date.now() });
    if (newHistory.length > state.maxHistory) newHistory.shift();

    set({
      draft: newDraft,
      isDirty,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  pushHistory: (state) => {
    const current = get();
    const newHistory = current.history.slice(0, current.historyIndex + 1);
    newHistory.push({ draft: state, timestamp: Date.now() });
    if (newHistory.length > current.maxHistory) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex < 0) return null;
    const entry = state.history[state.historyIndex];
    const newIndex = state.historyIndex - 1;
    set({
      draft: entry.draft,
      historyIndex: newIndex,
      isDirty: JSON.stringify(entry.draft) !== state.serverHash,
    });
    return entry.draft;
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return null;
    const entry = state.history[state.historyIndex + 1];
    const newIndex = state.historyIndex + 1;
    set({
      draft: entry.draft,
      historyIndex: newIndex,
      isDirty: JSON.stringify(entry.draft) !== state.serverHash,
    });
    return entry.draft;
  },

  canUndo: () => get().historyIndex >= 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  markSaved: (hash) => set({ serverHash: hash, isDirty: false, lastSavedAt: new Date() }),
  markPublished: (at) => set({ lastPublishedAt: at }),

  initializeDraft: (data) => set({
    draft: data,
    serverHash: JSON.stringify(data),
    isDirty: false,
    history: [],
    historyIndex: -1,
  }),
}));
