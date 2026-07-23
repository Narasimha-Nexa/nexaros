'use client';
import React, { useCallback, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';
import { mediaService } from '@/lib/api';
import { Upload, X, Link, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
        <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#E51A24" className="flex-1" />
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
            'px-3 py-2.5 rounded-lg text-[13px] font-sans font-semibold transition-colors flex items-center gap-1.5 leading-5',
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

/* ───────────────────────── MediaLibrary ─────────────────────────
 * Browser for previously uploaded media assets. Grid view with search, folder filter, and delete.
 */

interface MediaLibraryProps {
  tenantId: string;
  onSelect?: (url: string) => void;
  folder?: string;
  open: boolean;
  onClose: () => void;
}

export function MediaLibrary({ tenantId, onSelect, folder, open, onClose }: MediaLibraryProps) {
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(folder || '');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['media-library', tenantId, selectedFolder, search, page],
    queryFn: () => mediaService.list(tenantId, { folder: selectedFolder || undefined, search: search || undefined, page }),
    enabled: open,
  });

  const { data: folders } = useQuery({
    queryKey: ['media-folders', tenantId],
    queryFn: () => fetch(`${API_BASE}/media/folders?tenantId=${tenantId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } }).then((r) => r.json()),
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaService.remove(id, tenantId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media-library'] }); qc.invalidateQueries({ queryKey: ['media-folders'] }); setDeleting(null); },
  });

  if (!open) return null;

  const items: any[] = data?.data || [];
  const folderList: any[] = folders || [];
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-ink">Media Library</h3>
          <button onClick={onClose} className="text-ink/40 hover:text-ink text-lg">✕</button>
        </div>
        <div className="flex gap-2 px-4 py-2 border-b">
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <select
            value={selectedFolder}
            onChange={(e) => { setSelectedFolder(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-sm border rounded-lg"
          >
            <option value="">All folders</option>
            {folderList.map((f: any) => (
              <option key={f.folder} value={f.folder}>{f.folder} ({f.count})</option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-ink/40">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-sm text-ink/40">No files found</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {items.map((item: any) => (
                <div key={item.id} className="group relative rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary/50 cursor-pointer" onClick={() => { onSelect?.(item.url); onClose(); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.originalName} className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                    <div className="w-full p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white truncate">{item.originalName}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleting(item.id); }}
                    className="absolute top-1 right-1 w-5 h-5 bg-danger text-white rounded-full text-[10px] items-center justify-center opacity-0 group-hover:flex hover:bg-danger/80"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 border-t">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 text-xs border rounded disabled:opacity-40">Prev</button>
            <span className="text-xs text-ink/50">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 text-xs border rounded disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
      {deleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-4 shadow-xl max-w-sm">
            <p className="text-sm text-ink mb-3">Delete this file? This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="px-3 py-1.5 text-sm border rounded-lg">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleting)} className="px-3 py-1.5 text-sm bg-danger text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
