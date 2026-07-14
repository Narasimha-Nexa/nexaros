import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ThemeProvider from '@/components/ThemeProvider';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata: Metadata = {
  title: { default: 'NexaROS', template: '%s | NexaROS' },
  description: 'AI-Powered Restaurant Operating System. Complete restaurant management with POS, kitchen display, inventory, and customer ordering.',
  keywords: ['restaurant POS', 'restaurant management', 'kitchen display', 'inventory management', 'QR ordering', 'restaurant software India', 'GST billing', 'offline POS'],
  metadataBase: new URL('https://nexaros.com'),
  openGraph: {
    type: 'website',
    siteName: 'NexaROS',
    locale: 'en_IN',
    title: 'NexaROS — AI-Powered Restaurant Operating System',
    description: 'One platform for POS, kitchen display, inventory, ordering, and analytics. Built for India. Free to start.',
    url: 'https://nexaros.com',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'NexaROS — Restaurant Operating System' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexaROS — Restaurant Operating System',
    description: 'AI-Powered Restaurant Operating System. Complete management with POS, kitchen display, inventory.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://nexaros.com' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ScrollReveal />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
