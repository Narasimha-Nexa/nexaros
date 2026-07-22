'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { Input } from '@/components/ui/input';
import { Textarea, MediaField } from '@/components/ui/website-primitives';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/badge';

function ConfirmDeleteDialog({ open, onClose, onConfirm, title, isLoading }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isLoading?: boolean;
}) {
  if (!open) return null;
  return (
    <Dialog open onClose={onClose} title="Confirm Delete" size="sm">
      <p className="text-body text-sm">Are you sure you want to delete <strong>{title}</strong>? This action cannot be undone.</p>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>Delete</Button>
      </DialogFooter>
    </Dialog>
  );
}

/* ───────────── Offers ───────────── */

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

/* ───────────── Announcements ───────────── */

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

/* ───────────── Gallery ───────────── */

function SortableGalleryCard({ item, onEdit, onDelete }: { item: any; onEdit: (item: any) => void; onDelete: (item: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, opacity: isDragging ? 0.8 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`group relative rounded-lg border overflow-hidden bg-white ${isDragging ? 'shadow-lg' : ''}`}>
      <div {...attributes} {...listeners} className="absolute top-1 left-1 z-10 cursor-grab active:cursor-grabbing bg-white/80 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical size={14} className="text-ink/40" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.imageUrl} alt={item.altText || item.caption || ''} className="h-28 w-full object-cover" />
      <div className="flex items-center justify-between p-1.5">
        <span className="text-[10px] truncate flex-1">{item.caption || 'No caption'}{item.isFeatured ? ' ★' : ''}</span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(item)} className="p-1 text-ink/40 hover:text-primary text-[10px]">Edit</button>
          <button onClick={() => onDelete(item)} className="p-1 text-ink/40 hover:text-danger text-[10px]">✕</button>
        </div>
      </div>
    </div>
  );
}

export function GalleryTab({ tenantId }: { tenantId: string }) {
  const { addToast } = useToastStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [deleting, setDeleting] = useState<any>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data, isLoading } = useQuery({
    queryKey: ['admin-gallery', tenantId],
    queryFn: () => adminApi.listGallery(tenantId),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => {
      const updates = orderedIds.map((id, i) => adminApi.updateGalleryImage(tenantId, id, { displayOrder: i }));
      return Promise.all(updates);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-gallery', tenantId] }),
  });

  const open = (g?: any) => {
    setEditing(g || {});
    setForm(g || { imageUrl: '', caption: '', altText: '', isFeatured: false, displayOrder: 0 });
  };

  const save = useMutation({
    mutationFn: () => (editing.id ? adminApi.updateGalleryImage(tenantId, editing.id, form) : adminApi.createGalleryImage(tenantId, form)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-gallery', tenantId] }); setEditing(null); addToast('Image saved', 'success'); },
    onError: (e: any) => addToast(e.message || 'Failed', 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteGalleryImage(tenantId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-gallery', tenantId] }); setDeleting(null); addToast('Image deleted', 'success'); },
    onError: (e: any) => addToast(e.message || 'Failed', 'error'),
  });

  const items: any[] = (data || []).sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i: any) => i.id === active.id);
    const newIndex = items.findIndex((i: any) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    const orderedIds = reordered.map((i: any) => i.id);
    reorderMutation.mutate(orderedIds);
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => open()}>+ Add Image</Button>
      </div>
      {isLoading ? <p className="text-body">Loading...</p> : items.length === 0 ? (
        <p className="text-body text-center py-8 text-ink/40">No gallery images yet.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i: any) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((g: any) => (
                <SortableGalleryCard key={g.id} item={g} onEdit={open} onDelete={setDeleting} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      {editing && (
        <Dialog open onClose={() => setEditing(null)} title={editing.id ? 'Edit Image' : 'Add Image'} size="lg">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <MediaField value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} label="Gallery Image" aspect="aspect-video" tenantId={tenantId} folder="gallery" />
            <Input label="Caption" value={form.caption || ''} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
            <Input label="Alt Text" value={form.altText || ''} onChange={(e) => setForm({ ...form, altText: e.target.value })} />
            <Input label="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Interior, Food, Events" />
            <Input label="Display Order" type="number" value={form.displayOrder ?? 0} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /><span className="text-body-sm">Featured image</span></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => save.mutate()} isLoading={save.isPending}>Save</Button>
          </DialogFooter>
        </Dialog>
      )}
      <ConfirmDeleteDialog open={!!deleting} onClose={() => setDeleting(null)} title={deleting?.caption || deleting?.imageUrl || 'this image'} isLoading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </div>
  );
}
