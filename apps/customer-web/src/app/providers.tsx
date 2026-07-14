'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { FloatingWhatsApp } from '@/components/common/FloatingWhatsApp';
import { ScrollToTop } from '@/components/common/ScrollToTop';

export function Providers({ children }: { children: React.ReactNode }) {
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
