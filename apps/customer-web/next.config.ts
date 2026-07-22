import type { NextConfig } from 'next';

// App routes that should NOT be intercepted by the restaurant rewrite
const APP_ROUTES = [
  'menu', 'about', 'cart', 'checkout', 'login', 'signup', 'offers',
  'gallery', 'events', 'blog', 'contact', 'faq', 'orders', 'track-order',
  'order-success', 'payment', 'forgot-password', 'reservations', 'profile',
  'privacy-policy', 'terms', 'refund-policy', 'cancellation-policy',
  'cookie-policy', 'not-found', 'restaurant',
];

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  async rewrites() {
    return [
      // Exclude app routes from restaurant rewrite
      ...APP_ROUTES.map((route) => ({
        source: `/${route}`,
        destination: `/${route}`,
      })),
      ...APP_ROUTES.map((route) => ({
        source: `/${route}/:path*`,
        destination: `/${route}/:path*`,
      })),
      // Dynamic routes for per-tenant serving
      {
        source: '/:slug',
        destination: '/restaurant/:slug',
      },
      {
        source: '/:slug/table/:tableId',
        destination: '/restaurant/:slug/table/:tableId',
      },
      {
        source: '/:slug/order/:orderId',
        destination: '/restaurant/:slug/order/:orderId',
      },
      // Forward any other slug sub-path (policies, etc.) to the tenant site
      {
        source: '/:slug/:path*',
        destination: '/restaurant/:slug/:path*',
      },
    ];
  },

  // Image remote patterns for restaurant logos/menu images
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4000' },
      { protocol: 'https', hostname: '**' },
    ],
  },

  // API proxy to backend
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      {
        source: '/restaurant/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' http://localhost:*" },
        ],
      },
    ];
  },
};

export default nextConfig;
