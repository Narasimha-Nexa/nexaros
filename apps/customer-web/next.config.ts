import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  
  // Dynamic routes for per-tenant serving
  async rewrites() {
    return [
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
    ];
  },
};

export default nextConfig;
