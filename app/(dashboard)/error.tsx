'use client'
import { Button } from '../../components/ui'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col justify-center items-center py-12">
      <i className="bx bx-error-circle text-danger-500 text-5xl"></i>
      <h4 className="mt-3 mb-2 font-semibold text-surface-900">Something went wrong</h4>
      <p className="text-surface-500 mb-4">{error.message || 'An unexpected error occurred.'}</p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  )
}
