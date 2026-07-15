'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/lib/store/auth-store';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('Please fill in all required fields'); return; }
    setLoading(true);
    setError('');
    try {
      const [firstName = '', lastName = ''] = form.name.split(' ');
      await signup({ firstName, lastName, email: form.email, phone: form.phone, password: form.password });
      router.push('/profile');
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const updateField = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-ink text-white flex items-center justify-center font-bold text-lg mx-auto mb-4">SG</div>
          <h1 className="text-2xl font-bold text-ink">Create Account</h1>
          <p className="text-body mt-1">Join Spice Garden Rewards</p>
        </div>
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm">{error}</div>}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-body" size={18} />
              <input type="text" placeholder="Full Name *" value={form.name} onChange={(e) => updateField('name', e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-body" size={18} />
              <input type="email" placeholder="Email *" value={form.email} onChange={(e) => updateField('email', e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-body" size={18} />
              <input type="tel" placeholder="Phone Number" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-body" size={18} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Password *" value={form.password} onChange={(e) => updateField('password', e.target.value)} className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-ink"><Eye size={18} /></button>
            </div>
            <Button type="submit" className="w-full" loading={loading}>Create Account <ArrowRight size={18} /></Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-hairline" /></div>
            <div className="relative flex justify-center"><span className="bg-white dark:bg-ink px-3 text-xs text-body">or continue with</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-hairline text-sm text-ink hover:bg-hairline/50"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M12 4v4h4.5a5.47 5.47 0 00-4.5-2.5A5.5 5.5 0 006.5 11 5.5 5.5 0 1012 6.5V4z"/></svg> Google</button>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-hairline text-sm text-ink hover:bg-hairline/50"><svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Facebook</button>
          </div>
          <p className="text-center text-sm text-body mt-6">Already have an account? <Link href="/login" className="text-link font-medium hover:underline">Sign in</Link></p>
        </Card>
      </div>
    </div>
  );
}
