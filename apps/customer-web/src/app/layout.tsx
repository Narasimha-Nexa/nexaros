import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ErrorBoundary } from '@/components/error-boundary';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Spice Garden | Premium Indian Restaurant',
    template: '%s | Spice Garden',
  },
  description:
    'Experience the finest Indian cuisine at Spice Garden. Browse our menu, make reservations, order online for delivery or pickup. Award-winning dining in Bengaluru.',
  keywords: [
    'Indian restaurant',
    'Bengaluru dining',
    'Spice Garden',
    'Indian food delivery',
    'best Indian restaurant',
    'fine dining Bengaluru',
    'order Indian food online',
  ],
  authors: [{ name: 'Spice Garden' }],
  creator: 'Spice Garden',
  publisher: 'Spice Garden',
  metadataBase: new URL('https://spicegarden.com'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Spice Garden',
    title: 'Spice Garden | Premium Indian Restaurant',
    description: 'Experience the finest Indian cuisine at Spice Garden. Award-winning dining in Bengaluru.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Spice Garden Restaurant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spice Garden | Premium Indian Restaurant',
    description: 'Experience the finest Indian cuisine at Spice Garden.',
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=630&fit=crop'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Spice Garden',
  },
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#171717' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen bg-bg text-ink antialiased ${inter.variable} ${playfair.variable}`}>
        <Providers><ErrorBoundary>{children}</ErrorBoundary></Providers>
      </body>
    </html>
  );
}
