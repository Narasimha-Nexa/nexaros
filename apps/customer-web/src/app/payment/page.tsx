'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Wallet, Building2, Shield, ChevronLeft } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { cn, formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';
import { loadRazorpayScript, openRazorpayCheckout } from '@/lib/razorpay';

export default function PaymentPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [processing, setProcessing] = useState(false);
  const { getTotal } = useCartStore();

  const methods = [
    { id: 'card' as const, label: 'Credit/Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
    { id: 'upi' as const, label: 'UPI', icon: Wallet, desc: 'Google Pay, PhonePe, Paytm' },
    { id: 'netbanking' as const, label: 'Net Banking', icon: Building2, desc: 'All major banks' },
    { id: 'wallet' as const, label: 'Wallet', icon: CreditCard, desc: 'Paytm, Mobikwik, Freecharge' },
  ];

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load payment gateway');

      const response = await openRazorpayCheckout({
        amount: getTotal(),
        name: 'NexaROS',
        description: 'Order Payment',
        orderId: '',
        theme: { color: '#2563eb' },
      });

      if (response) {
        router.push('/order-success?payment=success');
      }
    } catch (e: any) {
      alert('Payment failed: ' + e.message);
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

      <div className="flex items-center gap-2 text-xs text-body mt-4 mb-6">
        <Shield size={14} className="text-success" /> Secure payment powered by Razorpay. Your data is encrypted.
      </div>

      <Button className="w-full h-12 text-base" onClick={handlePayment} loading={processing} disabled={processing}>
        {processing ? 'Processing...' : `Pay ${formatPrice(getTotal())}`}
      </Button>
    </div>
  );
}
