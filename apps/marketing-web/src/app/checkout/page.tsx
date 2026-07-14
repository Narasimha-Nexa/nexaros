'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { checkoutAndPay } from '@/lib/razorpay';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingCycle: string;
  trialDays: number;
  maxBranches: number;
  maxStaff: number;
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const planSlug = searchParams.get('plan') || 'professional';

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<{ valid: boolean; discount?: number; message?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [step, setStep] = useState<'details' | 'payment'>('details');

  useEffect(() => { fetchPlans(); }, []);

  useEffect(() => {
    if (plans.length > 0) {
      const plan = plans.find((p) => p.slug === planSlug) || plans[0];
      setSelectedPlan(plan);
    }
  }, [plans, planSlug]);

  async function fetchPlans() {
    try {
      const res = await fetch(`${API_BASE}/entitlements/plans`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch {
      setPlans([
        { id: '1', name: 'Starter Free', slug: 'starter-free', description: 'Perfect for single-branch restaurants.', price: 0, billingCycle: 'MONTHLY', trialDays: 0, maxBranches: 1, maxStaff: 5 },
        { id: '2', name: 'Professional', slug: 'professional', description: 'For growing restaurants with advanced features.', price: 2999, billingCycle: 'MONTHLY', trialDays: 14, maxBranches: 3, maxStaff: 20 },
        { id: '3', name: 'Business', slug: 'business', description: 'For restaurant chains and multi-branch operations.', price: 7999, billingCycle: 'MONTHLY', trialDays: 14, maxBranches: 10, maxStaff: 100 },
        { id: '4', name: 'Enterprise', slug: 'enterprise', description: 'Custom solutions for large restaurant enterprises.', price: 19999, billingCycle: 'MONTHLY', trialDays: 30, maxBranches: 999, maxStaff: 999 },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function validateCoupon() {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), planSlug: selectedPlan?.slug }),
      });
      const data = await res.json();
      if (res.ok && data.valid !== false) {
        setCouponResult({ valid: true, discount: data.discount || data.value, message: data.message });
      } else {
        setCouponResult({ valid: false, message: data.message || 'Invalid coupon code' });
      }
    } catch {
      setCouponResult({ valid: false, message: 'Could not validate coupon' });
    }
  }

  function removeCoupon() { setCouponCode(''); setCouponResult(null); }

  async function handleCheckout() {
    if (!selectedPlan) return;
    setProcessing(true);
    setError('');

    try {
      const result = await checkoutAndPay({
        planId: selectedPlan.id,
        planSlug: selectedPlan.slug,
        couponCode: couponResult?.valid ? couponCode : undefined,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
      });

      if (result.success) {
        window.location.href = '/checkout/success?plan=' + selectedPlan.slug + '&orderId=' + (result.orderId || '');
      } else {
        setError(result.error || 'Payment failed. Please try again.');
        setProcessing(false);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed. Please try again.');
      setProcessing(false);
    }
  }

  function handleProceedToPayment() {
    if (selectedPlan && selectedPlan.price > 0 && !customerName.trim()) {
      setError('Please enter your name to continue.');
      return;
    }
    if (selectedPlan && selectedPlan.price > 0 && !customerEmail.trim()) {
      setError('Please enter your email to continue.');
      return;
    }
    setError('');
    setStep('payment');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading plans...</p>
        </div>
      </div>
    );
  }

  const originalPrice = selectedPlan?.price || 0;
  const discountAmount = couponResult?.valid ? (couponResult.discount || 0) : 0;
  const finalPrice = Math.max(originalPrice - discountAmount, 0);
  const inputStyle = { background: 'var(--bg-primary)', border: '2px solid var(--border)', color: 'var(--text-primary)' };

  return (
    <div className="min-h-screen py-16 px-6" style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>NexaROS</span>
          </Link>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Checkout</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Complete your subscription setup</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 text-sm font-medium ${step === 'details' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: step === 'details' ? 'var(--accent)' : 'var(--border)', color: step === 'details' ? '#fff' : 'var(--text-muted)' }}>1</span>
            Details
          </div>
          <div className="w-8 h-px" style={{ background: 'var(--border)' }} />
          <div className={`flex items-center gap-2 text-sm font-medium ${step === 'payment' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: step === 'payment' ? 'var(--accent)' : 'var(--border)', color: step === 'payment' ? '#fff' : 'var(--text-muted)' }}>2</span>
            Payment
          </div>
        </div>

        {/* Plan selection (always visible) */}
        <div className="p-6 rounded-[20px] mb-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Select Plan</h2>
          <div className="space-y-3">
            {plans.map((plan) => (
              <label key={plan.id} className="flex items-center p-4 rounded-[16px] cursor-pointer transition-all" style={selectedPlan?.id === plan.id ? { border: '2px solid var(--accent)', background: 'var(--accent-light)' } : { border: '2px solid var(--border)' }}>
                <input type="radio" name="plan" value={plan.slug} checked={selectedPlan?.id === plan.id} onChange={() => setSelectedPlan(plan)} className="w-4 h-4" style={{ accentColor: 'var(--accent)' }} />
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{plan.name}</span>
                    <span className="font-bold" style={{ color: 'var(--accent)' }}>
                      {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}/mo`}
                    </span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{plan.description}</p>
                  <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{plan.maxBranches === 999 ? 'Unlimited' : plan.maxBranches} branches</span>
                    <span>{plan.maxStaff === 999 ? 'Unlimited' : plan.maxStaff} staff</span>
                    {plan.trialDays > 0 && <span>{plan.trialDays}-day free trial</span>}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Customer details (shown for paid plans, step 1) */}
        {selectedPlan && selectedPlan.price > 0 && step === 'details' && (
          <div className="p-6 rounded-[20px] mb-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Restaurant owner name" className="w-full px-4 py-2.5 rounded-[12px] text-base" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email Address *</label>
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="owner@restaurant.com" className="w-full px-4 py-2.5 rounded-[12px] text-base" style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {/* Coupon (shown for paid plans) */}
        {selectedPlan && selectedPlan.price > 0 && (
          <div className="p-6 rounded-[20px] mb-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Have a coupon?</h2>
            {couponResult ? (
              <div className="p-4 rounded-[16px]" style={couponResult.valid ? { background: 'var(--success-light)', border: '1px solid var(--success)' } : { background: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium" style={{ color: couponResult.valid ? 'var(--success)' : 'var(--accent)' }}>
                      {couponResult.valid ? `Coupon applied: ${couponCode.toUpperCase()}` : couponResult.message}
                    </p>
                    {couponResult.valid && couponResult.discount && (
                      <p className="text-sm mt-1" style={{ color: 'var(--success)' }}>Discount: ₹{couponResult.discount.toLocaleString()}</p>
                    )}
                  </div>
                  <button onClick={removeCoupon} className="text-sm" style={{ color: 'var(--text-muted)' }}>Remove</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="flex-1 px-4 py-2.5 rounded-[12px] text-base uppercase tracking-wider" style={inputStyle} />
                <button onClick={validateCoupon} disabled={!couponCode.trim()} className="px-6 py-2.5 rounded-[16px] font-medium text-white disabled:opacity-50" style={{ background: 'var(--text-primary)' }}>Apply</button>
              </div>
            )}
          </div>
        )}

        {/* Order summary */}
        {selectedPlan && (
          <div className="p-6 rounded-[20px] mb-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Plan</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedPlan.name}</span>
              </div>
              {selectedPlan.trialDays > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Free Trial</span>
                  <span className="font-medium" style={{ color: 'var(--success)' }}>{selectedPlan.trialDays} days</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Monthly Price</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>₹{originalPrice.toLocaleString()}</span>
              </div>
              {couponResult?.valid && discountAmount > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Coupon Discount</span>
                  <span className="font-medium" style={{ color: 'var(--success)' }}>-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 flex justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Total</span>
                <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
                  {finalPrice === 0 ? 'Free' : `₹${finalPrice.toLocaleString()}/mo`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment security note (shown at payment step) */}
        {step === 'payment' && selectedPlan && selectedPlan.price > 0 && (
          <div className="p-4 rounded-[16px] mb-6 flex items-center gap-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Secure payment powered by <strong>Razorpay</strong>. Your payment details are encrypted end-to-end.</p>
          </div>
        )}

        {error && <div className="mb-6 p-4 rounded-[16px] text-sm" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>{error}</div>}

        {/* CTA buttons */}
        {step === 'details' && selectedPlan && selectedPlan.price > 0 ? (
          <button onClick={handleProceedToPayment} className="w-full py-4 rounded-[16px] font-semibold text-lg text-white transition-all" style={{ background: 'var(--accent)' }}>
            Proceed to Payment →
          </button>
        ) : (
          <button onClick={handleCheckout} disabled={!selectedPlan || processing} className="w-full py-4 rounded-[16px] font-semibold text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all" style={{ background: 'var(--accent)' }}>
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : finalPrice === 0 ? 'Start Free' : `Pay ₹${finalPrice.toLocaleString()} / month`}
          </button>
        )}

        {step === 'payment' && (
          <button onClick={() => setStep('details')} className="w-full py-3 rounded-[16px] font-medium text-sm mt-3 transition-all" style={{ border: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
            ← Back to Details
          </button>
        )}

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          By completing this purchase, you agree to our{' '}
          <Link href="/terms" className="font-medium" style={{ color: 'var(--accent)' }}>Terms of Service</Link> and{' '}
          <Link href="/privacy" className="font-medium" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>.
        </p>

        <div className="text-center mt-4">
          <Link href="/pricing" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Back to Pricing</Link>
        </div>
      </div>
    </div>
  );
}
