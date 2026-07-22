'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { TenantSelector, useTenantSelector } from '@/components/layout/tenant-selector';
import { useToastStore } from '@/stores/ui.store';
import { useAiChatStore } from '@/stores/ai-chat.store';
import {
  useCopilotConversations,
  useCopilotConversation,
  useCopilotSuggestions,
  useCopilotProviders,
  useCopilotReports,
  useCopilotSendMessage,
  useCopilotGenerateReport,
  useCopilotDeleteConversation,
  useCopilotPinConversation,
  useCopilotRenameConversation,
} from '@/hooks/use-copilot';
import { ConversationSidebar } from '@/components/ai-chat/conversation-sidebar';
import { ChatWindow } from '@/components/ai-chat/chat-window';
import { ReportsPanel } from '@/components/ai-chat/reports-panel';
import { adminApi } from '@/lib/api';

export default function CopilotPage() {
  const { tenantId, setTenantId, tenants } = useTenantSelector();
  const { addToast } = useToastStore();

  const store = useAiChatStore();

  useEffect(() => {
    if (tenantId) store.setTenantId(tenantId);
  }, [tenantId]);

  const conversationsQ = useCopilotConversations(tenantId);
  const suggestionsQ = useCopilotSuggestions(tenantId);
  const providersQ = useCopilotProviders(tenantId);
  const reportsQ = useCopilotReports(tenantId);
  const sendMessageM = useCopilotSendMessage();
  const generateReportM = useCopilotGenerateReport();
  const deleteConvM = useCopilotDeleteConversation();
  const pinConvM = useCopilotPinConversation();
  const renameConvM = useCopilotRenameConversation();

  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const conversations = (conversationsQ.data as any)?.data ?? conversationsQ.data ?? [];
  const suggestions = (suggestionsQ.data as any)?.data ?? suggestionsQ.data ?? [];
  const providers = (providersQ.data as any)?.data ?? providersQ.data ?? [];
  const reports = (reportsQ.data as any)?.data ?? reportsQ.data ?? [];

  useEffect(() => {
    store.setConversations(Array.isArray(conversations) ? conversations : []);
  }, [conversations]);

  useEffect(() => {
    store.setSuggestions(Array.isArray(suggestions) ? suggestions : []);
  }, [suggestions]);

  useEffect(() => {
    store.setProviders(Array.isArray(providers) ? providers : []);
  }, [providers]);

  useEffect(() => {
    store.setReports(Array.isArray(reports) ? reports : []);
  }, [reports]);

  useEffect(() => {
    if (searchQuery.length > 2 && tenantId) {
      adminApi.searchCopilotConversations(tenantId, searchQuery)
        .then((r: any) => {
          const data = r?.data ?? r;
          setSearchResults(Array.isArray(data) ? data : []);
        })
        .catch(() => setSearchResults([]));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, tenantId]);

  const loadConversationMessages = useCallback(async (convId: string) => {
    if (!tenantId) return;
    try {
      const res: any = await adminApi.getCopilotConversation(tenantId, convId);
      const data = res?.data ?? res;
      const msgs = (data.messages || []).map((m: any) => ({
        id: m.id || `${Date.now()}-${Math.random()}`,
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content || '',
        chart: m.chart || null,
        sources: m.sources || [],
        createdAt: m.createdAt || new Date().toISOString(),
      }));
      store.setMessages(msgs);
      store.setActiveConversation(convId);
    } catch (err: any) {
      addToast('Failed to load conversation', 'error');
    }
  }, [tenantId]);

  const handleSend = useCallback(async (message: string) => {
    if (!tenantId || sending) return;
    setSending(true);

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: message,
      createdAt: new Date().toISOString(),
    };
    store.addMessage(userMsg);

    try {
      const res = await sendMessageM.mutateAsync({
        tenantId,
        message,
        conversationId: store.activeConversationId || undefined,
      });
      const data = (res as any)?.data ?? res;

      const assistantMsg = {
        id: data.id || `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: data.content || '',
        chart: data.chart || null,
        sources: data.sources || [],
        createdAt: data.createdAt || new Date().toISOString(),
      };
      store.addMessage(assistantMsg);

      if (data.conversationId && !store.activeConversationId) {
        store.setActiveConversation(data.conversationId);
      }
      conversationsQ.refetch();
    } catch (err: any) {
      store.addMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err?.message || 'Failed to get response. Please try again.'}`,
        createdAt: new Date().toISOString(),
      });
      addToast(err?.message || 'Failed to get response', 'error');
    } finally {
      setSending(false);
    }
  }, [tenantId, sending, store.activeConversationId]);

  const handleNewChat = useCallback(() => {
    store.clearChat();
    store.setSidebarOpen(true);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    loadConversationMessages(id);
  }, [loadConversationMessages]);

  const handlePin = useCallback((id: string, pinned: boolean) => {
    if (!tenantId) return;
    pinConvM.mutate({ tenantId, id, pinned });
  }, [tenantId]);

  const handleRename = useCallback((id: string, title: string) => {
    if (!tenantId) return;
    renameConvM.mutate({ tenantId, id, title });
    store.updateConversation(id, { title });
  }, [tenantId]);

  const handleDelete = useCallback((id: string) => {
    if (!tenantId) return;
    deleteConvM.mutate({ tenantId, id });
    if (store.activeConversationId === id) {
      store.clearChat();
    }
  }, [tenantId, store.activeConversationId]);

  const handleGenerateReport = useCallback((type: string) => {
    if (!tenantId) return;
    generateReportM.mutate(
      { tenantId, type },
      {
        onSuccess: (res: any) => {
          const data = res?.data ?? res;
          store.addMessage({
            id: `report-${Date.now()}`,
            role: 'assistant',
            content: `Report "${type}" generated successfully.\n\n${data.content || 'Report is ready.'}`,
            createdAt: new Date().toISOString(),
          });
          addToast('Report generated', 'success');
        },
        onError: (err: any) => {
          addToast(err?.message || 'Report generation failed', 'error');
        },
      }
    );
  }, [tenantId]);

  const handleTenantChange = useCallback((id: string) => {
    setTenantId(id);
    store.clearChat();
    store.setConversations([]);
    store.setSuggestions([]);
  }, []);

  const configuredProvider = providers.find((p: any) => p.configured);
  const providerWarning = providers.length > 0 && !providers.some((p: any) => p.configured);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <PageHeader
        eyebrow="Intelligence"
        title="AI Business Copilot"
        description={configuredProvider ? `Powered by ${configuredProvider.name}` : 'Configure an AI provider for live insights'}
        actions={
          <div className="flex items-center gap-2">
            <TenantSelector tenantId={tenantId} onTenantChange={handleTenantChange} tenants={tenants} />
            <Button variant="outline" size="sm" onClick={() => { conversationsQ.refetch(); suggestionsQ.refetch(); reportsQ.refetch(); }}>
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {providerWarning && (
        <div className="mx-4 mt-2 px-3 py-2 border border-warning/30 bg-warning/5 flex items-start gap-2">
          <Sparkles size={14} className="text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-ink">No AI provider configured</p>
            <p className="text-[11px] text-body">
              Set OPENAI_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, or run local Ollama.
              Analytics data is still available without an AI provider.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden mx-4 mt-2 mb-4 border border-hairline">
        <ConversationSidebar
          conversations={conversations}
          activeId={store.activeConversationId}
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSelect={handleSelectConversation}
          onNew={handleNewChat}
          onPin={handlePin}
          onRename={handleRename}
          onDelete={handleDelete}
          onSearch={setSearchQuery}
          isOpen={store.sidebarOpen}
          onToggle={() => store.setSidebarOpen(!store.sidebarOpen)}
        />

        <div className="flex-1 min-w-0 bg-canvas">
          <ChatWindow
            messages={store.messages}
            suggestions={store.suggestions}
            streaming={store.streaming}
            sending={sending}
            onSend={handleSend}
            onSuggestionSelect={handleSend}
          />
        </div>

        <div className="w-64 border-l border-hairline bg-canvas p-3 overflow-y-auto hidden xl:block">
          <ReportsPanel
            reports={reports}
            onGenerate={handleGenerateReport}
            generating={generateReportM.isPending}
          />
        </div>
      </div>
    </div>
  );
}
