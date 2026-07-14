'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const businessTypes = [
  'Restaurant', 'Cafe', 'Food Truck', 'Cloud Kitchen', 'Bakery',
  'Bar & Pub', 'Sweet Shop', 'Juice Center', 'Catering', 'Other',
];

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
];

type Step = 'details' | 'confirm';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('details');
  const [formData, setFormData] = useState({
    restaurantName: '', ownerName: '', email: '', phone: '',
    password: '', confirmPassword: '', businessType: '',
    country: 'India', state: '', city: '', address: '', agreeTerms: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.restaurantName.trim()) { setError('Restaurant name is required'); return; }
    if (!formData.ownerName.trim()) { setError('Owner name is required'); return; }
    if (!formData.email.trim() || !formData.email.includes('@')) { setError('Valid email is required'); return; }
    if (!formData.phone.trim() || formData.phone.length < 10) { setError('Valid phone number is required'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (!formData.agreeTerms) { setError('You must agree to the terms of service'); return; }
    setStep('confirm');
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
          email: formData.email, password: formData.password,
          firstName, lastName, phone: formData.phone,
          restaurantName: formData.restaurantName, businessType: formData.businessType,
          country: formData.country, state: formData.state, city: formData.city, address: formData.address,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Registration failed (${res.status})`);
      }
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center p-8 rounded-[24px]" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--success-light)' }}>
            <svg className="w-8 h-8" fill="none" stroke="var(--success)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Welcome to NexaROS!</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Your account has been created successfully. Check your email for setup instructions.
          </p>
          <Link href="/" className="inline-block text-sm" style={{ color: 'var(--text-muted)' }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  const inputStyle = { background: 'var(--bg-primary)', border: '2px solid var(--border)', color: 'var(--text-primary)' };

  return (
    <div className="min-h-screen pt-16" style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center gap-2 mb-12">
          {(['details', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === s || (step === 'confirm' && i === 0) ? 'text-white' : ''}`} style={step === s || (step === 'confirm' && i === 0) ? { background: 'var(--accent)' } : { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                {i + 1}
              </div>
              <span className={`ml-2 text-sm hidden sm:inline`} style={{ color: step === s ? 'var(--accent)' : 'var(--text-muted)', fontWeight: step === s ? 500 : 400 }}>
                {s === 'details' ? 'Your Details' : 'Confirm'}
              </span>
              {i < 1 && <div className="w-12 h-0.5 mx-2" style={{ background: 'var(--border)' }} />}
            </div>
          ))}
        </div>

        {step === 'details' && (
          <div>
            <h1 className="text-3xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>Create Your Account</h1>
            <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>Set up your restaurant in minutes. No credit card required.</p>
            {error && <div className="mb-6 p-4 rounded-[16px] text-sm" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Restaurant Name *</label>
                <input type="text" value={formData.restaurantName} onChange={(e) => updateField('restaurantName', e.target.value)} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="e.g., The Grand Bistro" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Owner Name *</label>
                <input type="text" value={formData.ownerName} onChange={(e) => updateField('ownerName', e.target.value)} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="Your full name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Phone *</label>
                  <input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Password *</label>
                  <input type="password" value={formData.password} onChange={(e) => updateField('password', e.target.value)} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="Min. 8 characters" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Confirm Password *</label>
                  <input type="password" value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="Re-enter password" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Business Type</label>
                  <select value={formData.businessType} onChange={(e) => updateField('businessType', e.target.value)} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle}>
                    <option value="">Select type</option>
                    {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>State</label>
                  <select value={formData.state} onChange={(e) => updateField('state', e.target.value)} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle}>
                    <option value="">Select state</option>
                    {states.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <input type="checkbox" id="terms" checked={formData.agreeTerms} onChange={(e) => updateField('agreeTerms', e.target.checked)} className="mt-1 h-4 w-4 rounded" style={{ accentColor: 'var(--accent)' }} />
                <label htmlFor="terms" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  I agree to the <Link href="/terms" className="font-medium" style={{ color: 'var(--accent)' }}>Terms of Service</Link> and <Link href="/privacy" className="font-medium" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>
                </label>
              </div>
              <button type="submit" className="w-full py-3 rounded-[16px] font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: 'var(--accent)' }}>
                Continue to Confirmation
              </button>
            </form>
          </div>
        )}

        {step === 'confirm' && (
          <div>
            <button onClick={() => setStep('details')} className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>&larr; Back to details</button>
            <h1 className="text-3xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>Confirm Your Registration</h1>
            <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>Please review your details before finalizing.</p>
            {error && <div className="mb-6 p-4 rounded-[16px] text-sm" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>{error}</div>}
            <div className="max-w-lg mx-auto p-6 rounded-[20px] mb-8" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Restaurant</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt style={{ color: 'var(--text-muted)' }}>Name</dt><dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{formData.restaurantName}</dd></div>
                <div className="flex justify-between"><dt style={{ color: 'var(--text-muted)' }}>Owner</dt><dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{formData.ownerName}</dd></div>
                <div className="flex justify-between"><dt style={{ color: 'var(--text-muted)' }}>Email</dt><dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{formData.email}</dd></div>
                <div className="flex justify-between"><dt style={{ color: 'var(--text-muted)' }}>Phone</dt><dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{formData.phone}</dd></div>
              </dl>
            </div>
            <div className="max-w-lg mx-auto flex gap-4">
              <button onClick={() => setStep('details')} className="flex-1 py-3 rounded-[16px] font-medium" style={{ border: '2px solid var(--border)', color: 'var(--text-primary)' }}>Edit Details</button>
              <button onClick={handleConfirm} className="flex-1 py-3 rounded-[16px] font-semibold text-white" style={{ background: 'var(--accent)' }}>Confirm &amp; Create Account</button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account? <Link href="/login" className="font-medium" style={{ color: 'var(--accent)' }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
