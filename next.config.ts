import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  // Configure headers to allow Coinbase Wallet SDK and ensure proper navigation
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          // Add cache control to prevent caching issues
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  // Configure rewrites for Coinbase Wallet SDK callback
  async rewrites() {
    return [
      {
        source: '/coinbase-callback',
        destination: '/api/auth/callback/coinbase',
      },
    ];
  },
  // Add redirects to ensure navigation works correctly
  async redirects() {
    return [
      // Add a catch-all redirect rule with lower priority
      {
        source: '/freemium',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  // Webpack configuration for crypto support
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
    };
    return config;
  },
};

export default nextConfig;
