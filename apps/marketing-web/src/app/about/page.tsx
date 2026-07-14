import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about NexaROS — the AI-powered restaurant operating system built for modern restaurants.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-16 px-6 md:pt-40 md:pb-20">
        <div className="max-w-[768px] mx-auto">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            About
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-6" style={{ color: 'var(--text-primary)' }}>
            About NexaROS
          </h1>
          <div className="reveal reveal-delay-2 space-y-6">
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              NexaROS is an AI-powered restaurant operating system designed for modern restaurants of all sizes.
              From small cafés to multi-branch restaurant chains, NexaROS provides the tools you need to
              manage every aspect of your business efficiently.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-[768px] mx-auto space-y-12">
          {[
            { title: 'Our Mission', text: 'To make restaurant management accessible, affordable, and intelligent. We believe that technology should empower restaurant owners and staff, not complicate their lives. That\'s why NexaROS is built with an offline-first architecture, ensuring you never lose data even when the internet goes down.' },
            { title: 'Why Offline-First?', text: 'Restaurants can\'t afford downtime. When the internet connection is unstable, your POS, kitchen display, and printers should still work seamlessly. NexaROS stores all critical data locally on your devices and syncs automatically when connectivity returns.', bullets: ['Orders are never lost — saved instantly to local storage', 'KOTs print even without internet', 'Payments are recorded offline and synced later', 'All devices stay in sync when connectivity returns'] },
            { title: 'Built for India', text: 'NexaROS supports Indian numbering (lakhs/crores), GST invoicing, UPI payments, and multiple Indian languages (Hindi, Kannada, Telugu, Tamil, Malayalam). Your data stays in India-compliant infrastructure.' },
          ].map((section) => (
            <div key={section.title} className="reveal">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{section.title}</h2>
              <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>{section.text}</p>
              {section.bullets && (
                <ul className="space-y-2">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="var(--success)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-[768px] mx-auto">
          <h2 className="reveal text-2xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: 'Simplicity', desc: 'Complex problems, simple solutions. If it\'s confusing, we haven\'t done our job.' },
              { title: 'Reliability', desc: 'Your restaurant runs 7 days a week. So should your software. Offline-first by design.' },
              { title: 'Affordability', desc: 'Enterprise features without enterprise pricing. Start free, scale as you grow.' },
              { title: 'Privacy', desc: 'Your data is yours. We never sell, share, or monetize your restaurant data.' },
            ].map((v, i) => (
              <div key={v.title} className={`reveal reveal-delay-${i + 1} p-6 rounded-[20px]`} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[768px] mx-auto">
          <div className="reveal rounded-[24px] p-10 md:p-16 text-center" style={{ background: 'var(--accent)' }}>
            <h2 className="text-3xl font-bold text-white mb-4">Join Us</h2>
            <p className="text-lg text-white/80 mb-8">We&apos;re building the future of restaurant technology. Come along for the ride.</p>
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-3.5 bg-white rounded-[16px] font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5" style={{ color: 'var(--accent)' }}>
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
