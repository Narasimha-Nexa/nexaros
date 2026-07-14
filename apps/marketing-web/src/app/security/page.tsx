import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security',
  description: 'NexaROS Security — enterprise-grade data protection with encryption, RBAC, audit logging, and SOC 2 compliant infrastructure.',
};

const securityFeatures = [
  { title: 'Encryption at Rest', desc: 'All data is encrypted using AES-256 encryption. Database backups are encrypted.', icon: '🔐' },
  { title: 'Encryption in Transit', desc: 'All communications use TLS 1.3. Your data is never transmitted in plain text.', icon: '🔒' },
  { title: 'Regular Backups', desc: 'Automated daily backups with 30-day retention. Point-in-time recovery available.', icon: '💾' },
  { title: 'Access Controls', desc: 'Role-based access control (RBAC) with granular permissions. Multi-factor authentication for admins.', icon: '🛡️' },
  { title: 'Data Isolation', desc: 'Multi-tenant architecture with complete data isolation. No cross-tenant data access.', icon: '🏢' },
  { title: 'Audit Logging', desc: 'Complete audit trail of all actions. Track who did what and when.', icon: '📋' },
  { title: 'Infrastructure', desc: 'Hosted on SOC 2 compliant infrastructure. Regular security assessments and penetration testing.', icon: '☁️' },
  { title: 'Incident Response', desc: '24/7 monitoring with automated alerts. Documented incident response procedures.', icon: '🚨' },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-16 px-6 md:pt-40 md:pb-20">
        <div className="max-w-[768px] mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            Security
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Security
          </h1>
          <p className="reveal reveal-delay-2 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Your restaurant data is critical. We take security seriously at every level.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((item, i) => (
              <div key={item.title} className={`reveal reveal-delay-${Math.min(i + 1, 4)} p-6 rounded-[20px]`} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="reveal mt-12 p-8 rounded-[20px] text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Report a Security Vulnerability</h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Found a security issue? We appreciate responsible disclosure. Email us at{' '}
              <a href="mailto:security@nexaros.com" className="font-medium" style={{ color: 'var(--accent)' }}>security@nexaros.com</a>.
            </p>
            <Link href="/contact" className="inline-block px-6 py-3 rounded-[16px] font-medium text-white" style={{ background: 'var(--accent)' }}>
              Contact Security Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
