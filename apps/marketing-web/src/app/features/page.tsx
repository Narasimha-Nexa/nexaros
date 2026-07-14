import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Explore all features of NexaROS — POS, kitchen display, inventory, QR ordering, analytics, and more.',
};

const featureGroups = [
  {
    title: 'Point of Sale',
    tag: 'POS',
    color: '#E23744',
    features: [
      { name: 'Touch-Optimized POS', desc: 'Fast, intuitive interface designed for speed. Add items with a single tap.' },
      { name: 'Table Management', desc: 'Visual floor plan with drag-and-drop. Track table status in real-time.' },
      { name: 'Split Bills', desc: 'Split by item, by seat, or custom amounts. Handle any billing scenario.' },
      { name: 'Hold & Recall', desc: 'Hold orders temporarily and recall them later. Perfect for busy rushes.' },
      { name: 'Multiple Payment Methods', desc: 'Cash, UPI, cards, net banking, wallets — accept them all in one place.' },
      { name: 'Quick Keys', desc: 'Keyboard shortcuts for power users. Process orders 3x faster.' },
    ],
  },
  {
    title: 'Kitchen Display System',
    tag: 'KDS',
    color: '#F58220',
    features: [
      { name: 'Real-Time Order Queue', desc: 'Orders appear instantly on kitchen screens. No paper KOTs needed.' },
      { name: 'Color-Coded Status', desc: 'New orders in red, in-progress in yellow, ready in green. Visual clarity.' },
      { name: 'Timer Per Order', desc: 'Track preparation time. Identify bottlenecks. Improve service speed.' },
      { name: 'Sound Alerts', desc: 'Audio notification for new orders. Never miss an order during rush hour.' },
      { name: 'KOT Printing', desc: 'Still prefer paper? Print KOTs directly to kitchen printers via ESC/POS.' },
      { name: 'Item-Level Tracking', desc: 'Track status of individual items within an order. Ready items marked separately.' },
    ],
  },
  {
    title: 'Inventory Management',
    tag: 'Inventory',
    color: '#F5A623',
    features: [
      { name: 'Stock Tracking', desc: 'Real-time stock levels. Automatic deduction when orders are placed.' },
      { name: 'Low Stock Alerts', desc: 'Get notified when items fall below minimum stock levels.' },
      { name: 'Supplier Management', desc: 'Track suppliers, purchase orders, and delivery schedules.' },
      { name: 'Waste Tracking', desc: 'Record and analyze waste to reduce costs and improve efficiency.' },
      { name: 'Purchase Orders', desc: 'Create and track purchase orders. Auto-receive stock on delivery.' },
      { name: 'Barcode Support', desc: 'Scan barcodes for quick item lookup and stock adjustments.' },
    ],
  },
  {
    title: 'Staff Management',
    tag: 'Staff',
    color: '#2DB67D',
    features: [
      { name: 'Role-Based Access', desc: 'Custom roles with granular permissions. Control what each staff member can do.' },
      { name: 'Shift Scheduling', desc: 'Create and manage shifts. Assign staff to shifts with drag-and-drop.' },
      { name: 'Attendance Tracking', desc: 'Clock in/out with PIN. Track attendance and working hours automatically.' },
      { name: 'Performance Metrics', desc: 'Track orders handled, revenue generated, and average service time per staff.' },
      { name: 'PIN-Based Login', desc: 'Staff login with 4-digit PIN. Fast, secure, no passwords to remember.' },
    ],
  },
  {
    title: 'Reports & Analytics',
    tag: 'Analytics',
    color: '#2F80ED',
    features: [
      { name: 'Daily Sales Report', desc: 'Complete breakdown of daily revenue, orders, and average order value.' },
      { name: 'Revenue Analytics', desc: 'Revenue by category, item, payment method, and time period.' },
      { name: 'Peak Hours Analysis', desc: 'Identify busiest hours to optimize staffing and inventory.' },
      { name: 'Item Performance', desc: 'Top sellers, slow movers, and profitability per item.' },
      { name: 'Branch Comparison', desc: 'Compare performance across multiple locations side by side.' },
      { name: 'Export to PDF/Excel', desc: 'Download reports in PDF or Excel format for accounting and analysis.' },
    ],
  },
  {
    title: 'Online Ordering',
    tag: 'Online',
    color: '#9B51E0',
    features: [
      { name: 'QR Code Ordering', desc: 'Customers scan QR, browse menu, order from their phone. No app download.' },
      { name: 'Customer Website', desc: 'Branded restaurant website with digital menu, ordering, and order tracking.' },
      { name: 'Real-Time Sync', desc: 'Online orders appear instantly on POS and kitchen display.' },
      { name: 'Online Payments', desc: 'Accept UPI, cards, and net banking for online orders.' },
      { name: 'Order Tracking', desc: 'Customers track their order status in real-time from their phone.' },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-16 px-6 md:pt-40 md:pb-20">
        <div className="max-w-[768px] mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            Features
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Features That Drive Results
          </h1>
          <p className="reveal reveal-delay-2 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Every tool your restaurant needs, from the front counter to the kitchen and beyond.
          </p>
        </div>
      </section>

      {featureGroups.map((group, gi) => (
        <section key={group.title} className="py-16 px-6" style={{ background: gi % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)' }}>
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-3 mb-10 justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[16px] text-xs font-semibold tracking-wider uppercase" style={{ background: `${group.color}15`, color: group.color }}>
                {group.tag}
              </div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{group.title}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.features.map((f, i) => (
                <div key={f.name} className={`reveal reveal-delay-${Math.min(i + 1, 4)} p-6 rounded-[20px] transition-all hover:-translate-y-1`} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{f.name}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="py-20 px-6">
        <div className="max-w-[768px] mx-auto">
          <div className="reveal rounded-[24px] p-10 md:p-16 text-center" style={{ background: 'var(--accent)' }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-white/80 mb-8">Start free today. No credit card required.</p>
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-3.5 bg-white rounded-[16px] font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5" style={{ color: 'var(--accent)' }}>
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
