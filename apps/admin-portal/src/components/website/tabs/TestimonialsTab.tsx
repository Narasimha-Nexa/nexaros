'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { Textarea } from '@/components/ui/website-primitives';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/badge';
import { ConfirmDeleteDialog } from '../shared';

export function TestimonialsTab({ tenantId }: { tenantId: string }) {
  const { addToast } = useToastStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [deleting, setDeleting] = useState<any>(null);
  const { data, isLoading } = useQuery({ queryKey: ['admin-testimonials', tenantId], queryFn: () => adminApi.listTestimonials(tenantId) });

  const open = (t?: any) => { setEditing(t || {}); setForm(t || { customerName: '', text: '', rating: 5, isFeatured: false, isVerified: false }); };
  const save = useMutation({ mutationFn: () => (editing.id ? adminApi.updateTestimonial(tenantId, editing.id, form) : adminApi.createTestimonial(tenantId, form)), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-testimonials', tenantId] }); setEditing(null); addToast('Testimonial saved', 'success'); }, onError: (e: any) => addToast(e.message || 'Failed', 'error') });
  const remove = useMutation({ mutationFn: (id: string) => adminApi.deleteTestimonial(tenantId, id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-testimonials', tenantId] }); setDeleting(null); addToast('Testimonial deleted', 'success'); }, onError: (e: any) => addToast(e.message || 'Failed', 'error') });

  const items: any[] = data || [];
  return (
    <div>
      <div className="flex justify-end mb-3"><Button size="sm" onClick={() => open()}>+ New Testimonial</Button></div>
      <DataTable isLoading={isLoading} data={items} keyExtractor={(r) => r.id}
        columns={[
          { key: 'customerName', header: 'Customer', render: (v) => <span className="font-semibold text-ink">{v}</span> },
          { key: 'rating', header: 'Rating', render: (v) => <span className="text-warning">{'★'.repeat(v || 0)}{'☆'.repeat(5 - (v || 0))}</span> },
          { key: 'text', header: 'Review', render: (v) => <span className="text-xs truncate max-w-[200px] block">{v}</span> },
          { key: 'status', header: 'Status', render: (_: any, r: any) => <StatusBadge status={r.isVerified ? 'VERIFIED' : 'PENDING'} label={r.isVerified ? 'Verified' : 'Pending'} /> },
          { key: 'actions', header: '', render: (_: any, r: any) => (<div className="flex gap-2 justify-end"><Button size="sm" variant="ghost" onClick={() => open(r)}>Edit</Button><Button size="sm" variant="danger" onClick={() => setDeleting(r)}>Delete</Button></div>) },
        ]} emptyMessage="No testimonials yet." />
      {editing && (
        <Dialog open onClose={() => setEditing(null)} title={editing.id ? 'Edit Testimonial' : 'New Testimonial'} size="lg">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <Input label="Customer Name" value={form.customerName || ''} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            <div>
              <label className="label">Rating</label>
              <div className="flex gap-1">{[1,2,3,4,5].map((s) => (<button key={s} type="button" onClick={() => setForm({ ...form, rating: s })} className={`text-xl ${s <= (form.rating || 0) ? 'text-warning' : 'text-ink/20'}`}>★</button>))}</div>
            </div>
            <Textarea label="Review Text" value={form.text || ''} onChange={(e) => setForm({ ...form, text: e.target.value })} />
            <Input label="Avatar URL" value={form.avatar || ''} onChange={(e) => setForm({ ...form, avatar: e.target.value })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isVerified} onChange={(e) => setForm({ ...form, isVerified: e.target.checked })} /><span className="text-body-sm">Verified</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /><span className="text-body-sm">Featured</span></label>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={() => save.mutate()} isLoading={save.isPending}>Save</Button></DialogFooter>
        </Dialog>
      )}
      <ConfirmDeleteDialog open={!!deleting} onClose={() => setDeleting(null)} title={deleting?.customerName || 'this testimonial'} isLoading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </div>
  );
}
