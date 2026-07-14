'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button, Card } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-1 text-sm text-body hover:text-ink mb-6"><ArrowLeft size={16} /> Back to Sign In</Link>
        {submitted ? (
          <Card padding="lg" className="text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"><Mail className="w-8 h-8 text-success" /></div>
            <h1 className="text-xl font-bold text-ink mb-2">Check Your Email</h1>
            <p className="text-body text-sm mb-6">We&apos;ve sent a password reset link to <strong>{email}</strong></p>
            <Button variant="outline" onClick={() => setSubmitted(false)} className="w-full">Send Again</Button>
          </Card>
        ) : (
          <Card padding="lg">
            <h1 className="text-xl font-bold text-ink mb-2">Forgot Password</h1>
            <p className="text-body text-sm mb-6">Enter your email and we&apos;ll send you a reset link</p>
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-body" size={18} />
                <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-sm focus:outline-none focus:border-ink/30" />
              </div>
              <Button onClick={() => email && setSubmitted(true)} disabled={!email} className="w-full gap-2">Send Reset Link <ArrowRight size={18} /></Button>
            </div>
            <p className="text-center text-sm text-body mt-4"><Link href="/login" className="text-link hover:underline">Back to Sign In</Link></p>
          </Card>
        )}
      </div>
    </div>
  );
}
