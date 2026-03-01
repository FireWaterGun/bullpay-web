import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Select Payment Asset — BULL PAY',
  description: 'Choose your preferred cryptocurrency for payment.',
  robots: { index: false, follow: false },
}

export default function PaySelectLayout({ children }: { children: React.ReactNode }) {
  return children
}
