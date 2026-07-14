import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'NexaROS documentation — guides, API reference, hardware setup, and troubleshooting for restaurant management.',
};

const sections = [
  { icon: '🚀', title: 'Getting Started', desc: 'Set up your restaurant in minutes.', topics: ['Installation Guide', 'First-time Setup', 'Adding Menu Items', 'Configuring Printers'] },
  { icon: '📖', title: 'User Guides', desc: 'Learn how to use every feature.', topics: ['POS Basics', 'Order Management', 'Kitchen Display', 'Inventory Management'] },
  { icon: '🔌', title: 'API Reference', desc: 'Integrate and extend NexaROS.', topics: ['Authentication', 'Menu API', 'Orders API', 'WebSocket Events'] },
  { icon: '🛠️', title: 'Troubleshooting', desc: 'Solve common issues.', topics: ['Printer Not Working', 'Sync Issues', 'Payment Errors', 'Login Problems'] },
  { icon: '📦', title: 'Hardware Setup', desc: 'Configure printers and scanners.', topics: ['Printer Installation (ESC/POS)', 'Barcode Scanner Setup', 'Cash Drawer Configuration', 'Network Requirements'] },
  { icon: '❓', title: 'FAQ', desc: 'Frequently asked questions.', topics: ['Pricing & Plans', 'Data Security', 'Multi-Branch Setup', 'Offline Mode'] },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-16 px-6 md:pt-40 md:pb-20">
        <div className="max-w-[768px] mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            Documentation
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Documentation
          </h1>
          <p className="reveal reveal-delay-2 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Everything you need to set up, use, and extend NexaROS.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, i) => (
              <div key={section.title} className={`reveal reveal-delay-${Math.min(i + 1, 4)} p-6 rounded-[20px] transition-all hover:-translate-y-1`} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="text-2xl mb-3">{section.icon}</div>
                <h2 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{section.title}</h2>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{section.desc}</p>
                <ul className="space-y-1.5">
                  {section.topics.map((topic) => (
                    <li key={topic} className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{topic}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
