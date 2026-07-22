'use client';
import { Field } from '../shared';

const FONT_OPTIONS = [
  'Playfair Display', 'Inter', 'Lora', 'Montserrat', 'Poppins',
  'Roboto', 'Open Sans', 'Merriweather', 'Oswald', 'Nunito',
];

export function TypographyTab({ draft, set }: any) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Heading Font">
        <select className="input" value={draft.fontHeading || 'Playfair Display'} onChange={(e) => set('fontHeading', e.target.value)}>
          {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </Field>
      <Field label="Body Font">
        <select className="input" value={draft.fontBody || 'Inter'} onChange={(e) => set('fontBody', e.target.value)}>
          {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </Field>
    </div>
  );
}
