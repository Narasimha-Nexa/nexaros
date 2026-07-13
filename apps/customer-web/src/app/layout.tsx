import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Order Online', template: '%s | Order Online' },
  description: 'Browse our menu and order online for pickup or delivery.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Order Online' },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'Restaurant Online Ordering',
    title: 'Order Online',
    description: 'Browse our menu and order online.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
