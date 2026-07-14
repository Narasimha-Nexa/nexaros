import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Restaurant management tips, technology insights, and NexaROS updates.',
};

const posts = [
  { title: 'Why Offline-First is Critical for Restaurants', excerpt: 'Internet downtime shouldn\'t mean business downtime. Learn why an offline-first architecture is essential for modern restaurants.', date: 'Jul 10, 2026', readTime: '5 min', slug: 'offline-first-restaurants' },
  { title: 'Complete Guide to GST Invoicing for Restaurants', excerpt: 'Everything you need to know about GST invoicing, tax rates, and compliance for Indian restaurants.', date: 'Jul 5, 2026', readTime: '8 min', slug: 'gst-invoicing-guide' },
  { title: 'How QR Ordering Can Increase Your Revenue', excerpt: 'QR code ordering is transforming the dining experience. See how restaurants are increasing order values by 20%+.', date: 'Jun 28, 2026', readTime: '4 min', slug: 'qr-ordering-revenue' },
  { title: 'The Ultimate Restaurant Tech Stack (2026)', excerpt: 'From POS to inventory management, here\'s the complete tech stack every restaurant needs in 2026.', date: 'Jun 20, 2026', readTime: '10 min', slug: 'restaurant-tech-stack-2026' },
  { title: 'Managing Multi-Branch Restaurants Efficiently', excerpt: 'Tips and tools for restaurant owners managing multiple locations without the headache.', date: 'Jun 15, 2026', readTime: '6 min', slug: 'multi-branch-management' },
  { title: 'Staff Scheduling Best Practices', excerpt: 'Optimize your staff schedules with these proven strategies and reduce labor costs.', date: 'Jun 8, 2026', readTime: '5 min', slug: 'staff-scheduling-best-practices' },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-16 px-6 md:pt-40 md:pb-20">
        <div className="max-w-[768px] mx-auto">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            Blog
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>Blog</h1>
          <p className="reveal reveal-delay-2 text-lg" style={{ color: 'var(--text-secondary)' }}>
            Restaurant management tips, technology insights, and NexaROS updates.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-[768px] mx-auto">
          <div className="space-y-0">
            {posts.map((post, i) => (
              <article key={post.title} className={`reveal reveal-delay-${Math.min(i + 1, 4)}`} style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="py-6">
                  <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    <Link href={`/blog/${post.slug}`} className="transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime} read</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
