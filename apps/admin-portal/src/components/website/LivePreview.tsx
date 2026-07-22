'use client';
import React from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

interface PreviewProps {
  config: Record<string, any>;
  device: 'desktop' | 'tablet' | 'mobile';
  slug?: string;
}

const DEVICE_CONFIGS = {
  desktop: { maxWidth: '100%', icon: Monitor, label: 'Desktop', scale: 1 },
  tablet: { maxWidth: '768px', icon: Tablet, label: 'Tablet', scale: 0.85 },
  mobile: { maxWidth: '375px', icon: Smartphone, label: 'Mobile', scale: 0.8 },
} as const;

export function LivePreview({ config, device, slug }: PreviewProps) {
  const name = config.restaurantName || 'Restaurant Name';
  const tagline = config.tagline || 'Your tagline goes here';
  const primary = config.primaryColor || '#2563eb';
  const secondary = config.secondaryColor || '#171717';
  const accent = config.accentColor || '#f59e0b';
  const fontHeading = config.fontHeading || 'Playfair Display';
  const fontBody = config.fontBody || 'Inter';
  const sections = (config.homeSections || []) as Array<{ key: string; enabled: boolean }>;
  const hours = config.openingHours || {};
  const social = config.socialLinks || {};
  const features = config.features || {};

  const deviceCfg = DEVICE_CONFIGS[device];
  const DeviceIcon = deviceCfg.icon;
  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';

  const getTodayHours = () => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = dayNames[new Date().getDay()];
    const h = hours[today];
    if (!h) return null;
    if (typeof h === 'string') return h;
    if (h.isOpen && h.open && h.close) return `${h.open} - ${h.close}`;
    return 'Closed today';
  };

  return (
    <div
      className="mx-auto transition-all duration-300 overflow-hidden"
      style={{ maxWidth: deviceCfg.maxWidth }}
    >
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <DeviceIcon size={12} className="text-ink/40" />
        <span className="text-[10px] text-ink/40 font-medium">{deviceCfg.label}</span>
      </div>

      <div
        className="rounded-xl border-2 border-ink/10 overflow-hidden bg-white shadow-sm"
        style={{ transform: `scale(${deviceCfg.scale})`, transformOrigin: 'top center' }}
      >
        <div className="bg-ink/5 px-3 py-2 flex items-center gap-2 text-ink/50 text-xs">
          <span className="h-2 w-2 rounded-full bg-danger/70" />
          <span className="h-2 w-2 rounded-full bg-warning/70" />
          <span className="h-2 w-2 rounded-full bg-success/70" />
          <span className="ml-1 truncate">
            {slug ? `${slug}.nexaros.in` : 'preview'}
          </span>
        </div>

        <div
          className="px-4 py-8 text-center"
          style={{ background: `linear-gradient(135deg, ${primary}22, ${accent}22)`, fontFamily: fontBody }}
        >
          {config.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logo} alt={name} className={`${isMobile ? 'h-10' : 'h-14'} mx-auto mb-3 object-contain`} />
          )}
          <h1
            className={`${isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'} font-bold`}
            style={{ color: secondary, fontFamily: fontHeading }}
          >
            {name}
          </h1>
          {tagline && (
            <p className="mt-1 text-xs" style={{ color: secondary }}>{tagline}</p>
          )}
          <div className="flex justify-center gap-2 mt-3">
            <button
              className="px-4 py-1.5 rounded-full text-white text-xs font-semibold"
              style={{ background: primary }}
            >
              {features.onlineOrdering !== false ? 'Order Online' : 'View Menu'}
            </button>
            {features.reservations !== false && (
              <button
                className="px-4 py-1.5 rounded-full text-xs font-semibold border"
                style={{ borderColor: primary, color: primary }}
              >
                Reserve
              </button>
            )}
          </div>
        </div>

        {sections.length > 0 && (
          <div className="p-3 space-y-2" style={{ fontFamily: fontBody }}>
            {sections.filter((s) => s.enabled !== false).slice(0, isMobile ? 4 : 6).map((s, i) => (
              <div key={i} className="rounded border border-ink/10 p-2">
                <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: primary }}>
                  {s.key.replace(/_/g, ' ')}
                </p>
                {s.key === 'menu' && (config.categories || []).length > 0 ? (
                  <div className="mt-1 space-y-1">
                    {(config.categories || []).slice(0, isMobile ? 2 : 4).map((cat: any, ci: number) => (
                      <div key={ci} className="flex items-center justify-between text-[10px]">
                        <span className="font-medium text-ink">{cat.name}</span>
                        <span className="text-ink/40">{cat.items?.length || 0} items</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-8 bg-ink/5 rounded mt-1" />
                )}
                {s.key === 'gallery' && (
                  <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-1 mt-1`}>
                    {[0, 1, 2, 3, 4, 5].slice(0, isMobile ? 4 : 6).map((gi) => (
                      <div key={gi} className="h-10 bg-ink/5 rounded" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {getTodayHours() && (
          <div className="px-3 py-2 text-[10px] text-center text-ink/50 border-t border-ink/5" style={{ fontFamily: fontBody }}>
            Today: {getTodayHours()}
          </div>
        )}

        <div className="bg-ink text-white text-center py-2 text-[10px] px-3" style={{ fontFamily: fontBody }}>
          © {new Date().getFullYear()} {name}
        </div>
      </div>
    </div>
  );
}
