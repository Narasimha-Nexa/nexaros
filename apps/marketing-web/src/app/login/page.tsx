'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Invalid email or password');
      }
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center p-8 rounded-[24px]" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--accent-light)' }}>
            <svg className="w-8 h-8" fill="none" stroke="var(--accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Login Successful!</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Open the <strong>NexaROS Flutter App</strong> on your desktop or tablet to manage your restaurant.
          </p>
          <div className="p-4 rounded-[16px] mb-6 text-left" style={{ background: 'var(--accent-light)' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--accent)' }}>Quick Start:</p>
            <ol className="text-sm space-y-1 ml-4 list-decimal" style={{ color: 'var(--accent)' }}>
              <li>Open the NexaROS app on your device</li>
              <li>Login with the same email & password</li>
              <li>Configure your menu and tables</li>
              <li>Start taking orders!</li>
            </ol>
          </div>
          <Link href="/" className="inline-block text-sm" style={{ color: 'var(--text-muted)' }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full p-8 rounded-[24px]" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>NexaROS</span>
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome Back</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Login to manage your restaurant</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-[16px] text-sm" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={{ background: 'var(--bg-primary)', border: '2px solid var(--border)', color: 'var(--text-primary)' }} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={{ background: 'var(--bg-primary)', border: '2px solid var(--border)', color: 'var(--text-primary)' }} placeholder="Your password" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-[16px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50" style={{ background: 'var(--accent)' }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium" style={{ color: 'var(--accent)' }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
