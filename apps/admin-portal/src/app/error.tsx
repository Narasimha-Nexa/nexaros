'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin portal error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-primary-muted flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-body-lg font-sans font-semibold text-ink mb-2">
          Something went wrong
        </h1>
        <p className="text-body-sm text-body mb-2">
          An unexpected error occurred in the admin portal.
        </p>
        {error.message && (
          <p className="text-caption font-mono text-muted bg-canvas-soft p-3 mb-6 break-all">
            {error.message}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="btn btn-primary"
          >
            Try Again
          </button>
          <a href="/login" className="btn btn-outline">
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
}
