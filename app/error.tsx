'use client'
import Button from '@/components/ui/Button'

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[80vh]">
      <i className="bx bx-error-circle text-danger-500" style={{ fontSize: '48px' }}></i>
      <h4 className="mt-3 mb-2">Something went wrong</h4>
      <p className="text-surface-500 mb-4">{error.message || 'An unexpected error occurred.'}</p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  )
}
