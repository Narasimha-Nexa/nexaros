import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://nexaros.com'),
  title: {
    default: 'NexaROS Admin | Enterprise Restaurant Management Platform',
    template: '%s | NexaROS Admin',
  },
  description:
    'NexaROS enterprise admin portal for managing multi-tenant restaurant operations. ' +
    'Provision restaurants, manage subscriptions, track analytics, and monitor ' +
    'real-time performance across your entire restaurant network.',
  keywords: [
    'restaurant management', 'POS platform', 'QR ordering', 'restaurant OS',
    'multi-tenant', 'SaaS', 'admin panel', 'restaurant analytics',
    'kitchen display', 'inventory management', 'staff management',
    'NexaROS', 'enterprise restaurant software', 'cloud POS',
  ],
  authors: [{ name: 'NexaROS', url: 'https://nexaros.com' }],
  creator: 'NexaROS',
  publisher: 'NexaROS',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    siteName: 'NexaROS',
    title: 'NexaROS Admin — Enterprise Restaurant Operating System',
    description:
      'Manage your entire restaurant network from one control plane. ' +
      'Multi-tenant SaaS platform for provisioning, monitoring, and analytics.',
    url: 'https://nexaros.com',
    locale: 'en_IN',
    images: [{ url: 'https://nexaros.com/og-image.png', width: 1200, height: 630, alt: 'NexaROS Admin Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@nexaros',
    creator: '@nexaros',
    title: 'NexaROS Admin — Enterprise Restaurant Operating System',
    description: 'Manage your entire restaurant network from one control plane.',
    images: ['https://nexaros.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://nexaros.com/admin',
  },
  category: 'technology',
  classification: 'Enterprise Software | Restaurant Management',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#111111',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Playfair+Display:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#111111" />
        <meta name="application-name" content="NexaROS Admin" />
        <meta name="apple-mobile-web-app-title" content="NexaROS" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="facebook-domain-verification" content="YOUR_VERIFICATION_CODE" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'NexaROS',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web, iOS, Android',
              description:
                'Enterprise restaurant operating system with multi-tenant architecture. ' +
                'Provision, manage, and monitor restaurant operations in real-time.',
              offers: {
                '@type': 'AggregateOffer',
                priceCurrency: 'INR',
                offerCount: 4,
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                bestRating: '5',
                ratingCount: '127',
              },
              author: { '@type': 'Organization', name: 'NexaROS' },
            }),
          }}
        />
      </head>
      <body className="bg-canvas text-ink font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
