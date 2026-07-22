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

export function OffersTab({ tenantId }: { tenantId: string }) {
  const { addToast } = useToastStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [deleting, setDeleting] = useState<any>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-offers', tenantId],
    queryFn: () => adminApi.listOffers(tenantId),
  });

  const open = (o?: any) => {
    setEditing(o || {});
    setForm(o || { title: '', description: '', discountType: 'PERCENTAGE', discountValue: 0, isActive: true });
  };

  const save = useMutation({
    mutationFn: () => (editing.id ? adminApi.updateOffer(tenantId, editing.id, form) : adminApi.createOffer(tenantId, form)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-offers', tenantId] }); setEditing(null); addToast('Offer saved', 'success'); },
    onError: (e: any) => addToast(e.message || 'Failed', 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteOffer(tenantId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-offers', tenantId] }); setDeleting(null); addToast('Offer deleted', 'success'); },
    onError: (e: any) => addToast(e.message || 'Failed', 'error'),
  });

  const items: any[] = data || [];
  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => open()}>+ New Offer</Button>
      </div>
      <DataTable
        isLoading={isLoading}
        data={items}
        keyExtractor={(r) => r.id}
        columns={[
          { key: 'title', header: 'Title', render: (v) => <span className="font-semibold text-ink">{v}</span> },
          { key: 'discount', header: 'Discount', render: (_: any, r: any) => {
            const v = r.discountValue;
            switch (r.discountType) {
              case 'PERCENTAGE': return `${v}%`;
              case 'FLAT': return `₹${v}`;
              case 'BOGO': return 'Buy 1 Get 1';
              case 'FREE_DELIVERY': return 'Free Delivery';
              default: return v;
            }
          } },
          { key: 'status', header: 'Status', render: (_: any, r: any) => <StatusBadge status={r.status} label={r.status} /> },
          { key: 'actions', header: '', render: (_: any, r: any) => (
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => open(r)}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => setDeleting(r)}>Delete</Button>
            </div>
          ) },
        ]}
        emptyMessage="No offers yet."
      />
      {editing && (
        <Dialog open onClose={() => setEditing(null)} title={editing.id ? 'Edit Offer' : 'New Offer'} size="lg">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <Input label="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Discount Type</label>
                <select className="input" value={form.discountType || 'PERCENTAGE'} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                  {['PERCENTAGE', 'FLAT', 'BOGO', 'FREE_DELIVERY'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Input label="Discount Value" type="number" value={form.discountValue ?? 0} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
            </div>
            <Input label="Coupon Code" value={form.couponCode || ''} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} />
            <Input label="Start Date" type="date" value={form.startDate ? form.startDate.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End Date" type="date" value={form.endDate ? form.endDate.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <span className="text-body-sm">Active</span>
            </label>
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
