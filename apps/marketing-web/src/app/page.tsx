import Link from 'next/link';
import JSONLDSchema from '@/components/JSONLDSchema';

const painPoints = [
  { icon: '📶', title: 'Unreliable Internet', desc: 'Cloud-based systems fail when your internet drops. Orders get lost, KOTs don\'t print.' },
  { icon: '💸', title: 'Expensive Software', desc: 'Enterprise POS systems cost lakhs upfront. Small restaurants can\'t afford them.' },
  { icon: '🔒', title: 'Vendor Lock-in', desc: 'Proprietary systems lock your data. Switching providers means starting from scratch.' },
  { icon: '📱', title: 'Disconnected Tools', desc: 'POS, kitchen, inventory — all different apps. Nothing talks to each other.' },
  { icon: '🌐', title: 'No Online Presence', desc: 'Customers want to order online. Building a website costs thousands.' },
  { icon: '📊', title: 'No Real-Time Data', desc: 'You don\'t know what\'s happening until end of day. Too late to act.' },
];

const features = [
  {
    icon: '🖥️',
    title: 'Point of Sale',
    desc: 'Fast, intuitive POS with table management, split bills, and multiple payment methods.',
    bullets: ['Touch-optimized interface', 'Visual floor plan with drag-and-drop', 'Cash, UPI, cards, wallets — all accepted'],
    color: '#E51A24',
    tag: 'POS',
  },
  {
    icon: '👨‍🍳',
    title: 'Kitchen Display System',
    desc: 'Real-time order queue with timers, color-coded status, and sound alerts.',
    bullets: ['Orders appear instantly on kitchen screens', 'Color-coded: red → yellow → green', 'Timer per order for performance tracking'],
    color: '#F58220',
    tag: 'KDS',
  },
  {
    icon: '📦',
    title: 'Inventory Management',
    desc: 'Track stock levels, set reorder points, manage suppliers, and auto-deduct from orders.',
    bullets: ['Real-time stock levels with auto-deduction', 'Low stock alerts before you run out', 'Supplier management and purchase orders'],
    color: '#F5A623',
    tag: 'Inventory',
  },
  {
    icon: '👥',
    title: 'Staff Management',
    desc: 'Role-based access, shift scheduling, attendance tracking, and performance metrics.',
    bullets: ['Custom roles with granular permissions', 'Shift scheduling with drag-and-drop', 'PIN-based login — no passwords needed'],
    color: '#2DB67D',
    tag: 'Staff',
  },
  {
    icon: '📊',
    title: 'Reports & Analytics',
    desc: 'Daily sales, revenue breakdowns, item performance, and peak hours analysis.',
    bullets: ['Revenue by category, item, and time', 'Peak hours analysis for staffing', 'Export to PDF and Excel'],
    color: '#2F80ED',
    tag: 'Analytics',
  },
  {
    icon: '📱',
    title: 'QR Code Ordering',
    desc: 'Customers scan QR, browse menu, order from their phone. No app download needed.',
    bullets: ['Table QR codes for self-ordering', 'Real-time sync with POS and kitchen', 'Online payments via UPI and cards'],
    color: '#9B51E0',
    tag: 'QR Order',
  },
];

const devices = [
  { name: 'Desktop POS', desc: 'Full POS experience with keyboard shortcuts and multi-monitor support.', platforms: 'Linux, Windows, macOS', icon: '🖥️' },
  { name: 'Tablet Ordering', desc: 'Touch-optimized interface for table-side ordering and floor management.', platforms: 'Android, iPad', icon: '📱' },
  { name: 'Mobile Manager', desc: 'On-the-go management, order tracking, and real-time notifications.', platforms: 'Android, iOS', icon: '📲' },
  { name: 'Kitchen Display', desc: 'TV-optimized screen with color-coded orders and timers for kitchen staff.', platforms: 'Any screen', icon: '📺' },
];

const steps = [
  { step: '1', title: 'Register Your Restaurant', desc: 'Sign up in 30 seconds. Choose your plan. No credit card required for the free tier.' },
  { step: '2', title: 'Configure & Customize', desc: 'Add your menu, set up tables, configure printers. We guide you through every step.' },
  { step: '3', title: 'Start Taking Orders', desc: 'Go live instantly. Take orders from POS, QR codes, or your customer website.' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Owner, Spice Garden, Bangalore', text: 'NexaROS transformed how we run our restaurant. The offline-first feature is a lifesaver during power cuts. We haven\'t lost a single order in 6 months.', rating: 5 },
  { name: 'Rahul Verma', role: 'Manager, Urban Bistro, Mumbai', text: 'Kitchen display system reduced our order preparation time by 30%. The real-time sync between POS and kitchen is incredible.', rating: 5 },
  { name: 'Ananya Patel', role: 'Owner, Green Leaf Cafe, Hyderabad', text: 'Started with the free plan, now running 3 branches on the Growth plan. Best investment we made. The QR ordering alone pays for itself.', rating: 5 },
];

