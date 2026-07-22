'use client';
import { Switch } from '@/components/ui/website-primitives';
import { Input } from '@/components/ui/input';
import { Field } from '../shared';

export function SocialHoursTab({ draft, setJson }: any) {
  const social = draft.socialLinks || {};
  const hours = draft.openingHours || {};
  const socialKeys = ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'website'];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const updateHours = (day: string, field: 'open' | 'close' | 'isOpen', value: any) => {
    const current = hours[day] || {};
    const isString = typeof current === 'string';
    const base = isString ? { open: '9:00 AM', close: '10:00 PM', isOpen: true } : current;
    setJson('openingHours', { [day]: { ...base, [field]: value } });
  };

  const getDayValue = (day: string, field: 'open' | 'close' | 'isOpen') => {
    const h = hours[day];
    if (!h) return field === 'isOpen' ? false : '';
    if (typeof h === 'string') {
      const parts = h.split(' - ');
      if (field === 'open') return parts[0] || '';
      if (field === 'close') return parts[1] || '';
      return true;
    }
    return h[field] ?? (field === 'isOpen' ? false : '');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <h3 className="font-semibold text-ink mb-3">Social Media</h3>
        {socialKeys.map((k) => (
          <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
            <Input value={social[k] || ''} onChange={(e) => setJson('socialLinks', { [k]: e.target.value })} placeholder="https://..." />
          </Field>
        ))}
      </div>
      <div>
        <h3 className="font-semibold text-ink mb-3">Business Hours</h3>
        {days.map((d) => (
          <div key={d} className="mb-3 border border-ink/10 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium capitalize text-ink">{d}</span>
              <Switch checked={getDayValue(d, 'isOpen') as boolean} onChange={(v) => updateHours(d, 'isOpen', v)} label="Open" />
            </div>
            {getDayValue(d, 'isOpen') && (
              <div className="grid grid-cols-2 gap-2">
                <Input value={getDayValue(d, 'open') as string} onChange={(e) => updateHours(d, 'open', e.target.value)} placeholder="9:00 AM" />
                <Input value={getDayValue(d, 'close') as string} onChange={(e) => updateHours(d, 'close', e.target.value)} placeholder="10:00 PM" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
