import type { Metadata, Viewport } from 'next'
import { Public_Sans } from 'next/font/google'
import Script from 'next/script'
import { AppProviders } from './providers'

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
      data-bs-theme="light"
      data-template="vertical-menu-template"
      data-assets-path="/assets/"
      suppressHydrationWarning
    >
      <head>
        {/* Core CSS — must match index.html order exactly */}
        <link rel="stylesheet" href="/assets/vendor/fonts/iconify-icons.css" />
        <link rel="stylesheet" href="/assets/vendor/libs/pickr/pickr-themes.css" />
        <link rel="stylesheet" href="/assets/vendor/css/core.css" />
        <link rel="stylesheet" href="/assets/css/demo.css" />
        <link rel="stylesheet" href="/assets/css/custom-overrides.css" />

        {/* Vendor CSS */}
        <link rel="stylesheet" href="/assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.css" />

        {/* Page CSS */}
        <link rel="stylesheet" href="/assets/vendor/css/pages/page-auth.css" />
        <link rel="stylesheet" href="/assets/vendor/libs/@form-validation/form-validation.css" />
        <link rel="stylesheet" href="/assets/vendor/css/pages/app-invoice.css" />

        {/* DataTables CSS */}
        <link rel="stylesheet" href="/assets/vendor/libs/datatables-bs5/datatables.bootstrap5.css" />
        <link rel="stylesheet" href="/assets/vendor/libs/datatables-responsive-bs5/responsive.bootstrap5.css" />
        <link rel="stylesheet" href="/assets/vendor/libs/datatables-buttons-bs5/buttons.bootstrap5.css" />

        {/* Boxicons */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>

        {/* Helpers & Config */}
        <Script src="/assets/vendor/js/helpers.js" strategy="beforeInteractive" />
        <Script src="/assets/js/config.js" strategy="beforeInteractive" />

        {/* Core JS */}
        <Script src="/assets/vendor/libs/jquery/jquery.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/libs/popper/popper.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/js/bootstrap.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/libs/@algolia/autocomplete-js.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/libs/hammer/hammer.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/js/menu.js" strategy="afterInteractive" />

        {/* Vendor JS */}
        <Script src="/assets/vendor/libs/@form-validation/popular.js" strategy="lazyOnload" />
        <Script src="/assets/vendor/libs/@form-validation/bootstrap5.js" strategy="lazyOnload" />
        <Script src="/assets/vendor/libs/@form-validation/auto-focus.js" strategy="lazyOnload" />
        <Script src="/assets/js/main.js" strategy="lazyOnload" />
        <Script src="/assets/js/dashboards-analytics.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
