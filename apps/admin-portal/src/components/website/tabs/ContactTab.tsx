'use client';
import { Input } from '@/components/ui/input';
import { Field } from '../shared';

export function ContactTab({ draft, set }: any) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Phone"><Input value={draft.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
      <Field label="Email"><Input value={draft.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
      <Field label="WhatsApp Number"><Input value={draft.whatsappNumber || ''} onChange={(e) => set('whatsappNumber', e.target.value)} /></Field>
      <Field label="Address"><Input value={draft.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
      <Field label="Map URL"><Input value={draft.mapUrl || ''} onChange={(e) => set('mapUrl', e.target.value)} /></Field>
      <Field label="Currency"><Input value={draft.currency || 'INR'} onChange={(e) => set('currency', e.target.value)} /></Field>
    </div>
  );
}
