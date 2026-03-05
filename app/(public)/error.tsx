'use client'

import Link from 'next/link'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col justify-center items-center" style={{ minHeight: '80vh' }}>
      <i className="bx bx-error-circle text-red-500" style={{ fontSize: '48px' }}></i>
      <h4 className="mt-3 mb-2">Something went wrong</h4>
      <p className="text-surface-500 mb-4">{error.message || 'An unexpected error occurred.'}</p>
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={reset}>
          Try Again
        </button>
        <Link href="/landing" className="btn btn-outline-secondary">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
