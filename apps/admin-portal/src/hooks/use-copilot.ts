'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

export function useCopilotConversations(tenantId: string | null) {
  return useQuery({
    queryKey: ['copilot', 'conversations', tenantId],
    queryFn: () => adminApi.listCopilotConversations(tenantId!),
    enabled: !!tenantId,
  });
}

export function useCopilotConversation(tenantId: string | null, conversationId: string | null) {
  return useQuery({
    queryKey: ['copilot', 'conversation', tenantId, conversationId],
    queryFn: () => adminApi.getCopilotConversation(tenantId!, conversationId!),
    enabled: !!tenantId && !!conversationId,
  });
}

export function useCopilotSuggestions(tenantId: string | null) {
  return useQuery({
    queryKey: ['copilot', 'suggestions', tenantId],
    queryFn: () => adminApi.getCopilotSuggestions(tenantId!),
    enabled: !!tenantId,
  });
}

export function useCopilotProviders(tenantId: string | null) {
  return useQuery({
    queryKey: ['copilot', 'providers', tenantId],
    queryFn: () => adminApi.getCopilotProviders(tenantId!),
    enabled: !!tenantId,
  });
}

export function useCopilotReports(tenantId: string | null) {
  return useQuery({
    queryKey: ['copilot', 'reports', tenantId],
    queryFn: () => adminApi.listCopilotReports(tenantId!),
    enabled: !!tenantId,
  });
}

export function useCopilotSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, message, conversationId }: { tenantId: string; message: string; conversationId?: string }) =>
      adminApi.sendCopilotMessage(tenantId, message, conversationId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['copilot', 'conversations', variables.tenantId] });
    },
  });
}

export function useCopilotGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, type, from, to }: { tenantId: string; type: string; from?: string; to?: string }) =>
      adminApi.generateCopilotReport(tenantId, type, from, to),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['copilot', 'reports', variables.tenantId] });
    },
  });
}

export function useCopilotDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, id }: { tenantId: string; id: string }) =>
      adminApi.deleteCopilotConversation(tenantId, id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['copilot', 'conversations', variables.tenantId] });
    },
  });
}

export function useCopilotPinConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, id, pinned }: { tenantId: string; id: string; pinned: boolean }) =>
      adminApi.pinCopilotConversation(tenantId, id, pinned),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['copilot', 'conversations', variables.tenantId] });
    },
  });
}

export function useCopilotRenameConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, id, title }: { tenantId: string; id: string; title: string }) =>
      adminApi.renameCopilotConversation(tenantId, id, title),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['copilot', 'conversations', variables.tenantId] });
    },
  });
}

export function useCopilotSearchConversations(tenantId: string | null, query: string) {
  return useQuery({
    queryKey: ['copilot', 'search', tenantId, query],
    queryFn: () => adminApi.searchCopilotConversations(tenantId!, query),
    enabled: !!tenantId && query.length > 2,
  });
}
