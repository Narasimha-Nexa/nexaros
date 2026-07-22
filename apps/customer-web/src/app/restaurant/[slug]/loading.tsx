export default function RestaurantLoading() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="animate-pulse">
        {/* Hero skeleton */}
        <div className="h-[400px] bg-surface-alt" />

        {/* Content skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="h-8 bg-surface-alt rounded w-48" />
          <div className="h-4 bg-surface-alt rounded w-96" />

          {/* Menu sections skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-surface-alt rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
