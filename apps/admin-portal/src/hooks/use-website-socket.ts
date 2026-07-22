'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useWebsiteBuilderStore } from '@/stores/website-builder.store';
import { useToastStore } from '@/stores/ui.store';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { adminApi } from '@/lib/api';

interface UseWebsiteSocketOptions {
  tenantId: string;
  token: string;
  enabled?: boolean;
}

export function useWebsiteSocket({ tenantId, token, enabled = true }: UseWebsiteSocketOptions) {
  const {
    setDraft,
    markSaved,
    draft,
    isDirty,
    history,
    historyIndex,
  } = useWebsiteBuilderStore();
  const { addToast } = useToastStore();
  const mountedRef = useRef(true);
  const resolvingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !token || !tenantId) return;

    const s = getSocket(token);
    s.emit('website:join', tenantId);

    s.on('connect', () => {
      console.log('[Socket] Connected to website room:', tenantId);
    });

    s.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    s.on('website:updated', async (data: { config: any; version: number; updatedBy: string }) => {
      if (!mountedRef.current || resolvingRef.current) return;

      console.log('[Socket] website:updated received:', data);

      const serverDraft = data.config;
      const localDraft = draft;

      if (JSON.stringify(serverDraft) === JSON.stringify(localDraft)) {
        console.log('[Socket] Server config matches local, no conflict');
        return;
      }

      if (!isDirty) {
        setDraft(serverDraft);
        markSaved(JSON.stringify(serverDraft));
        addToast(`Updated by ${data.updatedBy}`, 'info');
        return;
      }

      resolvingRef.current = true;
      const action = await showConflictDialog(data.updatedBy);

      if (action === 'accept') {
        setDraft(serverDraft);
        markSaved(JSON.stringify(serverDraft));
        addToast('Accepted incoming changes', 'success');
      } else if (action === 'keep') {
        addToast('Keeping your changes. Will overwrite on next save.', 'info');
      }
      resolvingRef.current = false;
    });

    s.on('gallery:created', () => {
      console.log('[Socket] Gallery created');
    });
    s.on('gallery:updated', () => {
      console.log('[Socket] Gallery updated');
    });
    s.on('gallery:deleted', () => {
      console.log('[Socket] Gallery deleted');
    });

    return () => {
      mountedRef.current = false;
      s.off('website:updated');
      s.off('gallery:created');
      s.off('gallery:updated');
      s.off('gallery:deleted');
      s.emit('website:leave', tenantId);
    };
  }, [tenantId, token, enabled, draft, isDirty, setDraft, markSaved, addToast]);

  const showConflictDialog = useCallback((updatedBy: string): Promise<'accept' | 'keep'> => {
    return new Promise((resolve) => {
      const existing = document.getElementById('website-conflict-dialog');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'website-conflict-dialog';
      overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
      overlay.innerHTML = `
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h3 className="text-lg font-semibold text-ink mb-2">Conflict Detected</h3>
          <p className="text-body text-ink/70 mb-4">
            Another admin (<strong>${updatedBy}</strong>) made changes to this website.
            Your local changes will be overwritten if you accept theirs.
          </p>
          <div className="flex gap-3 justify-end">
            <button id="keep-mine" className="px-4 py-2 border border-ink/20 rounded-lg text-body hover:bg-ink/5">Keep Mine</button>
            <button id="accept-theirs" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Accept Theirs</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.id === 'accept-theirs') {
          resolve('accept');
          overlay.remove();
        } else if (target.id === 'keep-mine') {
          resolve('keep');
          overlay.remove();
        }
      };
      overlay.addEventListener('click', handleClick);
    });
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { disconnect: disconnectSocket };
}