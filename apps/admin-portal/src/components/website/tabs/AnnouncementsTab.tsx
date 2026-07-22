'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/website-primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/badge';
import { ConfirmDeleteDialog } from '../shared';

export function AnnouncementsTab({ tenantId }: { tenantId: string }) {
  const { addToast } = useToastStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [deleting, setDeleting] = useState<any>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-announcements', tenantId],
    queryFn: () => adminApi.listAnnouncements(tenantId),
  });

  const open = (a?: any) => {
    setEditing(a || {});
    setForm(a || { title: '', message: '', type: 'INFO', isActive: true, isPinned: false });
  };

  const save = useMutation({
    mutationFn: () => (editing.id ? adminApi.updateAnnouncement(tenantId, editing.id, form) : adminApi.createAnnouncement(tenantId, form)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-announcements', tenantId] }); setEditing(null); addToast('Announcement saved', 'success'); },
    onError: (e: any) => addToast(e.message || 'Failed', 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteAnnouncement(tenantId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-announcements', tenantId] }); setDeleting(null); addToast('Announcement deleted', 'success'); },
    onError: (e: any) => addToast(e.message || 'Failed', 'error'),
  });

  const items: any[] = data || [];
  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => open()}>+ New Announcement</Button>
      </div>
      <DataTable
        isLoading={isLoading}
        data={items}
        keyExtractor={(r) => r.id}
        columns={[
          { key: 'title', header: 'Title', render: (v) => <span className="font-semibold text-ink">{v}</span> },
          { key: 'type', header: 'Type', render: (_: any, r: any) => <StatusBadge status={r.type} label={r.type} /> },
          { key: 'pinned', header: 'Pinned', render: (_: any, r: any) => r.isPinned ? '📌' : '' },
          { key: 'actions', header: '', render: (_: any, r: any) => (
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => open(r)}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => setDeleting(r)}>Delete</Button>
            </div>
          ) },
        ]}
        emptyMessage="No announcements yet."
      />
      {editing && (
        <Dialog open onClose={() => setEditing(null)} title={editing.id ? 'Edit Announcement' : 'New Announcement'} size="lg">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <Input label="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea label="Message" value={form.message || ''} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type || 'INFO'} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {['INFO', 'PROMO', 'EVENT', 'ALERT', 'MAINTENANCE', 'HOLIDAY'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} /><span className="text-body-sm">Pin to top</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><span className="text-body-sm">Active</span></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => save.mutate()} isLoading={save.isPending}>Save</Button>
          </DialogFooter>
        </Dialog>
      )}
      <ConfirmDeleteDialog open={!!deleting} onClose={() => setDeleting(null)} title={deleting?.title || ''} isLoading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </div>
  );
}
