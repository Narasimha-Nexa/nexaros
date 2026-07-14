import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the NexaROS team. We\'re building the future of restaurant technology. Remote-first, open source, real impact.',
};

const positions = [
  { title: 'Full-Stack Developer (NestJS + Next.js)', type: 'Full-time', location: 'Remote / Bangalore', description: 'Build and scale our backend APIs and web applications. Experience with NestJS, Next.js, PostgreSQL required.' },
  { title: 'Flutter Developer', type: 'Full-time', location: 'Remote / Bangalore', description: 'Develop our cross-platform restaurant app. Experience with Flutter, Drift/SQLite, and offline-first architecture required.' },
  { title: 'DevOps Engineer', type: 'Full-time', location: 'Remote', description: 'Manage our cloud infrastructure, CI/CD pipelines, and monitoring. Experience with Docker, GitHub Actions, and cloud platforms required.' },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-16 px-6 md:pt-40 md:pb-20">
        <div className="max-w-[768px] mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            Careers
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Careers at NexaROS
          </h1>
          <p className="reveal reveal-delay-2 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            We&apos;re building the future of restaurant technology. Join our small, passionate team and make a real impact.
          </p>
        </div>
      </section>

      <section className="pb-16 px-6">
        <div className="max-w-[768px] mx-auto">
          <h2 className="reveal text-2xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>Why NexaROS?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            {[
              { title: 'Remote-First', desc: 'Work from anywhere. We care about results, not office hours.' },
              { title: 'Open Source', desc: 'Contribute to open-source projects. Your work is visible to the world.' },
              { title: 'Early Stage', desc: 'Join early and shape the product. Your ideas matter here.' },
              { title: 'Real Impact', desc: 'Help restaurants run better. Your code directly impacts businesses.' },
            ].map((perk, i) => (
              <div key={perk.title} className={`reveal reveal-delay-${i + 1} p-6 rounded-[20px]`} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{perk.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{perk.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="reveal text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Open Positions</h2>
          <div className="space-y-4">
            {positions.map((pos, i) => (
              <div key={pos.title} className={`reveal reveal-delay-${Math.min(i + 1, 4)} p-6 rounded-[20px] transition-all hover:-translate-y-1`} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{pos.title}</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>{pos.type}</span>
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{pos.location}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{pos.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="mb-4" style={{ color: 'var(--text-muted)' }}>Don&apos;t see a position that fits? Send us your resume anyway.</p>
            <Link href="/contact" className="inline-block px-6 py-3 rounded-[16px] font-medium text-white" style={{ background: 'var(--accent)' }}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
