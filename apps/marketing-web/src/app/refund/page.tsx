import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'NexaROS Refund Policy — 7-day money-back guarantee on all paid plans. No questions asked.',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-32 pb-20 px-6 max-w-[768px] mx-auto">
        <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
          Legal
        </div>
        <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-2" style={{ color: 'var(--text-primary)' }}>Refund Policy</h1>
        <p className="reveal reveal-delay-2 text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: July 13, 2026</p>

        <div className="reveal reveal-delay-3 space-y-8">
          {[
            { title: '7-Day Money-Back Guarantee', content: 'We offer a 7-day money-back guarantee on all paid plans. If you are not satisfied with NexaROS within 7 days of your first payment, contact us for a full refund — no questions asked.' },
            { title: 'How to Request a Refund', content: 'Email us at billing@nexaros.com with your account email and reason. Refunds are processed within 5-7 business days. Refunds are credited to the original payment method.' },
            { title: 'After 7 Days', content: 'After the 7-day period, payments are non-refundable. However, you can cancel your subscription at any time, and your access will continue until the end of the current billing period.' },
            { title: 'Annual Plans', content: 'For annual plans, the 7-day money-back guarantee applies from the date of initial purchase. Pro-rated refunds for partial annual periods are not available.' },
            { title: 'Contact', content: 'For refund requests or billing questions, email billing@nexaros.com.' },
          ].map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{section.title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{section.content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
