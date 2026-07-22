export default function CheckoutLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-surface-alt rounded w-24" />
        <div className="h-8 bg-surface-alt rounded w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface-alt rounded-xl" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-40 bg-surface-alt rounded-xl" />
            <div className="h-12 bg-surface-alt rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
