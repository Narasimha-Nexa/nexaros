import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'NexaROS', template: '%s | NexaROS' },
  description: 'AI-Powered Restaurant Operating System. Complete restaurant management solution with POS, inventory, kitchen display, and customer ordering.',
  openGraph: {
    type: 'website',
    siteName: 'NexaROS',
    title: 'NexaROS — Restaurant Operating System',
    description: 'Complete restaurant management with POS, kitchen display, inventory, and online ordering.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
