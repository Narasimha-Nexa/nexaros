import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for restaurants of all sizes. Start free, scale as you grow.',
};

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for small cafes and food trucks getting started.',
    cta: 'Get Started',
    href: '/register',
    featured: false,
    features: [
      '1 Branch',
      'Up to 5 Staff Members',
      'Basic POS System',
      'Menu Management',
      'Table Management',
      'Basic Reports',
      'Email Support',
    ],
    limitations: [
      'No Kitchen Display',
      'No Inventory Management',
      'No QR Ordering',
      'No Multi-Branch',
    ],
  },
  {
    name: 'Growth',
    price: '₹2,999',
    period: '/mo',
    description: 'Ideal for growing restaurants ready to scale operations.',
    cta: 'Start Free Trial',
    href: '/checkout?plan=professional',
    featured: true,
    features: [
      'Up to 3 Branches',
      'Up to 20 Staff Members',
      'Advanced POS System',
      'Kitchen Display System',
      'Inventory Management',
      'QR Code Ordering',
      'Supplier Management',
      'Staff Scheduling',
      'Advanced Reports & Analytics',
      'Priority Email & Chat Support',
    ],
    limitations: [],
  },
  {
    name: 'Enterprise',
    price: '₹7,999',
    period: '/mo',
    description: 'For large restaurant chains with advanced requirements.',
    cta: 'Contact Sales',
    href: '/contact',
    featured: false,
    features: [
      'Unlimited Branches',
      'Unlimited Staff Members',
      'All Growth Features',
      'AI-Powered Analytics',
      'Demand Forecasting',
      'Custom Integrations',
      'Dedicated Account Manager',
      'SLA Guarantee (99.9% Uptime)',
      'White-Label Option',
      '24/7 Phone & Email Support',
    ],
    limitations: [],
  },
];

const faqs = [
  { q: 'Can I switch plans later?', a: 'Yes! You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.' },
  { q: 'Is there a free trial?', a: 'Growth plan comes with a 14-day free trial. No credit card required.' },
  { q: 'Do you offer custom plans?', a: 'Absolutely. Contact our sales team for custom enterprise plans tailored to your needs.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, UPI, net banking, and Razorpay for Indian customers.' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-16 px-6 md:pt-40 md:pb-20">
        <div className="max-w-[768px] mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            Pricing
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Simple, Transparent Pricing
          </h1>
          <p className="reveal reveal-delay-2 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Start free. Scale as you grow. No hidden fees, no surprise charges.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={plan.name} className={`reveal reveal-delay-${i + 1} relative p-8 rounded-[20px] transition-all ${plan.featured ? 'ring-2 scale-[1.02]' : ''}`} style={{ background: 'var(--bg-secondary)', border: `1px solid ${plan.featured ? 'var(--accent)' : 'var(--border)'}` }}>
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold tracking-widest uppercase text-white rounded-[16px]" style={{ background: 'var(--accent)' }}>
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{plan.price}</span>
                  {plan.period && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>}
                </div>
                <Link href={plan.href} className="block w-full py-3 text-center rounded-[16px] font-semibold transition-all hover:-translate-y-0.5 mb-8" style={plan.featured ? { background: 'var(--accent)', color: 'white' } : { border: '2px solid var(--border)', color: 'var(--text-primary)' }}>
                  {plan.cta}
                </Link>
                <div className="space-y-3 mb-6">
                  <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>What&apos;s included</p>
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="var(--success)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                {plan.limitations.length > 0 && (
                  <div className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Not included</p>
                    {plan.limitations.map((l) => (
                      <div key={l} className="flex items-start gap-2">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{l}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-[768px] mx-auto">
          <h2 className="reveal text-3xl font-bold text-center mb-12" style={{ color: 'var(--text-primary)' }}>Frequently Asked Questions</h2>
          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <div key={faq.q} className={`reveal reveal-delay-${Math.min(i + 1, 4)}`} style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="py-5">
                  <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{faq.q}</h3>
                  <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[768px] mx-auto">
          <div className="reveal rounded-[24px] p-10 md:p-16 text-center" style={{ background: 'var(--accent)' }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Restaurant?</h2>
            <p className="text-lg text-white/80 mb-8">Join thousands of restaurants using NexaROS. Start free today.</p>
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-3.5 bg-white rounded-[16px] font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5" style={{ color: 'var(--accent)' }}>
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
