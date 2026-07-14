import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about NexaROS — pricing, features, setup, and more.',
};

const faqGroups = [
  {
    title: 'Getting Started',
    faqs: [
      { q: 'How do I get started with NexaROS?', a: 'Sign up for free on our website, download the app on your device, and follow the setup wizard. You can be up and running in under 10 minutes.' },
      { q: 'What devices does NexaROS support?', a: 'NexaROS runs on Linux, Windows, and macOS desktops, Android and iPad tablets, and Android phones. Kitchen displays work on any screen with a web browser.' },
      { q: 'Do I need an internet connection?', a: 'NexaROS is built offline-first. All critical operations (POS, orders, KOT printing, payments) work without internet. Data syncs automatically when connectivity returns.' },
      { q: 'Can I migrate from another POS system?', a: 'Yes! We offer free data migration assistance. We can import your menu, customer data, and historical records from most popular POS systems.' },
    ],
  },
  {
    title: 'Pricing & Plans',
    faqs: [
      { q: 'Is there a free plan?', a: 'Yes! The Starter plan is completely free with no time limit. It includes 1 branch, up to 5 staff members, basic POS, and menu management.' },
      { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, UPI, net banking, and wallets through Razorpay. No setup fees — you only pay for your chosen plan.' },
      { q: 'Can I switch plans later?', a: 'Absolutely. You can upgrade or downgrade at any time from your dashboard. Changes take effect at the start of your next billing cycle.' },
      { q: 'Do you offer refunds?', a: 'Yes, we offer a 7-day money-back guarantee on all paid plans. If you are not satisfied, contact us within 7 days for a full refund.' },
      { q: 'Are there any hidden fees?', a: 'None. The price you see is the price you pay. No setup fees, no transaction fees, no hidden charges. Payment gateway fees (2% for Razorpay) are charged by Razorpay directly.' },
    ],
  },
  {
    title: 'Features',
    faqs: [
      { q: 'Does NexaROS support GST invoicing?', a: 'Yes. NexaROS generates GST-compliant invoices with CGST, SGST, and IGST support. You can configure tax rates per item or category.' },
      { q: 'Can I manage multiple branches?', a: 'Yes. The Growth plan supports up to 3 branches, and the Enterprise plan supports unlimited branches. Each branch has its own menu, staff, and reports.' },
      { q: 'How does QR ordering work?', a: 'Customers scan a QR code at their table, which opens your digital menu in their phone browser. They can browse, add items to cart, and place orders directly. Orders appear instantly on your POS and kitchen display.' },
      { q: 'Does NexaROS work with thermal printers?', a: 'Yes. NexaROS supports ESC/POS thermal printers via USB and network connections. Receipt and KOT printing is fully supported.' },
    ],
  },
  {
    title: 'Security & Privacy',
    faqs: [
      { q: 'Is my data secure?', a: 'Yes. All data is encrypted at rest and in transit (TLS 1.3). We use industry-standard security practices, regular backups, and SOC 2 compliant infrastructure.' },
      { q: 'Where is my data stored?', a: 'All data is stored in secure cloud servers in India. We comply with Indian data protection regulations. Your data is never shared with third parties.' },
      { q: 'Can I export my data?', a: 'Yes. You can export all your data (menu, orders, reports, customer data) in CSV or JSON format at any time. Your data belongs to you.' },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-16 px-6 md:pt-40 md:pb-20">
        <div className="max-w-[768px] mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            FAQ
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Frequently Asked Questions
          </h1>
          <p className="reveal reveal-delay-2 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Everything you need to know about NexaROS. Can&apos;t find what you&apos;re looking for?{' '}
            <Link href="/contact" className="font-medium" style={{ color: 'var(--accent)' }}>Contact us</Link>.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-[768px] mx-auto space-y-12">
          {faqGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{group.title}</h2>
              <div className="space-y-0">
                {group.faqs.map((faq, i) => (
                  <div key={faq.q} className={`reveal reveal-delay-${Math.min(i + 1, 4)}`} style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="py-5">
                      <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{faq.q}</h3>
                      <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
