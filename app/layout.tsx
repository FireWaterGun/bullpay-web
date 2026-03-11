import type { Metadata, Viewport } from 'next'
import { Public_Sans } from 'next/font/google'
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
  themeColor: '#2563eb',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={publicSans.className} dir="ltr" suppressHydrationWarning>
      <head>
        {/* Icon font (Boxicons via CSS masks) — low priority to avoid render-blocking */}
        <link rel="stylesheet" href="/assets/vendor/fonts/iconify-icons.css" precedence="low" />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
