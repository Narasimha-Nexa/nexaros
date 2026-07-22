'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ErrorBoundary } from '@/components/error-boundary';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-caption text-body font-sans">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <DashboardShell><ErrorBoundary>{children}</ErrorBoundary></DashboardShell>;
}
