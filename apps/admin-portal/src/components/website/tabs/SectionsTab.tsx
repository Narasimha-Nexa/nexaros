'use client';
import { useMemo } from 'react';
import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/website-primitives';
import { Button } from '@/components/ui/button';

type VisibilityDevices = 'desktop' | 'tablet' | 'mobile';

interface SectionItem {
  key: string;
  enabled: boolean;
  order: number;
  visibility?: { desktop: boolean; tablet: boolean; mobile: boolean };
}

interface SectionsTabProps {
  draft: any;
  set: (key: string, value: any) => void;
}

function SortableSectionCard({ item, onToggle, onVisibilityToggle }: { item: SectionItem; onToggle: (key: string) => void; onVisibilityToggle: (key: string, device: VisibilityDevices) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.8 : 1, zIndex: isDragging ? 10 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`group relative flex items-center justify-between border border-ink/10 rounded-lg px-3 py-2 ${isDragging ? 'shadow-lg bg-white' : ''}`}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-ink/40 hover:text-ink/60 p-1">
        <GripVertical size={16} />
      </div>
      <span className="font-sans font-semibold capitalize text-ink flex-1">{item.key}</span>
      <div className="flex items-center gap-2">
        {item.enabled && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => onVisibilityToggle(item.key, 'desktop')} title="Desktop" className={item.visibility?.desktop ? 'text-primary' : 'text-ink/30'}>
              <Eye size={14} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onVisibilityToggle(item.key, 'tablet')} title="Tablet" className={item.visibility?.tablet ? 'text-primary' : 'text-ink/30'}>
              <Eye size={14} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onVisibilityToggle(item.key, 'mobile')} title="Mobile" className={item.visibility?.mobile ? 'text-primary' : 'text-ink/30'}>
              <Eye size={14} />
            </Button>
          </div>
        )}
        <Switch checked={item.enabled} onChange={() => onToggle(item.key)} />
      </div>
    </div>
  );
}

export function SectionsTab({ draft, set }: SectionsTabProps) {
  const sections = useMemo(() => {
    const s = draft.homeSections || [];
    return s.map((sec: SectionItem) => ({
      ...sec,
      visibility: sec.visibility || { desktop: true, tablet: true, mobile: true },
    }));
  }, [draft.homeSections]);

  const available = ['hero', 'about', 'menu', 'gallery', 'offers', 'hours', 'contact', 'reviews', 'footer'];
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const toggle = (key: string) => {
    const exists = sections.find((s: any) => s.key === key);
    if (exists) {
      set('homeSections', sections.filter((s: any) => s.key !== key));
    } else {
      set('homeSections', [...sections, { key, enabled: true, order: sections.length + 1, visibility: { desktop: true, tablet: true, mobile: true } }]);
    }
  };

  const visibilityToggle = (key: string, device: VisibilityDevices) => {
    set('homeSections', sections.map((s: SectionItem) => s.key === key ? { ...s, visibility: { ...s.visibility, [device]: !s.visibility?.[device] } } : s));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((i: any) => i.key === active.id);
    const newIndex = sections.findIndex((i: any) => i.key === over.id);
    const reordered: SectionItem[] = arrayMove(sections, oldIndex, newIndex);
    const updated = reordered.map((s, i) => ({ ...s, order: i + 1 }));
    set('homeSections', updated);
  };

  return (
    <div className="space-y-2">
      <p className="text-body text-sm mb-2">Drag to reorder. Toggle visibility per device.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s: SectionItem) => s.key)} strategy={rectSortingStrategy}>
          <div className="space-y-2">
            {available.map((key) => {
              const item = sections.find((s: SectionItem) => s.key === key);
              const displayItem: SectionItem = item || { key, enabled: false, order: 0, visibility: { desktop: true, tablet: true, mobile: true } };
              return (
                <SortableSectionCard
                  key={key}
                  item={displayItem}
                  onToggle={toggle}
                  onVisibilityToggle={visibilityToggle}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}