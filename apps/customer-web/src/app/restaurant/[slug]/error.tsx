'use client';

export default function RestaurantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🍽️</div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-3">We hit a snag</h1>
        <p className="text-neutral-500 mb-2">
          We couldn&apos;t load this restaurant right now. Please try again.
        </p>
        <p className="text-sm text-neutral-400 mb-8 font-mono bg-neutral-100 rounded-lg p-3 break-all">
          {error.message || 'Unknown error'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
