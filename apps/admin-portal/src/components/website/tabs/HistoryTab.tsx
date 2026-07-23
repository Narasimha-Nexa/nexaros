'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { useWebsiteBuilderStore } from '@/stores/website-builder.store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { DiffView } from '@/components/website/DiffView';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export function HistoryTab({ tenantId, draft, setDraft }: { tenantId: string; draft: any; setDraft: (fn: (d: any) => any) => void }) {
  const { addToast } = useToastStore();
  const { isDirty, serverHash, markPublished } = useWebsiteBuilderStore();
  const qc = useQueryClient();
  const [reverting, setReverting] = useState<any>(null);
  const [diffing, setDiffing] = useState<{ revision: any; config: any } | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));

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

  const scheduleMutation = useMutation({
    mutationFn: (scheduledAt: Date) => adminApi.schedulePublish(tenantId, scheduledAt.toISOString()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website', tenantId] });
      qc.invalidateQueries({ queryKey: ['website-revisions', tenantId] });
      setScheduling(false);
      addToast('Publish scheduled', 'success');
    },
    onError: (e: any) => addToast(e.message || 'Schedule failed', 'error'),
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: () => adminApi.cancelScheduledPublish(tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website', tenantId] });
      addToast('Scheduled publish cancelled', 'success');
    },
    onError: (e: any) => addToast(e.message || 'Cancel failed', 'error'),
  });

  const items: any[] = revisions || [];

  return (
    <div className="space-y-6">
      {isDirty && (
        <Card className="border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800">
              <span>You have unsaved changes. Save or schedule publish to persist.</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setScheduling(true)}>
              Schedule Publish
            </Button>
          </div>
        </Card>
      )}

      {scheduling && (
        <Dialog open onClose={() => setScheduling(false)} title="Schedule Publish" size="sm">
          <p className="text-sm text-ink/70 mb-3">Schedule the website to be published automatically.</p>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-ink/40" />
            <Input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduling(false)}>Cancel</Button>
            <Button onClick={() => scheduleMutation.mutate(new Date(scheduleDate))} isLoading={scheduleMutation.isPending}>
              Schedule
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      <p className="text-body-sm text-ink/60 mb-3">Snapshots are automatically saved when you publish. You can revert to any previous version.</p>

      {isLoading ? (
        <p className="text-body text-sm">Loading history...</p>
      ) : items.length === 0 ? (
        <p className="text-body text-sm text-ink/40">No revisions yet. Publish your website to create the first snapshot.</p>
      ) : (
        <div className="space-y-2">
          {items.map((r: any) => (
            <Card key={r.id} className="p-3 hover:bg-canvas/50 transition-colors flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <p className="text-sm font-medium text-ink truncate">{r.label || `Revision v${r.version}`}</p>
                  {r.status && <Badge variant={r.status === 'PUBLISHED' ? 'success' : r.status === 'SCHEDULED' ? 'warning' : 'default'} size="xs">{r.status}</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setDiffing({ revision: r, config: r.snapshot })}>Diff</Button>
                  <Button size="sm" variant="ghost" onClick={() => setReverting(r)}>Revert</Button>
                </div>
              </div>
              <p className="text-xs text-ink/40">
                {new Date(r.createdAt).toLocaleString()} · v{r.version}
                {r.scheduledPublishAt && <span className="ml-2 text-amber-600">Scheduled: {new Date(r.scheduledPublishAt).toLocaleString()}</span>}
              </p>
            </Card>
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

      {diffing && (
        <Dialog open onClose={() => setDiffing(null)} title={`Diff: ${diffing.revision.label || `v${diffing.revision.version}`}`} size="lg">
          <DiffView oldConfig={diffing.config} newConfig={draft} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiffing(null)}>Close</Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}

function Badge({ variant = 'default', size = 'sm', children }: { variant?: 'default' | 'success' | 'warning' | 'danger'; size?: 'sm' | 'xs'; children: React.ReactNode }) {
  const base = 'inline-flex items-center font-medium rounded-full px-2 py-0.5';
  const variants = {
    default: 'bg-ink/10 text-ink',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
  };
  const sizes = { sm: 'text-xs', xs: 'text-[10px]' };
  return <span className={`${base} ${variants[variant]} ${sizes[size]}`}>{children}</span>;
}