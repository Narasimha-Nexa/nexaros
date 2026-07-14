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
      description: options.description || 'Payment',
      order_id: options.orderId,
      prefill: options.prefill || {},
      theme: options.theme || { color: '#000000' },
      handler: (response: RazorpayResponse) => resolve(response),
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.on('payment.failed', (resp: any) => reject(new Error(resp.error?.description || 'Payment failed')));
    rzp.open();
  });
}
