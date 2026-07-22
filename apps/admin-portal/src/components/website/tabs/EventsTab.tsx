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

export function EventsTab({ tenantId }: { tenantId: string }) {
  const { addToast } = useToastStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [deleting, setDeleting] = useState<any>(null);
  const { data, isLoading } = useQuery({ queryKey: ['admin-events', tenantId], queryFn: () => adminApi.listEvents(tenantId) });

  const open = (e?: any) => { setEditing(e || {}); setForm(e || { title: '', description: '', startDate: '', endDate: '', location: '', isVirtual: false, status: 'UPCOMING' }); };
  const save = useMutation({ mutationFn: () => (editing.id ? adminApi.updateEvent(tenantId, editing.id, form) : adminApi.createEvent(tenantId, form)), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-events', tenantId] }); setEditing(null); addToast('Event saved', 'success'); }, onError: (e: any) => addToast(e.message || 'Failed', 'error') });
  const remove = useMutation({ mutationFn: (id: string) => adminApi.deleteEvent(tenantId, id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-events', tenantId] }); setDeleting(null); addToast('Event deleted', 'success'); }, onError: (e: any) => addToast(e.message || 'Failed', 'error') });

  const items: any[] = data || [];
  return (
    <div>
      <div className="flex justify-end mb-3"><Button size="sm" onClick={() => open()}>+ New Event</Button></div>
      <DataTable isLoading={isLoading} data={items} keyExtractor={(r) => r.id}
        columns={[
          { key: 'title', header: 'Title', render: (v) => <span className="font-semibold text-ink">{v}</span> },
          { key: 'startDate', header: 'Start Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
          { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} label={v} /> },
          { key: 'isVirtual', header: 'Type', render: (v) => v ? 'Virtual' : 'In-Person' },
          { key: 'actions', header: '', render: (_: any, r: any) => (<div className="flex gap-2 justify-end"><Button size="sm" variant="ghost" onClick={() => open(r)}>Edit</Button><Button size="sm" variant="danger" onClick={() => setDeleting(r)}>Delete</Button></div>) },
        ]} emptyMessage="No events yet." />
      {editing && (
        <Dialog open onClose={() => setEditing(null)} title={editing.id ? 'Edit Event' : 'New Event'} size="lg">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <Input label="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date" type="datetime-local" value={form.startDate ? new Date(form.startDate).toISOString().slice(0, 16) : ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <Input label="End Date" type="datetime-local" value={form.endDate ? new Date(form.endDate).toISOString().slice(0, 16) : ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <Input label="Location" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input label="Image URL" value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isVirtual} onChange={(e) => setForm({ ...form, isVirtual: e.target.checked })} /><span className="text-body-sm">Virtual Event</span></label>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status || 'UPCOMING'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['UPCOMING', 'ONGOING', 'PAST', 'CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={() => save.mutate()} isLoading={save.isPending}>Save</Button></DialogFooter>
        </Dialog>
      )}
      <ConfirmDeleteDialog open={!!deleting} onClose={() => setDeleting(null)} title={deleting?.title || 'this event'} isLoading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </div>
  );
}
