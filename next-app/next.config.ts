import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Silence "multiple lockfiles" warning — pin workspace root to this directory
  outputFileTracingRoot: path.join(__dirname),

  reactStrictMode: true,

  // Allow images from coin asset paths
  images: {
    unoptimized: true, // Use unoptimized for Sneat theme compatibility
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
    ]
  },

  // Sass support for Sneat custom styles
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
}

export default nextConfig
