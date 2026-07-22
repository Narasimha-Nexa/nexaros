'use client';
import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';
import { mediaService } from '@/lib/api';
import { Upload, X, Link, Loader2 } from 'lucide-react';

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
 * Image input with file upload, drag-and-drop, URL paste, and preview.
 */

interface MediaFieldProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  aspect?: string;
  tenantId?: string;
  folder?: string;
}

export function MediaField({ value, onChange, label, hint, aspect = 'aspect-video', tenantId, folder }: MediaFieldProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState(value || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!tenantId) {
      const preview = URL.createObjectURL(file);
      onChange(preview);
      return;
    }
    setUploading(true);
    try {
      const result = await mediaService.upload(file, tenantId, folder);
      onChange(result.url);
    } catch (e: any) {
      console.error('Upload failed:', e);
    } finally {
      setUploading(false);
    }
  }, [tenantId, folder, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const handleUrlApply = () => {
    onChange(urlInput || null);
  };

  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div
        className={cn(
          'rounded-xl border-2 border-dashed border-ink/20 bg-canvas p-3 transition-colors',
          dragOver && 'border-primary bg-primary/5',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="space-y-2">
            <div className={cn('w-full overflow-hidden rounded-lg bg-ink/5 relative group', aspect)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt={label || 'preview'} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => { onChange(null); setUrlInput(''); }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Upload size={14} className="mr-1" />}
                {uploading ? 'Uploading...' : 'Replace'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { onChange(null); setUrlInput(''); }}>Remove</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-1 mb-2">
              <Button size="sm" variant={mode === 'url' ? 'primary' : 'ghost'} onClick={() => setMode('url')} className="text-xs">
                <Link size={12} className="mr-1" /> URL
              </Button>
              <Button size="sm" variant={mode === 'upload' ? 'primary' : 'ghost'} onClick={() => setMode('upload')} className="text-xs">
                <Upload size={12} className="mr-1" /> Upload
              </Button>
            </div>
            {mode === 'url' ? (
              <div className="flex gap-2">
                <Input
                  placeholder="https://...image-url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUrlApply(); }}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleUrlApply}>Apply</Button>
              </div>
            ) : (
              <div className="text-center py-4 cursor-pointer" onClick={() => fileRef.current?.click()}>
                {uploading ? (
                  <Loader2 size={32} className="mx-auto text-primary animate-spin mb-2" />
                ) : (
                  <Upload size={32} className="mx-auto text-ink/30 mb-2" />
                )}
                <p className="text-body-sm text-body font-sans">
                  {uploading ? 'Uploading...' : 'Click or drag to upload'}
                </p>
                <p className="text-xs text-ink/40 mt-1">JPG, PNG, WebP, GIF, SVG (max 10MB)</p>
              </div>
            )}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-body font-sans">{hint}</p>}
    </div>
  );
}
