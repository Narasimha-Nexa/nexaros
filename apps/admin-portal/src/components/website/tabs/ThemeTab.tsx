'use client';
import { ColorPicker } from '@/components/ui/website-primitives';
import { Field } from '../shared';

export function ThemeTab({ draft, set }: any) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <ColorPicker label="Primary Color" value={draft.primaryColor} onChange={(v) => set('primaryColor', v)} />
      <ColorPicker label="Secondary Color" value={draft.secondaryColor} onChange={(v) => set('secondaryColor', v)} />
      <ColorPicker label="Accent Color" value={draft.accentColor} onChange={(v) => set('accentColor', v)} />
      <Field label="Border Radius">
        <select className="input" value={draft.borderRadius || 'xl'} onChange={(e) => set('borderRadius', e.target.value)}>
          {['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="Container Width">
        <select className="input" value={draft.containerWidth || 'max-w-7xl'} onChange={(e) => set('containerWidth', e.target.value)}>
          {['max-w-5xl', 'max-w-6xl', 'max-w-7xl', 'max-w-screen-xl', 'max-w-full'].map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </Field>
    </div>
  );
}
