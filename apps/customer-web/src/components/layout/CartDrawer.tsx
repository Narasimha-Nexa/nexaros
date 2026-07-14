'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Trash2, Minus, Plus, ArrowRight } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';
import { useUIStore } from '@/lib/store/ui-store';
import { Button, EmptyState, VegIndicator } from '@/components/ui';

export function CartDrawer() {
  const { isCartOpen, closeCart } = useUIStore();
  const { items, removeItem, updateQuantity, clearCart, getItemCount, getSubtotal, getTotal, orderType, setOrderType } = useCartStore();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCart = () => {
    setIsClearing(true);
    setTimeout(() => {
      clearCart();
      setIsClearing(false);
    }, 300);
  };

  return (
    <>
      {/* Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-[70] bg-white dark:bg-ink shadow-2xl flex flex-col transition-transform duration-300',
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <h2 className="font-semibold text-lg">Your Cart</h2>
            <span className="text-sm text-body">({getItemCount()} items)</span>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                disabled={isClearing}
                className="text-xs text-danger hover:text-danger/80 transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} />
                Clear
              </button>
            )}
            <button onClick={closeCart} className="p-1 hover:bg-hairline rounded-lg transition-colors" aria-label="Close cart">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Order type selector */}
        {items.length > 0 && (
          <div className="px-5 py-3 border-b border-hairline">
            <div className="flex gap-1.5 bg-hairline rounded-xl p-1">
              {(['DELIVERY', 'TAKEAWAY', 'DINE_IN'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                    orderType === type
                      ? 'bg-white dark:bg-ink shadow-sm text-ink'
                      : 'text-body hover:text-ink'
                  )}
                >
                  {type === 'DINE_IN' ? 'Dine In' : type === 'TAKEAWAY' ? 'Pickup' : 'Delivery'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <EmptyState
              icon="🛒"
              title="Your cart is empty"
              description="Looks like you haven't added anything to your cart yet. Browse our menu to find something delicious!"
              action={
                <Link href="/menu" onClick={closeCart}>
                  <Button variant="primary">Browse Menu</Button>
                </Link>
              }
            />
          ) : (
            <div className="p-5 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-gray-50 dark:bg-ink-light rounded-xl p-3 group"
                >
                  {item.menuItem.image && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-hairline relative">
                      <Image
                        src={item.menuItem.image}
                        alt={item.menuItem.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <VegIndicator isVeg={item.menuItem.isVeg} />
                        <h4 className="font-medium text-sm text-ink truncate">{item.menuItem.name}</h4>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-body hover:text-danger transition-all"
                        aria-label="Remove item"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {item.variant && (
                      <p className="text-xs text-body mt-0.5">{item.variant.name}</p>
                    )}
                    {item.addOns.length > 0 && (
                      <p className="text-xs text-body mt-0.5">
                        + {item.addOns.map((ao) => ao.name).join(', ')}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 rounded-md bg-white dark:bg-ink flex items-center justify-center text-body hover:text-ink disabled:opacity-30 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-md bg-white dark:bg-ink flex items-center justify-center text-body hover:text-ink transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-ink">{formatPrice(item.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-hairline p-5 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-body">
                <span>Subtotal</span>
                <span>{formatPrice(getSubtotal())}</span>
              </div>
              <div className="flex justify-between text-body">
                <span>Delivery</span>
                <span>{getSubtotal() > 500 ? 'Free' : '₹40'}</span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(getSubtotal())}</span>
            </div>
            <Link href="/checkout" onClick={closeCart}>
              <Button className="w-full h-12 text-base">
                Checkout
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
