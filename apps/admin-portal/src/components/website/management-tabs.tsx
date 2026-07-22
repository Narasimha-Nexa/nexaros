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

/* ───────────── Testimonials ───────────── */

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

/* ───────────── FAQs ───────────── */

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

/* ───────────── Blog Posts ───────────── */

export function BlogTab({ tenantId }: { tenantId: string }) {
  const { addToast } = useToastStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [deleting, setDeleting] = useState<any>(null);
  const { data, isLoading } = useQuery({ queryKey: ['admin-blog', tenantId], queryFn: () => adminApi.listBlogPosts(tenantId) });

  const open = (b?: any) => { setEditing(b || {}); setForm(b || { title: '', slug: '', content: '', excerpt: '', author: '', tags: [], status: 'DRAFT' }); };
  const save = useMutation({ mutationFn: () => (editing.id ? adminApi.updateBlogPost(tenantId, editing.id, form) : adminApi.createBlogPost(tenantId, form)), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog', tenantId] }); setEditing(null); addToast('Blog post saved', 'success'); }, onError: (e: any) => addToast(e.message || 'Failed', 'error') });
  const remove = useMutation({ mutationFn: (id: string) => adminApi.deleteBlogPost(tenantId, id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog', tenantId] }); setDeleting(null); addToast('Blog post deleted', 'success'); }, onError: (e: any) => addToast(e.message || 'Failed', 'error') });

  const items: any[] = data || [];
  return (
    <div>
      <div className="flex justify-end mb-3"><Button size="sm" onClick={() => open()}>+ New Post</Button></div>
      <DataTable isLoading={isLoading} data={items} keyExtractor={(r) => r.id}
        columns={[
          { key: 'title', header: 'Title', render: (v) => <span className="font-semibold text-ink">{v}</span> },
          { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} label={v} /> },
          { key: 'author', header: 'Author', render: (v) => v || '—' },
          { key: 'publishedAt', header: 'Published', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
          { key: 'actions', header: '', render: (_: any, r: any) => (<div className="flex gap-2 justify-end"><Button size="sm" variant="ghost" onClick={() => open(r)}>Edit</Button><Button size="sm" variant="danger" onClick={() => setDeleting(r)}>Delete</Button></div>) },
        ]} emptyMessage="No blog posts yet." />
      {editing && (
        <Dialog open onClose={() => setEditing(null)} title={editing.id ? 'Edit Post' : 'New Post'} size="lg">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <Input label="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Slug" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated-from-title" />
            <Textarea label="Content" value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            <Textarea label="Excerpt" value={form.excerpt || ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            <Input label="Cover Image URL" value={form.coverImage || ''} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
            <Input label="Author" value={form.author || ''} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            <Input label="Tags (comma-separated)" value={(form.tags || []).join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status || 'DRAFT'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['DRAFT', 'PUBLISHED', 'ARCHIVED'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={() => save.mutate()} isLoading={save.isPending}>Save</Button></DialogFooter>
        </Dialog>
      )}
      <ConfirmDeleteDialog open={!!deleting} onClose={() => setDeleting(null)} title={deleting?.title || 'this post'} isLoading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </div>
  );
}

/* ───────────── Events ───────────── */

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
