const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(options: {
  amount: number;
  currency?: string;
  name: string;
  description?: string;
  orderId: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
}): Promise<RazorpayResponse | null> {
  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error('Failed to load Razorpay SDK');

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: Math.round(options.amount * 100),
      currency: options.currency || 'INR',
      name: options.name,
      description: options.description || 'Subscription',
      order_id: options.orderId,
      prefill: options.prefill || {},
      theme: options.theme || { color: '#E51A24' },
      handler: (response: RazorpayResponse) => resolve(response),
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.on('payment.failed', (resp: any) => reject(new Error(resp.error?.description || 'Payment failed')));
    rzp.open();
  });
}

export async function checkoutAndPay(data: {
  planId: string;
  planSlug: string;
  couponCode?: string;
  customerName?: string;
  customerEmail?: string;
}): Promise<{ success: boolean; orderId?: string; subscriptionId?: string; error?: string }> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  try {
    const checkoutRes = await fetch(`${API_BASE}/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: data.planId,
        planSlug: data.planSlug,
        couponCode: data.couponCode,
      }),
    });

    if (!checkoutRes.ok) {
      const err = await checkoutRes.json();
      return { success: false, error: err.message || 'Failed to create checkout order' };
    }

    const checkout = await checkoutRes.json();

    if (checkout.amount === 0 || checkout.freeTrial) {
      const verifyRes = await fetch(`${API_BASE}/billing/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: checkout.orderId || 'free_trial',
          razorpayPaymentId: 'free_trial',
          razorpaySignature: 'free_trial',
          planId: data.planId,
          couponCode: data.couponCode,
        }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        return { success: false, error: err.message || 'Failed to activate free plan' };
      }

      const result = await verifyRes.json();
      return { success: true, orderId: checkout.orderId, subscriptionId: result.subscriptionId };
    }

    const paymentResponse = await openRazorpayCheckout({
      amount: checkout.amount,
      name: 'NexaROS',
      description: `Subscription — ${data.planSlug}`,
      orderId: checkout.orderId,
      prefill: {
        name: data.customerName,
        email: data.customerEmail,
      },
      theme: { color: '#E51A24' },
    });

    if (!paymentResponse) {
      return { success: false, error: 'Payment was cancelled' };
    }

    const verifyRes = await fetch(`${API_BASE}/billing/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
        planId: data.planId,
        couponCode: data.couponCode,
      }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      return { success: false, error: err.message || 'Payment verification failed' };
    }

    const result = await verifyRes.json();
    return { success: true, orderId: paymentResponse.razorpay_order_id, subscriptionId: result.subscriptionId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
