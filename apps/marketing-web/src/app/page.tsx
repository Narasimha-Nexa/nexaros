

export default function MarketingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-900">NexaROS</span>
          </div>
          <div className="hidden sm:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#about" className="text-sm text-gray-600 hover:text-gray-900">About</a>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_CUSTOMER_URL || '/'}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Order Now
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-sm text-blue-700 mb-6">
            AI-Powered Restaurant Operating System
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            The Complete Platform for{' '}
            <span className="text-blue-600">Modern Restaurants</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            From POS and kitchen display to inventory management and customer ordering — 
            everything you need to run your restaurant efficiently.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="#features"
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              Explore Features
            </a>
            <a
              href="#pricing"
              className="px-8 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Need</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            A complete suite of tools designed for restaurants of all sizes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-2xl">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Start free. Scale as you grow. No hidden fees.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((p) => (
              <div key={p.name} className={`p-8 rounded-2xl border ${p.featured ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200'} bg-white`}>
                {p.featured && <div className="text-xs font-semibold text-blue-600 mb-2">POPULAR</div>}
                <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                <div className="text-3xl font-bold mb-4">{p.price}<span className="text-sm font-normal text-gray-500">/mo</span></div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#" className="block w-full py-3 text-center rounded-xl font-medium border border-gray-200 hover:bg-gray-50">
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white font-semibold mb-2">NexaROS</p>
          <p className="text-sm">AI-Powered Restaurant Operating System</p>
          <p className="text-xs mt-4">&copy; {new Date().getFullYear()} NexaROS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { icon: '🖥️', title: 'POS System', desc: 'Fast, intuitive point of sale with table management, split bills, and multiple payment methods.' },
  { icon: '👨‍🍳', title: 'Kitchen Display', desc: 'Real-time order display with timers, color-coded status, and sound alerts for new orders.' },
  { icon: '📊', title: 'Analytics & Reports', desc: 'Daily sales reports, revenue breakdowns, item performance, and peak hours analysis.' },
  { icon: '📱', title: 'QR Ordering', desc: 'Customers scan QR codes to browse menus and place orders directly from their phones.' },
  { icon: '📦', title: 'Inventory Management', desc: 'Track stock levels, set reorder points, manage suppliers, and auto-deduct inventory from orders.' },
  { icon: '👥', title: 'Staff Management', desc: 'Role-based access, shift scheduling, attendance tracking, and performance metrics.' },
  { icon: '🖨️', title: 'Printer Integration', desc: 'ESC/POS thermal printer support for receipts and KOTs with auto-discovery.' },
  { icon: '🌐', title: 'Customer Website', desc: 'Restaurant website with digital menu, online ordering, and order tracking.' },
  { icon: '💼', title: 'Multi-Branch', desc: 'Manage multiple locations from a single dashboard with branch-specific reporting.' },
];

const pricing = [
  { name: 'Starter', price: 'Free', cta: 'Get Started', featured: false, features: ['1 Branch', 'Up to 5 Staff', 'Basic POS', 'Menu Management', 'Email Support'] },
  { name: 'Growth', price: '₹2,999', cta: 'Start Free Trial', featured: true, features: ['Up to 3 Branches', 'Up to 20 Staff', 'Advanced POS', 'Kitchen Display', 'Inventory Management', 'QR Ordering', 'Priority Support'] },
  { name: 'Enterprise', price: '₹7,999', cta: 'Contact Sales', featured: false, features: ['Unlimited Branches', 'Unlimited Staff', 'All Features', 'AI Analytics', 'Custom Integration', 'Dedicated Support', 'SLA Guarantee'] },
];
