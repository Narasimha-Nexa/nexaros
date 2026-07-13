'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">😵</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Something went wrong</h1>
        <p className="text-gray-500 mb-2">
          We encountered an unexpected error while loading this page.
        </p>
        <p className="text-sm text-gray-400 mb-8 font-mono bg-gray-100 rounded-lg p-3 break-all">
          {error.message || 'Unknown error'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
