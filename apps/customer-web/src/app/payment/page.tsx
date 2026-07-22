'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Wallet, Building2, Shield, ChevronLeft, AlertCircle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { cn, formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';

export default function PaymentPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { getTotal } = useCartStore();

  useEffect(() => {
    if (getTotal() <= 0) {
      router.push('/checkout');
    }
  }, [getTotal, router]);

  const methods = [
    { id: 'card' as const, label: 'Credit/Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
    { id: 'upi' as const, label: 'UPI', icon: Wallet, desc: 'Google Pay, PhonePe, Paytm' },
    { id: 'netbanking' as const, label: 'Net Banking', icon: Building2, desc: 'All major banks' },
    { id: 'wallet' as const, label: 'Wallet', icon: CreditCard, desc: 'Paytm, Mobikwik, Freecharge' },
  ];

  const razorpayRef = useRef<{ loadScript: typeof import('@/lib/razorpay').loadRazorpayScript; openCheckout: typeof import('@/lib/razorpay').openRazorpayCheckout } | null>(null);

  const loadRazorpay = useCallback(async () => {
    if (!razorpayRef.current) {
      const mod = await import('@/lib/razorpay');
      razorpayRef.current = { loadScript: mod.loadRazorpayScript, openCheckout: mod.openRazorpayCheckout };
      await mod.loadRazorpayScript();
    }
    return razorpayRef.current;
  }, []);

  const handlePayment = async () => {
    setProcessing(true);
    setPaymentError(null);
    try {
      const razorpay = await loadRazorpay();
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const orderRes = await fetch(`${API_BASE}/billing/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: getTotal(), receipt: 'order-payment' }),
      });

      if (!orderRes.ok) throw new Error('Failed to create payment order');
      const { orderId } = await orderRes.json();

      const response = await razorpay.openCheckout({
        amount: getTotal(),
        name: 'NexaROS',
        description: 'Order Payment',
        orderId,
        theme: { color: '#2563eb' },
      });

      if (response) {
        router.push('/order-success?payment=success');
      }
    } catch (e: any) {
      console.error('Payment failed:', e);
      setPaymentError(e.message || 'An unexpected error occurred');
    }
    setProcessing(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
      <Link href="/checkout" className="inline-flex items-center gap-1 text-sm text-body hover:text-ink mb-6"><ChevronLeft size={16} /> Back to Checkout</Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-6">Payment</h1>

      <div className="space-y-3 mb-6">
        {methods.map((m) => (
          <button key={m.id} onClick={() => setMethod(m.id)} className={cn('w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left', method === m.id ? 'border-ink bg-ink/5' : 'border-hairline')}>
            <m.icon size={24} className={method === m.id ? 'text-ink' : 'text-body'} />
            <div className="flex-1"><p className="font-medium text-ink text-sm">{m.label}</p><p className="text-xs text-body">{m.desc}</p></div>
            <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center', method === m.id ? 'border-ink' : 'border-hairline')}>
              {method === m.id && <div className="w-2.5 h-2.5 rounded-full bg-ink" />}
            </div>
          </button>
        ))}
      </div>

      {method === 'card' && (
        <Card className="space-y-4">
          <input type="text" placeholder="Card Number" className="w-full px-4 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:border-ink/30" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="MM/YY" className="px-4 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:border-ink/30" />
            <input type="text" placeholder="CVV" className="px-4 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:border-ink/30" />
          </div>
          <input type="text" placeholder="Cardholder Name" className="w-full px-4 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:border-ink/30" />
        </Card>
      )}

      {method === 'upi' && (
        <Card>
          <input type="text" placeholder="Enter your UPI ID (e.g., name@upi)" className="w-full px-4 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:border-ink/30" />
        </Card>
      )}

      {paymentError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 mb-4">
          <AlertCircle size={20} className="text-danger mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-danger">Payment Failed</p>
            <p className="text-xs text-danger/80 mt-1">{paymentError}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-body mt-4 mb-6">
        <Shield size={14} className="text-success" /> Secure payment powered by Razorpay. Your data is encrypted.
      </div>

      <Button className="w-full h-12 text-base" onClick={handlePayment} loading={processing} disabled={processing}>
        {processing ? 'Processing...' : `Pay ${formatPrice(getTotal())}`}
      </Button>
    </div>
  );
}
