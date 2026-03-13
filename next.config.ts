import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Silence "multiple lockfiles" warning — pin workspace root to this directory
  outputFileTracingRoot: path.join(__dirname),

  reactStrictMode: true,

  // Tree-shake barrel imports for faster builds & smaller bundles
  experimental: {
    optimizePackageImports: [
      'bignumber.js',
      'react-i18next',
      'i18next',
      'qrcode.react',
      'zod',
      'react-hook-form',
      '@hookform/resolvers',
      'react-turnstile',
      '@/components/ui',
    ],
  },

  // Allow images from coin asset paths
  images: {
    remotePatterns: [],
  },

  // Rewrite API calls to backend
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3339'
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBase}/api/v1/:path*`,
      },
    ]
  },

  // Redirect legacy paths (Vite SPA used /app/ prefix)
  async redirects() {
    return [
      {
        source: '/app/balance/verify-address',
        destination: '/wallet/verify-address',
        permanent: true,
      },
      {
        source: '/verify',
        destination: '/verify-email',
        permanent: true,
      },
      {
        source: '/wallets/verify',
        destination: '/wallet/verify-address',
        permanent: true,
      },
    ]
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },

  // Sass support for Sneat custom styles
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
}

export default nextConfig
