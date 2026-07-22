'use client';
import { Textarea } from '@/components/ui/website-primitives';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Field } from '../shared';

export function LegalTab({ draft, setJson }: any) {
  const legal = draft.legalPages || {};
  const pages = ['privacyPolicy', 'termsOfService', 'refundPolicy', 'cancellationPolicy', 'cookiePolicy'];
  return (
    <div className="space-y-4">
      {pages.map((p) => (
        <Card key={p} className="p-4">
          <h4 className="font-semibold text-ink mb-2 capitalize">{p.replace(/([A-Z])/g, ' $1')}</h4>
          <Field label="Title"><Input value={legal[p]?.title || ''} onChange={(e) => setJson('legalPages', { [p]: { ...(legal[p] || {}), title: e.target.value } })} /></Field>
          <Field label="Content"><Textarea value={legal[p]?.content || ''} onChange={(e) => setJson('legalPages', { [p]: { ...(legal[p] || {}), content: e.target.value } })} /></Field>
        </Card>
      ))}
    </div>
  );
}
