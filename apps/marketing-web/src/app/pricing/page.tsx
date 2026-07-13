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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-900">NexaROS</span>
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">Back to Home</Link>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Start free. Scale as you grow. No hidden fees, no surprise charges.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl border bg-white ${
                  plan.featured
                    ? 'border-blue-600 ring-2 ring-blue-100 scale-[1.02] md:scale-105'
                    : 'border-gray-200'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  {'period' in plan && plan.period && (
                    <span className="text-sm text-gray-500 ml-1">{plan.period}</span>
                  )}
                </div>
                <Link
                  href={plan.name === 'Enterprise' ? '/contact' : '/signup'}
                  className={`block w-full py-3 text-center rounded-xl font-semibold mb-8 ${
                    plan.featured
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="space-y-3 mb-6">
                  <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide">What&apos;s included</p>
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>

                {plan.limitations.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Not included</p>
                    {plan.limitations.map((l) => (
                      <div key={l} className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-sm text-gray-400">{l}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white p-6 rounded-2xl border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Restaurant?</h2>
          <p className="text-blue-100 mb-8">Join thousands of restaurants using NexaROS. Start free today.</p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white font-semibold mb-2">NexaROS</p>
          <p className="text-sm">AI-Powered Restaurant Operating System</p>
        </div>
      </footer>
    </div>
  );
}
