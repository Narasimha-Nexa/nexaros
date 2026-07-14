import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Partners',
  description: 'Partner with NexaROS. Reseller, integration, technology, and training partnership opportunities for restaurant tech.',
};

const partnerTypes = [
  { icon: '🤝', title: 'Reseller Partners', desc: 'Earn commissions by referring restaurants to NexaROS. We provide training, marketing materials, and competitive commission rates.', benefits: ['Competitive commissions', 'Marketing support', 'Dedicated partner portal', 'Training & certification'] },
  { icon: '🔌', title: 'Integration Partners', desc: 'Build integrations with NexaROS APIs. Connect payment gateways, delivery platforms, accounting software, and more.', benefits: ['Full API access', 'Technical documentation', 'Engineering support', 'Co-marketing opportunities'] },
  { icon: '🏗️', title: 'Technology Partners', desc: 'Hardware vendors, POS system providers, and technology companies looking to integrate with NexaROS.', benefits: ['Joint product development', 'Certified partner badge', 'Joint webinars & events', 'Priority support'] },
  { icon: '🎓', title: 'Training Partners', desc: 'Provide on-ground training and support to restaurants using NexaROS in your region.', benefits: ['Training curriculum provided', 'Certification program', 'Regional exclusivity', 'Lead referrals'] },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-16 px-6 md:pt-40 md:pb-20">
        <div className="max-w-[768px] mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            Partners
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Partner with NexaROS
          </h1>
          <p className="reveal reveal-delay-2 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Join our growing partner ecosystem. Together, we can help more restaurants succeed.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partnerTypes.map((p, i) => (
              <div key={p.title} className={`reveal reveal-delay-${Math.min(i + 1, 4)} p-8 rounded-[20px] transition-all hover:-translate-y-1`} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{p.title}</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{p.desc}</p>
                <ul className="space-y-2">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="var(--success)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-[768px] mx-auto text-center">
          <h2 className="reveal text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Interested in Partnering?</h2>
          <p className="reveal reveal-delay-1 mb-8" style={{ color: 'var(--text-secondary)' }}>Send us a message and our partnerships team will get back to you within 48 hours.</p>
          <Link href="/contact" className="reveal reveal-delay-2 inline-block px-8 py-3 rounded-[16px] font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: 'var(--accent)' }}>
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  );
}
