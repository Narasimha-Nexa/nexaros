import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Status',
  description: 'NexaROS System Status — check the health and uptime of all services in real-time.',
};

const services = [
  { name: 'API Server', status: 'operational', uptime: '99.99%' },
  { name: 'POS System', status: 'operational', uptime: '99.99%' },
  { name: 'Kitchen Display', status: 'operational', uptime: '99.98%' },
  { name: 'QR Ordering', status: 'operational', uptime: '99.99%' },
  { name: 'Customer Website', status: 'operational', uptime: '99.99%' },
  { name: 'Payment Processing', status: 'operational', uptime: '99.97%' },
  { name: 'Email Service', status: 'operational', uptime: '99.95%' },
];

export default function StatusPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-16 px-6 md:pt-40 md:pb-20">
        <div className="max-w-[768px] mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }}></span>
            All Systems Operational
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            System Status
          </h1>
          <p className="reveal reveal-delay-2 text-lg" style={{ color: 'var(--text-secondary)' }}>
            All systems are currently operational.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-[768px] mx-auto">
          <h2 className="reveal text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Service Status</h2>
          <div className="reveal reveal-delay-1 rounded-[20px] overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{service.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{service.uptime} uptime</span>
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--success)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }}></span>
                    Operational
                  </span>
                </div>
              </div>
            ))}
          </div>

          <h2 className="reveal text-xl font-bold mt-12 mb-6" style={{ color: 'var(--text-primary)' }}>Past Incidents</h2>
          <div className="reveal reveal-delay-1 p-6 rounded-[20px]" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No recent incidents</p>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>All systems operational</p>
          </div>
        </div>
      </section>
    </div>
  );
}
