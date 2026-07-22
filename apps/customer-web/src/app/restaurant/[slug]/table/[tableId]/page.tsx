'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getTenantMenu, diningApi } from '@/lib/api';
import { useDiningStore } from '@/lib/store/dining-store';
import type { TenantInfo, MenuCategory, MenuItem } from '@/types';
import MenuDisplay from '@/components/MenuDisplay';

function generateGuestToken(): string {
  return `gst_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateDeviceId(): string {
  let id = localStorage.getItem('nexaros_device_id');
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('nexaros_device_id', id);
  }
  return id;
}

const AVATAR_COLORS = ['#E23744', '#16A34A', '#D97706', '#7C3AED', '#0891B2', '#DC2626', '#2563EB'];

type View = 'loading' | 'join' | 'menu' | 'cart' | 'bill' | 'payment' | 'confirmed' | 'error';

export default function TableOrderPage() {
  const params = useParams();
  const slug = params.slug as string;
  const tableId = params.tableId as string;

  const store = useDiningStore();
  const [view, setView] = useState<View>('loading');
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tableNumber, setTableNumber] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [guestNameInput, setGuestNameInput] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState<{ id: string; orderNumber: number } | null>(null);
  const activityRef = useRef<NodeJS.Timeout | null>(null);

  const initializeSession = useCallback(async () => {
    try {
      const [menuData, qrData] = await Promise.all([
        getTenantMenu(slug),
        diningApi.scanQr(tableId),
      ]);

      setTenant(menuData.tenant);
      setCategories(menuData.categories);
      setTableNumber(qrData.tableNumber);

      store.setSession({
        sessionId: qrData.activeSession?.id || '',
        sessionCode: qrData.activeSession?.sessionCode || '',
        tableId: qrData.tableId,
        tableNumber: qrData.tableNumber,
        branchId: qrData.branchId,
        status: qrData.activeSession?.status || 'ACTIVE',
        guests: qrData.activeSession?.guestSessions || [],
      });

      const savedToken = store.guestToken;
      if (savedToken) {
        try {
          const guestData = await diningApi.getGuestSession(savedToken);
          store.setGuest({
            guestSessionId: guestData.id,
            guestToken: guestData.guestToken,
            guestName: guestData.guestName,
            guestNumber: guestData.guestNumber,
            avatarColor: guestData.avatarColor,
          });
          store.setSession({
            ...store,
            sessionId: guestData.diningSession.id,
            sessionCode: guestData.diningSession.sessionCode,
            tableId: guestData.diningSession.table.id,
            tableNumber: guestData.diningSession.table.number,
            branchId: guestData.diningSession.branchId,
            status: guestData.diningSession.status,
            guests: guestData.diningSession.guestSessions || [],
          });
          setView('menu');
          return;
        } catch {
          store.reset();
        }
      }

      setView('join');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not load restaurant');
      setView('error');
    }
  }, [slug, tableId]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    if (store.guestToken && view === 'menu') {
      activityRef.current = setInterval(() => {
        diningApi.touchActivity(store.guestToken!).catch(() => {});
      }, 30000);
    }
    return () => { if (activityRef.current) clearInterval(activityRef.current); };
  }, [store.guestToken, view]);

  const handleJoin = async () => {
    if (!store.sessionId) return;
    const token = store.guestToken || generateGuestToken();
    const deviceId = generateDeviceId();
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    try {
      const result = await diningApi.joinSession(store.sessionId, {
        guestToken: token,
        guestName: guestNameInput || undefined,
        avatarColor: color,
        deviceFingerprint: deviceId,
      });

      store.setGuest({
        guestSessionId: result.id,
        guestToken: result.guestToken,
        guestName: result.guestName,
        guestNumber: result.guestNumber,
        avatarColor: result.avatarColor,
      });
      setView('menu');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to join session');
    }
  };

  const handleAddToCart = async (item: MenuItem, quantity: number) => {
    if (!store.guestSessionId) return;
    try {
      const result = await diningApi.addToCart(store.guestSessionId, {
        menuItemId: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity,
      });
      store.setCart(result.items, result.subtotal);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add item');
    }
  };

  const handleUpdateCart = async (cartItemId: string, quantity: number) => {
    if (!store.guestSessionId) return;
    try {
      if (quantity <= 0) {
        await diningApi.removeFromCart(store.guestSessionId, cartItemId);
        store.removeCartItem(cartItemId);
      } else {
        const result = await diningApi.updateCartItem(store.guestSessionId, cartItemId, { quantity });
        store.setCart(result.items, result.subtotal);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update cart');
    }
  };

  const handlePlaceOrder = async () => {
    if (!store.guestSessionId || store.cart.length === 0) return;
    setPlacing(true);
    try {
      const result = await diningApi.placeOrder(store.guestSessionId);
      setOrderResult({ id: result.id, orderNumber: result.orderNumber });
      store.clearCart();
      store.setOrders([...store.orders, {
        id: result.id,
        orderNumber: result.orderNumber,
        status: result.status,
        totalAmount: Number(result.totalAmount),
        items: result.items,
      }]);
      setView('confirmed');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to place order');
    }
    setPlacing(false);
  };

  const handleViewBill = async () => {
    if (!store.sessionId) return;
    try {
      const bill = await diningApi.getBill(store.sessionId);
      store.setBill(bill.grandTotal, bill.grandTotal - bill.remaining || 0, bill.remaining || bill.grandTotal);
      setView('bill');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load bill');
    }
  };

  const handlePay = async (method: string) => {
    if (!store.sessionId || !store.guestSessionId) return;
    try {
      const allocation = store.billTotal / Math.max(store.guests.length, 1);
      await diningApi.payGuestShare(store.sessionId, {
        guestSessionId: store.guestSessionId,
        method,
        amount: allocation,
      });
      setView('confirmed');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Payment failed');
    }
  };

  if (view === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading table...</p>
        </div>
      </div>
    );
  }

  if (view === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h1>
          <p className="text-gray-500 mb-4">{errorMsg}</p>
          <button onClick={() => { setErrorMsg(''); setView('loading'); initializeSession(); }} className="px-4 py-2 bg-primary text-white rounded-lg">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-white/20 rounded-lg p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold">{tenant?.name || 'Restaurant'}</h1>
                <p className="text-white/80 text-sm">Table {tableNumber} · Join to order</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800">Join Table {tableNumber}</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your name to start ordering</p>
            </div>

            {store.guests.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Already at this table</p>
                <div className="space-y-2">
                  {store.guests.map((g: any) => (
                    <div key={g.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: g.avatarColor || '#666' }}>
                        {g.guestName?.[0] || g.guestNumber}
                      </div>
                      <span className="text-sm text-gray-700">{g.guestName || `Guest ${g.guestNumber}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              <button
                onClick={handleJoin}
                className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                {guestNameInput ? `Join as ${guestNameInput}` : 'Join Anonymously'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'confirmed' && orderResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-1">Order Placed!</h1>
          <p className="text-gray-500 mb-1">Order #{orderResult.orderNumber}</p>
          <p className="text-sm text-gray-400 mb-6">Table {tableNumber} · Sent to kitchen</p>
          <div className="space-y-2">
            <a href={`/${slug}/order/${orderResult.id}`} className="block w-full py-3 bg-primary text-white rounded-xl font-medium text-center">
              Track Order
            </a>
            <button onClick={() => { setOrderResult(null); setView('menu'); }} className="block w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium">
              Continue Ordering
            </button>
            <button onClick={handleViewBill} className="block w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium">
              View Bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-lg p-1.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">{tenant?.name}</p>
              <p className="text-[11px] text-white/70">Table {tableNumber} · {store.guestName || `Guest ${store.guestNumber || '?'}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {store.guests.length > 1 && (
              <div className="flex -space-x-2">
                {store.guests.slice(0, 4).map((g: any) => (
                  <div key={g.id} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: g.avatarColor || '#666' }}>
                    {g.guestName?.[0] || g.guestNumber}
                  </div>
                ))}
                {store.guests.length > 4 && <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-[10px] font-bold text-white">+{store.guests.length - 4}</div>}
              </div>
            )}
            <button onClick={handleViewBill} className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-medium hover:bg-white/30">
              Bill ₹{store.subtotal > 0 ? store.subtotal.toFixed(0) : '—'}
            </button>
          </div>
        </div>
      </div>

      {view === 'menu' && (
        <MenuDisplay categories={categories} tenantName={tenant?.name || ''} currency={tenant?.currency || 'INR'} onAddToCart={handleAddToCart} />
      )}

      {store.cartCount > 0 && view === 'menu' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-2xl z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <span className="font-bold text-lg">{store.cartCount} items</span>
              <span className="text-gray-400 mx-1">·</span>
              <span className="font-bold text-primary">₹{store.subtotal.toFixed(0)}</span>
            </div>
            <button onClick={() => setView('cart')} className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90">
              View Cart
            </button>
          </div>
        </div>
      )}

      {view === 'cart' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setView('menu')} />
          <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-bold">Your Order</h2>
                <p className="text-xs text-gray-400">Table {tableNumber} · {store.guestName || `Guest ${store.guestNumber}`}</p>
              </div>
              <button onClick={() => setView('menu')} className="p-1 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {store.cart.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Cart is empty</p>
              ) : store.cart.map((ci) => (
                <div key={ci.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className={ci.menuItem.isVeg ? 'w-3 h-3 border-2 border-green-600 rounded-sm' : 'w-3 h-3 border-2 border-red-600 rounded-sm rotate-45'} />
                    <div>
                      <p className="font-medium text-sm">{ci.name}</p>
                      <p className="text-xs text-primary font-semibold">₹{ci.totalPrice.toFixed(0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleUpdateCart(ci.id, ci.quantity - 1)} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 text-sm font-bold">−</button>
                    <span className="w-8 text-center font-semibold text-sm">{ci.quantity}</span>
                    <button onClick={() => handleUpdateCart(ci.id, ci.quantity + 1)} className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 text-sm font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>
            {store.cart.length > 0 && (
              <div className="border-t p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-xl text-primary">₹{store.subtotal.toFixed(0)}</span>
                </div>
                <button onClick={handlePlaceOrder} disabled={placing} className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 disabled:opacity-50">
                  {placing ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'bill' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setView('menu')} />
          <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Bill · Table {tableNumber}</h2>
              <button onClick={() => setView('menu')} className="p-1 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between mb-2"><span className="text-sm text-gray-500">Guests at table</span><span className="font-medium">{store.guests.length}</span></div>
                <div className="flex justify-between mb-2"><span className="text-sm text-gray-500">Your orders</span><span className="font-medium">{store.orders.length}</span></div>
                <div className="border-t mt-3 pt-3 flex justify-between">
                  <span className="font-bold">Your Total</span>
                  <span className="font-bold text-xl text-primary">₹{store.billTotal.toFixed(0)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Pay with</p>
                {['UPI', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD'].map((method) => (
                  <button key={method} onClick={() => handlePay(method)} className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <span className="text-sm font-medium">{method.replace('_', ' ')}</span>
                    <span className="text-sm text-primary font-semibold">Pay ₹{(store.billTotal / Math.max(store.guests.length, 1)).toFixed(0)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="fixed top-4 left-4 right-4 z-[100] bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 shadow-lg">
          <span className="text-red-500 text-sm flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600 text-lg">×</button>
        </div>
      )}
    </div>
  );
}
