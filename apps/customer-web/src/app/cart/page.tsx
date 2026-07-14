'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, ArrowRight, Tag } from 'lucide-react';
import { Button, Card, EmptyState, VegIndicator } from '@/components/ui';
import { cn, formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getItemCount, getSubtotal, getDeliveryCharge, getTotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState icon="🛒" title="Your cart is empty" description="Looks like you haven't added any items yet" action={<Link href="/menu"><Button>Browse Menu <ArrowRight size={16} /></Button></Link>} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">Shopping Cart</h1>
          <p className="text-body text-sm mt-1">{getItemCount()} items in your cart</p>
        </div>
        <Button variant="ghost" size="sm" className="text-danger" onClick={clearCart}>
          <Trash2 size={16} /> Clear All
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="flex gap-4 p-4">
              {item.menuItem.image && (
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-hairline relative">
                  <Image src={item.menuItem.image} alt={item.menuItem.name} fill className="object-cover" sizes="80px" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <VegIndicator isVeg={item.menuItem.isVeg} />
                    <h3 className="font-semibold text-ink text-sm">{item.menuItem.name}</h3>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-1 text-body hover:text-danger transition-colors" aria-label="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>
                {item.variant && <p className="text-xs text-body mt-0.5">{item.variant.name}</p>}
                {item.addOns.length > 0 && <p className="text-xs text-body mt-0.5">+ {item.addOns.map((ao) => ao.name).join(', ')}</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="w-7 h-7 rounded-md bg-hairline flex items-center justify-center text-body hover:text-ink transition-colors" aria-label="Decrease"><Minus size={14} /></button>
                    <span className="text-sm font-semibold w-7 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-md bg-hairline flex items-center justify-center text-body hover:text-ink transition-colors" aria-label="Increase"><Plus size={14} /></button>
                  </div>
                  <span className="font-bold text-ink">{formatPrice(item.totalPrice)}</span>
                </div>
              </div>
            </Card>
          ))}

          <Link href="/menu" className="inline-flex items-center gap-1 text-sm text-link hover:underline mt-4">
            <ArrowLeft size={16} /> Continue Shopping
          </Link>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-24">
            <h2 className="font-semibold text-ink mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-body"><span>Subtotal</span><span>{formatPrice(getSubtotal())}</span></div>
              <div className="flex justify-between text-body"><span>Delivery</span><span>{getSubtotal() > 500 ? 'Free' : formatPrice(getDeliveryCharge())}</span></div>
            </div>
            <hr className="my-3 border-hairline" />
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Total</span>
              <span>{formatPrice(getTotal())}</span>
            </div>
            <Link href="/checkout">
              <Button className="w-full h-12 text-base gap-2">Proceed to Checkout <ArrowRight size={18} /></Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
