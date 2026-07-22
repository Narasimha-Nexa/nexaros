'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { MediaField } from '@/components/ui/website-primitives';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '../shared';

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
