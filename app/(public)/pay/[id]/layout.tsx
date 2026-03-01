import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Payment — BULL PAY',
  description: 'Complete your crypto payment securely with BULL PAY.',
  robots: { index: false, follow: false },
}

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return children
}
