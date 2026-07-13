'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [slug, setSlug] = useState('');
  const router = useRouter();

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && slug.trim()) {
      router.push(`/restaurant/${slug.trim()}`);
    }
  }, [slug, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-sm text-blue-100 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Order online from your favorite restaurants
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight mb-4">
            Delicious Food
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Delivered to You
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100/80 max-w-xl mx-auto mb-8">
            Browse menus, place orders, and enjoy restaurant-quality meals from the comfort of your home.
          </p>

          {/* Restaurant search */}
          <div className="max-w-md mx-auto">
            <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-2">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter restaurant name..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/20 text-white placeholder-blue-200 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              <Link
                href={slug ? `/restaurant/${slug}` : '#'}
                className={`px-6 py-2.5 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-300 transition-all flex items-center gap-1.5 ${
                  !slug ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                Order
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <p className="text-xs text-blue-200/60 mt-2">e.g., &quot;my-restaurant&quot; or the restaurant&apos;s unique slug</p>
          </div>
        </div>
      </header>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-12">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: '1', icon: '📱', title: 'Browse Menu', desc: 'View the full menu with photos, descriptions, and prices.' },
            { step: '2', icon: '🛒', title: 'Add to Cart', desc: 'Select your items, customize, and add them to your cart.' },
            { step: '3', icon: '🎉', title: 'Enjoy', desc: 'Place your order and track it in real-time until it arrives.' },
          ].map((item) => (
            <div key={item.step} className="text-center p-6">
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QR Scanner CTA */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 sm:p-12 text-white">
            <div className="text-5xl mb-4">📷</div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Dine-In? Scan & Order</h2>
            <p className="text-blue-100/80 max-w-lg mx-auto mb-6">
              Scan the QR code on your table to browse the menu and order directly from your phone.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Find a Table QR Code
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-lg font-semibold text-white mb-2">NexaROS</p>
          <p className="text-sm">Restaurant Operating System — Powering digital dining experiences.</p>
          <div className="mt-4 text-xs">
            &copy; {new Date().getFullYear()} NexaROS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
