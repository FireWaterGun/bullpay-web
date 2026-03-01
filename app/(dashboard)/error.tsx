'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="d-flex flex-column justify-content-center align-items-center py-5">
        <i className="bx bx-error-circle text-danger" style={{ fontSize: '48px' }}></i>
        <h4 className="mt-3 mb-2">Something went wrong</h4>
        <p className="text-muted mb-4">{error.message || 'An unexpected error occurred.'}</p>
        <button className="btn btn-primary" onClick={reset}>
          Try Again
        </button>
      </div>
    </div>
  )
}
