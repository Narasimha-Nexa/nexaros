'use client';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';

/* ───────────────────────── Textarea ───────────────────────── */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const tid = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <label htmlFor={tid} className="label">{label}</label>}
        <textarea
          ref={ref}
          id={tid}
          className={cn('input min-h-[90px] resize-y', error && 'input-error', className)}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger font-sans">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-body font-sans">{hint}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

/* ───────────────────────── Switch ───────────────────────── */

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <label className={cn('flex items-center justify-between gap-4 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <span>
        {label && <span className="block text-body-sm font-sans font-semibold text-ink">{label}</span>}
        {description && <span className="block text-xs text-body font-sans">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-ink/20',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </label>
  );
}

/* ───────────────────────── ColorPicker ───────────────────────── */

interface ColorPickerProps {
  value?: string;
  onChange: (v: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded-lg border-2 border-ink bg-canvas cursor-pointer"
        />
        <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#2563eb" className="flex-1" />
      </div>
    </div>
  );
}

/* ───────────────────────── Tabs ───────────────────────── */

interface TabsProps<T extends string> {
  tabs: { id: T; label: string; icon?: React.ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1 border-b-2 border-ink/10 pb-1 mb-6">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            'px-3 py-2 rounded-lg text-body-sm font-sans font-semibold transition-colors flex items-center gap-1.5',
            active === t.id ? 'bg-primary text-white' : 'text-body hover:bg-ink/5',
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── MediaField ─────────────────────────
 * Reusable image input. Stores URLs today; the upload button is wired to the
 * mediaService stub and will switch to MinIO in Phase 6 without UI changes.
 */

interface MediaFieldProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  aspect?: string; // tailwind aspect class e.g. 'aspect-video'
}

export function MediaField({ value, onChange, label, hint, aspect = 'aspect-video' }: MediaFieldProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div
        className={cn(
          'rounded-xl border-2 border-dashed border-ink/20 bg-canvas p-3',
          dragOver && 'border-primary bg-primary/5',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
      >
        {value ? (
          <div className="space-y-2">
            <div className={cn('w-full overflow-hidden rounded-lg bg-ink/5', aspect)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt={label || 'preview'} className="h-full w-full object-cover" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Replace</Button>
              <Button variant="ghost" size="sm" onClick={() => onChange(null)}>Remove</Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-body-sm text-body font-sans mb-2">Paste an image URL or use the picker</p>
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Choose Image</Button>
          </div>
        )}
        <input
          ref={inputRef}
          type="url"
          placeholder="https://...image-url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="input mt-2"
        />
      </div>
      {hint && <p className="mt-1 text-xs text-body font-sans">{hint}</p>}
    </div>
  );
}
