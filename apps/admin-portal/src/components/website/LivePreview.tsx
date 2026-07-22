'use client';
import React from 'react';

interface PreviewProps {
  config: Record<string, any>;
  device: 'desktop' | 'tablet' | 'mobile';
  slug?: string;
}

/**
 * Lightweight in-app preview of the customer site, themed from the website
 * config. This gives owners an at-a-glance responsive preview before publish.
 * (A full live render is available via the "Open Live Site" link.)
 */
export function LivePreview({ config, device, slug }: PreviewProps) {
  const name = config.restaurantName || 'Restaurant Name';
  const tagline = config.tagline || 'Your tagline goes here';
  const primary = config.primaryColor || '#2563eb';
  const secondary = config.secondaryColor || '#171717';
  const accent = config.accentColor || '#f59e0b';
  const fontHeading = config.fontHeading || 'Playfair Display';
  const fontBody = config.fontBody || 'Inter';

  const width = device === 'mobile' ? 'max-w-[390px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-full';

  return (
    <div className={`mx-auto ${width} transition-all duration-300`}>
      <div className="rounded-xl border-2 border-ink/10 overflow-hidden bg-white shadow-sm">
        {/* Mock browser/status bar */}
        <div className="bg-ink/5 px-3 py-2 flex items-center gap-2 text-ink/50 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
          <span className="ml-2 truncate">{((slug || config.slug) ? `${(slug || config.slug)}.nexaros.in` : 'live preview')}</span>
        </div>

        {/* Hero */}
        <div
          className="px-6 py-12 text-center"
          style={{ background: `linear-gradient(135deg, ${primary}22, ${accent}22)`, fontFamily: fontBody }}
        >
          {config.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logo} alt={name} className="h-16 mx-auto mb-4 object-contain" />
          ) : null}
          <h1 className="text-3xl font-bold" style={{ color: secondary, fontFamily: fontHeading }}>{name}</h1>
          <p className="mt-2 text-sm" style={{ color: secondary }}>{tagline}</p>
          <button
            className="mt-4 px-5 py-2 rounded-full text-white text-sm font-semibold"
            style={{ background: primary }}
          >
            Order Online
          </button>
        </div>

        {/* Sections preview */}
        <div className="p-6 space-y-4" style={{ fontFamily: fontBody }}>
          {(config.homeSections || []).length > 0 ? (
            (config.homeSections as any[]).map((s: any, i: number) => (
              <div key={i} className="rounded-lg border border-ink/10 p-3">
                <p className="text-xs uppercase tracking-wide" style={{ color: primary }}>{(s.key || s.type || 'section').replace(/_/g, ' ')}</p>
                <div className="h-16 bg-ink/5 rounded mt-2" />
              </div>
            ))
          ) : (
            <>
              <div className="rounded-lg border border-ink/10 p-3">
                <p className="text-xs uppercase tracking-wide" style={{ color: primary }}>Menu</p>
                <div className="h-16 bg-ink/5 rounded mt-2" />
              </div>
              <div className="rounded-lg border border-ink/10 p-3">
                <p className="text-xs uppercase tracking-wide" style={{ color: primary }}>Gallery</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[0, 1, 2].map((i) => <div key={i} className="h-14 bg-ink/5 rounded" />)}
                </div>
              </div>
            </>
          )}

          {(config.legalPages || {}).privacyPolicy?.title ? (
            <p className="text-xs text-body text-center pt-2">{config.legalPages.privacyPolicy.title}</p>
          ) : null}
        </div>

        <div className="bg-ink text-white text-center py-3 text-xs" style={{ fontFamily: fontBody }}>
          © {new Date().getFullYear()} {name}
        </div>
      </div>
    </div>
  );
}
