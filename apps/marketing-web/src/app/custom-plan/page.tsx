'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function CustomPlanPage() {
  const [formData, setFormData] = useState({
    restaurantName: '', contactName: '', email: '', phone: '',
    city: '', currentPos: '', requiredModules: [] as string[],
    monthlyBudget: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const modules = [
    'POS System', 'Kitchen Display', 'Inventory Management', 'Staff Management',
    'QR Ordering', 'Customer Website', 'Multi-Branch', 'AI Analytics',
    'CRM & Loyalty', 'Reservations', 'API Access', 'White Label',
  ];

  const toggleModule = (mod: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredModules: prev.requiredModules.includes(mod)
        ? prev.requiredModules.filter((m) => m !== mod)
        : [...prev.requiredModules, mod],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API_BASE}/public/demo-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source: 'custom-plan-page' }),
      });
    } catch { /* success regardless */ }
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center p-8 rounded-[24px]" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--success-light)' }}>
            <svg className="w-8 h-8" fill="none" stroke="var(--success)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Request Submitted!</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Our team will review your requirements and get back to you within 24 hours with a custom plan proposal.
          </p>
          <Link href="/" className="inline-block px-6 py-3 rounded-[16px] font-medium text-white" style={{ background: 'var(--accent)' }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  const inputStyle = { background: 'var(--bg-primary)', border: '2px solid var(--border)', color: 'var(--text-primary)' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-secondary)' }}>
      <section className="pt-32 pb-16 px-6 md:pt-40">
        <div className="max-w-[768px] mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            Custom Plan
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Need a <span style={{ color: 'var(--accent)' }}>Custom Plan</span>?
          </h1>
          <p className="reveal reveal-delay-2 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Every restaurant is unique. Tell us what you need, and we&apos;ll create a plan that fits your exact requirements and budget.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="reveal p-8 rounded-[24px]" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Restaurant Name *</label>
                  <input type="text" required value={formData.restaurantName} onChange={(e) => setFormData((p) => ({ ...p, restaurantName: e.target.value }))} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="Your restaurant name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Contact Name *</label>
                  <input type="text" required value={formData.contactName} onChange={(e) => setFormData((p) => ({ ...p, contactName: e.target.value }))} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="Your name" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Email *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Phone *</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>City</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="e.g., Bangalore" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Monthly Budget</label>
                  <input type="text" value={formData.monthlyBudget} onChange={(e) => setFormData((p) => ({ ...p, monthlyBudget: e.target.value }))} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="e.g., 5000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Current POS / Software</label>
                <input type="text" value={formData.currentPos} onChange={(e) => setFormData((p) => ({ ...p, currentPos: e.target.value }))} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={inputStyle} placeholder="e.g., Petpooja, DotPe, None" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Required Modules</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {modules.map((mod) => (
                    <button key={mod} type="button" onClick={() => toggleModule(mod)} className="px-3 py-2 rounded-[12px] text-sm transition-all" style={formData.requiredModules.includes(mod) ? { background: 'var(--accent-light)', border: '2px solid var(--accent)', color: 'var(--accent)' } : { border: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                      {mod}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Additional Requirements</label>
                <textarea value={formData.message} onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))} rows={4} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all resize-none" style={inputStyle} placeholder="Tell us about your specific needs..." />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-[16px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50" style={{ background: 'var(--accent)' }}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
