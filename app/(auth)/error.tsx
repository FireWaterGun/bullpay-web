'use client'

import Link from 'next/link'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <i className="bx bx-error-circle text-danger-500 text-5xl"></i>
      <h4 className="mt-4 mb-2 text-xl font-semibold">Something went wrong</h4>
      <p className="text-surface-500 mb-6">{error.message || 'An unexpected error occurred.'}</p>
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={reset}>
          Try Again
        </button>
        <Link href="/login" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100">
          Back to Login
        </Link>
      </div>
    </div>
  )
}
