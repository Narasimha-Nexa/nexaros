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

export function FaqsTab({ tenantId }: { tenantId: string }) {
  const { addToast } = useToastStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [deleting, setDeleting] = useState<any>(null);
  const { data, isLoading } = useQuery({ queryKey: ['admin-faqs', tenantId], queryFn: () => adminApi.listFaqs(tenantId) });

  const open = (f?: any) => { setEditing(f || {}); setForm(f || { question: '', answer: '', category: '', displayOrder: 0, isActive: true }); };
  const save = useMutation({ mutationFn: () => (editing.id ? adminApi.updateFaq(tenantId, editing.id, form) : adminApi.createFaq(tenantId, form)), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-faqs', tenantId] }); setEditing(null); addToast('FAQ saved', 'success'); }, onError: (e: any) => addToast(e.message || 'Failed', 'error') });
  const remove = useMutation({ mutationFn: (id: string) => adminApi.deleteFaq(tenantId, id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-faqs', tenantId] }); setDeleting(null); addToast('FAQ deleted', 'success'); }, onError: (e: any) => addToast(e.message || 'Failed', 'error') });

  const items: any[] = (data || []).sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  return (
    <div>
      <div className="flex justify-end mb-3"><Button size="sm" onClick={() => open()}>+ New FAQ</Button></div>
      <DataTable isLoading={isLoading} data={items} keyExtractor={(r) => r.id}
        columns={[
          { key: 'question', header: 'Question', render: (v) => <span className="font-semibold text-ink">{v}</span> },
          { key: 'category', header: 'Category', render: (v) => v || '—' },
          { key: 'displayOrder', header: 'Order', render: (v) => v ?? 0 },
          { key: 'isActive', header: 'Active', render: (v) => v ? '✅' : '—' },
          { key: 'actions', header: '', render: (_: any, r: any) => (<div className="flex gap-2 justify-end"><Button size="sm" variant="ghost" onClick={() => open(r)}>Edit</Button><Button size="sm" variant="danger" onClick={() => setDeleting(r)}>Delete</Button></div>) },
        ]} emptyMessage="No FAQs yet." />
      {editing && (
        <Dialog open onClose={() => setEditing(null)} title={editing.id ? 'Edit FAQ' : 'New FAQ'} size="lg">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <Input label="Question" value={form.question || ''} onChange={(e) => setForm({ ...form, question: e.target.value })} />
            <Textarea label="Answer" value={form.answer || ''} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
            <Input label="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Ordering, Delivery, Payment" />
            <Input label="Display Order" type="number" value={form.displayOrder ?? 0} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><span className="text-body-sm">Active</span></label>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={() => save.mutate()} isLoading={save.isPending}>Save</Button></DialogFooter>
        </Dialog>
      )}
      <ConfirmDeleteDialog open={!!deleting} onClose={() => setDeleting(null)} title={deleting?.question || 'this FAQ'} isLoading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </div>
  );
}
