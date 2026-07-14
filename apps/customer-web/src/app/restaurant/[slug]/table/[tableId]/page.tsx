'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTenantMenu, scanTableQr, createOrder } from '@/lib/api';
import type { TenantInfo, MenuCategory, MenuItem } from '@/types';
import MenuDisplay from '@/components/MenuDisplay';

interface CartItem { item: MenuItem; quantity: number; }

export default function TableOrderPage() {
  const params = useParams();
  const slug = params.slug as string;
  const tableId = params.tableId as string;

  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tableInfo, setTableInfo] = useState<{ number: number; branchId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState<{ id: string; orderNumber: number } | null>(null);

  useEffect(() => {
    if (!slug || !tableId) return;
    setLoading(true);
    Promise.all([
      getTenantMenu(slug),
      scanTableQr(tableId).catch(() => null),
    ])
      .then(([menu, table]) => {
        setTenant(menu.tenant);
        setCategories(menu.categories);
        if (table) setTableInfo({ number: table.tableNumber, branchId: table.branchId });
      })
      .catch(() => setError('Could not load restaurant data'))
      .finally(() => setLoading(false));
  }, [slug, tableId]);

  const handleAddToCart = (item: MenuItem, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) return prev.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + quantity } : c);
      return [...prev, { item, quantity }];
    });
    setShowCart(true);
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !tableInfo) return;
    setPlacing(true);
    try {
      const result = await createOrder({
        branchId: tableInfo.branchId,
        tableId: tableId,
        type: 'QR_ORDER',
        customerName: customerName || undefined,
        customerPhone: phone || undefined,
        items: cart.map((c) => ({ menuItemId: c.item.id, name: c.item.name, quantity: c.quantity, unitPrice: c.item.price })),
      });
      setOrderResult({ id: result.id, orderNumber: result.orderNumber });
      setCart([]);
      setShowCart(false);
    } catch (e: any) {
      alert('Order failed: ' + e.message);
    }
    setPlacing(false);
  };

  // Loading, Error, Order confirmed states...
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen p-8 text-center"><h1 className="text-2xl font-bold text-gray-800">Error loading menu</h1></div>;
  if (orderResult) return <div className="flex items-center justify-center min-h-screen p-4 text-center">
    <div><div className="text-6xl mb-4">✅</div><h1 className="text-2xl font-bold mb-2">Order Placed!</h1><p className="text-lg text-gray-600 mb-1">Order #{orderResult.orderNumber}</p><a href={`/${slug}/order/${orderResult.id}`} className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Track Order</a></div>
  </div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with table info */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 rounded-lg p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
            <div>
              <h1 className="text-xl font-bold">{tenant?.name}</h1>
              <p className="text-blue-100 text-sm">Table {tableInfo?.number} &middot; Scan & Order</p>
            </div>
          </div>
        </div>
      </div>

      <MenuDisplay categories={categories} tenantName={tenant?.name || ''} currency={tenant?.currency || 'INR'} onAddToCart={handleAddToCart} />

      {/* Cart bar */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="font-bold text-lg">{cartCount} items &middot; ₹{cartTotal.toFixed(0)}</span>
            <button onClick={() => setShowCart(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">View Cart</button>
          </div>
        </div>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="p-1 hover:bg-gray-100 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? <p className="text-center text-gray-400 py-8">Cart is empty</p> : cart.map((ci) => (
                <div key={ci.item.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div>
                    <div className="flex items-center gap-2"><span className={ci.item.isVeg ? 'veg-dot' : 'nonveg-dot'} /><span className="font-medium text-sm">{ci.item.name}</span></div>
                    <p className="text-sm text-blue-600 font-semibold mt-1">₹{(ci.item.price * ci.quantity).toFixed(0)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCart((p) => p.map((c) => c.item.id === ci.item.id ? { ...c, quantity: Math.max(0, c.quantity - 1) } : c).filter((c) => c.quantity > 0))} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">-</button>
                    <span className="w-8 text-center font-semibold">{ci.quantity}</span>
                    <button onClick={() => setCart((p) => p.map((c) => c.item.id === ci.item.id ? { ...c, quantity: c.quantity + 1 } : c))} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700">+</button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="border-t p-4 space-y-3">
                <input type="text" placeholder="Your name (optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex justify-between"><span className="font-bold text-lg">Total</span><span className="font-bold text-xl text-blue-600">₹{cartTotal.toFixed(0)}</span></div>
                <button onClick={handlePlaceOrder} disabled={placing} className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 disabled:opacity-50">{placing ? 'Placing...' : 'Place Order'}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
