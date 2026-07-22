'use client';
import { useMemo } from 'react';
import { Switch } from '@/components/ui/website-primitives';
import { Button } from '@/components/ui/button';

export function SectionsTab({ draft, set }: any) {
  const sections = useMemo(() => draft.homeSections || [], [draft.homeSections]);
  const available = ['hero', 'about', 'menu', 'gallery', 'offers', 'hours', 'contact', 'reviews', 'footer'];
  const toggle = (key: string) => {
    const exists = sections.find((s: any) => s.key === key);
    if (exists) {
      set('homeSections', sections.filter((s: any) => s.key !== key));
    } else {
      set('homeSections', [...sections, { key, enabled: true, order: sections.length + 1 }]);
    }
  };
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    next.forEach((s, i) => (s.order = i + 1));
    set('homeSections', next);
  };
  return (
    <div className="space-y-2">
      <p className="text-body text-sm mb-2">Enable/disable and reorder homepage sections.</p>
      {available.map((key) => {
        const idx = sections.findIndex((s: any) => s.key === key);
        const enabled = idx >= 0;
        return (
          <div key={key} className="flex items-center justify-between border border-ink/10 rounded-lg px-3 py-2">
            <span className="font-sans font-semibold capitalize text-ink">{key}</span>
            <div className="flex items-center gap-2">
              {enabled && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => move(idx, -1)}>↑</Button>
                  <Button size="sm" variant="ghost" onClick={() => move(idx, 1)}>↓</Button>
                </>
              )}
              <Switch checked={enabled} onChange={() => toggle(key)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
