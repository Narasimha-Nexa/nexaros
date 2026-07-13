'use client';

import { useState } from 'react';
import Link from 'next/link';

type PlanSelection = 'starter' | 'growth' | 'enterprise';
type Step = 'plan' | 'details' | 'confirm';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const planDetails = {
  starter: { name: 'Starter', price: 'Free', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  growth: { name: 'Growth', price: '₹2,999/mo', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  enterprise: { name: 'Enterprise', price: '₹7,999/mo', color: 'bg-purple-100 text-purple-800 border-purple-300' },
};

export default function SignupPage() {
  const [step, setStep] = useState<Step>('plan');
  const [selectedPlan, setSelectedPlan] = useState<PlanSelection | null>(null);
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectPlan = (plan: PlanSelection) => {
    setSelectedPlan(plan);
    setStep('details');
    setError('');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.restaurantName.trim()) {
      setError('Restaurant name is required');
      return;
    }
    if (!formData.ownerName.trim()) {
      setError('Owner name is required');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Valid email is required');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError('Valid phone number is required');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!formData.agreeTerms) {
      setError('You must agree to the terms of service');
      return;
    }

    setStep('confirm');
    setError('');
  };

  const handleConfirm = async () => {
    setError('');
    try {
      const [firstName, ...rest] = formData.ownerName.trim().split(' ');
      const lastName = rest.join(' ') || '';
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName,
          lastName,
          phone: formData.phone,
          restaurantName: formData.restaurantName,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Registration failed (${res.status})`);
      }
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || 'Registration failed. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to NexaROS!</h1>
          <p className="text-gray-500 mb-6">
            Your {selectedPlan && planDetails[selectedPlan].name} account has been created.
            Check your email for setup instructions.
          </p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-blue-800 mb-1">Next Steps:</p>
            <ol className="text-sm text-blue-700 space-y-1 ml-4 list-decimal">
              <li>Verify your email address</li>
              <li>Set up your restaurant profile</li>
              <li>Configure your first branch</li>
              <li>Import your menu</li>
              <li>Start taking orders!</li>
            </ol>
          </div>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-900">NexaROS</span>
          </Link>
          {step !== 'plan' && (
            <button
              onClick={() => {
                if (step === 'details') setStep('plan');
                else if (step === 'confirm') setStep('details');
              }}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              &larr; Back
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {(['plan', 'details', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  ['plan', 'details', 'confirm'].indexOf(step) >= i
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`ml-2 text-sm hidden sm:inline ${
                  ['plan', 'details', 'confirm'].indexOf(step) >= i
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-400'
                }`}
              >
                {s === 'plan' ? 'Choose Plan' : s === 'details' ? 'Your Details' : 'Confirm'}
              </span>
              {i < 2 && <div className="w-12 h-0.5 mx-2 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Plan Selection */}
        {step === 'plan' && (
          <div>
            <h1 className="text-3xl font-bold text-center mb-4">Choose Your Plan</h1>
            <p className="text-gray-500 text-center mb-12">Select the plan that fits your restaurant best.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(Object.entries(planDetails) as [PlanSelection, typeof planDetails.starter][]).map(([key, plan]) => (
                <button
                  key={key}
                  onClick={() => selectPlan(key)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                    selectedPlan === key
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${plan.color}`}>
                    {plan.name}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-4">{plan.price}</div>
                  <ul className="space-y-2">
                    {key === 'starter' && (
                      <>
                        <li className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          1 Branch
                        </li>
                        <li className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Up to 5 Staff
                        </li>
                        <li className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Basic POS
                        </li>
                      </>
                    )}
                    {key === 'growth' && (
                      <>
                        <li className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Up to 3 Branches
                        </li>
                        <li className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Kitchen Display
                        </li>
                        <li className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Inventory + QR Orders
                        </li>
                      </>
                    )}
                    {key === 'enterprise' && (
                      <>
                        <li className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Unlimited Branches
                        </li>
                        <li className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          AI Analytics
                        </li>
                        <li className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Dedicated Support
                        </li>
                      </>
                    )}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Details Form */}
        {step === 'details' && selectedPlan && (
          <div>
            <h1 className="text-3xl font-bold text-center mb-2">Create Your Account</h1>
            <p className="text-gray-500 text-center mb-8">
              {planDetails[selectedPlan].name} plan &mdash; {planDetails[selectedPlan].price}
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleDetailsSubmit} className="max-w-lg mx-auto space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  value={formData.restaurantName}
                  onChange={(e) => updateField('restaurantName', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., The Grand Bistro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => updateField('ownerName', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your full name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.agreeTerms}
                  onChange={(e) => updateField('agreeTerms', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-500">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                  <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue to Confirmation
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && selectedPlan && (
          <div>
            <h1 className="text-3xl font-bold text-center mb-2">Confirm Your Registration</h1>
            <p className="text-gray-500 text-center mb-8">Please review your details before finalizing.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Plan</h3>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <span className="text-gray-600">{planDetails[selectedPlan].name}</span>
                <span className="font-semibold">{planDetails[selectedPlan].price}</span>
              </div>

              <h3 className="font-semibold text-gray-900 mt-4 mb-3">Account Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Restaurant</dt>
                  <dd className="text-gray-900 font-medium">{formData.restaurantName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Owner</dt>
                  <dd className="text-gray-900 font-medium">{formData.ownerName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="text-gray-900 font-medium">{formData.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="text-gray-900 font-medium">{formData.phone}</dd>
                </div>
              </dl>
            </div>

            <div className="max-w-lg mx-auto flex gap-4">
              <button
                onClick={() => setStep('details')}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Edit Details
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              >
                Confirm &amp; Create Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
