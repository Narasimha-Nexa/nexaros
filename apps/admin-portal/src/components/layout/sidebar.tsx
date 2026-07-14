'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Building2, Users, CreditCard, Settings, Shield,
  FileText, LifeBuoy, Bell, BarChart3, Database, Cpu, Webhook,
  Tag, MessageSquare, Server, Activity, BookOpen, ChevronLeft, ChevronRight, PlusCircle, X
} from 'lucide-react';
import { useSidebarStore } from '@/stores/ui.store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navSections: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Create Restaurant', href: '/provision', icon: <PlusCircle size={18} /> },
      { label: 'Tenants', href: '/tenants', icon: <Building2 size={18} /> },
      { label: 'Subscriptions', href: '/subscriptions', icon: <CreditCard size={18} /> },
      { label: 'Plans', href: '/plans', icon: <Tag size={18} /> },
      { label: 'Coupons', href: '/coupons', icon: <Tag size={18} /> },
      { label: 'Demo Requests', href: '/demo-requests', icon: <MessageSquare size={18} /> },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Support', href: '/support', icon: <LifeBuoy size={18} /> },
      { label: 'Notifications', href: '/notifications', icon: <Bell size={18} /> },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Audit Logs', href: '/audit-logs', icon: <FileText size={18} /> },
      { label: 'Security', href: '/security', icon: <Shield size={18} /> },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
      { label: 'Monitoring', href: '/monitoring', icon: <Activity size={18} /> },
      { label: 'Database', href: '/database', icon: <Database size={18} /> },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, collapse, expand, closeMobile } = useSidebarStore();

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') collapse();
  }, []);

  const handleToggleCollapse = () => {
    if (isCollapsed) {
      expand();
      localStorage.setItem('sidebar_collapsed', 'false');
    } else {
      collapse();
      localStorage.setItem('sidebar_collapsed', 'true');
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen fixed left-0 top-0 z-40',
          'bg-ink text-canvas transition-all duration-200',
          isCollapsed ? 'w-16' : 'w-60',
        )}
      >
        {/* Logo */}
        <div className={cn('border-b border-white/10 shrink-0', isCollapsed ? 'p-3' : 'p-4')}>
          <Link href="/dashboard" className="flex items-center gap-3 text-canvas no-underline">
            <div className="w-8 h-8 bg-canvas flex items-center justify-center shrink-0">
              <span className="text-ink font-bold text-sm">N</span>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="font-bold text-sm tracking-wide block whitespace-nowrap">NexaROS</span>
                <span className="text-[10px] opacity-50 tracking-widest uppercase block whitespace-nowrap">Control Plane</span>
              </div>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          {navSections.map((section, si) => (
            <div key={si} className="mb-2">
              {section.title && !isCollapsed && (
                <p className="px-5 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-white/30">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <div key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      className={cn(
                        'sidebar-link',
                        isActive && 'active',
                        isCollapsed && 'justify-center px-0',
                      )}
                    >
                      {item.icon}
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                      {!isCollapsed && item.badge && (
                        <span className="ml-auto text-[10px] bg-canvas text-ink px-1.5 py-0.5 font-bold shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                    {/* Tooltip on collapsed sidebar */}
                    {isCollapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-ink text-canvas text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        {item.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-white/10 shrink-0">
          <button
            onClick={handleToggleCollapse}
            className="sidebar-link w-full justify-center"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 bg-ink text-canvas flex flex-col',
          'md:hidden transition-transform duration-200',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo + close */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 text-canvas no-underline" onClick={closeMobile}>
            <div className="w-8 h-8 bg-canvas flex items-center justify-center">
              <span className="text-ink font-bold text-sm">N</span>
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide">NexaROS</span>
              <span className="block text-[10px] opacity-50 tracking-widest uppercase">Control Plane</span>
            </div>
          </Link>
          <button onClick={closeMobile} className="p-2 text-canvas/60 hover:text-canvas">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navSections.map((section, si) => (
            <div key={si} className="mb-2">
              {section.title && (
                <p className="px-5 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-white/30">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn('sidebar-link', isActive && 'active')}
                    onClick={closeMobile}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
