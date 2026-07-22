'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, LogOut, ChevronDown, User, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useSidebarStore } from '@/stores/ui.store';
import { getInitials } from '@/lib/utils';
import { DarkModeToggle } from './dark-mode-toggle';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  tenants: 'Tenants',
  provision: 'Create Restaurant',
  subscriptions: 'Subscriptions',
  plans: 'Plans',
  coupons: 'Coupons',
  'demo-requests': 'Demo Requests',
  support: 'Support',
  notifications: 'Notifications',
  'audit-logs': 'Audit Logs',
  security: 'Security',
  settings: 'Settings',
  monitoring: 'Monitoring',
  database: 'Database',
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isImpersonating, impersonationTarget, stopImpersonation } = useAuthStore();
  const { openMobile, isMobileOpen } = useSidebarStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getPageTitle = () => {
    const segments = (pathname || '').split('/').filter(Boolean);
    const last = segments[segments.length - 1] || 'dashboard';
    return PAGE_TITLES[last] || last.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleExitImpersonation = async () => {
    await stopImpersonation();
    router.push('/tenants');
  };

  return (
    <>
      {/* Impersonation Banner */}
      {isImpersonating && impersonationTarget && (
        <div className="h-10 bg-blue-600 text-white flex items-center justify-between px-4 sm:px-6 shrink-0 z-40">
          <div className="flex items-center gap-2 text-sm font-sans">
            <User size={14} />
            <span className="font-semibold">Viewing as:</span>
            <span className="opacity-90">{impersonationTarget.name || impersonationTarget.email}</span>
            <span className="opacity-60 text-xs">•</span>
            <span className="opacity-70 text-xs">Expires {new Date(impersonationTarget.expiresAt).toLocaleTimeString()}</span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-white text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <X size={12} />
            Exit Impersonation
          </button>
        </div>
      )}

      <header className="h-14 border-b border-hairline bg-canvas flex items-center justify-between px-4 sm:px-6 shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={openMobile}
            className="md:hidden p-1.5 -ml-1 text-ink hover:bg-canvas-soft transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-body-md font-sans font-semibold truncate">{getPageTitle()}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Search - hidden on mobile */}
          <div className="relative hidden lg:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 w-64 text-sm border border-hairline bg-canvas-soft focus:bg-canvas focus:border-ink outline-none transition-colors font-sans"
              onFocus={(e) => e.target.style.borderColor = 'var(--color-ink)'}
              onBlur={(e) => e.target.style.borderColor = ''}
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-body hover:text-ink hover:bg-canvas-soft transition-colors">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-ink rounded-full" />
          </button>

          {/* Dark mode toggle */}
          <DarkModeToggle />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-canvas-soft transition-colors"
            >
              <div className="w-7 h-7 bg-ink text-canvas flex items-center justify-center text-[11px] font-bold shrink-0">
                {user ? getInitials(user.name) : 'A'}
              </div>
              <span className="text-sm font-sans hidden sm:block truncate max-w-[120px]">{user?.name || 'Admin'}</span>
              <ChevronDown size={12} className="hidden sm:block text-body" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 bg-canvas border-2 border-ink z-50 shadow-lg">
                  <div className="px-4 py-3 border-b border-hairline">
                    <p className="text-body-sm font-sans font-semibold truncate">{user?.name}</p>
                    <p className="text-caption text-body font-sans truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/security"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-body-sm font-sans hover:bg-canvas-soft no-underline text-ink transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={14} />
                    Account
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-body-sm font-sans hover:bg-canvas-soft w-full text-left text-ink transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
