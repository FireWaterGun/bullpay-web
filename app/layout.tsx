import type { Metadata, Viewport } from 'next'
import { Public_Sans } from 'next/font/google'
import Script from 'next/script'
import { AppProviders } from './providers'
import './globals.css'

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'BULL PAY — Crypto Payment Gateway',
    template: '%s — BULL PAY',
  },
  description:
    'Professional cryptocurrency payment gateway supporting 50+ digital currencies. Low fees, instant settlement, and enterprise-grade security.',
  icons: {
    icon: '/assets/img/favicon/favicon.ico',
    apple: '/assets/img/favicon/apple-touch-icon-180x180.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#696cff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`layout-wide customizer-hide ${publicSans.className}`}
      dir="ltr"
      data-skin="default"
      data-template="vertical-menu-template"
      data-assets-path="/assets/"
      suppressHydrationWarning
    >
      <head>
        {/* Core CSS */}
        <link rel="stylesheet" href="/assets/vendor/fonts/iconify-icons.css" />
        <link rel="stylesheet" href="/assets/css/demo.css" />
        <link rel="stylesheet" href="/assets/css/custom-overrides.css" />

        {/* Page CSS */}
        <link rel="stylesheet" href="/assets/vendor/css/pages/page-auth.css" />
        <link rel="stylesheet" href="/assets/vendor/css/pages/app-invoice.css" />

        {/* Boxicons (self-hosted) */}
        <link rel="stylesheet" href="/assets/vendor/fonts/boxicons/boxicons.min.css" />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>

        {/* Helpers & Config */}
        <Script src="/assets/vendor/js/helpers.js" strategy="beforeInteractive" />
        <Script src="/assets/js/config.js" strategy="beforeInteractive" />

        {/* Core JS */}
        <Script src="/assets/vendor/libs/popper/popper.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/js/bootstrap.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
