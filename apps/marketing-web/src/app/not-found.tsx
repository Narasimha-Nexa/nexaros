import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-[120px] md:text-[160px] font-extrabold leading-none" style={{ color: 'var(--border)' }}>404</h1>
        <h2 className="text-2xl font-bold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>Page Not Found</h2>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="px-6 py-3 rounded-[16px] font-medium text-white transition-all hover:-translate-y-0.5" style={{ background: 'var(--accent)' }}>
            Go Home
          </Link>
          <Link href="/contact" className="px-6 py-3 rounded-[16px] font-medium transition-all" style={{ border: '2px solid var(--border)', color: 'var(--text-primary)' }}>
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
