'use client';
import { Switch } from '@/components/ui/website-primitives';

export function FeaturesTab({ draft, setJson }: any) {
  const features = draft.features || {};
  const list = [
    ['onlineOrdering', 'Online Ordering'], ['reservations', 'Reservations'], ['reviews', 'Reviews'],
    ['offers', 'Offers'], ['loyalty', 'Loyalty'], ['qrOrdering', 'QR Ordering'],
    ['delivery', 'Delivery'], ['pickup', 'Pickup'], ['whatsappOrdering', 'WhatsApp Ordering'],
    ['aiAssistant', 'AI Assistant'], ['maintenanceMode', 'Maintenance Mode'],
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {list.map(([k, label]) => (
        <div key={k} className="border border-ink/10 rounded-lg px-3 py-2">
          <Switch checked={features[k] !== false} onChange={(v) => setJson('features', { [k]: v })} label={label} />
        </div>
      ))}
    </div>
  );
}
