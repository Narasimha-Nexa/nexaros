'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewProps {
  config: Record<string, any>;
  device: 'desktop' | 'tablet' | 'mobile';
  slug?: string;
}

const DEVICE_CONFIGS = {
  desktop: { width: '100%', height: '100%', icon: Monitor, label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', icon: Tablet, label: 'Tablet' },
  mobile: { width: '375px', height: '667px', icon: Smartphone, label: 'Mobile' },
} as const;

const CUSTOMER_SITE = process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL || 'http://localhost:3001';

export function LivePreview({ config, device, slug }: PreviewProps) {
  const deviceCfg = DEVICE_CONFIGS[device];
  const DeviceIcon = deviceCfg.icon;
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewUrl = slug ? `${CUSTOMER_SITE}/restaurant/${slug}` : '';

  useEffect(() => {
    setKey((k) => k + 1);
  }, [slug]);

  // Send theme CSS variables to iframe via postMessage whenever config changes
  useEffect(() => {
    if (!iframeRef.current || !slug) return;
    const themePayload = {
      type: 'nexaros:theme-update',
      theme: {
        '--color-primary': config.primaryColor || '#2563eb',
        '--color-secondary': config.secondaryColor || '#171717',
        '--color-accent': config.accentColor || '#f59e0b',
        '--font-heading': config.fontHeading || 'Playfair Display',
        '--font-body': config.fontBody || 'Inter',
        '--border-radius': config.borderRadius || 'xl',
        '--container-width': config.containerWidth || 'max-w-7xl',
        restaurantName: config.restaurantName,
        tagline: config.tagline,
        logo: config.logo,
      },
    };

    const sendTheme = () => {
      try {
        iframeRef.current?.contentWindow?.postMessage(themePayload, '*');
      } catch {}
    };

    const iframe = iframeRef.current;
    iframe.addEventListener('load', sendTheme);
    sendTheme();

    return () => iframe.removeEventListener('load', sendTheme);
  }, [config, slug]);

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
            <span className="ml-1 truncate">{slug}.nexaros.in</span>
          </div>
          <div className="relative w-full" style={{ paddingBottom: device === 'mobile' ? '178%' : device === 'tablet' ? '132%' : '75%' }}>
            <iframe
              ref={iframeRef}
              key={key}
              src={previewUrl}
              title="Website Preview"
              className="absolute inset-0 w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
              loading="lazy"
            />
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
