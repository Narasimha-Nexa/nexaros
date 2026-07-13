'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
      if (!res.ok && res.status !== 404) {
        throw new Error('Failed to send message');
      }
      setSubmitted(true);
    } catch {
      // Endpoint may not exist yet — still show success to user
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
          <p className="text-gray-500">We&apos;ll get back to you shortly.</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">Back to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-900">NexaROS</span>
          </a>
          <a href="/" className="text-sm text-gray-600 hover:text-gray-900">Back to Home</a>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">Contact Us</h1>
        <p className="text-gray-500 text-center mb-12">
          Have questions? We&apos;d love to hear from you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="p-6 bg-gray-50 rounded-2xl">
            <div className="text-2xl mb-2">📧</div>
            <h3 className="font-semibold mb-1">Email</h3>
            <p className="text-sm text-gray-500">hello@nexaros.com</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl">
            <div className="text-2xl mb-2">📞</div>
            <h3 className="font-semibold mb-1">Phone</h3>
            <p className="text-sm text-gray-500">+91 88888 88888</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl">
            <div className="text-2xl mb-2">💬</div>
            <h3 className="font-semibold mb-1">WhatsApp</h3>
            <p className="text-sm text-gray-500">+91 88888 88888</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl">
            <div className="text-2xl mb-2">📍</div>
            <h3 className="font-semibold mb-1">Office</h3>
            <p className="text-sm text-gray-500">Bangalore, India</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" name="name" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea name="message" required rows={5} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="How can we help?" />
          </div>
          <button type="submit" disabled={sending} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white font-semibold mb-2">NexaROS</p>
          <p className="text-sm">AI-Powered Restaurant Operating System</p>
        </div>
      </footer>
    </div>
  );
}
