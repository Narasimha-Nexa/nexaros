'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useToastStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { login } = useAuthStore();
  const { addToast } = useToastStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      addToast(err.message || 'Invalid credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@nexaros.com');
    setPassword('admin123');
  };

  const copyDemo = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row">
      {/* Left Panel — Masthead (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-ink text-canvas flex-col justify-between p-10 xl:p-14 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-canvas flex items-center justify-center">
              <span className="text-ink font-bold text-lg">N</span>
            </div>
            <div>
              <span className="font-bold text-lg tracking-wide">NexaROS</span>
              <span className="block text-[10px] opacity-40 tracking-[0.3em] uppercase">Control Plane</span>
            </div>
          </div>

          <h1 className="font-display text-display-hero mb-6">
            Manage your<br />platform
          </h1>
          <div className="h-[1px] w-12 bg-canvas/20 mb-6" />
          <p className="text-body-lg opacity-50 max-w-sm font-body leading-relaxed">
            The command center for NexaROS — monitoring, managing, and scaling
            your restaurant SaaS platform from a single interface.
          </p>
        </div>

        <div className="flex items-center gap-6 text-caption opacity-25 font-sans">
          <span>Platform v1.0</span>
          <span>•</span>
          <span>System Operational</span>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-ink flex items-center justify-center">
              <span className="text-canvas font-bold text-sm">N</span>
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide">NexaROS</span>
              <span className="block text-[10px] opacity-40 tracking-widest uppercase">Control Plane</span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-caption font-sans font-semibold tracking-[0.15em] uppercase text-body mb-2">
              Administrator Access
            </p>
            <h2 className="font-display text-display-sm">Sign in to continue</h2>
          </div>

          <div className="h-[1px] w-full bg-ink mb-6" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="admin@nexaros.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-ink transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 border border-hairline accent-ink" />
                <span className="text-body-sm font-sans text-body">Remember me</span>
              </label>
              <button type="button" className="text-body-sm font-sans font-semibold text-link hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full h-11">
              Sign In
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-hairline">
            <div className="flex items-center justify-between mb-2">
              <p className="text-caption font-sans font-semibold text-body uppercase tracking-wider">Demo Credentials</p>
              <button
                type="button"
                onClick={fillDemo}
                className="text-caption font-sans font-semibold text-link hover:underline"
              >
                Auto-fill
              </button>
            </div>
            <div className="flex items-center justify-between bg-canvas-soft p-3 border border-hairline">
              <div className="min-w-0">
                <p className="text-body-sm font-sans font-medium truncate">admin@nexaros.com</p>
                <p className="text-body-sm font-mono text-body">admin123</p>
              </div>
              <button
                type="button"
                onClick={() => copyDemo('admin@nexaros.com / admin123', 'creds')}
                className="shrink-0 p-1.5 text-body hover:text-ink transition-colors ml-2"
                title="Copy credentials"
              >
                {copied === 'creds' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-caption text-body font-sans">
            Restricted access portal.{' '}
            <a href="https://nexaros.com" className="text-link font-semibold hover:underline">Visit nexaros.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
