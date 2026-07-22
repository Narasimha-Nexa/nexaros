export default function PaymentLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-surface-alt rounded w-24" />
        <div className="h-8 bg-surface-alt rounded w-40" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-surface-alt rounded-xl" />
          ))}
        </div>
        <div className="h-40 bg-surface-alt rounded-xl mt-4" />
        <div className="h-12 bg-surface-alt rounded-xl mt-4" />
      </div>
    </div>
  );
}
