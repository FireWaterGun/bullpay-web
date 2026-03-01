'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" data-bs-theme="light">
      <body>
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <h2 className="mb-3">Something went wrong</h2>
          <p className="text-muted mb-4">{error.message || 'An unexpected error occurred.'}</p>
          <button className="btn btn-primary" onClick={reset}>
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
