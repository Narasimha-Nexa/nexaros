import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Restaurant management tips, technology insights, and NexaROS updates.',
};

const posts = [
  { title: 'Why Offline-First is Critical for Restaurants', excerpt: 'Internet downtime shouldn\'t mean business downtime. Learn why an offline-first architecture is essential for modern restaurants.', date: 'Jul 10, 2026', readTime: '5 min' },
  { title: 'Complete Guide to GST Invoicing for Restaurants', excerpt: 'Everything you need to know about GST invoicing, tax rates, and compliance for Indian restaurants.', date: 'Jul 5, 2026', readTime: '8 min' },
  { title: 'How QR Ordering Can Increase Your Revenue', excerpt: 'QR code ordering is transforming the dining experience. See how restaurants are increasing order values by 20%+.', date: 'Jun 28, 2026', readTime: '4 min' },
  { title: 'The Ultimate Restaurant Tech Stack (2026)', excerpt: 'From POS to inventory management, here\'s the complete tech stack every restaurant needs in 2026.', date: 'Jun 20, 2026', readTime: '10 min' },
  { title: 'Managing Multi-Branch Restaurants Efficiently', excerpt: 'Tips and tools for restaurant owners managing multiple locations without the headache.', date: 'Jun 15, 2026', readTime: '6 min' },
  { title: 'Staff Scheduling Best Practices', excerpt: 'Optimize your staff schedules with these proven strategies and reduce labor costs.', date: 'Jun 8, 2026', readTime: '5 min' },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-900">NexaROS</span>
          </a>
          <a href="/" className="text-sm text-gray-600 hover:text-gray-900">Back to Home</a>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-gray-500 mb-12">Restaurant management tips, technology insights, and NexaROS updates.</p>
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.title} className="border-b border-gray-100 pb-8 last:border-0">
              <h2 className="text-xl font-semibold mb-2 hover:text-blue-600 cursor-pointer">{post.title}</h2>
              <p className="text-gray-500 mb-3">{post.excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime} read</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white font-semibold mb-2">NexaROS</p>
          <p className="text-sm">AI-Powered Restaurant Operating System</p>
        </div>
      </footer>
    </div>
  );
}
