import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'NexaROS Changelog — track what\'s new, improved, and fixed in every release.',
};

const releases = [
  {
    version: '1.0.0',
    date: 'July 2026',
    tag: 'Latest',
    changes: [
      { type: 'feature', text: 'POS System with touch-optimized interface' },
      { type: 'feature', text: 'Kitchen Display System with real-time order queue' },
      { type: 'feature', text: 'Inventory Management with stock tracking and alerts' },
      { type: 'feature', text: 'Staff Management with role-based access control' },
      { type: 'feature', text: 'QR Code Ordering for customers' },
      { type: 'feature', text: 'Multi-Branch support with data isolation' },
      { type: 'feature', text: 'Reports & Analytics dashboard' },
      { type: 'feature', text: 'ESC/POS printer integration' },
      { type: 'feature', text: 'Offline-first architecture with auto-sync' },
      { type: 'feature', text: 'Customer website with digital menu' },
      { type: 'improved', text: 'Real-time Socket.IO updates across all devices' },
      { type: 'improved', text: 'GST-compliant invoicing with CGST, SGST, IGST' },
      { type: 'improved', text: 'Multi-language support (English, Hindi, Kannada, Telugu, Tamil, Malayalam)' },
    ],
  },
];

const tagStyles: Record<string, { bg: string; color: string }> = {
  feature: { bg: 'var(--accent-light)', color: 'var(--accent)' },
  improved: { bg: 'var(--success-light)', color: 'var(--success)' },
  fixed: { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-16 px-6 md:pt-40 md:pb-20">
        <div className="max-w-[768px] mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            Changelog
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Changelog
          </h1>
          <p className="reveal reveal-delay-2 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Track what&apos;s new, improved, and fixed in NexaROS.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-[768px] mx-auto space-y-12">
          {releases.map((release) => (
            <div key={release.version} className="reveal">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>v{release.version}</h2>
                {release.tag && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-[16px] text-white" style={{ background: 'var(--accent)' }}>
                    {release.tag}
                  </span>
                )}
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{release.date}</span>
              </div>
              <div className="p-6 rounded-[20px]" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="space-y-3">
                  {release.changes.map((change, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium mt-0.5" style={tagStyles[change.type] || { bg: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                        {change.type}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{change.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
