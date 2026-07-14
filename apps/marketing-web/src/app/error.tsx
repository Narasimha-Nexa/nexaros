'use client';

import Link from 'next/link';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>An unexpected error occurred. Please try again.</p>
        <div className="flex gap-4 justify-center">
          <button onClick={reset} className="px-6 py-3 rounded-[16px] font-medium text-white transition-all" style={{ background: 'var(--accent)' }}>
            Try Again
          </button>
          <Link href="/" className="px-6 py-3 rounded-[16px] font-medium transition-all" style={{ border: '2px solid var(--border)', color: 'var(--text-primary)' }}>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
