'use client';

import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { FloatingWhatsApp } from '@/components/common/FloatingWhatsApp';
import { ScrollToTop } from '@/components/common/ScrollToTop';

// Static marketing/app routes that use the shared "Spice Garden" chrome.
// Anything else (e.g. /:slug or /restaurant/:slug) is a per-tenant website
// that renders its own branded Header/Footer and must NOT show the global chrome.
const STATIC_ROUTES = new Set([
  'menu', 'about', 'cart', 'checkout', 'login', 'signup', 'offers',
  'gallery', 'events', 'blog', 'contact', 'faq', 'orders', 'track-order',
  'order-success', 'payment', 'forgot-password', 'reservations', 'profile',
  'privacy-policy', 'terms', 'refund-policy', 'cancellation-policy',
  'cookie-policy',
]);

function isTenantSite(pathname: string): boolean {
  const seg = pathname.split('/')[1];
  if (!seg) return false; // home page
  if (STATIC_ROUTES.has(seg)) return false;
  if (seg === 'restaurant') return true; // /restaurant/:slug
  // Any unknown first segment that isn't a static route is treated as a tenant slug.
  return true;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tenantSite = isTenantSite(pathname || '/');

  // Tenant websites render their own branded chrome; skip the global Spice Garden UI.
  if (tenantSite) {
    return (
      <ThemeProvider>
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <CartDrawer />
      <FloatingWhatsApp />
      <ScrollToTop />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer />
    </ThemeProvider>
  );
}
