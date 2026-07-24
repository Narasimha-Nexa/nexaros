'use client';

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, CreditCard, XCircle, Loader2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useOrderSocket } from '@/lib/socket';

type PaymentStatus = 'pending' | 'confirmed' | 'failed';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || '';
  const orderNumber = searchParams.get('number') || '';

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string>('');

  const handlePaymentReceived = useCallback((data: { amount: number; method: string; remaining: number }) => {
    setPaymentStatus('confirmed');
    setPaymentAmount(data.amount);
    setPaymentMethod(data.method);
  }, []);

  const handlePaymentFailed = useCallback((data: { reason: string }) => {
    setPaymentStatus('failed');
    setPaymentError(data.reason || 'Payment processing failed');
  }, []);

  useOrderSocket({
    orderId,
    onPaymentReceived: handlePaymentReceived,
    onPaymentFailed: handlePaymentFailed,
    enabled: !!orderId,
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {/* Status Icon */}
      {paymentStatus === 'confirmed' ? (
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
      ) : paymentStatus === 'failed' ? (
        <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-danger" />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold text-ink mb-2">
        {paymentStatus === 'confirmed' ? 'Payment Confirmed!' : paymentStatus === 'failed' ? 'Payment Failed' : 'Order Placed!'}
      </h1>
      <p className="text-body mb-2">
        {paymentStatus === 'confirmed' ? 'Your payment has been received' : paymentStatus === 'failed' ? 'There was an issue with your payment' : 'Thank you for your order'}
      </p>
      <p className="text-2xl font-bold text-ink mb-6">Order #{orderNumber}</p>

      {/* Payment Status Card */}
      {paymentStatus === 'confirmed' && paymentAmount !== null && (
        <Card className="p-4 mb-4 text-left">
          <div className="flex items-center gap-3">
            <CreditCard className="text-success" size={20} />
            <div>
              <p className="font-medium text-ink text-sm">Payment Received</p>
              <p className="text-body text-xs">
                ₹{paymentAmount.toFixed(2)} via {paymentMethod.toUpperCase()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {paymentStatus === 'failed' && (
        <Card className="p-4 mb-4 text-left border-danger/30">
          <div className="flex items-center gap-3">
            <XCircle className="text-danger" size={20} />
            <div>
              <p className="font-medium text-ink text-sm">Payment Failed</p>
              <p className="text-body text-xs">{paymentError}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Order Confirmation Card */}
      <Card className="p-6 text-left space-y-3 mb-6">
        <div className="flex items-center gap-3 text-sm">
          <Package className="text-primary" size={20} />
          <div>
            <p className="font-medium text-ink">Order Confirmed</p>
            <p className="text-body text-xs">Your order has been received and is being processed</p>
          </div>
        </div>
        <hr className="border-hairline" />
        <p className="text-xs text-body">A confirmation has been sent to your email and phone. You can track your order in real-time.</p>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Link href={`/track-order?id=${orderId}`}>
          <Button className="w-full h-12 gap-2">Track Order <ArrowRight size={18} /></Button>
        </Link>
        <Link href="/menu">
          <Button variant="outline" className="w-full gap-2">Order Again <ArrowRight size={18} /></Button>
        </Link>
        <Link href="/profile/orders">
          <Button variant="ghost" className="w-full">View All Orders</Button>
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-16 text-center"><div className="w-12 h-12 border-4 border-ink border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
