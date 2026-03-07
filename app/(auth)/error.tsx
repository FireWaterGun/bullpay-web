'use client'

import { Button } from '../../components/ui'

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <i className="bx bx-error-circle text-danger-500 text-5xl"></i>
      <h4 className="mt-4 mb-2 text-xl font-semibold">Something went wrong</h4>
      <p className="text-surface-500 mb-6">{error.message || 'An unexpected error occurred.'}</p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline-secondary" href="/login">
          Back to Login
        </Button>
      </div>
    </div>
  )
}
