'use client';
import React, { useEffect } from 'react';
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

  return (
    <div className="h-screen flex overflow-hidden bg-canvas-soft">
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
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
        <footer className="border-t border-hairline px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 bg-canvas">
          <p className="text-caption text-body font-sans">NexaROS Control Plane v1.0</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-caption text-body font-sans">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
              System Operational
            </span>
          </div>
        </footer>
      </div>

      <ToastContainer />
    </div>
  );
}
