'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu, X, Search, ShoppingBag, Heart, User, Sun, Moon, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store/ui-store';
import { useCartStore } from '@/lib/store/cart-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  {
    href: '/menu',
    label: 'Menu',
    children: [
      { href: '/menu', label: 'All Menu' },
      { href: '/menu/appetizers', label: 'Appetizers' },
      { href: '/menu/main-course', label: 'Main Course' },
      { href: '/menu/biryani-rice', label: 'Biryani & Rice' },
      { href: '/menu/curries', label: 'Curries' },
      { href: '/menu/tandoor-specialties', label: 'Tandoor' },
      { href: '/menu/desserts', label: 'Desserts' },
      { href: '/menu/beverages', label: 'Beverages' },
    ],
  },
  { href: '/offers', label: 'Offers' },
  { href: '/reservations', label: 'Reservations' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/events', label: 'Events' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { isDarkMode, toggleDarkMode } = useUIStore();
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { isAuthenticated, user } = useAuthStore();
  const { openCart } = useUIStore();

  // Scroll listener in useEffect to prevent leaks
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          isScrolled
            ? 'bg-white/80 dark:bg-ink/80 backdrop-blur-xl shadow-sm border-b border-hairline'
            : 'bg-white dark:bg-ink'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-2 -ml-2 text-ink/70 hover:text-ink transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center font-bold text-sm">
                SG
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg text-ink">Spice Garden</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                const hasDropdown = link.children && link.children.length > 0;

                if (hasDropdown) {
                  return (
                    <div
                      key={link.href}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(link.href)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className={cn(
                          'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'text-ink bg-hairline'
                            : 'text-body hover:text-ink hover:bg-hairline/50'
                        )}
                      >
                        {link.label}
                        <ChevronDown size={14} className={cn('transition-transform', openDropdown === link.href && 'rotate-180')} />
                      </button>
                      {openDropdown === link.href && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-ink-dark border border-hairline rounded-xl shadow-lg py-2 z-50">
                          {link.children?.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                'block px-4 py-2 text-sm transition-colors',
                                pathname === child.href
                                  ? 'text-ink font-medium bg-hairline'
                                  : 'text-body hover:text-ink hover:bg-hairline/50'
                              )}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'text-ink bg-hairline'
                        : 'text-body hover:text-ink hover:bg-hairline/50'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-body hover:text-ink transition-colors rounded-lg hover:bg-hairline"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              <button
                onClick={toggleDarkMode}
                className="p-2 text-body hover:text-ink transition-colors rounded-lg hover:bg-hairline hidden sm:flex"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Wishlist */}
              <Link
                href="/profile/favorites"
                className="p-2 text-body hover:text-ink transition-colors rounded-lg hover:bg-hairline hidden sm:flex"
                aria-label="Wishlist"
              >
                <Heart size={20} />
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2 text-body hover:text-ink transition-colors rounded-lg hover:bg-hairline"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-ink text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>

              {/* Profile */}
              {isAuthenticated ? (
                <Link
                  href="/profile"
                  className="p-2 text-body hover:text-ink transition-colors rounded-lg hover:bg-hairline"
                  aria-label="Profile"
                >
                  <div className="w-8 h-8 rounded-full bg-hairline flex items-center justify-center overflow-hidden relative">
                    {user?.avatar ? (
                      <Image src={user.avatar} alt="" fill className="object-cover" sizes="32px" />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="sm" className="hidden sm:inline-flex">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search overlay */}
        {isSearchOpen && (
          <div className="border-t border-hairline bg-white dark:bg-ink">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-body/60" size={20} />
                <input
                  type="text"
                  placeholder="Search menu items, categories..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline bg-gray-50 dark:bg-ink-light text-ink placeholder:text-body/40 focus:outline-none focus:border-ink/30 focus:ring-2 focus:ring-ink/5"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-ink shadow-2xl overflow-y-auto">
            <div className="p-4 border-b border-hairline">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center font-bold text-sm">
                  SG
                </div>
                <span className="font-bold text-lg text-ink">Spice Garden</span>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                const hasDropdown = link.children && link.children.length > 0;

                return (
                  <div key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => !hasDropdown && setIsMobileOpen(false)}
                      className={cn(
                        'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'text-ink bg-hairline' : 'text-body hover:text-ink hover:bg-hairline/50'
                      )}
                    >
                      {link.label}
                      {hasDropdown && (
                        <ChevronDown size={16} className={cn(
                          'transition-transform',
                          openDropdown === link.href && 'rotate-180'
                        )} />
                      )}
                    </Link>
                    {hasDropdown && openDropdown === link.href && (
                      <div className="ml-4 mt-1 space-y-1">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsMobileOpen(false)}
                            className="block px-3 py-2 rounded-lg text-sm text-body hover:text-ink hover:bg-hairline/50 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
