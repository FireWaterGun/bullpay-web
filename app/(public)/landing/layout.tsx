import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BULL PAY — Crypto Payment Gateway',
  description: 'Accept crypto payments with low fees, instant settlement, and enterprise-grade security. Supporting 50+ digital currencies across multiple blockchains.',
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children
}
