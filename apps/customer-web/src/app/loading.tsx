export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Hero shimmer */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="max-w-4xl mx-auto px-4 py-20 sm:py-28">
          <div className="flex justify-center mb-6">
            <div className="h-6 w-64 bg-white/20 rounded-full" />
          </div>
          <div className="h-12 w-96 bg-white/20 rounded-xl mx-auto mb-4" />
          <div className="h-12 w-80 bg-white/20 rounded-xl mx-auto mb-6" />
          <div className="h-6 w-72 bg-white/20 rounded-xl mx-auto mb-8" />
          <div className="max-w-md mx-auto">
            <div className="h-14 bg-white/20 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Content shimmer */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-8 w-48 bg-gray-200 rounded-xl mx-auto mb-12" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center p-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="w-10 h-10 bg-blue-100 rounded-full mx-auto mb-3" />
              <div className="h-5 w-24 bg-gray-200 rounded mx-auto mb-2" />
              <div className="h-4 w-40 bg-gray-200 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* CTA shimmer */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-64 bg-gray-200 rounded-3xl" />
        </div>
      </div>

      {/* Footer shimmer */}
      <div className="bg-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="h-5 w-32 bg-gray-300 rounded mx-auto mb-2" />
          <div className="h-4 w-64 bg-gray-300 rounded mx-auto" />
        </div>
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}
