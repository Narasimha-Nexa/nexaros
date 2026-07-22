'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter } from '@/components/ui/dialog';

export function HistoryTab({ tenantId, draft, setDraft }: { tenantId: string; draft: any; setDraft: (fn: (d: any) => any) => void }) {
  const { addToast } = useToastStore();
  const qc = useQueryClient();
  const [reverting, setReverting] = useState<any>(null);

  const { data: revisions, isLoading } = useQuery({
    queryKey: ['website-revisions', tenantId],
    queryFn: () => adminApi.listRevisions(tenantId),
  });

  const revertMutation = useMutation({
    mutationFn: (revisionId: string) => adminApi.revertRevision(tenantId, revisionId),
    onSuccess: (data: any) => {
      setDraft(() => data);
      qc.invalidateQueries({ queryKey: ['website-revisions', tenantId] });
      setReverting(null);
      addToast('Reverted to previous revision', 'success');
    },
    onError: (e: any) => addToast(e.message || 'Revert failed', 'error'),
  });

  const items: any[] = revisions || [];

  return (
    <div>
      <p className="text-body-sm text-ink/60 mb-3">Snapshots are automatically saved when you publish. You can revert to any previous version.</p>
      {isLoading ? (
        <p className="text-body text-sm">Loading history...</p>
      ) : items.length === 0 ? (
        <p className="text-body text-sm text-ink/40">No revisions yet. Publish your website to create the first snapshot.</p>
      ) : (
        <div className="space-y-2">
          {items.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-canvas/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{r.label || `Revision v${r.version}`}</p>
                <p className="text-xs text-ink/40">
                  {new Date(r.createdAt).toLocaleString()} · v{r.version}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setReverting(r)}>
                Revert
              </Button>
            </div>
          ))}
        </div>
      )}
      {reverting && (
        <Dialog open onClose={() => setReverting(null)} title="Revert to Revision" size="sm">
          <p className="text-sm text-ink/70 mb-1">
            Revert the website config to <strong>{reverting.label || `v${reverting.version}`}</strong>?
          </p>
          <p className="text-xs text-ink/50 mb-3">
            This will overwrite your current settings. A new revision will be saved automatically.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReverting(null)}>Cancel</Button>
            <Button onClick={() => revertMutation.mutate(reverting.id)} isLoading={revertMutation.isPending}>Revert</Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
