'use client';

import { useState } from 'react';
import type { MenuCategory, MenuItem } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_HOST = API_BASE_URL.replace(/\/api\/?$/, '');

interface MenuDisplayProps {
  categories: MenuCategory[];
  tenantName: string;
  currency: string;
  onAddToCart: (item: MenuItem, quantity: number) => void;
}

export default function MenuDisplay({ categories, tenantName, currency, onAddToCart }: MenuDisplayProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const activeItems = categories.find((c) => c.id === activeCategory)?.items || [];

  const handleQtyChange = (itemId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [itemId]: next };
    });
  };

  const handleAddToCart = (item: MenuItem) => {
    const qty = quantities[item.id] || 1;
    onAddToCart(item, qty);
    setQuantities((prev) => ({ ...prev, [item.id]: 0 }));
  };

  const formatPrice = (price: number) => `${currency === 'INR' ? '₹' : '$'}${price.toFixed(0)}`;

  return (
    <div>
      {/* Category tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex overflow-x-auto gap-1 p-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
              <span className="ml-1.5 text-xs opacity-70">({cat.items.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      <div className="p-4 space-y-3">
        {activeItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No items in this category</p>
          </div>
        ) : (
          activeItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 transition-all hover:shadow-md"
            >
              {/* Item image */}
              {item.image && (
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                  <img
                    src={item.image.startsWith('http') ? item.image : `${API_HOST}${item.image}`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Item details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <span className={item.isVeg ? 'veg-dot mt-1' : 'nonveg-dot mt-1'} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base">{item.name}</h3>
                    {item.description && (
                      <p className={`text-sm text-gray-500 mt-0.5 ${
                        !expandedDescriptions[item.id] && item.description.length > 80 ? 'line-clamp-2' : ''
                      }`}>
                        {item.description}
                      </p>
                    )}
                    {item.description && item.description.length > 80 && (
                      <button
                        onClick={() => setExpandedDescriptions((p) => ({ ...p, [item.id]: !p[item.id] }))}
                        className="text-xs text-blue-600 mt-0.5"
                      >
                        {expandedDescriptions[item.id] ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Variants */}
                {item.variants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.variants.map((v) => (
                      <span key={v.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {v.name}: {formatPrice(v.price)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price and add to cart */}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-blue-600">{formatPrice(item.price)}</span>
                  <div className="flex items-center gap-2">
                    {quantities[item.id] > 0 && (
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                        <button
                          onClick={() => handleQtyChange(item.id, -1)}
                          className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-semibold">{quantities[item.id]}</span>
                        <button
                          onClick={() => handleQtyChange(item.id, 1)}
                          className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold hover:bg-blue-700"
                        >
                          +
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
                    >
                      {(quantities[item.id] || 0) > 0 ? `Add ${quantities[item.id]}` : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
