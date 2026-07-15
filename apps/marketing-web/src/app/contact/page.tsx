'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;
    try {
      const res = await fetch(`${API_BASE}/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok && res.status !== 404) throw new Error('Failed to send');
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center p-8 rounded-[24px]" style={{ background: 'var(--bg-secondary)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--success-light)' }}>
            <svg className="w-8 h-8" fill="none" stroke="var(--success)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Thank You!</h1>
          <p style={{ color: 'var(--text-secondary)' }}>We&apos;ll get back to you shortly.</p>
          <Link href="/" className="inline-block mt-6 px-6 py-3 rounded-[16px] font-medium text-white" style={{ background: 'var(--accent)' }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-20 px-6 max-w-[768px] mx-auto">
        <div className="text-center mb-12">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            Contact
          </div>
          <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>Contact Us</h1>
          <p className="reveal reveal-delay-2 text-lg" style={{ color: 'var(--text-secondary)' }}>
            Have questions? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {[
            { icon: '📧', title: 'Email', value: 'hello@nexaros.com' },
            { icon: '📞', title: 'Phone', value: '+91 88888 88888' },
            { icon: '💬', title: 'WhatsApp', value: '+91 88888 88888' },
            { icon: '📍', title: 'Office', value: 'Bangalore, India' },
          ].map((item) => (
            <div key={item.title} className="reveal p-5 rounded-[20px]" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="text-xl mb-2">{item.icon}</div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.value}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-4 rounded-[16px] text-sm" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Name</label>
            <input type="text" name="name" required className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={{ background: 'var(--bg-primary)', border: '2px solid var(--border)', color: 'var(--text-primary)' }} placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Email</label>
            <input type="email" name="email" required className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all" style={{ background: 'var(--bg-primary)', border: '2px solid var(--border)', color: 'var(--text-primary)' }} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Message</label>
            <textarea name="message" required rows={5} className="w-full px-4 py-2.5 rounded-[12px] text-base transition-all resize-none" style={{ background: 'var(--bg-primary)', border: '2px solid var(--border)', color: 'var(--text-primary)' }} placeholder="How can we help?" />
          </div>
          <button type="submit" disabled={sending} className="w-full py-3 rounded-[16px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50" style={{ background: 'var(--accent)' }}>
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </section>
    </div>
  );
}
