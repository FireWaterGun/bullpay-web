'use client'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <i className="bx bx-error-circle text-danger" style={{ fontSize: '48px' }}></i>
      <h4 className="mt-3 mb-2">Something went wrong</h4>
      <p className="text-muted mb-4">{error.message || 'An unexpected error occurred.'}</p>
      <button className="btn btn-primary" onClick={reset}>
        Try Again
      </button>
    </div>
  )
}