const pricing = [
  { name: 'Starter', price: 'Free', cta: 'Get Started', href: '/register', featured: false, features: ['1 Branch', 'Up to 5 Staff', 'Basic POS', 'Menu Management', 'Email Support'] },
  { name: 'Growth', price: '₹2,999', cta: 'Start Free Trial', href: '/register', featured: true, features: ['Up to 3 Branches', 'Up to 20 Staff', 'Kitchen Display', 'Inventory Management', 'QR Ordering', 'Priority Support'] },
  { name: 'Enterprise', price: '₹7,999', cta: 'Contact Sales', href: '/contact', featured: false, features: ['Unlimited Branches', 'Unlimited Staff', 'All Features', 'AI Analytics', 'Custom Integration', 'Dedicated Support'] },
];

const faqs = [
  { q: 'How does the free plan work?', a: 'The Starter plan is completely free with no time limit. You get 1 branch, up to 5 staff members, basic POS, and menu management. No credit card required.' },
  { q: 'What happens when the internet goes down?', a: 'NexaROS is built offline-first. All critical data is stored locally on your device. Orders, KOTs, and payments continue to work. Everything syncs automatically when connectivity returns.' },
  { q: 'Can I switch plans later?', a: 'Yes! You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle. No penalties or hidden fees.' },
  { q: 'What hardware do I need?', a: 'NexaROS runs on any modern computer, tablet, or phone. For printers, we support ESC/POS thermal printers (USB or network). Barcode scanners work as standard USB HID devices.' },
  { q: 'Is my data secure?', a: 'Yes. Your data is encrypted at rest and in transit. We use industry-standard security practices. Your data belongs to you and is never shared with third parties.' },
  { q: 'Do you support Indian payment methods?', a: 'Yes! We support Cash, UPI, credit/debit cards, net banking, and wallets. Razorpay integration is built-in for online payments.' },
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen">
      <JSONLDSchema type="Organization" data={{
        name: 'NexaROS',
        url: 'https://nexaros.com',
        logo: 'https://nexaros.com/logo.png',
        description: 'AI-powered restaurant operating system for India. Free POS, kitchen display, inventory, ordering, and analytics.',
        foundingDate: '2026',
        address: { '@type': 'PostalAddress', addressLocality: 'Bangalore', addressRegion: 'Karnataka', addressCountry: 'IN' },
        sameAs: [],
      }} />
      <JSONLDSchema type="FAQPage" data={{
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      }} />
      <JSONLDSchema type="WebSite" data={{
        name: 'NexaROS',
        url: 'https://nexaros.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://nexaros.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }} />
      <JSONLDSchema type="SoftwareApplication" data={{
        name: 'NexaROS - Restaurant Operating System',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Android, iOS, Windows, Linux, macOS',
        offers: [
          { '@type': 'Offer', price: '0', priceCurrency: 'INR', name: 'Starter Plan' },
          { '@type': 'Offer', price: '2999', priceCurrency: 'INR', name: 'Growth Plan' },
          { '@type': 'Offer', price: '7999', priceCurrency: 'INR', name: 'Enterprise Plan' },
        ],
        description: 'Complete restaurant management platform with POS, kitchen display, inventory, staff management, QR ordering, and analytics. Built for India.',
      }} />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:pt-40 md:pb-28">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            AI-Powered Restaurant Operating System
          </div>
          <h1 className="reveal reveal-delay-1 text-[40px] md:text-[56px] lg:text-[72px] font-extrabold leading-[1.1] mb-6" style={{ color: 'var(--text-primary)' }}>
            Run Your Restaurant<br />
            <span className="gradient-text">Like a Fortune 500 Company</span>
          </h1>
          <p className="reveal reveal-delay-2 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            One platform for POS, kitchen display, inventory, ordering, and analytics.
            Built for India. Free to start.
          </p>
          <div className="reveal reveal-delay-3 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white rounded-[16px] transition-all hover:shadow-lg hover:-translate-y-0.5" style={{ background: 'var(--accent)' }}>
              Start Free Trial
            </Link>
            <Link href="/features" className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-[16px] transition-all" style={{ color: 'var(--text-primary)', border: '2px solid var(--border)' }}>
              Explore Features
            </Link>
          </div>
          <p className="reveal reveal-delay-4 mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Trusted by 500+ restaurants across India
          </p>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-6" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <div className="reveal text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>The Problem</div>
            <h2 className="reveal reveal-delay-1 text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Restaurants Face These Problems Every Day
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {painPoints.map((item, i) => (
              <div key={item.title} className={`reveal reveal-delay-${Math.min(i + 1, 4)} p-6 rounded-[20px] transition-all hover:-translate-y-1`} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Modules — Alternating Layout */}
      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <div className="reveal text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>The Platform</div>
            <h2 className="reveal reveal-delay-1 text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Everything You Need to Run Your Restaurant
            </h2>
          </div>

          <div className="space-y-20">
            {features.map((f, i) => (
              <div key={f.title} className={`reveal flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}>
                <div className="flex-1 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[16px] text-xs font-semibold tracking-wide uppercase" style={{ background: `${f.color}15`, color: f.color }}>
                    {f.tag}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                  <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                  <ul className="space-y-2 pt-2">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke={f.color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 w-full">
                  <div className="rounded-[20px] p-8 md:p-12 flex items-center justify-center min-h-[280px]" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="text-center">
                      <div className="text-6xl mb-4">{f.icon}</div>
                      <div className="text-sm font-semibold tracking-wider uppercase" style={{ color: f.color }}>{f.tag}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Device Showcase */}
      <section className="py-20 px-6" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <div className="reveal text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>Multi-Device</div>
            <h2 className="reveal reveal-delay-1 text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              One Platform. Every Device.
            </h2>
            <p className="reveal reveal-delay-2 mt-4 text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              All connected. All in sync. Works everywhere your restaurant needs it.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {devices.map((d, i) => (
              <div key={d.name} className={`reveal reveal-delay-${Math.min(i + 1, 4)} p-6 rounded-[20px] text-center transition-all hover:-translate-y-1`} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div className="text-4xl mb-4">{d.icon}</div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{d.name}</h3>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{d.desc}</p>
                <span className="inline-block px-3 py-1 rounded-[16px] text-xs font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{d.platforms}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-[768px] mx-auto">
          <div className="text-center mb-12">
            <div className="reveal text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>Getting Started</div>
            <h2 className="reveal reveal-delay-1 text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Up and Running in Minutes
            </h2>
            <p className="reveal reveal-delay-2 mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>
              No complex setup. No IT team needed.
            </p>
          </div>
          <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
            {steps.map((item, i) => (
              <div key={item.step} className={`reveal reveal-delay-${i + 1} text-center relative`}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white mx-auto mb-4" style={{ background: 'var(--accent)' }}>
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <div className="reveal text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>Testimonials</div>
            <h2 className="reveal reveal-delay-1 text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Loved by Restaurant Owners
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={t.name} className={`reveal reveal-delay-${i + 1} p-6 rounded-[20px] transition-all hover:-translate-y-1`} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <svg key={j} className="w-4 h-4" fill="#F5A623" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <div className="reveal text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>Pricing</div>
            <h2 className="reveal reveal-delay-1 text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Simple, Transparent Pricing
            </h2>
            <p className="reveal reveal-delay-2 mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>
              Start free. Scale as you grow. No hidden fees.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricing.map((p, i) => (
              <div key={p.name} className={`reveal reveal-delay-${i + 1} p-8 rounded-[20px] transition-all ${p.featured ? 'ring-2 scale-[1.02]' : ''}`} style={{ background: 'var(--bg-secondary)', border: `1px solid ${p.featured ? 'var(--accent)' : 'var(--border)'}`, ...(p.featured ? { '--tw-ring-color': 'var(--accent)' } as React.CSSProperties : {}) }}>
                {p.featured && <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>MOST POPULAR</div>}
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{p.price}</span>
                  {p.price !== 'Free' && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/mo</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="var(--success)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.href} className="block w-full py-3 text-center rounded-[16px] font-semibold transition-all hover:-translate-y-0.5" style={p.featured ? { background: 'var(--accent)', color: 'white' } : { border: '2px solid var(--border)', color: 'var(--text-primary)' }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>View detailed pricing comparison →</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-[768px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="reveal text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>Frequently Asked Questions</h2>
          </div>
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
          <div className="text-center mt-8">
            <Link href="/faq" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>View all FAQs →</Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-[768px] mx-auto">
          <div className="reveal rounded-[24px] p-10 md:p-16 text-center" style={{ background: 'var(--accent)' }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Restaurant?</h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Join 500+ restaurants using NexaROS to streamline operations and boost revenue. Start free today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center px-8 py-3.5 bg-white rounded-[16px] font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5" style={{ color: 'var(--accent)' }}>
                Start Free Trial
              </Link>
              <Link href="/custom-plan" className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-white/40 text-white rounded-[16px] font-semibold transition-all hover:bg-white/10">
                Request Custom Plan
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
