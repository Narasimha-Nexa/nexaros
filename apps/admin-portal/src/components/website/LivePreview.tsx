'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Pencil, PencilOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToastStore } from '@/stores/ui.store';

interface PreviewProps {
  config: Record<string, any>;
  device: 'desktop' | 'tablet' | 'mobile';
  slug?: string;
  onFieldEdit?: (field: string, value: string) => void;
}

const DEVICE_CONFIGS = {
  desktop: { width: '100%', height: '100%', icon: Monitor, label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', icon: Tablet, label: 'Tablet' },
  mobile: { width: '375px', height: '667px', icon: Smartphone, label: 'Mobile' },
} as const;

const CUSTOMER_SITE = process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL || 'http://localhost:3001';

export function LivePreview({ config, device, slug, onFieldEdit }: PreviewProps) {
  const deviceCfg = DEVICE_CONFIGS[device];
  const DeviceIcon = deviceCfg.icon;
  const [key, setKey] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { addToast } = useToastStore();

  const previewUrl = slug ? `${CUSTOMER_SITE}/${slug}` : '';

  useEffect(() => {
    setKey((k) => k + 1);
    setIframeError(false);
    setIframeLoaded(false);
  }, [slug]);

  // Listen for messages from the iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'nexaros:field-edit') {
        if (onFieldEdit) {
          onFieldEdit(data.field, data.value);
        }
      }

      if (data.type === 'nexaros:field-clicked') {
        setActiveField(data.field);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onFieldEdit]);

  // Send theme + edit mode to iframe
  useEffect(() => {
    if (!iframeRef.current || !slug) return;

    const sendPayload = () => {
      try {
        const themePayload = {
          type: 'nexaros:theme-update',
          theme: {
            '--color-primary': config.primaryColor || '#E51A24',
            '--color-secondary': config.secondaryColor || '#111111',
            '--color-accent': config.accentColor || '#F1B31C',
            '--font-heading': config.fontHeading || 'Playfair Display',
            '--font-body': config.fontBody || 'Inter',
            '--border-radius': config.borderRadius || 'xl',
            '--container-width': config.containerWidth || 'max-w-7xl',
            restaurantName: config.restaurantName,
            tagline: config.tagline,
            logo: config.logo,
          },
        };
        iframeRef.current?.contentWindow?.postMessage(themePayload, '*');

        // Send edit mode state
        const editPayload = {
          type: 'nexaros:edit-mode',
          enabled: isEditMode,
        };
        iframeRef.current?.contentWindow?.postMessage(editPayload, '*');

        // Send active field highlight
        if (activeField) {
          iframeRef.current?.contentWindow?.postMessage({
            type: 'nexaros:set-active-field',
            field: activeField,
          }, '*');
        }
      } catch {}
    };

    const iframe = iframeRef.current;
    iframe.addEventListener('load', sendPayload);
    sendPayload();

    return () => iframe.removeEventListener('load', sendPayload);
  }, [config, slug, isEditMode, activeField]);

  // Re-send edit mode when toggled
  const toggleEditMode = useCallback(() => {
    const next = !isEditMode;
    setIsEditMode(next);
    if (!next) setActiveField(null);

    setTimeout(() => {
      try {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'nexaros:edit-mode',
          enabled: next,
        }, '*');
      } catch {}
    }, 100);

    if (next) {
      addToast('Edit mode enabled — click text in the preview to edit', 'info');
    }
  }, [isEditMode, addToast]);

  return (
    <div className="mx-auto transition-all duration-300">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <DeviceIcon size={12} className="text-ink/40" />
          <span className="text-[10px] text-ink/40 font-medium">{deviceCfg.label}</span>
          <span className="text-[10px] text-ink/30">·</span>
          <span className="text-[10px] text-ink/30">{deviceCfg.width}</span>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={isEditMode ? 'primary' : 'ghost'}
            onClick={toggleEditMode}
            title={isEditMode ? 'Exit edit mode' : 'Enable inline editing'}
          >
            {isEditMode ? <PencilOff size={12} /> : <Pencil size={12} />}
            <span className="ml-1 hidden sm:inline">{isEditMode ? 'Editing' : 'Edit'}</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setKey((k) => k + 1)} title="Refresh preview">
            <RefreshCw size={12} />
          </Button>
          {slug && (
            <Button size="sm" variant="ghost" onClick={() => window.open(previewUrl, '_blank')} title="Open in new tab">
              <ExternalLink size={12} />
            </Button>
          )}
        </div>
      </div>

      {slug ? (
        <div
          className="rounded-xl border-2 border-ink/10 overflow-hidden bg-white shadow-sm mx-auto"
          style={{ maxWidth: deviceCfg.width }}
        >
          <div className="bg-ink/5 px-3 py-2 flex items-center gap-2 text-ink/50 text-xs">
            <span className="h-2 w-2 rounded-full bg-danger/70" />
            <span className="h-2 w-2 rounded-full bg-warning/70" />
            <span className="h-2 w-2 rounded-full bg-success/70" />
            <span className="ml-1 truncate">{CUSTOMER_SITE}/{slug}</span>
            {isEditMode && (
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-white">LIVE EDIT</span>
            )}
          </div>
          <div className="relative w-full" style={{ paddingBottom: device === 'mobile' ? '178%' : device === 'tablet' ? '132%' : '75%' }}>
            {iframeError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
                <Monitor size={40} className="text-ink/20 mb-3" />
                <p className="text-sm font-semibold text-ink/60 mb-1">Preview unavailable</p>
                <p className="text-xs text-ink/40 mb-3">The restaurant page could not be loaded. Make sure the backend is running.</p>
                <Button size="sm" variant="outline" onClick={() => { setIframeError(false); setKey((k) => k + 1); }}>
                  <RefreshCw size={12} className="mr-1" /> Reload
                </Button>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                key={key}
                src={previewUrl}
                title="Website Preview"
                className="absolute inset-0 w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups"
                loading="lazy"
                onLoad={() => setIframeLoaded(true)}
                onError={() => setIframeError(true)}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-ink/10 bg-canvas p-8 text-center">
          <Monitor size={32} className="mx-auto text-ink/20 mb-2" />
          <p className="text-body-sm text-ink/40">Select a restaurant to see the live preview</p>
        </div>
      )}
    </div>
  );
}
