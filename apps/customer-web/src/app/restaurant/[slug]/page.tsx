'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getTenantMenu, createOrder } from '@/lib/api';
import type { TenantInfo, MenuCategory, MenuItem } from '@/types';
import MenuDisplay from '@/components/MenuDisplay';

interface CartItem {
  item: MenuItem;
  quantity: number;
}

export default function RestaurantPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [defaultBranch, setDefaultBranch] = useState<{ id: string; name: string } | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState<{ id: string; orderNumber: number } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getTenantMenu(slug)
      .then((data) => {
        setTenant(data.tenant);
        setDefaultBranch(data.defaultBranch);
        setCategories(data.categories);
      })
      .catch(() => setError('Restaurant not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = useCallback((item: MenuItem, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + quantity } : c
        );
      }
      return [...prev, { item, quantity }];
    });
    setShowCart(true);
  }, []);

  const updateCartQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const result = await createOrder({
        branchId: defaultBranch?.id || '',
        type: orderType,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        items: cart.map((c) => ({
          menuItemId: c.item.id,
          name: c.item.name,
          quantity: c.quantity,
          unitPrice: c.item.price,
        })),
      });
      setOrderResult({ id: result.id, orderNumber: result.orderNumber });
      setCart([]);
      setShowCart(false);
    } catch (e: any) {
      alert('Failed to place order: ' + e.message);
    }
    setPlacing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Restaurant Not Found</h1>
          <p className="text-gray-500">The restaurant you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  // Order confirmed view
  if (orderResult) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h1>
          <p className="text-lg text-gray-600 mb-1">Order #{orderResult.orderNumber}</p>
          <p className="text-gray-500 mb-6">Your order has been sent to the kitchen.</p>
          <a
            href={`/${slug}/order/${orderResult.id}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Track Order
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {tenant?.logo && (
              <Image src={tenant.logo} alt={tenant.name} width={48} height={48} className="rounded-full object-cover" />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{tenant?.name || 'Restaurant'}</h1>
              {tenant?.address && <p className="text-sm text-gray-500">{tenant.address}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Menu display */}
      <div className="max-w-4xl mx-auto pb-24">
        <MenuDisplay
          categories={categories}
          tenantName={tenant?.name || ''}
          currency={tenant?.currency || 'INR'}
          onAddToCart={handleAddToCart}
        />
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <span className="font-bold text-lg">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
              <span className="ml-3 text-blue-600 font-bold">₹{cartTotal.toFixed(0)}</span>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              View Cart
            </button>
          </div>
        </div>
      )}

      {/* Cart drawer/modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Cart is empty</p>
              ) : (
                cart.map((cartItem) => (
                  <div key={cartItem.item.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cartItem.item.isVeg ? 'veg-dot' : 'nonveg-dot'} />
                        <span className="font-medium text-sm">{cartItem.item.name}</span>
                      </div>
                      <p className="text-sm text-blue-600 font-semibold mt-1">
                        ₹{(cartItem.item.price * cartItem.quantity).toFixed(0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQty(cartItem.item.id, -1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold">{cartItem.quantity}</span>
                      <button
                        onClick={() => updateCartQty(cartItem.item.id, 1)}
                        className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer info + place order */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                <div className="flex gap-2">
                  {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setOrderType(type)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        orderType === type
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {type === 'DINE_IN' ? 'Dine In' : type === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-xl text-blue-600">₹{cartTotal.toFixed(0)}</span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {placing ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
