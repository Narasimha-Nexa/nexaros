'use client';
import { Textarea, Switch, MediaField } from '@/components/ui/website-primitives';
import { Input } from '@/components/ui/input';
import { Field } from '../shared';

export function SeoTab({ tenantId, draft, setJson }: any) {
  const seo = draft.seo || {};
  return (
    <div>
      <Field label="Meta Title"><Input value={seo.title || ''} onChange={(e) => setJson('seo', { title: e.target.value })} /></Field>
      <Field label="Meta Description"><Textarea value={seo.description || ''} onChange={(e) => setJson('seo', { description: e.target.value })} /></Field>
      <Field label="Keywords (comma separated)">
        <Input value={(seo.keywords || []).join(', ')} onChange={(e) => setJson('seo', { keywords: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
      </Field>
      <Field label="OG Image"><MediaField value={seo.ogImage} onChange={(v) => setJson('seo', { ogImage: v })} label="Social Preview" tenantId={tenantId} folder="seo" /></Field>
      <Field label="Robots Index">
        <Switch checked={seo.robots?.index !== false} onChange={(v) => setJson('seo', { robots: { ...(seo.robots || {}), index: v } })} />
      </Field>
    </div>
  );
}
