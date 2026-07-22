'use client';
import { Input } from '@/components/ui/input';
import { MediaField } from '@/components/ui/website-primitives';
import { Field } from '../shared';

export function BrandingTab({ tenantId, draft, set, setJson }: any) {
  return (
    <div>
      <Field label="Restaurant Name"><Input value={draft.restaurantName || ''} onChange={(e) => set('restaurantName', e.target.value)} /></Field>
      <Field label="Tagline"><Input value={draft.tagline || ''} onChange={(e) => set('tagline', e.target.value)} /></Field>
      <Field label="Logo"><MediaField value={draft.logo} onChange={(v) => set('logo', v)} label="Logo" aspect="aspect-square" tenantId={tenantId} folder="branding" /></Field>
      <Field label="Favicon"><MediaField value={draft.favicon} onChange={(v) => set('favicon', v)} label="Favicon" aspect="aspect-square" tenantId={tenantId} folder="branding" /></Field>
    </div>
  );
}
