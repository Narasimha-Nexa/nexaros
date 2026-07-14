'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Truck, Store, UtensilsCrossed, Calendar, ChevronRight, Plus } from 'lucide-react';
import { Button, Card, Badge, Input, EmptyState, Divider } from '@/components/ui';
import { cn, formatPrice, generateId } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { api } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, orderType, setOrderType, getSubtotal, getTotal, getDeliveryCharge, couponCode, couponDiscount, setCoupon, removeCoupon, instructions, setInstructions, tip, setTip, getTax, clearCart } = useCartStore();
  const { isAuthenticated, user, savedAddresses } = useAuthStore();
  const [selectedAddress, setSelectedAddress] = useState(savedAddresses[0]?.id || null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('online');
  const [gstNumber, setGstNumber] = useState('');

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const offer = await api.validateCoupon(couponInput);
      if (offer) {
        setCoupon(offer.code, offer.discountType === 'percentage' ? Math.min(getSubtotal() * offer.discountValue / 100, offer.maxDiscount) : offer.discountValue);
        setCouponInput('');
      } else {
        setCouponError('Invalid coupon code');
      }
    } catch {
      setCouponError('Failed to validate coupon');
    }
    setCouponLoading(false);
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      if (paymentMethod === 'online') {
        const { openRazorpayCheckout } = await import('@/lib/razorpay');
        const loaded = await import('@/lib/razorpay').then(m => m.loadRazorpayScript());
        if (!loaded) throw new Error('Failed to load payment gateway');

        const paymentResponse = await openRazorpayCheckout({
          amount: getTotal(),
          name: 'NexaROS',
          description: 'Order Payment',
          orderId: '',
          prefill: { name: customerName, email: customerEmail, contact: customerPhone },
          theme: { color: '#2563eb' },
        });

        if (!paymentResponse) {
          setPlacing(false);
          return;
        }
      }

      const order = await api.createOrder({
        items: items.map((i) => ({ menuItemId: i.menuItem.id, name: i.menuItem.name, quantity: i.quantity, unitPrice: i.unitPrice })),
        type: orderType,
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddressId: selectedAddress || undefined,
        instructions,
        couponCode: couponCode || undefined,
        tip,
      });

      const { useAuthStore } = await import('@/lib/store/auth-store');
      useAuthStore.getState().addOrder(order as any);
      clearCart();
      router.push(`/order-success?id=${order.id}&number=${order.orderNumber}`);
    } catch (e: any) {
      alert('Failed to place order: ' + e.message);
    }
    setPlacing(false);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState icon="🛒" title="Your cart is empty" description="Add items from our menu to get started" action={<Link href="/menu"><Button>Browse Menu</Button></Link>} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left - Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Type */}
          <Card>
            <h2 className="font-semibold text-ink mb-3">Order Type</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'DELIVERY' as const, icon: Truck, label: 'Delivery' },
                { type: 'TAKEAWAY' as const, icon: Store, label: 'Pickup' },
                { type: 'DINE_IN' as const, icon: UtensilsCrossed, label: 'Dine In' },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                    orderType === type ? 'border-ink bg-ink/5 text-ink' : 'border-hairline text-body hover:border-ink/30'
                  )}
                >
                  <Icon size={24} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Delivery Address */}
          {orderType === 'DELIVERY' && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-ink">Delivery Address</h2>
                <button className="text-xs text-link hover:underline flex items-center gap-1"><Plus size={14} /> Add New</button>
              </div>
              {savedAddresses.length > 0 ? (
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-xl border transition-all',
                        selectedAddress === addr.id ? 'border-ink bg-ink/5' : 'border-hairline'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={14} className="text-primary" />
                        <span className="font-medium text-sm text-ink">{addr.label}</span>
                        {addr.isDefault && <Badge variant="primary">Default</Badge>}
                      </div>
                      <p className="text-xs text-body pl-6">{addr.fullAddress}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-body">No saved addresses. Please add one.</p>
              )}
            </Card>
          )}

          {/* Schedule */}
          <Card>
            <h2 className="font-semibold text-ink mb-3">Schedule Order</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="px-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" placeholder="Date" />
              <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="px-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" placeholder="Time" />
            </div>
            <p className="text-xs text-body mt-2">Leave blank for ASAP delivery</p>
          </Card>

          {/* Contact */}
          <Card>
            <h2 className="font-semibold text-ink mb-3">Contact Information</h2>
            <div className="space-y-3">
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full Name *" className="w-full px-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" />
              <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone Number *" className="w-full px-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" />
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email (for order updates)" className="w-full px-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" />
              <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="GST Number (for invoice)" className="w-full px-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" />
            </div>
          </Card>

          {/* Instructions */}
          <Card>
            <h2 className="font-semibold text-ink mb-3">Instructions</h2>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder="Any special instructions for the restaurant?" className="w-full px-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30 resize-none" />
          </Card>

          {/* Payment */}
          <Card>
            <h2 className="font-semibold text-ink mb-3">Payment Method</h2>
            <div className="space-y-2">
              {[
                { id: 'online', label: 'Pay Online', desc: 'Credit/Debit Card, UPI, Net Banking' },
                { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive' },
              ].map(({ id, label, desc }) => (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id as any)}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-xl border transition-all',
                    paymentMethod === id ? 'border-ink bg-ink/5' : 'border-hairline'
                  )}
                >
                  <div className="text-left">
                    <span className="text-sm font-medium text-ink">{label}</span>
                    <p className="text-xs text-body">{desc}</p>
                  </div>
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center', paymentMethod === id ? 'border-ink' : 'border-hairline')}>
                    {paymentMethod === id && <div className="w-2.5 h-2.5 rounded-full bg-ink" />}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right - Order Summary */}
        <div className="space-y-4">
          <Card className="sticky top-24">
            <h2 className="font-semibold text-ink mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="text-ink font-medium">{item.quantity}x </span>
                    <span className="text-ink">{item.menuItem.name}</span>
                    {item.variant && <span className="text-body ml-1">({item.variant.name})</span>}
                  </div>
                  <span className="text-ink font-medium ml-2">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            {couponCode ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-success/10 text-success text-sm mb-3">
                <span>Code: {couponCode}</span>
                <button onClick={removeCoupon} className="text-danger text-xs hover:underline">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2 mb-3">
                <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Enter coupon code" className="flex-1 px-3 py-2 rounded-lg border border-hairline text-sm focus:outline-none focus:border-ink/30" />
                <Button size="sm" variant="outline" onClick={handleApplyCoupon} loading={couponLoading}>Apply</Button>
              </div>
            )}
            {couponError && <p className="text-xs text-danger mb-2">{couponError}</p>}

            <Divider />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-body"><span>Subtotal</span><span>{formatPrice(getSubtotal())}</span></div>
              <div className="flex justify-between text-body"><span>Delivery</span><span>{getSubtotal() > 500 ? 'Free' : formatPrice(getDeliveryCharge())}</span></div>
              {couponCode && <div className="flex justify-between text-success"><span>Discount</span><span>-{formatPrice(couponDiscount)}</span></div>}
              <div className="flex justify-between text-body"><span>Tax (5%)</span><span>{formatPrice(getTax())}</span></div>
              <div className="flex items-center justify-between text-body">
                <span>Tip</span>
                <div className="flex gap-1">
                  {[0, 20, 50, 100].map((t) => (
                    <button key={t} onClick={() => setTip(t)} className={cn('px-2 py-1 rounded text-xs font-medium transition-colors', tip === t ? 'bg-ink text-white' : 'bg-hairline text-body')}>₹{t}</button>
                  ))}
                </div>
              </div>
            </div>

            <Divider className="my-3" />

            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Total</span>
              <span>{formatPrice(getTotal())}</span>
            </div>

            <Button onClick={handlePlaceOrder} className="w-full h-12 text-base" loading={placing} disabled={!customerName || !customerPhone}>
              Place Order · {formatPrice(getTotal())}
            </Button>
            <p className="text-xs text-body text-center">By placing this order, you agree to our Terms of Service</p>
          </Card>

          <Link href="/cart" className="block text-center text-sm text-link hover:underline">
            Edit Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
