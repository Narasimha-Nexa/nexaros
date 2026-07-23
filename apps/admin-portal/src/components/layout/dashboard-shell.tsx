'use client';
import React, { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useSidebarStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';
import { ToastContainer } from '@/components/ui/toast';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebarStore();
  const [apiStatus, setApiStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');

  useEffect(() => {
    let mounted = true;
    let controller: AbortController;
    const check = async () => {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (mounted) setApiStatus(res.ok ? 'connected' : 'disconnected');
      } catch {
        clearTimeout(timeout);
        if (mounted) setApiStatus('disconnected');
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => { mounted = false; clearInterval(interval); if (controller) controller.abort(); };
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-canvas-soft">
      {/* Connection Status — prominent banner when disconnected */}
      {apiStatus !== 'connected' && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-danger text-white px-4 py-2 text-sm font-semibold flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          API Disconnected — changes cannot be saved. Check if the backend is running on port 4000.
          <button
            onClick={() => window.location.reload()}
            className="ml-auto px-3 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition"
          >
            Retry
          </button>
        </div>
      )}
      <div className={`connection-bar ${
        apiStatus === 'connected' ? 'connected' :
        apiStatus === 'reconnecting' ? 'reconnecting' : 'disconnected'
      }`} />
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-ink/40 z-40 md:hidden animate-fade-in"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div
        className={cn(
          'flex-1 flex flex-col h-screen transition-all duration-200 min-w-0',
          'md:ml-[var(--sidebar-width)]',
        )}
        style={{
          '--sidebar-width': isCollapsed ? '64px' : '240px',
        } as React.CSSProperties}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className={`p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full ${apiStatus !== 'connected' ? 'pt-12' : ''}`}>
            {children}
          </div>
        </main>
        <footer className="border-t border-hairline px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 bg-canvas">
          <p className="text-[12px] text-body font-sans">NexaROS Control Plane v1.0</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[12px] font-sans font-semibold">
              <span className={`w-1.5 h-1.5 rounded-full ${
                apiStatus === 'connected' ? 'bg-semantic-success' : 'bg-semantic-danger'
              }`} />
              API {apiStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </footer>
      </div>

      <ToastContainer />
    </div>
  );
}
